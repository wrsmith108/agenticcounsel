import OpenAI from 'openai';
import { CoachingContext, CoachingResponse, PersonalityProfile, AhaMomentType } from '@/types';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/ai-coaching.log' })
  ]
});

export class AICoachingService {
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: { api_key: string; model: string; max_tokens: number; temperature: number }) {
    this.openai = new OpenAI({
      apiKey: config.api_key
    });
    this.model = config.model;
    this.maxTokens = config.max_tokens;
    this.temperature = config.temperature;
  }

  async generateCoachingResponse(context: CoachingContext): Promise<CoachingResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = context.current_message;

      logger.info('Generating coaching response', {
        sessionType: context.session_type,
        messageLength: userMessage.length,
        hasPersonality: !!context.user_personality
      });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.buildConversationHistory(context.conversation_history),
          { role: 'user', content: userMessage }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const rawResponse = completion.choices[0]?.message?.content || '';
      
      // Analyze response for aha moment delivery
      const ahaMomentType = this.detectAhaMoment(rawResponse, context);
      
      // Personalize the response based on personality profile
      const personalizedResponse = this.personalizeResponse(rawResponse, context.user_personality);

      const response: CoachingResponse = {
        content: personalizedResponse,
        metadata: {
          personality_applied: !!context.user_personality,
          ...(ahaMomentType && { aha_moment_type: ahaMomentType }),
          coaching_technique: this.identifyCoachingTechnique(rawResponse),
          confidence_score: this.calculateConfidenceScore(completion)
        }
      };

      logger.info('Coaching response generated', {
        responseLength: personalizedResponse.length,
        ahaMoment: ahaMomentType,
        confidenceScore: response.metadata.confidence_score
      });

      return response;
    } catch (error) {
      logger.error('Error generating coaching response:', error);
      throw error;
    }
  }

  async generateAhaMoment(context: CoachingContext, momentType: AhaMomentType): Promise<CoachingResponse> {
    try {
      const systemPrompt = this.buildAhaMomentPrompt(context, momentType);
      
      logger.info('Generating aha moment', { momentType, userId: 'context' });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please deliver the ${momentType} aha moment based on my personality profile.` }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature - 0.1, // Slightly more focused for aha moments
        presence_penalty: 0.2,
        frequency_penalty: 0.1
      });

      const rawResponse = completion.choices[0]?.message?.content || '';
      const personalizedResponse = this.personalizeResponse(rawResponse, context.user_personality);

      const response: CoachingResponse = {
        content: personalizedResponse,
        metadata: {
          personality_applied: true,
          aha_moment_type: momentType,
          coaching_technique: 'insight_delivery',
          confidence_score: this.calculateConfidenceScore(completion)
        }
      };

      logger.info('Aha moment generated', { momentType, responseLength: personalizedResponse.length });
      return response;
    } catch (error) {
      logger.error('Error generating aha moment:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context: CoachingContext): string {
    const personalityContext = this.buildPersonalityContext(context.user_personality);
    const sessionContext = this.buildSessionContext(context.session_type);
    const goalsContext = this.buildGoalsContext(context.coaching_goals);

    return `You are an expert executive coach with deep expertise in personality-based coaching and leadership development. Your role is to provide empathetic, insightful, and personalized coaching that demonstrates a profound understanding of the client's unique patterns and challenges.

${personalityContext}

${sessionContext}

${goalsContext}

COACHING APPROACH:
- Use powerful questions rather than direct advice
- Reflect the client's language and communication style
- Validate experiences and emotions authentically
- Guide discovery rather than prescribe solutions
- Demonstrate deep understanding of their personality patterns
- Focus on growth and development opportunities

RESPONSE GUIDELINES:
- Keep responses conversational and warm (150-300 words)
- Use "you" language to make it personal
- Reference their personality patterns when relevant
- Ask thoughtful follow-up questions
- Provide specific, actionable insights
- Maintain professional coaching boundaries

Remember: Your goal is to create "aha moments" where the client feels truly seen and understood, leading to meaningful insights about their patterns and growth opportunities.`;
  }

  private buildAhaMomentPrompt(context: CoachingContext, momentType: AhaMomentType): string {
    const personalityContext = this.buildPersonalityContext(context.user_personality);
    
    const momentPrompts = {
      personality_recognition: `Deliver a personality recognition aha moment. Present 3-4 accurate personality insights using coaching language that makes the client think "This describes me perfectly!" Focus on their core patterns in a way that feels revelatory and personally meaningful.`,
      
      empathetic_understanding: `Demonstrate empathetic understanding that makes the client feel "This coach really gets me!" Show that you understand their specific challenges and patterns. Reference something they've shared and connect it to their personality in a way that shows deep comprehension.`,
      
      personalized_guidance: `Provide personalized guidance that makes them think "This advice is specifically for me!" Give recommendations that align perfectly with their personality patterns and feel uniquely tailored to their situation and style.`,
      
      progress_clarity: `Create progress clarity that makes them feel "I can see exactly how to grow!" Present a clear, personalized growth path with specific milestones that align with their personality and feel achievable and exciting.`
    };

    return `You are an expert executive coach delivering a specific type of breakthrough moment for your client.

${personalityContext}

MISSION: ${momentPrompts[momentType]}

DELIVERY REQUIREMENTS:
- Make it feel personally revelatory and meaningful
- Use specific personality insights, not generic advice
- Create an emotional connection and recognition
- Be specific and actionable
- Keep it focused and impactful (100-200 words)
- Use warm, professional coaching language

The client should feel a strong sense of recognition and understanding when they read this.`;
  }

  private buildPersonalityContext(personality: PersonalityProfile | undefined): string {
    if (!personality) {
      return 'PERSONALITY CONTEXT: Personality profile not yet available. Focus on general coaching principles and building rapport.';
    }

    const traits = personality.psychological_traits;
    return `PERSONALITY CONTEXT:
- Communication Style: ${traits.communication_style}
- Decision-Making Pattern: ${traits.decision_making_pattern}  
- Stress Response: ${traits.stress_response}
- Leadership Tendency: ${traits.leadership_tendency}
- Growth Orientation: ${traits.growth_orientation}
- Profile Confidence: ${personality.accuracy_confidence}%

Use these insights to personalize your coaching approach and demonstrate understanding of their unique patterns.`;
  }

  private buildSessionContext(sessionType: string): string {
    const contexts = {
      initial_insights: 'SESSION CONTEXT: This is about presenting initial personality insights. Focus on helping them recognize and validate their patterns.',
      goal_setting: 'SESSION CONTEXT: This is a goal-setting session. Help them identify coaching areas that align with their personality and growth opportunities.',
      coaching_conversation: 'SESSION CONTEXT: This is an ongoing coaching conversation. Provide deep, personalized coaching that builds on their personality insights.',
      progress_review: 'SESSION CONTEXT: This is a progress review. Help them see their growth through the lens of their personality patterns.',
      action_planning: 'SESSION CONTEXT: This is action planning. Create specific, personality-aligned action steps and recommendations.'
    };

    return contexts[sessionType as keyof typeof contexts] || 'SESSION CONTEXT: General coaching conversation focused on growth and development.';
  }

  private buildGoalsContext(goals: string[]): string {
    if (!goals || goals.length === 0) {
      return 'GOALS CONTEXT: Coaching goals not yet defined. Help explore what they want to work on.';
    }

    return `GOALS CONTEXT: Current coaching focus areas: ${goals.join(', ')}. Tailor your coaching to support progress in these areas.`;
  }

  private buildConversationHistory(history: any[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return history.slice(-6).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  private personalizeResponse(response: string, personality: PersonalityProfile | undefined): string {
    if (!personality) return response;

    // Apply personality-based language adjustments
    const traits = personality.psychological_traits;
    
    // Adjust communication style
    if (traits.communication_style.includes('direct')) {
      // Keep language straightforward and clear
      return response.replace(/perhaps|maybe|might/g, match => 
        match === 'perhaps' ? 'likely' : match === 'maybe' ? 'probably' : 'will'
      );
    } else if (traits.communication_style.includes('diplomatic')) {
      // Add more collaborative language
      return response.replace(/you should/g, 'you might consider')
                    .replace(/you need to/g, 'it could be helpful to');
    }

    return response;
  }

  private detectAhaMoment(response: string, context: CoachingContext): AhaMomentType | undefined {
    const patterns = {
      personality_recognition: /your natural|you tend to|this describes|your pattern/i,
      empathetic_understanding: /I understand|I can see|this makes sense|I notice/i,
      personalized_guidance: /specifically for you|based on your|given your style/i,
      progress_clarity: /your growth path|next steps|you can see/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(response)) {
        return type as AhaMomentType;
      }
    }

    return undefined;
  }

  private identifyCoachingTechnique(response: string): string {
    if (response.includes('?')) return 'powerful_questioning';
    if (response.includes('I notice') || response.includes('I observe')) return 'observation_sharing';
    if (response.includes('your pattern') || response.includes('your tendency')) return 'pattern_recognition';
    if (response.includes('consider') || response.includes('explore')) return 'exploration_guidance';
    if (response.includes('strength') || response.includes('opportunity')) return 'strengths_based';
    return 'supportive_coaching';
  }

  private calculateConfidenceScore(completion: any): number {
    // Simple confidence calculation based on response characteristics
    const choice = completion.choices[0];
    if (!choice) return 0.5;

    let confidence = 0.7; // Base confidence

    // Adjust based on finish reason
    if (choice.finish_reason === 'stop') confidence += 0.2;
    if (choice.finish_reason === 'length') confidence -= 0.1;

    // Adjust based on response length (optimal range)
    const responseLength = choice.message?.content?.length || 0;
    if (responseLength > 100 && responseLength < 500) confidence += 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }

  async validateResponseQuality(response: string): Promise<boolean> {
    try {
      // Check for appropriate length
      if (response.length < 50 || response.length > 1000) return false;

      // Check for coaching language patterns
      const coachingPatterns = [
        /\b(you|your)\b/i, // Personal language
        /\?(.*\?)?/g, // Questions
        /\b(understand|recognize|notice|explore|consider)\b/i // Coaching verbs
      ];

      const patternMatches = coachingPatterns.filter(pattern => pattern.test(response)).length;
      return patternMatches >= 2;
    } catch (error) {
      logger.error('Error validating response quality:', error);
      return false;
    }
  }
}