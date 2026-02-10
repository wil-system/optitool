"use client";

import { VChart } from "@visactor/react-vchart";
import { useTheme } from "next-themes";

interface PieChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartProps {
  data: PieChartData[];
  categoryField?: string;
  valueField?: string;
  title?: string;
  height?: number;
  colors?: string[];
  innerRadius?: number;
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  showLegend?: boolean;
}

const defaultColors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const darkColors = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#a3e635",
];

export function PieChart({
  data,
  categoryField = "name",
  valueField = "value",
  title,
  height = 300,
  colors,
  innerRadius = 0,
  showLabel = true,
  labelPosition = "inside",
  showLegend = true,
}: PieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const spec = {
    type: "pie",
    data: [{ values: data }],
    categoryField,
    valueField,
    outerRadius: 0.8,
    innerRadius: innerRadius / 100,
    pie: {
      style: {
        cornerRadius: 4,
      },
    },
    color: {
      type: "ordinal",
      range: colors || (isDark ? darkColors : defaultColors),
    },
    title: title ? {
      visible: true,
      text: title,
      textStyle: {
        fill: isDark ? "#e5e7eb" : "#1f2937",
        fontSize: 14,
        fontWeight: "bold",
      },
    } : undefined,
    label: {
      visible: showLabel,
      position: labelPosition,
      style: {
        fill: labelPosition === "inside" ? "#fff" : (isDark ? "#e5e7eb" : "#1f2937"),
        fontSize: 12,
        fontWeight: "bold",
      },
    },
    tooltip: {
      visible: true,
      mark: {
        content: [
          {
            key: (datum: any) => datum[categoryField],
            value: (datum: any) => {
              const total = data.reduce((acc, cur) => acc + cur.value, 0);
              const percent = total > 0 ? ((datum[valueField] / total) * 100).toFixed(1) : 0;
              return `${datum[valueField].toLocaleString()} (${percent}%)`;
            },
          },
        ],
      },
    },
    legends: showLegend
      ? {
          visible: true,
          orient: "right",
          item: {
            label: {
              style: {
                fill: isDark ? "#9ca3af" : "#6b7280",
                fontSize: 12,
              },
            },
          },
        }
      : { visible: false },
    background: "transparent",
  };

  return (
    <div style={{ height }}>
      {/* @ts-ignore */}
      <VChart spec={spec} />
    </div>
  );
}
