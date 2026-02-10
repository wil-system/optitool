import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface IGroupedProduct {
  itemNumber: string;
  items: {
    product_code: string;
    item_number: string;
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

    // 2. individual_product_ids에서 # 앞의 품번(item_number)만 추출하여 inventory_history 데이터 조회
    const itemNumbers = setData.individual_product_ids?.map((id: string) => id.split('#')[0]) || [];

    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_history')
      .select(`
        product_code,
        item_number,
        product_name,
        specification,
        total,
        warehouse_106,
        warehouse_3333,
        warehouse_12345
      `)
      .in('item_number', itemNumbers);

    if (inventoryError) {
      console.error('재고 이력 조회 에러:', inventoryError);
      throw inventoryError;
    }

    // 품번(item_number)의 prefix(첫 번째 '-' 앞부분)로 그룹화
    const groupedProducts = inventoryData.reduce<IGroupedProduct[]>((acc, item) => {
      const fullItemNumber = item.item_number || 'unknown';
      const itemNumberPrefix = fullItemNumber.split('-')[0]; // LWNAAUP0502-BK-XL -> LWNAAUP0502
      const size = item.product_name.match(/\b(XS|S|M|L|XL|XXL|4XL)\b/)?.[0];
      
      const existingGroup = acc.find(group => group.itemNumber === itemNumberPrefix);
      
      if (existingGroup) {
        existingGroup.items.push({ ...item, size });
      } else {
        acc.push({
          itemNumber: itemNumberPrefix,
          items: [{ ...item, size }]
        });
      }
      
      return acc;
    }, []);

    // 각 그룹 내의 아이템들을 사이즈 순서대로 정렬
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
    groupedProducts.forEach(group => {
      group.items.sort((a, b) => {
        const specA = (a.specification || '').toUpperCase().trim();
        const specB = (b.specification || '').toUpperCase().trim();
        
        // 숫자인 경우 숫자 크기로 비교 (예: 85, 90...) - "2XL" 같은 값은 숫자로 취급하면 안 됨
        const isNumA = /^\d+$/.test(specA);
        const isNumB = /^\d+$/.test(specB);
        const numA = isNumA ? parseInt(specA, 10) : NaN;
        const numB = isNumB ? parseInt(specB, 10) : NaN;
        if (isNumA && isNumB) return numA - numB;
        if (isNumA) return -1;
        if (isNumB) return 1;

        // 문자열 사이즈인 경우 sizeOrder 기준
        const getIndex = (size: string) => {
          const s = size.toUpperCase();
          if (s === '2XL') return sizeOrder.indexOf('XXL');
          return sizeOrder.indexOf(s);
        };

        const indexA = getIndex(specA);
        const indexB = getIndex(specB);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return specA.localeCompare(specB);
      });
    });

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

export async function DELETE(request: Request)
{
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop();
    
    const { error } = await supabase
      .from('operational_quantities')
      .delete()
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