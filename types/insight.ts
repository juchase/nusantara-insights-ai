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

// types/insight.ts
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
    growth_percentage: number;
    forecast_trend: "up" | "down" | "stable";
    top_keyword: string;
  };
}
