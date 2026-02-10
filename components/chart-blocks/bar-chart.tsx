"use client";

import { VChart } from "@visactor/react-vchart";
import { useTheme } from "next-themes";
import type { IBarChartSpec } from "@visactor/vchart";

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  xField?: string;
  yField?: string;
  seriesField?: string;
  /** X축(카테고리) 라벨을 2줄로 확보하고 홀/짝 행으로 번갈아 배치 */
  staggerLabels?: boolean;
  title?: string;
  height?: number;
  color?: string | string[];
  horizontal?: boolean;
}

export function BarChart({
  data,
  xField = "name",
  yField = "value",
  seriesField,
  staggerLabels = false,
  title,
  height = 300,
  color,
  horizontal = false,
}: BarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // 라벨 인덱스(카테고리 순서) 맵: "홀수는 1행, 짝수는 2행" 배치용
  // seriesField가 있을 때 동일 카테고리가 여러 번 등장하므로 최초 1회만 기록합니다.
  const labelIndexMap = new Map<string, number>();
  if (staggerLabels && !horizontal) {
    for (const row of data) {
      const raw = (row as any)?.[xField];
      const label = raw == null ? "" : String(raw);
      if (!labelIndexMap.has(label)) {
        labelIndexMap.set(label, labelIndexMap.size);
      }
    }
  }

  const spec: IBarChartSpec = {
    type: "bar",
    data: [{ values: data }],
    direction: horizontal ? "horizontal" : "vertical",
    xField: horizontal ? yField : xField,
    yField: horizontal ? xField : yField,
    seriesField,
    bar: {
      style: {
        cornerRadius: [4, 4, 0, 0],
        fill: Array.isArray(color) ? undefined : (color || (isDark ? "#60a5fa" : "#3b82f6")),
        stroke: isDark ? "#1f2937" : "#ffffff",
        lineWidth: 1,
      },
      state: {
        hover: {
          cursor: 'pointer',
          fillOpacity: 0.8,
        }
      }
    },
    stack: false, // 쌓이지 않고 옆으로 나열되도록 강제 설정
    color: Array.isArray(color) ? color : undefined,
    legends: seriesField ? [{ visible: true, orient: 'bottom' }] : undefined,
    title: title ? {
      visible: true,
      text: title,
      textStyle: {
        fill: isDark ? "#e5e7eb" : "#1f2937",
        fontSize: 14,
        fontWeight: "bold",
      },
    } : undefined,
    axes: [
      {
        orient: horizontal ? "left" : "bottom",
        // NOTE: VChart의 axis label sampling 기본값 때문에
        // 항목이 많을 때 짝수/홀수로 라벨이 생략될 수 있어 sampling을 비활성화합니다.
        sampling: false,
        label: {
          autoHide: false,
          autoRotate: staggerLabels ? false : true,
          autoRotateAngle: staggerLabels ? undefined : [0, 45, 90],
          formatMethod: staggerLabels
            ? (text: any) => {
                const label = text == null ? "" : String(text);
                const idx = labelIndexMap.get(label) ?? 0;
                // 1번째(홀수) = 1행, 2번째(짝수) = 2행
                return idx % 2 === 0 ? [label, ""] : ["", label];
              }
            : undefined,
          style: {
            fill: isDark ? "#9ca3af" : "#6b7280",
            fontSize: 10,
            lineHeight: 12,
          },
        },
        tick: {
          style: {
            stroke: isDark ? "#374151" : "#e5e7eb",
          },
        },
        domainLine: {
          style: {
            stroke: isDark ? "#374151" : "#e5e7eb",
          },
        },
      },
      {
        orient: horizontal ? "bottom" : "left",
        sampling: false,
        label: {
          autoHide: false,
          style: {
            fill: isDark ? "#9ca3af" : "#6b7280",
            fontSize: 10,
          },
        },
        tick: {
          style: {
            stroke: isDark ? "#374151" : "#e5e7eb",
          },
        },
        domainLine: {
          style: {
            stroke: isDark ? "#374151" : "#e5e7eb",
          },
        },
        grid: {
          style: {
            stroke: isDark ? "#374151" : "#e5e7eb",
            lineDash: [4, 4],
          },
        },
      },
    ],
    background: "transparent",
  };

  return (
    <div style={{ height }}>
      <VChart spec={spec} />
    </div>
  );
}
