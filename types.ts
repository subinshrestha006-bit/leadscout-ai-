export interface Lead {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  website: string;
  contactInfo: string;
  potentialScore: number; // 0-100
  reasoning: string;
  platformStatus: string;
  emailDraft: string;
  followUpEmail: string;
  outreachTips: string;
}

export interface AgentLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
}

export enum AgentStatus {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING_MISSION',
  SCOUTING = 'SCOUTING_LOCATIONS',
  ANALYZING = 'ANALYZING_DATA',
  COMPLETE = 'MISSION_COMPLETE',
  ERROR = 'ERROR'
}

export interface SearchParams {
  niche: string; // e.g., "Restaurants", "Salons"
  serviceOffering: string; // e.g., "AI Voice Agent", "Website Redesign"
}