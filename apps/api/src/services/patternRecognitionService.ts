import { Pool } from 'pg';
import {
  MemoryPattern,
  MemoryInsight,
  CreatePatternRequest,
  CreateInsightRequest,
  PatternAnalysisResult,
  ConversationExample
} from '../types/memoryBank.js';
import { MemoryBankService } from './memoryBankService.js';

// Temporary logger implementation
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args)
};

export interface ConversationData {
  conversation_id: string;
  user_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  session_metadata?: {
    duration_minutes?: number;
    topic_focus?: string;
    emotional_tone?: string;
    goals_discussed?: string[];
  };
}

export interface PatternDetectionConfig {
  min_pattern_frequency: number;
  pattern_confidence_threshold: number;
  insight_impact_threshold: number;
  analysis_window_days: number;
}

export class PatternRecognitionService {
  private db: Pool;
  private memoryService: MemoryBankService;
  private config: PatternDetectionConfig;

  constructor(db: Pool, memoryService: MemoryBankService, config?: Partial<PatternDetectionConfig>) {
    this.db = db;
    this.memoryService = memoryService;
    this.config = {
      min_pattern_frequency: 3,
      pattern_confidence_threshold: 0.6,
      insight_impact_threshold: 0.5,
      analysis_window_days: 30,
      ...config
    };
  }

  // Main pattern analysis entry point
  async analyzeConversation(conversationData: ConversationData): Promise<{
    patterns_detected: MemoryPattern[];
    insights_generated: MemoryInsight[];
    analysis_summary: string;
  }> {
    try {
      logger.info(`Analyzing conversation ${conversationData.conversation_id} for user ${conversationData.user_id}`);

      const patterns = await this.detectPatterns(conversationData);
      const insights = await this.generateInsights(conversationData, patterns);
      
      // Store detected patterns and insights
      const storedPatterns = await this.storePatterns(conversationData.user_id, patterns);
      const storedInsights = await this.storeInsights(conversationData.user_id, insights);

      const analysisSummary = this.generateAnalysisSummary(storedPatterns, storedInsights);

      return {
        patterns_detected: storedPatterns,
        insights_generated: storedInsights,
        analysis_summary: analysisSummary
      };
    } catch (error) {
      logger.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  // Pattern detection methods
  private async detectPatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];

    // Detect communication patterns
    const communicationPatterns = await this.detectCommunicationPatterns(conversationData);
    patterns.push(...communicationPatterns);

    // Detect decision-making patterns
    const decisionPatterns = await this.detectDecisionMakingPatterns(conversationData);
    patterns.push(...decisionPatterns);

    // Detect stress response patterns
    const stressPatterns = await this.detectStressResponsePatterns(conversationData);
    patterns.push(...stressPatterns);

    // Detect goal-setting patterns
    const goalPatterns = await this.detectGoalSettingPatterns(conversationData);
    patterns.push(...goalPatterns);

    // Detect learning style patterns
    const learningPatterns = await this.detectLearningStylePatterns(conversationData);
    patterns.push(...learningPatterns);

    return patterns;
  }

  private async detectCommunicationPatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Analyze message length patterns
    const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    
    if (avgMessageLength > 500) {
      patterns.push({
        pattern_type: 'communication',
        pattern_data: {
          description: 'Tends to provide detailed, comprehensive responses',
          triggers: ['complex topics', 'emotional discussions'],
          responses: ['lengthy explanations', 'multiple examples'],
          context: {
            avg_message_length: avgMessageLength,
            detail_preference: 'high'
          }
        },
        strength_score: Math.min(0.9, avgMessageLength / 1000)
      });
    } else if (avgMessageLength < 100) {
      patterns.push({
        pattern_type: 'communication',
        pattern_data: {
          description: 'Prefers concise, direct communication',
          triggers: ['any topic'],
          responses: ['brief responses', 'direct questions'],
          context: {
            avg_message_length: avgMessageLength,
            detail_preference: 'low'
          }
        },
        strength_score: Math.min(0.9, (200 - avgMessageLength) / 200)
      });
    }

