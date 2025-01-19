export interface IChannelStatistics {
  id: string; // 채널 ID
  channel_name: string; // 채널명
  channel_detail: string; // 채널상세
  quantity: number; // 전체 판매수량
  amount: number; // 전체 판매금액
  target_quantity: number; // 전체 목표
  performance: number; // 전체 실적
  achievement_rate: number; // 전체 달성률
  share: number; // 점유율
  date: string; // 날짜
}

export interface IDailyStatistics {
  date: string; // 날짜
  channels: IChannelStatistics[]; // 채널 통계 배열
}

export interface IChannelDetailStatistics {
  date: string; // 일자
  time: string; // 시간
  //sales_channel: string; // 판매채널
  channel_detail: string; // 채널상세
  category: string; // 카테고리
  product_name: string; // 상품명
  set_id: number;
  set_product_code: string; // 세트품번
  target: number; // 목표
  performance: number; // 실적
  sales_amount: number; // 판매금액
  achievement_rate: number; // 달성률
}

export interface IProductStatisticsGroup {
  //세트 테이블 정보
  setId: number;      // 세트ID
  productIds: number[]; // 품목ID 배열
  //판매계획 정보
  planDate: string; // 판매계획일자

  quantity: number;          // 판매수량
  sales_amount: number;      // 판매금액
  performance: number;       // 실적

}

export interface IProductStatistics {
  product_name: string;      // 상품명
  set_product_code: string;  // 세트품번
  channel: string;          // 채널
  channel_detail: string;   // 상세채널
  category: string;         // 카테고리
  sales_amount: number;     // 판매금액
  performance: number;      // 실적
  target: number;          // 목표
  achievement_rate: number; // 달성률
  share: number;           // 점유율
  temperature: number;     // 온도 추가
}

// export interface IProductStatistics {
//   product_code: string;      // 품목코드
//   product_name: string;      // 품목명
//   specification: string;     // 규격
//   quantity: number;          // 판매수량
//   sales_amount: number;      // 판매금액
//   performance: number;       // 실적
//   share: number;            // 점유율 (%)
// }

// 응답 데이터 형태를 위한 인터페이스
export interface IProductStatisticsResponse {
  data: IProductStatistics[];
  total: {
    total_quantity: number;
    total_amount: number;
    total_performance: number;
  };
}

export interface ICombinedSalesData {
  // sales_performance 테이블 필드
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

  // sales_plans 테이블 필드
  sales_plan: {
    id: number;
    season: string;
    plan_date: string;
    plan_time: string;
    channel_code: string;
    channel_detail: string;
    product_category: string;
    product_name: string;
    product_summary: string;
    quantity_composition: string;
    set_id: number;
    product_code: string;
    sale_price: number;
    commission_rate: number;
    target_quantity: number;
    channel_id: number;

    // set_products 테이블 필드
    set_product: {
      set_id: number;
      set_name: string;
      individual_product_ids: string;
      remarks: string;
      created_at: string;
      updated_at: string;
      is_active: boolean;
    };
    sales_channels: {
      id: number;
      channel_code: string;
      channel_name: string;
      channel_detail: string;
      is_active: boolean;
    };
  };
} 

export interface IAssortStatistics {
  product_name: string;      // 상품명
  set_product_code: string;  // 세트품번
  // 실제 주문 수량
  xs_size: number;
  s_size: number;
  m_size: number;
  l_size: number;
  xl_size: number;
  xxl_size: number;
  fourxl_size: number;
  // 사이즈별 아소트 (%)
  xs_assort: number;
  s_assort: number;
  m_assort: number;
  l_assort: number;
  xl_assort: number;
  xxl_assort: number;
  fourxl_assort: number;
}
