export interface InsightItem {
  type: string;
  title: string;
  description: string;
  priority: string;
}

// types/insight.ts
export interface InsightResponse {
  summary: string;
  health_score: number;
  health_label?: string;
  risk_level?: string;
  dominant_issue?: string;
  llm_used: boolean;
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
