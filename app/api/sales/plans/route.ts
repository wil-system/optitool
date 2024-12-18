import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels(id, channel_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data?.map(item => ({
      ...item,
      channel_name: item.channel?.channel_name || ''
    })) || [];

    return NextResponse.json({
      data: formattedData
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('받은 데이터:', data);

    if (!data.channel_id) {
      throw new Error('채널 ID가 필요합니다.');
    }

    // 채널 정보 조회하여 channel_code 가져오기
    const { data: channelData, error: channelError } = await supabase
      .from('sales_channels')
      .select('id, channel_code')
      .eq('id', data.channel_id)
      .eq('is_active', true)
      .single();

    if (channelError) throw channelError;
    if (!channelData) throw new Error('활성화된 채널 정보를 찾을 수 없습니다.');

    const planData = {
      season: data.season,
      plan_date: data.plan_date,
      plan_time: data.plan_time,
      channel_id: channelData.id,
      channel_code: channelData.channel_code,
      channel_detail: data.channel_detail,
      product_category: data.product_category,
      product_name: data.product_name,
      product_summary: data.product_summary,
      quantity_composition: data.quantity_composition,
      set_id: data.set_id,
      product_code: data.product_code,
      sale_price: data.sale_price,
      commission_rate: data.commission_rate,
      target_quantity: data.target_quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('저장할 데이터:', planData);

    const { error } = await supabase
      .from('sales_plans')
      .insert(planData);

    if (error) {
      console.error('저장 오류:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: '판매계획이 성공적으로 등록되었습니다.',
      success: true 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '판매계획 등록 실패',
      success: false 
    }, { 
      status: 500 
    });
  }
} 