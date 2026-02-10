"use client";

import { VChart } from "@visactor/react-vchart";
import { useTheme } from "next-themes";

interface GaugeChartProps {
  value: number;
  max?: number;
  title?: string;
  height?: number;
  color?: string;
}

export function GaugeChart({
  value,
  max = 100,
  title,
  height = 200,
  color,
}: GaugeChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const percentage = Math.min((value / max) * 100, 100);

  const spec = {
    type: "gauge",
    data: [
      {
        values: [{ value: percentage }],
      },
    ],
    categoryField: "type",
    valueField: "value",
    outerRadius: 0.9,
    innerRadius: 0.7,
    startAngle: -180,
    endAngle: 0,
    gauge: {
      type: "circularProgress",
      progress: {
        style: {
          fill: color || (isDark ? "#60a5fa" : "#3b82f6"),
          cornerRadius: 10,
        },
      },
      track: {
        style: {
          fill: isDark ? "#374151" : "#e5e7eb",
        },
      },
    },
    pointer: {
      visible: false,
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
    indicator: [
      {
        visible: true,
        offsetY: "30%",
        title: {
          style: {
            text: `${value.toLocaleString()}`,
            fill: isDark ? "#e5e7eb" : "#1f2937",
            fontSize: 24,
            fontWeight: "bold",
          },
        },
        content: [
          {
            style: {
              text: `/ ${max.toLocaleString()}`,
              fill: isDark ? "#9ca3af" : "#6b7280",
              fontSize: 14,
            },
          },
        ],
      },
    ],
    background: "transparent",
  };

  return (
    <div style={{ height }}>
      {/* @ts-ignore */}
      <VChart spec={spec} />
    </div>
  );
}
