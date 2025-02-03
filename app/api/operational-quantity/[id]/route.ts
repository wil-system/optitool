import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface IGroupedProduct {
  groupName: string;
  items: {
    product_code: string;
    product_name: string;
    specification: string;
    total: number;
    warehouse_106: number;
    warehouse_3333: number;
    warehouse_12345: number;
    size?: string;  // 사이즈 정보 추가
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 먼저 set_products 테이블에서 세트 정보와 individual_product_ids 가져오기
    const { data: setData, error: setError } = await supabase
      .from('set_products')
      .select(`
        set_id,
        set_name,
        individual_product_ids
      `)
      .eq('id', id)
      .single();

    if (setError) {
      console.error('세트 상품 조회 에러:', setError);
      throw setError;
    }

    if (!setData) {
      return NextResponse.json(
        { success: false, error: '세트 상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. individual_product_ids를 사용하여 inventory_history 데이터 조회
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_history')
      .select(`
        product_code,
        product_name,
        specification,
        total,
        warehouse_106,
        warehouse_3333,
        warehouse_12345
      `)
      .in('product_code', setData.individual_product_ids);

    if (inventoryError) {
      console.error('재고 이력 조회 에러:', inventoryError);
      throw inventoryError;
    }

    // 상품명으로 그룹화
    const groupedProducts = inventoryData.reduce<IGroupedProduct[]>((acc, item) => {
      const groupName = item.product_name.split('-')[0].trim();
      const size = item.product_name.match(/\b(XS|S|M|L|XL|XXL|4XL)\b/)?.[0];
      
      const existingGroup = acc.find(group => group.groupName === groupName);
      
      if (existingGroup) {
        existingGroup.items.push({ ...item, size });
      } else {
        acc.push({
          groupName,
          items: [{ ...item, size }]
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json({
      success: true,
      setInfo: {
        set_id: setData.set_id,
        set_name: setData.set_name,
      },
      groupedProducts
    });

  } catch (error) {
    console.error('세트 상품 상세 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세트 상품 상세 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const { error } = await supabase
      .from('operational_quantities')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('운영수량 삭제 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '운영수량 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 