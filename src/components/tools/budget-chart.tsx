"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export const GROUP_COLORS = ["#F29F04", "#F2B705", "#4D4D4D", "#A3A3A3", "#C27E00", "#FFD25E", "#7A7A7A", "#DEDEDE", "#8A5A00", "#2E2E2E", "#E9C46A", "#BDBDBD"]

export default function BudgetDonut({ data, format }: { data: { name: string; value: number }[]; format: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1.5} stroke="var(--background)" strokeWidth={2} isAnimationActive>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => format(Number(value))}
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 }}
          itemStyle={{ color: "var(--popover-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
