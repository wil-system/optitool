import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function PUT(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const channel = await request.json();
    const { code } = params;

    // PostgreSQL 배열 형식으로 변환
    const channelDetailsArray = channel.channel_details
      .split(',')
      .map((detail: string) => detail.trim())
      .filter(Boolean);
    
    const formattedChannelDetails = `{${channelDetailsArray.map((detail: string) => `"${detail}"`).join(',')}}`;

    const { error } = await supabase
      .from('sales_channels')
      .update({
        channel_name: channel.channel_name,
        channel_details: formattedChannelDetails,  // PostgreSQL 배열 형식으로 변환된 데이터
        remarks: channel.remarks
      })
      .eq('channel_code', code);

    if (error) throw error;

    return NextResponse.json({ 
      message: '채널이 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 