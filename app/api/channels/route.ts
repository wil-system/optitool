import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const size = Number(searchParams.get('size')) || 100;
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('sales_channels')
      .select('*', { count: 'exact' })
      .order('channel_code', { ascending: true });

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    const { data, error, count } = await query
      .range(page * size, (page + 1) * size - 1);

    if (error) throw error;

    return NextResponse.json({ 
      data,
      count,
      hasMore: count ? (page + 1) * size < count : false
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const channel = await request.json();

    const { error } = await supabase
      .from('sales_channels')
      .update({
        channel_name: channel.channel_name,
        channel_details: channel.channel_details,
        remarks: channel.remarks
      })
      .eq('channel_code', channel.channel_code);

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: '삭제할 채널 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sales_channels')
      .delete()
      .eq('channel_code', code);

    if (error) throw error;

    return NextResponse.json({ 
      message: '채널이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 