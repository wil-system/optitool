// 판매 실적 테이블
export interface ISalesPerformance {
  id: number;
  sales_plan_id: number;
  performance: number;
  achievement_rate: number;
  temperature: number;
  xs_size: number;
  s_size: number;
  m_size: number;
  l_size: number;
  xl_size: number;
  xxl_size: number;
  fourxl_size: number;
  created_at: string;
  updated_at: string;
  us_order: number | null;
  sales_plan?: ISalesPlans;
}

// 판매 계획 테이블
export interface ISalesPlans {
  id: number;
  season: string;
  plan_date: string;
  plan_time: string;
  channel_code: string;
  channel_detail: string;
  product_category: string | null;
  product_name: string;
  product_summary: string | null;
  quantity_composition: string | null;
  set_id: number | null;
  product_code: string;
  sale_price: number;
  commission_rate: number | null;
  target_quantity: number;
  created_at: string;
  updated_at: string;
  channel_id: number | null;
  is_undecided: boolean;
  channel_name?: string; // API에서 가공되어 전달되는 필드
  channel?: ISalesChannels;
  set_info?: ISetProduct;
}

// 판매 채널 테이블
export interface ISalesChannels {
  id: number;
  channel_code: string;
  channel_name: string;
  channel_details: string[];
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// 세트 상품 테이블
export interface ISetProduct {
  id: number;
  set_id: string;
  set_name: string;
  individual_product_ids: string[] | null;
  individual_products_with_names?: {
    item_number: string;
    product_name: string;
  }[];
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// 세트 상품 폼 데이터
export interface ISetForm {
  set_id: string;
  set_name: string;
  individual_product_ids: string[];
  remarks: string;
}

// 상품 테이블
export interface IProducts {
  id: number;
  product_code: string;
  item_number: string | null;
  product_name: string;
  specification: string | null;
  purchase_price: number | null;
  selling_price: number | null;
  barcode_info: string | null;
  barcode: string | null;
  tag_price: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// 상품 카테고리 테이블
export interface IProductCategories {
  id: number;
  category_name: string;
  created_at: string;
  updated_at: string;
}

// 재고 이력 테이블
export interface IInventoryHistory {
  id: number;
  product_code: string;
  product_name: string;
  specification: string | null;
  total: number;
  warehouse_106: number;
  warehouse_3333: number;
  warehouse_12345: number;
  created_at: string;
  updated_at: string;
  sell_product_name: string | null;
  muin_sell_product_name: string | null;
  item_number: string | null;
  barcode: string | null;
  distribution_code: string | null;
  tag_price: number | null;
  out_price: number | null;
  muin_price: number | null;
  is_set: boolean | null;
}

// 가동 수량 테이블
export interface IOperationalQuantity {
  id: number;
  set_id: string;
  set_name: string;
  size_1: string | null;
  size_2: string | null;
  size_3: string | null;
  size_4: string | null;
  size_5: string | null;
  size_6: string | null;
  size_7: string | null;
  size_8: string | null;
  size_9: string | null;
  size_percent_1: number;
  size_percent_2: number;
  size_percent_3: number;
  size_percent_4: number;
  size_percent_5: number;
  size_percent_6: number;
  size_percent_7: number;
  size_percent_8: number | null;
  size_percent_9: number | null;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

// 멤버 테이블
export interface IMember {
  id: string;
  login_id: string;
  user_jnum: string | null;
  user_sex: string | null;
  user_name: string | null;
  cloth_size: string | null;
  mbti_type_name: string | null;
  user_uid: string;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
  is_admin: boolean;
}

// QA 게시글 테이블
export interface IQAPost {
  id: number;
  title: string;
  content: string;
  author_name: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  author_user_uid: string | null;
  answer_content: string | null;
  answer_author_uid: string | null;
  answer_author_name: string | null;
  answered_at: string | null;
  image_urls: string[] | null;
  is_notice: boolean;
}

// 판매계획 및 실적 통합 테이블
export interface ISalesPlanWithPerformance {
  id: string;
  season_year: string | null;
  season: string | null;
  plan_date: string | null;
  plan_time: string | null;
  channel_name: string | null;
  set_item_code: string | null;
  product_name: string | null;
  additional_composition: string | null;
  additional_item_code: string | null;
  sale_price: number;
  target_quantity: number;
  commission_rate: number;
  total_order_quantity: number;
  net_order_quantity: number;
  total_sales: number;
  net_sales: number;
  achievement_rate: number;
  pre_order_rate: number;
  total_achievement_rate: number;
  size_85: number;
  size_90: number;
  size_95: number;
  size_100: number;
  size_105: number;
  size_110: number;
  size_115: number;
  size_120: number;
  quantity_composition?: string | null;
  created_at: string;
  updated_at: string;
}
