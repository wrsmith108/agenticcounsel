import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  APIResponse, 
  AuthResult, 
  LoginData, 
  RegisterData, 
  User, 
  CoachingSession, 
  Message, 
  ProgressOverview,
  ProgressTracking,
  PersonalityProfile,
  PersonalityInsight,
  CreateNatalChartRequest,
  UpdateNatalChartRequest,
  NatalChart,
  PlanetaryPosition,
  HouseCusp,
  AspectData
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.error('Authentication failed - clearing token and redirecting to login');
          // Token expired or invalid
          this.clearToken();
          // Redirect to login if we're not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from cookies on initialization
    if (typeof window !== 'undefined') {
      this.token = this.getTokenFromCookies();
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Store token in cookies for middleware access
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 days to match JWT expiration
      
      document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
      
      // Also store in localStorage as backup for client-side access
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      // Clear from cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      
      // Clear from localStorage
      localStorage.removeItem('auth_token');
    }
  }

  private getTokenFromCookies(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    
    return cookieToken || null;
  }

  getToken(): string | null {
    // If no token in memory, try to get from cookies and localStorage
    if (!this.token && typeof window !== 'undefined') {
      const cookieToken = this.getTokenFromCookies();
      const localStorageToken = localStorage.getItem('auth_token');
      
      // Prefer cookie token, fallback to localStorage
      this.token = cookieToken || localStorageToken;
    }
    return this.token;
  }

  // Auth endpoints
  async login(data: LoginData): Promise<APIResponse<AuthResult>> {
    const response: AxiosResponse<APIResponse<AuthResult>> = await this.client.post('/api/auth/login', data);
    if (response.data.success && response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async register(data: RegisterData): Promise<APIResponse<AuthResult>> {
    const response: AxiosResponse<APIResponse<AuthResult>> = await this.client.post('/api/auth/register', data);
    if (response.data.success && response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<APIResponse> {
    const response: AxiosResponse<APIResponse> = await this.client.post('/api/auth/logout');
    this.clearToken();
    return response.data;
  }

  async verifyToken(): Promise<APIResponse<{ user: User }>> {
    const response: AxiosResponse<APIResponse<{ user: User }>> = await this.client.get('/api/auth/verify');
    return response.data;
  }

  async refreshToken(): Promise<APIResponse<AuthResult>> {
    const response: AxiosResponse<APIResponse<AuthResult>> = await this.client.post('/api/auth/refresh');
    if (response.data.success && response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  // User endpoints
  async getUserProfile(): Promise<APIResponse<{ user: User }>> {
    const response: AxiosResponse<APIResponse<{ user: User }>> = await this.client.get('/api/user/profile');
    return response.data;
  }

  async updateUserProfile(data: Partial<User>): Promise<APIResponse<{ user: User }>> {
    const response: AxiosResponse<APIResponse<{ user: User }>> = await this.client.put('/api/user/profile', data);
    return response.data;
  }

  async completeOnboarding(data: {
    coaching_goals: string[];
    personality_insights_reviewed: boolean;
    initial_session_preferences?: any;
  }): Promise<APIResponse<{ user: User }>> {
    const response: AxiosResponse<APIResponse<{ user: User }>> = await this.client.post('/api/user/onboarding', data);
    return response.data;
  }

  async getPersonalityProfile(): Promise<APIResponse<{ personality_profile: PersonalityProfile; insights: PersonalityInsight[] }>> {
    const response: AxiosResponse<APIResponse<{ personality_profile: PersonalityProfile; insights: PersonalityInsight[] }>> = await this.client.get('/api/user/personality');
    return response.data;
  }

  async updateCoachingGoals(coaching_goals: string[]): Promise<APIResponse<{ coaching_goals: string[] }>> {
    const response: AxiosResponse<APIResponse<{ coaching_goals: string[] }>> = await this.client.put('/api/user/coaching-goals', { coaching_goals });
    return response.data;
  }

  // Coaching endpoints
  async startCoachingSession(data: {
    session_type: string;
    initial_message?: string;
  }): Promise<APIResponse<{ conversation: CoachingSession; messages?: Message[]; initial_response?: any }>> {
    const response: AxiosResponse<APIResponse<{ conversation: CoachingSession; messages?: Message[]; initial_response?: any }>> = await this.client.post('/api/coaching/start-session', data, {
      timeout: 30000 // 30 seconds for AI coaching responses
    });
    return response.data;
  }

  async getCoachingConversations(limit = 20, offset = 0): Promise<APIResponse<{ conversations: CoachingSession[]; pagination: any }>> {
    const response: AxiosResponse<APIResponse<{ conversations: CoachingSession[]; pagination: any }>> = await this.client.get(`/api/coaching/conversations?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  async getCoachingConversation(id: string): Promise<APIResponse<{ conversation: CoachingSession; messages: Message[] }>> {
    const response: AxiosResponse<APIResponse<{ conversation: CoachingSession; messages: Message[] }>> = await this.client.get(`/api/coaching/conversations/${id}`);
    return response.data;
  }

  async sendMessage(conversationId: string, data: {
    content: string;
    metadata?: any;
  }): Promise<APIResponse<{ user_message: Message; coach_response: Message; coaching_metadata?: any }>> {
    const response: AxiosResponse<APIResponse<{ user_message: Message; coach_response: Message; coaching_metadata?: any }>> = await this.client.post(`/api/coaching/conversations/${conversationId}/messages`, data);
    return response.data;
  }

  async getConversationMessages(conversationId: string, limit = 50, offset = 0): Promise<APIResponse<{ messages: Message[]; pagination: any }>> {
    const response: AxiosResponse<APIResponse<{ messages: Message[]; pagination: any }>> = await this.client.get(`/api/coaching/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Additional coaching methods for real-time messaging
  async getCoachingMessages(conversationId: string): Promise<APIResponse<Message[]>> {
    const response: AxiosResponse<APIResponse<{ messages: Message[]; pagination: any }>> = await this.client.get(`/api/coaching/conversations/${conversationId}/messages`);
    
    // Transform the response to match expected format
    if (response.data.success && response.data.data?.messages) {
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data.messages
      };
    }
    
    return response.data as any;
  }

  async sendCoachingMessage(conversationId: string, messageData: {
    content: string;
    message_type?: string;
    metadata?: any;
  }): Promise<APIResponse<{ user_message: Message; coach_response: Message; coaching_metadata?: any }>> {
    const response: AxiosResponse<APIResponse<{ user_message: Message; coach_response: Message; coaching_metadata?: any }>> = await this.client.post(`/api/coaching/conversations/${conversationId}/messages`, messageData, {
      timeout: 30000 // 30 seconds for AI coaching responses
    });
    return response.data;
  }

  async endCoachingSession(conversationId: string): Promise<APIResponse<{ conversation: CoachingSession }>> {
    const response: AxiosResponse<APIResponse<{ conversation: CoachingSession }>> = await this.client.post(`/api/coaching/conversations/${conversationId}/end`);
    return response.data;
  }

  // Progress endpoints
  async getProgressOverview(): Promise<APIResponse<ProgressOverview>> {
    const response: AxiosResponse<APIResponse<ProgressOverview>> = await this.client.get('/api/progress/overview');
    return response.data;
  }

  async getGoalProgress(category?: string): Promise<APIResponse<{ coaching_goals: string[]; progress_records: ProgressTracking[]; filtered_by_category: string | null }>> {
    const url = category ? `/api/progress/goals?category=${encodeURIComponent(category)}` : '/api/progress/goals';
    const response: AxiosResponse<APIResponse<{ coaching_goals: string[]; progress_records: ProgressTracking[]; filtered_by_category: string | null }>> = await this.client.get(url);
    return response.data;
  }

  async recordMilestone(data: {
    title: string;
    description: string;
    goal_category: string;
    target_date?: string;
    metadata?: any;
  }): Promise<APIResponse<{ milestone: any; achievement: any; goal_category: string }>> {
    const response: AxiosResponse<APIResponse<{ milestone: any; achievement: any; goal_category: string }>> = await this.client.post('/api/progress/milestone', data);
    return response.data;
  }

  async getProgressInsights(): Promise<APIResponse<{ insights: any[]; recommendations: any[]; progress_summary: any }>> {
    const response: AxiosResponse<APIResponse<{ insights: any[]; recommendations: any[]; progress_summary: any }>> = await this.client.get('/api/progress/insights');
    return response.data;
  }

  async getProgressHistory(timeRange: string): Promise<APIResponse<any[]>> {
    const response: AxiosResponse<APIResponse<any[]>> = await this.client.get(`/api/progress/history?timeRange=${encodeURIComponent(timeRange)}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: Date; version: string }>> {
    const response: AxiosResponse<APIResponse<{ status: string; timestamp: Date; version: string }>> = await this.client.get('/health');
    return response.data;
  }

  // Astrology endpoints
  async generateNatalChart(birthData: CreateNatalChartRequest): Promise<APIResponse<NatalChart>> {
    const response: AxiosResponse<APIResponse<NatalChart>> = await this.client.post('/api/astrology/natal-chart', birthData);
    return response.data;
  }

  async getNatalChart(userId: string): Promise<APIResponse<NatalChart>> {
    const response: AxiosResponse<APIResponse<NatalChart>> = await this.client.get(`/api/astrology/natal-chart/${userId}`);
    return response.data;
  }

  async updateNatalChart(chartId: string, birthData: UpdateNatalChartRequest): Promise<APIResponse<{ chart_id: string }>> {
    const response: AxiosResponse<APIResponse<{ chart_id: string }>> = await this.client.put(`/api/astrology/natal-chart/${chartId}`, birthData);
    return response.data;
  }

  async deleteNatalChart(chartId: string): Promise<APIResponse<{ chart_id: string }>> {
    const response: AxiosResponse<APIResponse<{ chart_id: string }>> = await this.client.delete(`/api/astrology/natal-chart/${chartId}`);
    return response.data;
  }

  async getPlanetaryPositions(chartId: string): Promise<APIResponse<PlanetaryPosition[]>> {
    const response: AxiosResponse<APIResponse<PlanetaryPosition[]>> = await this.client.get(`/api/astrology/planetary-positions/${chartId}`);
    return response.data;
  }

  async getHouseCusps(chartId: string): Promise<APIResponse<HouseCusp[]>> {
    const response: AxiosResponse<APIResponse<HouseCusp[]>> = await this.client.get(`/api/astrology/house-cusps/${chartId}`);
    return response.data;
  }

  async getAspects(chartId: string, params?: { aspect_type?: string; max_orb?: number; applying_only?: boolean }): Promise<APIResponse<AspectData[]>> {
    const queryParams = new URLSearchParams();
    if (params?.aspect_type) queryParams.append('aspect_type', params.aspect_type);
    if (params?.max_orb) queryParams.append('max_orb', params.max_orb.toString());
    if (params?.applying_only) queryParams.append('applying_only', 'true');
    
    const url = `/api/astrology/aspects/${chartId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response: AxiosResponse<APIResponse<AspectData[]>> = await this.client.get(url);
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;