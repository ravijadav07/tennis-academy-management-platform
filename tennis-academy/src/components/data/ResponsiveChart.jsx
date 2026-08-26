import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../ui/Card';

const chartColors = {
  brand: '#7C4DFF',
  blue: '#3B82F6',
  green: '#16A34A',
  amber: '#D97706',
  gray: '#9CA3AF',
  ok: '#16A34A',
  warn: '#D97706',
  err: '#DC2626',
};

export default function ResponsiveChart({ children, height = 240, className = '', title, subtitle, indicator }) {
  return (
    <Card className={className}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-[11px] text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
          {indicator && <span className="text-xs font-semibold text-ink-muted">{indicator}</span>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </Card>
  );
}

export function TrendChart({ data, dataKey = 'value', xKey = 'label', height = 240, color = chartColors.brand, title, subtitle, indicator }) {
  return (
    <ResponsiveChart height={height} title={title} subtitle={subtitle} indicator={indicator}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.14} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEEFF4" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#969CAF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#969CAF' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E9EAF1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontSize: 12 }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#fill-${dataKey})`} />
      </AreaChart>
    </ResponsiveChart>
  );
}

export function BarChartWidget({ data, dataKey = 'value', xKey = 'label', height = 240, color = chartColors.brand, title, subtitle, indicator }) {
  return (
    <ResponsiveChart height={height} title={title} subtitle={subtitle} indicator={indicator}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEEFF4" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#969CAF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#969CAF' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E9EAF1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}

export function DonutChart({ data, height = 240, title, subtitle, indicator }) {
  const COLORS = [chartColors.brand, chartColors.blue, chartColors.green, chartColors.amber, chartColors.gray];
  return (
    <ResponsiveChart height={height} title={title} subtitle={subtitle} indicator={indicator}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={56} outerRadius={96} paddingAngle={4} dataKey="value">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E9EAF1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontSize: 12 }} />
      </PieChart>
    </ResponsiveChart>
  );
}