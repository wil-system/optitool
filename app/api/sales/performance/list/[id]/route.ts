import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface IUpdateSizePayload {
  performance: number;
  achievement_rate: number;
  xs85: number;
  s90: number;
  m95: number;
  l100: number;
  xl105: number;
  xxl110: number;
  xxxl120: number;
  us_order: number;
}

// 판매실적 삭제 (기존 기능)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '삭제할 판매실적 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sales_performance')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '판매실적이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '판매실적 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

// 사이즈별 수량 및 실적 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '수정할 판매실적 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Partial<IUpdateSizePayload>;

    const {
      performance,
      achievement_rate,
      xs85,
      s90,
      m95,
      l100,
      xl105,
      xxl110,
      xxxl120,
      us_order,
    } = body;

    const updatePayload: Record<string, number | string> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof performance === 'number') updatePayload.performance = performance;
    if (typeof achievement_rate === 'number') updatePayload.achievement_rate = achievement_rate;
    if (typeof xs85 === 'number') updatePayload.xs_size = xs85;
    if (typeof s90 === 'number') updatePayload.s_size = s90;
    if (typeof m95 === 'number') updatePayload.m_size = m95;
    if (typeof l100 === 'number') updatePayload.l_size = l100;
    if (typeof xl105 === 'number') updatePayload.xl_size = xl105;
    if (typeof xxl110 === 'number') updatePayload.xxl_size = xxl110;
    if (typeof xxxl120 === 'number') updatePayload.fourxl_size = xxxl120;
    if (typeof us_order === 'number') updatePayload.us_order = us_order;

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        { error: '수정할 값이 없습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sales_performance')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '사이즈별 수량이 수정되었습니다.',
      data,
    });
  } catch (error) {
    console.error('Error updating sales performance sizes:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사이즈별 수량 수정 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}