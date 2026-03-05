// Calendar View Types
export type CalendarView = 'month' | 'week' | 'day';

export interface ViewConfig {
  type: CalendarView;
  dateRange: { start: Date; end: Date };
  gridColumns: number;
  eventDisplayMode: 'compact' | 'detailed' | 'full';
}

// Calendar Event Types
export interface CalendarEvent {
  publicationId: number;
  id: string;
  resourceId: number;
  type: 'publication' | 'post' | 'user_event';
  title: string;
  start: string;
  end?: string;
  status: string;
  color: string;
  platform?: string;
  campaign?: string;
  hasNoPlatforms?: boolean; // Indicates if publication has no social networks assigned
  user?: {
    id: number;
    name: string;
  };
  extendedProps: {
    slug?: string;
    thumbnail?: string;
    publication_id?: number;
    platform?: string;
    platforms?: string[]; // Array of all platforms for this publication
    campaigns?: string[]; // Array of all campaigns for this publication
    description?: string;
    remind_at?: string;
    is_public?: boolean;
    user_name?: string;
    [key: string]: any;
  };
}

// Filter Types
export interface CalendarFilters {
  platforms: string[];
  campaigns: string[];
  statuses: string[];
  dateRange?: { start: Date; end: Date };
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
}

export interface Campaign {
  id: number;
  name: string;
  color: string;
}

export type PublicationStatus = 
  | 'draft' 
  | 'published' 
  | 'publishing' 
  | 'failed' 
  | 'pending_review' 
  | 'approved' 
  | 'scheduled' 
  | 'rejected'
  | 'retrying';

// Bulk Operations Types
export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}

// External Calendar Types
export interface ExternalCalendarConnection {
  provider: 'google' | 'outlook';
  connected: boolean;
  email?: string;
  lastSync?: Date;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
}

export interface SyncConfig {
  enabled: boolean;
  syncCampaigns: number[];
  syncPlatforms: string[];
  syncDirection: 'one-way' | 'two-way';
}
