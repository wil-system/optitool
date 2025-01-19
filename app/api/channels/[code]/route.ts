import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const { data, error } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('channel_code', code)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('sales_channels')
      .update({
        channel_name: body.channel_name,
        channel_details: body.channel_details,
        remarks: body.remarks,
        is_active: body.is_active
      })
      .eq('channel_code', code)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const { error } = await supabase
      .from('sales_channels')
      .delete()
      .eq('channel_code', code);

    if (error) throw error;

    return NextResponse.json({ message: '채널이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 