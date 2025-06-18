import Anthropic from '@anthropic-ai/sdk';
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
  private anthropic: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // Minimum 100ms between requests

  constructor(config: { api_key: string; model: string; max_tokens: number; temperature: number }) {
    this.anthropic = new Anthropic({
      apiKey: config.api_key
    });
    this.model = config.model;
    this.maxTokens = config.max_tokens;
    this.temperature = config.temperature;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
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

      // Build conversation history for Anthropic API (no system role)
      const conversationHistory = this.buildConversationHistory(context.conversation_history);
      
      // Combine system prompt with user message for Anthropic
      const fullUserMessage = `${systemPrompt}\n\nUser: ${userMessage}`;

      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: fullUserMessage }
      ];

      // Apply rate limiting before making API call
      await this.rateLimit();
      
      // Implement robust retry logic for API calls
      let completion;
      let retries = 0;
      const maxRetries = 4; // Increased from 3 to 4
      
      while (retries < maxRetries) {
        try {
          completion = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            messages: messages
          });
          
          // Log successful retry if this wasn't the first attempt
          if (retries > 0) {
            logger.info(`Anthropic API call succeeded after ${retries} retries`);
          }
          
          break; // Success, exit retry loop
        } catch (error: any) {
          const isRetryableError = 
            error.status === 529 || // Overloaded
            error.status === 502 || // Bad Gateway
            error.status === 503 || // Service Unavailable
            error.status === 504 || // Gateway Timeout
            (error.status === 429 && retries < 2); // Rate limited (but only retry first 2 times)
            
          if (isRetryableError && retries < maxRetries - 1) {
            // Calculate exponential backoff with jitter: 1s, 2s, 4s, 8s + random up to 1s
            const baseWaitTime = Math.pow(2, retries) * 1000;
            const jitter = Math.random() * 1000; // Add up to 1 second of jitter
            const waitTime = baseWaitTime + jitter;
            
            logger.warn(`Anthropic API error (${error.status}), retrying in ${Math.round(waitTime)}ms...`, { 
              attempt: retries + 1, 
              maxRetries,
              errorType: error.error?.type || 'unknown',
              errorMessage: error.message
            });
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
          } else {
            // Non-retryable error or max retries reached
            logger.error(`Anthropic API error after ${retries} retries`, {
              status: error.status,
              errorType: error.error?.type,
              message: error.message
            });
            throw error;
          }
        }
      }
      
      if (!completion) {
        throw new Error('Failed to get completion after retries');
      }

      const rawResponse = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
      
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

      const userMessage = `Please deliver the ${momentType} aha moment based on my personality profile.`;
      const fullMessage = `${systemPrompt}\n\nUser: ${userMessage}`;

      const completion = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature - 0.1, // Slightly more focused for aha moments
        messages: [
          { role: 'user' as const, content: fullMessage }
        ]
      });

      const rawResponse = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
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
    const clientName = this.buildClientNameContext(context.user_first_name, context.user_last_name);

    return `You are an expert executive coach with deep expertise in personality-based coaching and leadership development. Your role is to provide empathetic, insightful, and personalized coaching that demonstrates a profound understanding of the client's unique patterns and challenges.

${clientName}

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
- Keep responses brief and focused (75-125 words maximum)
- Use "you" language to make it personal
- Reference their personality patterns when relevant
- Provide specific, actionable insights
- Maintain professional coaching boundaries
- Group ALL questions at the end using bullet points
- Structure: [Insight/Response Body] + [Questions section with bullets]

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
- Keep it focused and impactful (75-125 words)
- Group ALL questions at the end using bullet points
- Structure: [Insight/Response Body] + [Questions section with bullets]
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

  private buildClientNameContext(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) {
      return 'CLIENT NAME: Client name not available. Use "you" to address them directly.';
    }

    const name = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : (lastName || '');
    return `CLIENT NAME: Address the client as "${name}" when appropriate. Use their name naturally in conversation to create personal connection.`;
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
    let confidence = 0.7; // Base confidence

    // Adjust based on stop reason for Anthropic API
    if (completion.stop_reason === 'end_turn') confidence += 0.2;
    if (completion.stop_reason === 'max_tokens') confidence -= 0.1;

    // Adjust based on response length (optimal range)
    const responseLength = completion.content[0]?.type === 'text' ? completion.content[0].text.length : 0;
    if (responseLength > 100 && responseLength < 500) confidence += 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }

  async validateResponseQuality(response: string): Promise<boolean> {
    try {
      // Check for appropriate length (shorter responses now)
      if (response.length < 50 || response.length > 600) return false;

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