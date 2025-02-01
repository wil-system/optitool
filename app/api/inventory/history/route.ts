import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    const { data, error } = await supabase
      .from('inventory_history')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase 조회 에러:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        specification: item.specification,
        total: item.total,
        warehouse_106: item.warehouse_106,
        warehouse_3333: item.warehouse_3333,
        warehouse_12345: item.warehouse_12345,
        updated_at: item.updated_at
      }))
    });

  } catch (error) {
    console.error('재고 이력 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '재고 이력 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 