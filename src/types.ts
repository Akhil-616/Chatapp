export type ViewMode = 'landing' | 'app';
export type AppSection = 'messages' | 'search' | 'notifications' | 'matching' | 'profile' | 'settings';

export interface DesignIdea {
  id: string;
  title: string;
  category: 'ui-ux' | 'websocket-engine' | 'matching-algorithm' | 'security-rls' | 'mobile-terminal';
  description: string;
  author: string;
  university?: string;
  tags: string[];
  upvotes: number;
  hasUpvoted?: boolean;
  createdAt: string;
  status: 'under-review' | 'in-progress' | 'planned' | 'completed';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isMe: boolean;
  type?: 'text' | 'voice' | 'image';
  voiceDuration?: string;
  voiceWaveform?: number[];
  attachmentUrl?: string;
}

export interface Contact {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  sharedInterests: string[];
  university: string;
  major: string;
}

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'like' | 'mention' | 'security' | 'match_found';
  userName: string;
  userAvatar?: string;
  actionText: string;
  timeAgo: string;
  messagePreview?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface ArchitectureLayer {
  number: number;
  name: string;
  badge: string;
  summary: string;
  technicalPrinciple: string;
  realWorldProblem: string;
  solutionDetail: string;
  diagramCode: string;
}

export interface UniversityMatchProfile {
  id: string;
  name: string;
  avatar: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  matchScore: number;
  interests: string[];
  seeking: string;
}
