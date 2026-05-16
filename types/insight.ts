export interface InsightItem {
  type: string;
  title: string;
  description: string;
  priority: string;
}

export interface InsightResponse {
  summary: string;
  health_score: number;
  insights: InsightItem[];
  recommendations: string[];
}
