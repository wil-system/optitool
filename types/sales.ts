export interface SalesPerformance {
  id: number;
  season: string;
  channel_code: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  set_id: string;
  sales_date: string;
  sales_quantity: number;
  sales_amount: number;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export type SearchFilterKey = 'season' | 'channel' | 'channelDetail' | 'category' | 'productName' | 'setId';

export interface ISearchFilter {
  key: SearchFilterKey;
  label: string;
}

interface ISalesPerformanceWithRelations {
  id: number;
  sales_plan_id: number;
  performance: number;
  achievement_rate: number;
  // ... 다른 필드들
  sales_plans: {
    id: number;
    // ... sales_plans의 다른 필드들
    sales_channels: {
      channel_code: string;
      channel_name: string;
    };
  };
} 