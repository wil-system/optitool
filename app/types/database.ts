// 판매 실적 테이블
export interface ISalesPerformance {
  id: number;
  sales_plan_id: number;
  performance: number;
  achievement_rate: number;
  temperature: number;
  created_at: string;
  updated_at: string;
  sales_plan: {
    season: string;
    channel_name: string;
    channel_detail: string;
    product_category: string;
    product_name: string;
    plan_date: string;
    plan_time: string;
    target_quantity: number;
    set_info: {
      id: number;
      set_id: string;
      set_name: string;
    } | null;
    sale_price: number;
    commission_rate: number;
    product_code: string;
    product_summary: string;
    quantity_composition: string;
    channel?: {
      id: number;
      channel_code: string;
      channel_name: string;
    };
    created_at: string;
    updated_at: string;
  };
}

// 판매 계획 테이블
export interface ISalesPlans {
  id: number;
  channel_id: number;
  channel_code: string;
  set_id: number | null;
  set_info?: {
    id: number;
    set_id: string;
    set_name: string;
  } | null;
  channel?: {
    id: number;
    channel_code: string;
    channel_name: string;
  };
  season: string;
  channel_name: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  plan_date: string;
  plan_time: string;
  target_quantity: number;
  sale_price: number;
  commission_rate: number;
  product_code: string;
  product_summary: string;
  quantity_composition: string;
  created_at: string;
  updated_at: string;
}

// 판매 채널 테이블
export interface ISalesChannels {
  id: number;
  channel_code: string;
  channel_name: string;
  channel_details: string;
  remarks: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// 세트 상품 테이블
export interface ISetProduct {
  id: string;
  set_id: string;
  set_name: string;
  individual_product_ids: string[];
  remarks: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface ISetForm {
  set_id: string;
  set_name: string;
  individual_product_ids: string[];
  remarks: string;
}

// 상품 테이블
interface IProducts {
  id: number;
  product_code: string;
  item_number: string;
  product_name: string;
  specification: string;
  purchase_price: number;
  selling_price: number;
  barcode_info: string;
  barcode: string;
  tag_price: number;
  remarks: string;
  created_at: Date;
  updated_at: Date;
}

// 상품 카테고리 테이블
interface IProductCategories {
  id: number;
  category_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface IChannel {
  id: number;
  channel_code: string;
  channel_name: string;
  created_at: string;
  updated_at: string;
}

export interface ICategory {
  id: number;
  category_name: string;
  created_at: string;
  updated_at: string;
} 

export interface IProduct {
  product_code: string;
  product_name: string;
  specification: string;
  total: number;
  warehouse_106: number;
  warehouse_3333: number;
  warehouse_12345: number;
}