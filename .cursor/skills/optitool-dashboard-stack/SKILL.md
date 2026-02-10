---
name: optitool-dashboard-stack
description: Builds modern dashboards using VisActor charts, Shadcn/ui components, dark/light theme support, and Supabase PostgreSQL. Use when creating dashboard UIs, data visualizations, charts, or integrating Supabase in Next.js projects.
---

# OptiTool 대시보드 스택

VisActor, Shadcn/ui, 다크/라이트 모드, Supabase PostgreSQL을 사용한 모던 대시보드 개발 가이드.

## 기술 스택 요약

| 영역 | 기술 | 용도 |
|------|------|------|
| 차트 | @visactor/react-vchart | 막대/선/파이/게이지 차트 |
| UI | Shadcn/ui (Radix) | 버튼, 카드, 다이얼로그, 테이블 등 |
| 테마 | next-themes + Tailwind class | 다크/라이트 모드 |
| DB | Supabase (PostgreSQL) | 인증, CRUD, Realtime |

---

## 1. VisActor 차트

### 기본 사용법

```tsx
"use client";

import { VChart } from "@visactor/react-vchart";
import { useTheme } from "next-themes";
import type { IBarChartSpec } from "@visactor/vchart";

export function BarChart({ data }: { data: { name: string; value: number }[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const spec: IBarChartSpec = {
    type: "bar",
    data: [{ values: data }],
    xField: "name",
    yField: "value",
    bar: {
      style: {
        cornerRadius: 4,
        fill: isDark ? "#60a5fa" : "#3b82f6",
      },
    },
    background: "transparent",
    axes: [
      {
        orient: "bottom",
        label: { style: { fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 } },
      },
      {
        orient: "left",
        label: { style: { fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 } },
        grid: { style: { stroke: isDark ? "#374151" : "#e5e7eb", lineDash: [4, 4] } },
      },
    ],
  };

  return (
    <div style={{ height: 300 }}>
      <VChart spec={spec} />
    </div>
  );
}
```

### 차트별 spec 타입

- 막대: `IBarChartSpec`
- 선: `ILineChartSpec`
- 파이: `IPieChartSpec`
- 게이지: `IGaugeChartSpec`

### 다크 모드 컬러 패턴

| 용도 | 라이트 | 다크 |
|------|--------|------|
| 시리즈 색상 | #3b82f6 | #60a5fa |
| 텍스트/라벨 | #1f2937 / #6b7280 | #e5e7eb / #9ca3af |
| 그리드/축 | #e5e7eb | #374151 |
| 배경 | transparent | transparent |

차트는 반드시 `useTheme()`의 `resolvedTheme`으로 `isDark` 판별 후 색상 적용.

---

## 2. Shadcn/ui

### 추가 방법

```bash
npx shadcn@latest add [component-name]
```

### 주요 컴포넌트

- `Card`, `CardHeader`, `CardTitle`, `CardContent` — 대시보드 카드 레이아웃
- `Button`, `Input`, `Label` — 폼/액션
- `Dialog`, `DropdownMenu`, `Select`, `Tabs` — 모달, 메뉴, 탭
- `Table` — 데이터 테이블
- `Badge`, `Separator`, `Skeleton` — 상태/구분/로딩

### 스타일 컨벤션

- Tailwind 시맨틱 클래스 사용: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`
- `className={cn(...)}` (lib/utils.ts)로 조건부 클래스 병합

---

## 3. 다크/라이트 모드

### 설정

**layout.tsx:**
```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```

**tailwind.config.ts:**
```ts
darkMode: ["class"],
```

**globals.css:**
- `:root` — 라이트 변수
- `.dark` — 다크 변수 (background, foreground, primary, muted 등)

### 토글 사용

```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
setTheme(resolvedTheme === "dark" ? "light" : "dark");
```

---

## 4. 모던 대시보드 UI 패턴

### 레이아웃 구조

```
DashboardLayout
├── 사이드바 (nav items)
├── 헤더 (제목, 테마 토글)
└── main (children)
```

### 카드 그리드

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>
    <CardHeader><CardTitle>제목</CardTitle></CardHeader>
    <CardContent>...</CardContent>
  </Card>
</div>
```

### 반응형 브레이크포인트

- `phone`: 370px
- `tablet`: 750px
- `laptop`: 1000px
- `desktop`: 1200px

---

## 5. Supabase PostgreSQL

### 클라이언트 생성

**클라이언트 (브라우저):**
```ts
// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**서버 (Service Role):**
```ts
// utils/supabase-server.ts
export const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

### CRUD 패턴

```ts
// 조회
const { data, error } = await supabase.from('table_name').select('*').eq('id', id).single();

// 삽입
const { data, error } = await supabase.from('table_name').insert(payload).select().single();

// 수정
const { data, error } = await supabase.from('table_name').update(payload).eq('id', id).select().single();

// 삭제
const { error } = await supabase.from('table_name').delete().eq('id', id);
```

### API Route에서 사용

```ts
// app/api/xxx/route.ts
import { supabase } from '@/utils/supabase-server';

export async function GET() {
  const { data, error } = await supabase.from('table').select('*');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

---

## 체크리스트

- [ ] 차트에 `useTheme()` + `isDark` 적용
- [ ] UI는 `bg-background`, `text-foreground` 등 시맨틱 클래스 사용
- [ ] Shadcn 추가 시 `npx shadcn@latest add` 사용
- [ ] Supabase 클라이언트: 브라우저는 anon, 서버는 service role
- [ ] `ThemeProvider`가 layout 최상위에 래핑됨

---

## 추가 참고

자세한 패턴과 예시는 [reference.md](reference.md)를 참고.
