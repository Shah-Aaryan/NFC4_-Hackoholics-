export interface EmergencyApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  sentTo?: string[];
  failures?: Array<{
    email: string;
    error: string;
  }>;
  data?: {
    sentTo?: string[];
    message?: string;
    failures?: Array<{
      email: string;
      error: string;
    }>;
  };
}
