# OptiTool 대시보드 스택 — 상세 레퍼런스

## VisActor 차트 상세

### LineChart spec 예시

```ts
const spec: ILineChartSpec = {
  type: "line",
  data: [{ values: data }],
  xField: "name",
  yField: "value",
  line: {
    style: {
      stroke: isDark ? "#60a5fa" : "#3b82f6",
      lineWidth: 2,
      curveType: "monotone",
    },
  },
  point: {
    style: {
      fill: isDark ? "#60a5fa" : "#3b82f6",
      stroke: isDark ? "#1f2937" : "#ffffff",
      lineWidth: 2,
      size: 6,
    },
  },
  background: "transparent",
};
```

### PieChart spec 예시

```ts
const spec: IPieChartSpec = {
  type: "pie",
  data: [{ values: data }],
  valueField: "value",
  categoryField: "name",
  background: "transparent",
};
```

### GaugeChart spec 예시

```ts
const spec: IGaugeChartSpec = {
  type: "gauge",
  data: [{ values: [{ value: 75 }] }],
  categoryField: "value",
  valueField: "value",
  background: "transparent",
};
```

---

## Shadcn/ui 컴포넌트 패턴

### Card 레이아웃

```tsx
<Card className="border-border bg-card">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">레이블</CardTitle>
    <CardContent className="text-2xl font-bold">{value}</CardContent>
  </CardHeader>
</Card>
```

### Dialog (모달)

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>열기</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>제목</DialogTitle></DialogHeader>
    {/* 내용 */}
  </DialogContent>
</Dialog>
```

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>컬럼1</TableHead>
      <TableHead>컬럼2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.col1}</TableCell>
        <TableCell>{item.col2}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Supabase 고급 패턴

### 필터링 및 정렬

```ts
const { data } = await supabase
  .from('products')
  .select('id, name, price')
  .eq('category', 'electronics')
  .gte('price', 100)
  .order('created_at', { ascending: false })
  .range(0, 9);
```

### RPC (함수 호출)

```ts
const { data } = await supabase.rpc('function_name', { param1: value });
```

### Realtime 구독

```ts
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, (payload) => {
    console.log(payload);
  })
  .subscribe();
```

---

## Tailwind 다크 모드 클래스

```tsx
// 조건 없이 시맨틱 변수 사용 (권장)
<div className="bg-background text-foreground border-border" />

// 명시적 다크 모드
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
```
