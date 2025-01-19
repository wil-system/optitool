import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

import { ICombinedSalesData , IAssortStatistics } from '@/app/types/statistics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';

    let query = supabase
    .from('sales_performance')
    .select(`
      id,
      performance,
      achievement_rate,
      temperature,
      xs_size,
      s_size,
      m_size,
      l_size,
      xl_size,
      xxl_size,
      fourxl_size,
      is_active,
      sales_plans!inner(
        id,
        season,
        plan_date,
        channel_code,
        channel_detail,
        product_category,
        product_name,
        product_summary,
        quantity_composition,
        set_id,
        product_code,
        sale_price,
        commission_rate,
        target_quantity,
        channel_id,
        is_active,
        set_products(
          id,
          set_id,
          set_name,
          individual_product_ids,
          is_active
        ),
        sales_channels(
          id,
          channel_code,
          channel_name,
          channel_details,
          is_active
        )
      )
    `)
    .eq('is_active', true)
    .eq('sales_plans.is_active', true)
    .eq('sales_plans.set_products.is_active', true)
    .eq('sales_plans.sales_channels.is_active', true);

    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startDateTime.getHours() + 9);
      query = query.gte('sales_plans.plan_date', startDateTime.toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endDateTime.getHours() + 9);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('sales_plans.plan_date', endDateTime.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json([]);

    const groupedStats = data.reduce((acc: Record<string, Record<number, ICombinedSalesData>>, curr: any) => {
      const planDate = curr.sales_plans?.plan_date;
      
      if (!planDate) return acc;

      // KST로 변환
      const date = new Date(planDate);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const originalDate = kstDate.toISOString().split('T')[0];

      // 기간별 그룹화 키 생성
      let groupKey;
      switch (period) {
        case 'yearly':
          groupKey = `${kstDate.getFullYear()}`;
          break;
        case 'monthly':
          groupKey = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        case 'custom':
          groupKey = originalDate;
          break;
        default:
          groupKey = originalDate;
      }

      console.log('데이터 그룹화:', {
        원본날짜: planDate,
        KST변환날짜: kstDate.toISOString(),
        그룹키: groupKey,
        표시날짜: originalDate,
      });

      if (!acc[groupKey]) {
        acc[groupKey] = {}
      }
      
      const setid = curr.sales_plans?.set_products?.id;
      if (!acc[groupKey][setid]) {
        // 개별 상품 ID들을 배열로 변환
        acc[groupKey][setid] = {
          id: curr.id,
          sales_plan_id: curr.sales_plan_id,
          performance: curr.performance,
          achievement_rate: curr.achievement_rate,
          temperature: curr.temperature,
          xs_size: curr.xs_size,
          s_size: curr.s_size,
          m_size: curr.m_size,
          l_size: curr.l_size,
          xl_size: curr.xl_size,
          xxl_size: curr.xxl_size,
          fourxl_size: curr.fourxl_size,
          sales_plan: {
            id: curr.sales_plans.id,
            season: curr.sales_plans.season,
            plan_date: curr.sales_plans.plan_date,
            plan_time: curr.sales_plans.plan_time,
            channel_code: curr.sales_plans.channel_code,
            channel_detail: curr.sales_plans.channel_detail,
            product_category: curr.sales_plans.product_category,
            product_name: curr.sales_plans.product_name,
            product_summary: curr.sales_plans.product_summary,
            quantity_composition: curr.sales_plans.quantity_composition,
            set_id: curr.sales_plans.set_id,
            product_code: curr.sales_plans.product_code,
            sale_price: curr.sales_plans.sale_price,
            commission_rate: curr.sales_plans.commission_rate,
            target_quantity: curr.sales_plans.target_quantity,
            channel_id: curr.sales_plans.channel_id,
            set_product: {
              set_id: curr.sales_plans.set_products.set_id,
              set_name: curr.sales_plans.set_products.set_name,
              individual_product_ids: curr.sales_plans.set_products.individual_product_ids,
              remarks: curr.sales_plans.set_products.remarks,
              created_at: curr.sales_plans.set_products.created_at,
              updated_at: curr.sales_plans.set_products.updated_at,
              is_active: curr.sales_plans.set_products.is_active
            },
            sales_channels: {
              id: curr.sales_plans.sales_channels.id,
              channel_code: curr.sales_plans.sales_channels.channel_code,
              channel_detail: curr.sales_plans.sales_channels.channel_detail,
              channel_name: curr.sales_plans.sales_channels.channel_name,
              is_active: curr.sales_plans.sales_channels.is_active
            }
          }
        };
      }

      return acc;
    }, {});

    const result = Object.entries(groupedStats).map(([date, planData]) => {
      const groupedProducts = Object.values(planData).map(plan => {
        // 전체 주문 수량 계산
        const totalQuantity = (
          (plan.xs_size || 0) +
          (plan.s_size || 0) +
          (plan.m_size || 0) +
          (plan.l_size || 0) +
          (plan.xl_size || 0) +
          (plan.xxl_size || 0) +
          (plan.fourxl_size || 0)
        );
    
        return {
          product_name: plan.sales_plan.set_product.set_name,
          set_product_code: plan.sales_plan.set_product.set_id.toString(),
          // 실제 주문 수량
          xs_size: plan.xs_size || 0,
          s_size: plan.s_size || 0,
          m_size: plan.m_size || 0,
          l_size: plan.l_size || 0,
          xl_size: plan.xl_size || 0,
          xxl_size: plan.xxl_size || 0,
          fourxl_size: plan.fourxl_size || 0,
          // 사이즈별 아소트 (%) - 소수점 한자리까지 표시
          xs_assort: Number(((totalQuantity > 0 ? ((plan.xs_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          s_assort: Number(((totalQuantity > 0 ? ((plan.s_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          m_assort: Number(((totalQuantity > 0 ? ((plan.m_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          l_assort: Number(((totalQuantity > 0 ? ((plan.l_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          xl_assort: Number(((totalQuantity > 0 ? ((plan.xl_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          xxl_assort: Number(((totalQuantity > 0 ? ((plan.xxl_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          fourxl_assort: Number(((totalQuantity > 0 ? ((plan.fourxl_size || 0) / totalQuantity) * 100 : 0)).toFixed(1)),
          // 사이즈별 주문수량
          xs_order: plan.xs_size || 0,
          s_order: plan.s_size || 0,
          m_order: plan.m_size || 0,
          l_order: plan.l_size || 0,
          xl_order: plan.xl_size || 0,
          xxl_order: plan.xxl_size || 0,
          fourxl_order: plan.fourxl_size || 0
        } as IAssortStatistics;
      }).reduce((acc, curr) => {
        const key = `${curr.set_product_code}`;
        if (!acc[key]) {
          acc[key] = curr;
        } else {
          // 사이즈별 수량 합산
          acc[key].xs_size += curr.xs_size;
          acc[key].s_size += curr.s_size;
          acc[key].m_size += curr.m_size;
          acc[key].l_size += curr.l_size;
          acc[key].xl_size += curr.xl_size;
          acc[key].xxl_size += curr.xxl_size;
          acc[key].fourxl_size += curr.fourxl_size;

          // 전체 수량 재계산
          const totalQuantity = (
            acc[key].xs_size +
            acc[key].s_size +
            acc[key].m_size +
            acc[key].l_size +
            acc[key].xl_size +
            acc[key].xxl_size +
            acc[key].fourxl_size
          );

          // 아소트 비율 재계산
          acc[key].xs_assort = Number(((totalQuantity > 0 ? (acc[key].xs_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].s_assort = Number(((totalQuantity > 0 ? (acc[key].s_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].m_assort = Number(((totalQuantity > 0 ? (acc[key].m_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].l_assort = Number(((totalQuantity > 0 ? (acc[key].l_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].xl_assort = Number(((totalQuantity > 0 ? (acc[key].xl_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].xxl_assort = Number(((totalQuantity > 0 ? (acc[key].xxl_size / totalQuantity) * 100 : 0)).toFixed(1));
          acc[key].fourxl_assort = Number(((totalQuantity > 0 ? (acc[key].fourxl_size / totalQuantity) * 100 : 0)).toFixed(1));
        }
        return acc;
      }, {} as Record<string, IAssortStatistics>);
    
      return {
        [date]: Object.values(groupedProducts)
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});
       // 날짜 기준 내림차순 정렬
      // result.sort((a, b) => b.date.localeCompare(a.date));
    
        return NextResponse.json(result);
    } catch (error) {
        console.error('API 에러:', error);
        return NextResponse.json(
          { error: '통계 조회 중 오류가 발생했습니다.' },
          { status: 500 }
      );
    }
  } 