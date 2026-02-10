import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const size = Number(searchParams.get('size')) || 12;
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
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
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

export async function POST(request: Request) {
  try {
    const channel = await request.json();

    // 필수 필드 검증
    if (!channel.channel_code || !channel.channel_name) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sales_channels')
      .insert([{
        channel_code: channel.channel_code,
        channel_name: channel.channel_name,
        channel_details: [],
        remarks: channel.remarks || ''
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // 중복 키 에러
        return NextResponse.json(
          { error: '이미 존재하는 채널 코드입니다.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      message: '채널이 성공적으로 등록되었습니다.',
      data 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 