    // Analyze question-asking patterns
    const questionCount = userMessages.filter(msg => msg.content.includes('?')).length;
    const questionRatio = questionCount / userMessages.length;

    if (questionRatio > 0.3) {
      patterns.push({
        pattern_type: 'communication',
        pattern_data: {
          description: 'Frequently asks clarifying questions',
          triggers: ['uncertainty', 'complex topics'],
          responses: ['multiple questions', 'seeks clarification'],
          context: {
            question_ratio: questionRatio,
            curiosity_level: 'high'
          }
        },
        strength_score: Math.min(0.9, questionRatio * 2)
      });
    }

    return patterns;
  }

  private async detectDecisionMakingPatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Look for decision-related keywords
    const decisionKeywords = ['decide', 'choice', 'option', 'should I', 'what if', 'pros and cons'];
    const decisionMessages = userMessages.filter(msg => 
      decisionKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );

    if (decisionMessages.length > 0) {
      // Analyze decision-making style
      const analyticalKeywords = ['analyze', 'compare', 'evaluate', 'pros', 'cons', 'data'];
      const intuitiveKeywords = ['feel', 'sense', 'instinct', 'gut', 'intuition'];
      
      const analyticalCount = decisionMessages.filter(msg =>
        analyticalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      ).length;
      
      const intuitiveCount = decisionMessages.filter(msg =>
        intuitiveKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      ).length;

      if (analyticalCount > intuitiveCount) {
        patterns.push({
          pattern_type: 'decision_making',
          pattern_data: {
            description: 'Analytical decision-making style',
            triggers: ['complex decisions', 'important choices'],
            responses: ['seeks data', 'compares options', 'lists pros and cons'],
            context: {
              style: 'analytical',
              analytical_score: analyticalCount / decisionMessages.length
            }
          },
          strength_score: Math.min(0.9, analyticalCount / Math.max(1, decisionMessages.length))
        });
      } else if (intuitiveCount > analyticalCount) {
        patterns.push({
          pattern_type: 'decision_making',
          pattern_data: {
            description: 'Intuitive decision-making style',
            triggers: ['personal decisions', 'emotional choices'],
            responses: ['trusts feelings', 'goes with gut instinct'],
            context: {
              style: 'intuitive',
              intuitive_score: intuitiveCount / decisionMessages.length
            }
          },
          strength_score: Math.min(0.9, intuitiveCount / Math.max(1, decisionMessages.length))
        });
      }
    }

    return patterns;
  }

  private async detectStressResponsePatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Look for stress indicators
    const stressKeywords = ['stressed', 'overwhelmed', 'anxious', 'worried', 'pressure', 'deadline', 'urgent'];
    const stressMessages = userMessages.filter(msg =>
      stressKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );

    if (stressMessages.length > 0) {
      // Analyze coping mechanisms mentioned
      const copingKeywords = ['breathe', 'exercise', 'break', 'relax', 'meditate', 'talk', 'help'];
      const copingMessages = stressMessages.filter(msg =>
        copingKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      );

      patterns.push({
        pattern_type: 'stress_response',
        pattern_data: {
          description: 'Identifies stress and seeks coping strategies',
          triggers: ['high pressure situations', 'deadlines', 'overwhelming tasks'],
          responses: copingMessages.length > 0 ? ['seeks coping strategies', 'looks for support'] : ['expresses stress', 'seeks guidance'],
          context: {
            stress_frequency: stressMessages.length / userMessages.length,
            coping_awareness: copingMessages.length / Math.max(1, stressMessages.length)
          }
        },
        strength_score: Math.min(0.9, stressMessages.length / Math.max(1, userMessages.length) * 2)
      });
    }

    return patterns;
  }

  private async detectGoalSettingPatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Look for goal-related language
    const goalKeywords = ['goal', 'want to', 'plan to', 'achieve', 'accomplish', 'target', 'objective'];
    const goalMessages = userMessages.filter(msg =>
      goalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );

    if (goalMessages.length > 0) {
      // Analyze goal specificity
      const specificKeywords = ['by', 'when', 'how much', 'exactly', 'specific', 'measurable'];
      const specificGoals = goalMessages.filter(msg =>
        specificKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
      );

      const specificity = specificGoals.length / goalMessages.length;

      patterns.push({
        pattern_type: 'goal_setting',
        pattern_data: {
          description: specificity > 0.5 ? 'Sets specific, measurable goals' : 'Sets general aspirational goals',
          triggers: ['planning sessions', 'life changes', 'challenges'],
          responses: specificity > 0.5 ? ['defines clear metrics', 'sets timelines'] : ['expresses general desires', 'seeks direction'],
          context: {
            goal_frequency: goalMessages.length / userMessages.length,
            specificity_score: specificity
          }
        },
        strength_score: Math.min(0.9, goalMessages.length / Math.max(1, userMessages.length) * 2)
      });
    }

    return patterns;
  }

  private async detectLearningStylePatterns(conversationData: ConversationData): Promise<CreatePatternRequest[]> {
    const patterns: CreatePatternRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Analyze learning preferences
    const visualKeywords = ['see', 'show', 'picture', 'diagram', 'visual', 'chart'];
    const auditoryKeywords = ['hear', 'listen', 'explain', 'tell', 'discuss', 'talk'];
    const kinestheticKeywords = ['do', 'try', 'practice', 'hands-on', 'experience', 'feel'];

    const visualCount = userMessages.filter(msg =>
      visualKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length;

    const auditoryCount = userMessages.filter(msg =>
      auditoryKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length;

    const kinestheticCount = userMessages.filter(msg =>
      kinestheticKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length;

    const total = visualCount + auditoryCount + kinestheticCount;

    if (total > 0) {
      let dominantStyle = 'mixed';
      let dominantCount = 0;

      if (visualCount > auditoryCount && visualCount > kinestheticCount) {
        dominantStyle = 'visual';
        dominantCount = visualCount;
      } else if (auditoryCount > kinestheticCount) {
        dominantStyle = 'auditory';
        dominantCount = auditoryCount;
      } else if (kinestheticCount > 0) {
        dominantStyle = 'kinesthetic';
        dominantCount = kinestheticCount;
      }

      if (dominantCount > 0) {
        patterns.push({
          pattern_type: 'learning_style',
          pattern_data: {
            description: `Prefers ${dominantStyle} learning approaches`,
            triggers: ['learning new concepts', 'problem-solving'],
            responses: this.getLearningResponses(dominantStyle),
            context: {
              dominant_style: dominantStyle,
              visual_score: visualCount / total,
              auditory_score: auditoryCount / total,
              kinesthetic_score: kinestheticCount / total
            }
          },
          strength_score: Math.min(0.9, dominantCount / Math.max(1, userMessages.length))
        });
      }
    }

    return patterns;
  }

  private getLearningResponses(style: string): string[] {
    switch (style) {
      case 'visual':
        return ['requests visual aids', 'wants to see examples', 'prefers diagrams'];
      case 'auditory':
        return ['wants verbal explanations', 'prefers discussions', 'learns through listening'];
      case 'kinesthetic':
        return ['wants hands-on experience', 'learns by doing', 'prefers practical examples'];
      default:
        return ['adapts to various learning methods'];
    }
  }

  // Insight generation methods
  private async generateInsights(conversationData: ConversationData, patterns: CreatePatternRequest[]): Promise<CreateInsightRequest[]> {
    const insights: CreateInsightRequest[] = [];

    // Generate insights from pattern combinations
    insights.push(...this.generatePatternCombinationInsights(patterns, conversationData));

    // Generate insights from conversation content
    insights.push(...this.generateContentInsights(conversationData));

    // Generate insights from behavioral changes
    insights.push(...await this.generateBehavioralChangeInsights(conversationData));

    return insights;
  }

  private generatePatternCombinationInsights(patterns: CreatePatternRequest[], conversationData: ConversationData): CreateInsightRequest[] {
    const insights: CreateInsightRequest[] = [];

    // Analyze pattern combinations for insights
    const communicationPatterns = patterns.filter(p => p.pattern_type === 'communication');
    const decisionPatterns = patterns.filter(p => p.pattern_type === 'decision_making');
    const learningPatterns = patterns.filter(p => p.pattern_type === 'learning_style');

    // Insight: Communication style affects decision-making
    if (communicationPatterns.length > 0 && decisionPatterns.length > 0) {
      const commPattern = communicationPatterns[0];
      const decisionPattern = decisionPatterns[0];

      if (commPattern && decisionPattern) {
        insights.push({
          insight_type: 'pattern_recognition',
          title: 'Communication and Decision-Making Connection',
          description: `Your ${commPattern.pattern_data.description.toLowerCase()} aligns with your ${decisionPattern.pattern_data.description.toLowerCase()}. This suggests a consistent approach to processing and expressing information.`,
          conversation_id: conversationData.conversation_id,
          impact_score: 0.7,
          tags: ['communication', 'decision-making', 'consistency']
        });
      }
    }

    // Insight: Learning style optimization
    if (learningPatterns.length > 0) {
      const learningPattern = learningPatterns[0];
      const dominantStyle = learningPattern?.pattern_data.context?.['dominant_style'];

      if (learningPattern && dominantStyle) {
        insights.push({
          insight_type: 'realization',
          title: `${dominantStyle.charAt(0).toUpperCase() + dominantStyle.slice(1)} Learning Preference Identified`,
          description: `You consistently prefer ${dominantStyle} learning approaches. Leveraging this preference could significantly improve your learning efficiency and retention.`,
          conversation_id: conversationData.conversation_id,
          impact_score: 0.8,
          tags: ['learning', 'optimization', dominantStyle]
        });
      }
    }

    return insights;
  }

  private generateContentInsights(conversationData: ConversationData): CreateInsightRequest[] {
    const insights: CreateInsightRequest[] = [];
    const userMessages = conversationData.messages.filter(m => m.role === 'user');

    // Analyze emotional progression
    const emotionalKeywords = {
      positive: ['happy', 'excited', 'confident', 'optimistic', 'grateful'],
      negative: ['sad', 'frustrated', 'angry', 'disappointed', 'worried'],
      growth: ['learned', 'realized', 'understand', 'breakthrough', 'clarity']
    };

    const emotionalProgression = this.analyzeEmotionalProgression(userMessages, emotionalKeywords);

    if (emotionalProgression.growth_indicators > 0) {
      insights.push({
        insight_type: 'emotional_growth',
        title: 'Emotional Growth Detected',
        description: `This conversation shows signs of emotional growth and self-awareness. You've demonstrated increased understanding and clarity about your situation.`,
        conversation_id: conversationData.conversation_id,
        impact_score: 0.8,
        tags: ['emotional-growth', 'self-awareness', 'breakthrough']
      });
    }

    return insights;
  }

  private async generateBehavioralChangeInsights(conversationData: ConversationData): Promise<CreateInsightRequest[]> {
    const insights: CreateInsightRequest[] = [];

    try {
      // Get recent patterns for comparison
      const recentPatterns = await this.memoryService.getUserPatterns(conversationData.user_id);
      
      // Analyze if current conversation shows behavioral shifts
      // This is a simplified analysis - in production, you'd want more sophisticated comparison
      if (recentPatterns.length > 0) {
        const hasNewBehaviors = this.detectBehavioralShifts(conversationData, recentPatterns);
        
        if (hasNewBehaviors) {
          insights.push({
            insight_type: 'breakthrough',
            title: 'Behavioral Shift Detected',
            description: 'Your approach in this conversation shows some new patterns compared to previous sessions. This could indicate personal growth or changing perspectives.',
            conversation_id: conversationData.conversation_id,
            impact_score: 0.6,
            tags: ['behavioral-change', 'growth', 'evolution']
          });
        }
      }
    } catch (error) {
      logger.error('Error generating behavioral change insights:', error);
    }

    return insights;
  }

  private analyzeEmotionalProgression(messages: any[], emotionalKeywords: any): { growth_indicators: number } {
    let growthIndicators = 0;

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      emotionalKeywords.growth.forEach((keyword: string) => {
        if (content.includes(keyword)) {
          growthIndicators++;
        }
      });
    });

    return { growth_indicators: growthIndicators };
  }

  private detectBehavioralShifts(conversationData: ConversationData, existingPatterns: MemoryPattern[]): boolean {
    // Simplified behavioral shift detection
    // In production, this would involve more sophisticated analysis
    const userMessages = conversationData.messages.filter(m => m.role === 'user');
    const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;

    // Check if communication pattern has shifted significantly
    const communicationPatterns = existingPatterns.filter(p => p.pattern_type === 'communication');
    if (communicationPatterns.length > 0) {
      const firstPattern = communicationPatterns[0];
      const existingAvgLength = firstPattern?.pattern_data.context?.['avg_message_length'] || 0;
      const lengthDifference = Math.abs(avgMessageLength - existingAvgLength);
      
      // If message length has changed by more than 50%, consider it a shift
      return lengthDifference > existingAvgLength * 0.5;
    }

    return false;
  }

  // Storage methods
  private async storePatterns(userId: string, patterns: CreatePatternRequest[]): Promise<MemoryPattern[]> {
    const storedPatterns: MemoryPattern[] = [];

    for (const pattern of patterns) {
      try {
        const stored = await this.memoryService.createPattern(userId, pattern);
        storedPatterns.push(stored);
      } catch (error) {
        logger.error('Error storing pattern:', error);
      }
    }

    return storedPatterns;
  }

  private async storeInsights(userId: string, insights: CreateInsightRequest[]): Promise<MemoryInsight[]> {
    const storedInsights: MemoryInsight[] = [];

    for (const insight of insights) {
      try {
        const stored = await this.memoryService.createInsight(userId, insight);
        storedInsights.push(stored);
      } catch (error) {
        logger.error('Error storing insight:', error);
      }
    }

    return storedInsights;
  }

  private generateAnalysisSummary(patterns: MemoryPattern[], insights: MemoryInsight[]): string {
    const patternTypes = patterns.map(p => p.pattern_type);
    const insightTypes = insights.map(i => i.insight_type);

    let summary = `Analysis completed: `;
    
    if (patterns.length > 0) {
      summary += `${patterns.length} pattern(s) detected (${[...new Set(patternTypes)].join(', ')})`;
    }
    
    if (insights.length > 0) {
      if (patterns.length > 0) summary += ' and ';
      summary += `${insights.length} insight(s) generated (${[...new Set(insightTypes)].join(', ')})`;
    }
    
    if (patterns.length === 0 && insights.length === 0) {
      summary += 'No significant patterns or insights detected in this conversation.';
    }

    return summary;
  }

  // Utility methods for pattern analysis
  async getPatternAnalysis(userId: string, patternId: string): Promise<PatternAnalysisResult | null> {
    try {
      const patterns = await this.memoryService.getUserPatterns(userId);
      const pattern = patterns.find(p => p.pattern_id === patternId);
      
      if (!pattern) {
        return null;
      }

      // Get recent examples (simplified - in production, you'd query conversation history)
      const recentExamples: ConversationExample[] = pattern.examples || [];

      // Calculate trend analysis (simplified)
      const trendAnalysis = {
        frequency_change: 0.1, // Placeholder
        strength_change: 0.05, // Placeholder
        last_occurrence: new Date()
      };

      return {
        pattern,
        recent_examples: recentExamples,
        trend_analysis: trendAnalysis
      };
    } catch (error) {
      logger.error('Error getting pattern analysis:', error);
      throw error;
    }
  }
}