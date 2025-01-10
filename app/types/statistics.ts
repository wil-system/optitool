export interface IDailyStatistics {
  date: string;
  channels: IChannelStatistics[];
}

export interface IChannelStatistics {
  id: string;
  channel_name: string;
  quantity: number;
  amount: number;
  share: number;
  date: string;
}

export interface IChannelDetail {
  channel_name: string;
  season: string;
  category: string;
  product_code: string;
  product_name: string;
  set_code: string;
  price: number;
  commission_rate: number;
  note?: string;
} 