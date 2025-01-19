// import { NextResponse } from 'next/server';
// import { supabase } from '@/utils/supabase';
// import { ICombinedSalesData , IProductStatistics } from '@/app/types/statistics';

// interface IProductStatsMap {
//   [key: string]: ICombinedSalesData;
// }

// // 데이터베이스 쿼리 결과 타입 정의
// interface SalesPlan {
//   id: number;
//   season: string;
//   plan_date: string;
//   channel_code: string;
//   channel_detail: string;
//   product_category: string;
//   product_name: string;
//   product_summary: string;
//   quantity_composition: string;
//   set_id: number;
//   product_code: string;
//   sale_price: number;
//   commission_rate: number;
//   target_quantity: number;
//   channel_id: number;
//   is_active: boolean;
//   set_products: {
//     id: number;
//     set_id: number;
//     set_name: string;
//     individual_product_ids: string;
//     is_active: boolean;
//   }[];
// }

// interface QueryResult {
//   id: number;
//   performance: number;
//   achievement_rate: number;
//   temperature: number;
//   xs_size: number;
//   s_size: number;
//   m_size: number;
//   l_size: number;
//   xl_size: number;
//   xxl_size: number;
//   fourxl_size: number;
//   is_active: boolean;
//   sales_plans: {
//     id: number;
//     season: string;
//     plan_date: string;
//     channel_code: string;
//     channel_detail: string;
//     product_category: string;
//     product_name: string;
//     product_summary: string;
//     quantity_composition: string;
//     set_id: number;
//     product_code: string;
//     sale_price: number;
//     commission_rate: number;
//     target_quantity: number;
//     channel_id: number;
//     is_active: boolean;
//     set_products: {
//       individual_product_ids: string;
//     };
//   };
// }

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const startDate = searchParams.get('startDate');
//     const endDate = searchParams.get('endDate');
//     const period = searchParams.get('period') || 'monthly';

//     let query = supabase
//     .from('sales_performance')
//     .select(`
//       id,
//       performance,
//       achievement_rate,
//       temperature,
//       xs_size,
//       s_size,
//       m_size,
//       l_size,
//       xl_size,
//       xxl_size,
//       fourxl_size,
//       is_active,
//       sales_plans!inner(
//         id,
//         season,
//         plan_date,
//         channel_code,
//         channel_detail,
//         product_category,
//         product_name,
//         product_summary,
//         quantity_composition,
//         set_id,
//         product_code,
//         sale_price,
//         commission_rate,
//         target_quantity,
//         channel_id,
//         is_active,
//         set_products(
//           id,
//           set_id,
//           set_name,
//           individual_product_ids,
//           is_active
//         )
//       )
//     `)
//     .eq('is_active', true);

//     if (startDate) {
//       const startDateTime = new Date(startDate);
//       startDateTime.setHours(startDateTime.getHours() + 9);
//       query = query.gte('sales_plans.plan_date', startDateTime.toISOString());
//     }
//     if (endDate) {
//       const endDateTime = new Date(endDate);
//       endDateTime.setHours(endDateTime.getHours() + 9);
//       endDateTime.setHours(23, 59, 59, 999);
//       query = query.lte('sales_plans.plan_date', endDateTime.toISOString());
//     }

//     const { data, error } = await query;
    
//     console.log('DB 조회 결과:', data);
//     console.log('DB 조회 에러:', error);

//     if (error) throw error;
//     if (!data || data.length === 0) return NextResponse.json([]);

//     console.log('DB 조회 결과:', data);
//     // 타입 단언을 사용하여 TypeScript에 데이터 구조를 알림
//     // const salesData = data as { sales_plans: SalesPlan[] }[];

//     const setProductIds = [...new Set((data as unknown as QueryResult[]).map(item => 
//       item.sales_plans?.set_products?.individual_product_ids || ''
//     ))].filter(Boolean);

//     // 세트 상품의 ID들을 수집
//     // const setProductIds = [...new Set(salesData.flatMap(item => 
//     //   item.sales_plans.flatMap(plan => 
//     //     plan.set_products.map(product => product.individual_product_ids)
//     //   )
//     // ))].filter(Boolean);

//     console.log('수집된 setProductIds:', setProductIds);

//     // products 테이블에서 한 번에 모든 상품 정보 조회
//     const { data: productsData } = await supabase
//       .from('products')
//       .select('*')
//       .in('product_code', setProductIds);

//     console.log('productsData:', productsData);

//     // products 데이터를 Map으로 변환하여 빠른 조회 가능하게 함
//     const productsMap = new Map(productsData?.map(product => [product.product_code, product]));

//     // reduce 함수에서 Map을 사용
//     const groupedStats = data.reduce((acc: Record<string, Record<number, ICombinedSalesData>>, curr: any) => {
//       const planDate = curr.sales_plans?.plan_date;
      
//       if (!planDate) return acc;

//       // KST로 변환
//       const date = new Date(planDate);
//       const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
//       const originalDate = kstDate.toISOString().split('T')[0];

//       // 기간별 그룹화 키 생성
//       let groupKey;
//       switch (period) {
//         case 'yearly':
//           groupKey = `${kstDate.getFullYear()}`;
//           break;
//         case 'monthly':
//           groupKey = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}`;
//           break;
//         case 'daily':
//         case 'custom':
//           groupKey = originalDate;
//           break;
//         default:
//           groupKey = originalDate;
//       }

//       console.log('데이터 그룹화:', {
//         원본날짜: planDate,
//         KST변환날짜: kstDate.toISOString(),
//         그룹키: groupKey,
//         표시날짜: originalDate,
//       });

//       if (!acc[groupKey]) {
//         acc[groupKey] = {}
//       }
      
