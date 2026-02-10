"use client";

import { VChart } from "@visactor/react-vchart";
import { useTheme } from "next-themes";
import type { ILineChartSpec } from "@visactor/vchart";

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  xField?: string;
  yField?: string;
  title?: string;
  height?: number;
  color?: string;
  smooth?: boolean;
  area?: boolean;
}

export function LineChart({
  data,
  xField = "name",
  yField = "value",
  title,
  height = 300,
  color,
  smooth = true,
}: LineChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const spec: ILineChartSpec = {
    type: "line",
    data: [{ values: data }],
    xField,
    yField,
    line: {
      style: {
        stroke: color || (isDark ? "#60a5fa" : "#3b82f6"),
        lineWidth: 2,
        curveType: smooth ? "monotone" : "linear",
      },
    },
    point: {
      style: {
        fill: color || (isDark ? "#60a5fa" : "#3b82f6"),
        stroke: isDark ? "#1f2937" : "#ffffff",
        lineWidth: 2,
        size: 6,
      },
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
    axes: [
      {
        orient: "bottom",
        label: {
          style: {
            fill: isDark ? "#9ca3af" : "#6b7280",
            fontSize: 12,
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
        orient: "left",
        label: {
          style: {
            fill: isDark ? "#9ca3af" : "#6b7280",
            fontSize: 12,
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
