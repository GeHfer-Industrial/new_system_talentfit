import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DepartmentChartProps {
  data: { department: string; count: number }[]
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="count" name="Currículos" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