//       const planId = curr.sales_plans?.id;
//       if (!acc[groupKey][planId]) {
//         // 개별 상품 ID들을 배열로 변환
//         const productIds = curr.sales_plan?.set_product?.individual_product_ids
//           ?.split(',')
//           .map((id: string) => id.trim()) || [];
        
//         acc[groupKey][planId] = {
//           id: curr.id,
//           sales_plan_id: curr.sales_plan_id,
//           performance: curr.performance,
//           achievement_rate: curr.achievement_rate,
//           temperature: curr.temperature,
//           xs_size: curr.xs_size,
//           s_size: curr.s_size,
//           m_size: curr.m_size,
//           l_size: curr.l_size,
//           xl_size: curr.xl_size,
//           xxl_size: curr.xxl_size,
//           fourxl_size: curr.fourxl_size,
//           sales_plan: {
//             id: curr.sales_plans.id,
//             season: curr.sales_plans.season,
//             plan_date: curr.sales_plans.plan_date,
//             plan_time: curr.sales_plans.plan_time,
//             channel_code: curr.sales_plans.channel_code,
//             channel_detail: curr.sales_plans.channel_detail,
//             product_category: curr.sales_plans.product_category,
//             product_name: curr.sales_plans.product_name,
//             product_summary: curr.sales_plans.product_summary,
//             quantity_composition: curr.sales_plans.quantity_composition,
//             set_id: curr.sales_plans.set_id,
//             product_code: curr.sales_plans.product_code,
//             sale_price: curr.sales_plans.sale_price,
//             commission_rate: curr.sales_plans.commission_rate,
//             target_quantity: curr.sales_plans.target_quantity,
//             channel_id: curr.sales_plans.channel_id,
//             set_product: {
//               set_id: curr.sales_plans.set_products.set_id,
//               set_name: curr.sales_plans.set_products.set_name,
//               individual_product_ids: curr.sales_plans.set_products.individual_product_ids,
//               individual_products: productIds.map((id : string) => productsMap.get(id)).filter(Boolean),
//               remarks: curr.sales_plans.set_products.remarks,
//               created_at: curr.sales_plans.set_products.created_at,
//               updated_at: curr.sales_plans.set_products.updated_at,
//               is_active: curr.sales_plans.set_products.is_active
//             }
//           }
//         };
//       }

//       // const quantity = (
//       //   (curr.xs_size || 0) +
//       //   (curr.s_size || 0) +
//       //   (curr.m_size || 0) +
//       //   (curr.l_size || 0) +
//       //   (curr.xl_size || 0) +
//       //   (curr.xxl_size || 0) +
//       //   (curr.fourxl_size || 0)
//       // );
//       // acc[groupKey].quantity += quantity;
//       // acc[groupKey].quantity += quantity;
//       // acc[groupKey].sales_amount += curr.performance || 0;
//       // acc[groupKey].performance += curr.performance || 0;
//       // acc[groupKey].share = 0;
//       return acc;
//     }, {});
    

// // 각 그룹의 점유율 계산

// const result = Object.entries(groupedStats).map(([date, planData]) => {
//   // 날짜별로 상품 데이터를 product_code와 specification으로 그룹화
//   const groupedProducts = Object.values(planData).flatMap(plan => {
//     const productIds = plan.sales_plan.set_product.individual_product_ids.toString().split(',');
    
//     return productIds.map(productId => {
//       const product = productsMap.get(productId.trim());
      
//       let sizeQuantity = 0;
//       if (product?.specification) {
//         switch(product.specification.toLowerCase()) {
//           case 'xs': sizeQuantity = plan.xs_size || 0; break;
//           case 's': sizeQuantity = plan.s_size || 0; break;
//           case 'm': sizeQuantity = plan.m_size || 0; break;
//           case 'l': sizeQuantity = plan.l_size || 0; break;
//           case 'xl': sizeQuantity = plan.xl_size || 0; break;
//           case 'xxl': sizeQuantity = plan.xxl_size || 0; break;
//           case '4xl': sizeQuantity = plan.fourxl_size || 0; break;
//           default: sizeQuantity = 0;
//         }
//       }

//       return {
//         product_code: product?.product_code || '',
//         product_name: product?.product_name || '',
//         specification: product?.specification || '',
//         quantity: sizeQuantity,
//         sales_amount: (plan?.sales_plan.sale_price || 0) * sizeQuantity,
//         performance: sizeQuantity,
//         share: 0
//       } as IProductStatistics;
//     });
//   }).reduce((acc, curr) => {
//     const key = `${curr.product_code}-${curr.specification}`;
//     if (!acc[key]) {
//       acc[key] = curr;
//     } else {
//       // 중복된 상품의 경우 수량과 금액을 합산
//       acc[key].quantity += curr.quantity;
//       acc[key].sales_amount += curr.sales_amount;
//       acc[key].performance += curr.performance;
//     }
//     return acc;
//   }, {} as Record<string, IProductStatistics>);

//   // 객체를 배열로 변환
//   const products = Object.values(groupedProducts);

//   // 합산된 전체 수량으로 점유율 재계산
//   const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
//   products.forEach(p => {
//     p.share = totalQuantity > 0 ? (p.quantity / totalQuantity) * 100 : 0;
//   });

//   return {
//     [date]: products
//   };
// }).reduce((acc, curr) => ({ ...acc, ...curr }), {});
//    // 날짜 기준 내림차순 정렬
//   // result.sort((a, b) => b.date.localeCompare(a.date));

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('API 에러:', error);
//     return NextResponse.json(
//       { error: '통계 조회 중 오류가 발생했습니다.' },
//       { status: 500 }
//     );
//   }
// } 