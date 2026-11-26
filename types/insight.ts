export interface InsightItem {
  type: string;
  title: string;
  description: string;
  priority: string;
}

export interface SentimentTrend {
  status: "ok" | "insufficient_data";
  first_period_positive: number;
  second_period_positive: number;
  delta: number;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  label: string;
  message: string;
  first_period_range?: string;
  second_period_range?: string;
  first_period_count?: number;
  second_period_count?: number;
}

export interface ForecastValidation {
  wape: number | null;
  mae?: number | null;
  rmse?: number | null;
  n_predictions: number;
  evaluation_status?: string;
}

export interface ConfidenceContext {
  status: "available" | "unavailable";
  reason?: string | null;
  label: string;
  message: string;
  color: "green" | "yellow" | "red" | "gray";
}

export interface InsightResponse {
  executive_summary: string;
  summary: string;
  health_score: number;
  health_label?: string;
  risk_level?: string;
  dominant_issue?: string;
  llm_used: boolean;
  sentiment_trend?: SentimentTrend;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  recommendations: string[];
  metrics?: {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
    total_reviews?: number;
    growth_percentage: number;
    forecast_trend: "up" | "down" | "stable";
    top_keyword: string;
  };
  confidence: number | null;
  confidence_context: ConfidenceContext | null;
  validation?: ForecastValidation | null;
  modelVersion: string;
  freq: "D" | "W";
  forecastSummary?: { avg: number; min: number; max: number } | null;
}
