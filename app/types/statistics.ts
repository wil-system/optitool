export interface IChannelStatistics {
  id: string; // 채널 ID
  channel_name: string; // 채널명
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

