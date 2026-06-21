/* Types mirroring the backend Pydantic response schemas (app/schemas/*). */

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  agency_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  client_id: string;
  platform_id: number;
  external_account_id: string;
  display_name: string | null;
  status: string;
  connected_at: string;
}

export interface AccountSyncResult {
  account_id: string;
  captured_date: string;
  followers_count: number | null;
  views_count: number | null;
  content_items_synced: number;
  message: string;
}

export interface AccountMetricsDaily {
  id: string;
  connected_account_id: string;
  captured_date: string;
  followers_count: number | null;
  views_count: number | null;
  // Pydantic serializes Decimal defensively; accept both shapes.
  engagement_rate: number | string | null;
}

export interface ContentMetrics {
  id: string;
  captured_at: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

export interface ContentItem {
  id: string;
  connected_account_id: string;
  external_content_id: string;
  title: string | null;
  content_type: string;
  published_at: string | null;
  thumbnail_url: string | null;
  latest_metrics: ContentMetrics | null;
}

// Request payloads
export interface RegisterRequest {
  email: string;
  password: string;
  agency_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ClientCreate {
  name: string;
}

export interface ClientUpdate {
  name: string;
}

export interface AccountConnectRequest {
  client_id: string;
  channel: string;
  platform?: string;
}
