---
name: pucho-frontend
description: >
  Builds Pucho.ai product UIs — dashboards, tables, forms, workflow screens, management panels, and auth pages — in a single minimal, modern, friendly SaaS design system (Notion/Linear/Stripe ethos) that is consistent across every screen, secure by default on the Pucho stack, and carries Pucho branding. Use this skill WHENEVER generating a React/Vite frontend, dashboard, admin panel, CRM/monitoring UI, login/auth page, settings screen, or any Pucho web app. It supersedes the older pucho-dashboard-template for product UI. It embeds the canonical Pucho Login page and the "Powered by Pucho.ai" badge verbatim — reproduce them exactly. For bespoke marketing/landing pages where a one-off visual identity matters more than system consistency, defer to the frontend-design skill (see §0). Triggers: "dashboard", "admin panel", "login page", "CRM", "settings screen", "management UI", "Pucho web app", "build a frontend", "workflow dashboard".
---

# Pucho Frontend — Minimal SaaS Design System (secure by default)

Build calm, modern, productive product UIs with ONE consistent design system across dashboards, tables, forms, workflows, and management screens. Clarity over decoration. Every screen feels like the same product. Secure on the Pucho stack by default. Pucho-branded.

> **Intake first.** For a new project or significant requirement, run `creation-guideline` first — it scopes, documents (PRD/App Flow/UI-UX), and routes here with the confirmed App Flow + UI/UX brief as source of truth. For a self-contained UI change, proceed directly.

> **Read this whole file before writing any UI.** The tokens, the header-title rule (§3), the canonical Login (§6), the branding badge (§7), and the security model (§8) are the single source of truth.

---

## 0. SCOPE — when to use this vs frontend-design vs dashboard-template

| Surface | Use |
|---|---|
| Product UI: dashboards, tables, forms, settings, workflow/management screens, auth | **This skill** — system consistency and learnability win |
| Bespoke marketing/landing/hero pages needing a unique, non-templated identity | **frontend-design** skill — bespoke per-brief identity |
| Older standalone dashboard builds | **Deprecated** in favour of this skill |

**Reconciliation with frontend-design:** A design *system* is intentionally consistent and reusable — that is not a "templated default," it's the justified, coherent direction frontend-design itself endorses for product tools (Linear/Stripe/Notion). frontend-design's bespoke-identity and "spend boldness in one place" principles still apply to: (a) marketing surfaces, and (b) the ONE signature moment per app. In Pucho product UIs the sanctioned signature is the **Login page** (floating mascots + violet ambient gradient, §6); everything behind the login stays quiet, disciplined, and minimal. Don't add a second competing flourish.

---

## 1. DESIGN PHILOSOPHY
- Clean, soft, minimal. Light background, generous whitespace, low cognitive load.
- Soft elevation (low-blur shadows), never harsh. Rounded corners everywhere (12–16px).
- Soft pastel palette with Pucho violet as the brand accent — never neon, never over-saturated, avoid harsh contrast.
- Progressive disclosure: don't overwhelm. Clear feedback for loading / success / error.
- Calm, modern, productive — slightly playful (the mascots, soft clay accents) but professional.

**Avoid:** harsh shadows, skeuomorphism, sharp edges, overcrowded layouts, bright neon, inconsistent spacing/typography.

---

## 2. DESIGN TOKENS (single source — put in `tailwind.config.js`)

```js
// tailwind.config.js — theme.extend
colors: {
  brand: {
    DEFAULT: '#8b5cf6',   // Pucho violet — primary accent
    600:     '#5833EF',   // deep violet (login gradient top / primary buttons)
    700:     '#3A10CE',   // deepest violet (login gradient bottom)
    50:      '#F5F3FF',   // tint for soft fills / hovers
  },
  ink:   { DEFAULT: '#111834', muted: '#6B7280', faint: '#9CA3AF' }, // text
  canvas:{ DEFAULT: '#FAFAFF', soft: '#F8F9FC' },                    // app backgrounds
  line:  '#F0F0F0',                                                  // hairline borders
  ok:    { DEFAULT: '#16A34A', bg: '#ECFDF3' },  // success (soft bg)
  warn:  { DEFAULT: '#D97706', bg: '#FFFBEB' },  // warning
  err:   { DEFAULT: '#DC2626', bg: '#FEF2F2' },  // error
  off:   { DEFAULT: '#6B7280', bg: '#F3F4F6' },  // inactive
},
borderRadius: { lg: '12px', xl: '14px', '2xl': '16px', '3xl': '24px' },
boxShadow: {
  card:       '0 2px 10px rgba(0,0,0,0.04)',
  'card-hover':'0 12px 24px rgba(0,0,0,0.06)',
  soft:       '0 1px 3px rgba(0,0,0,0.05)',
  focus:      '0 0 0 3px rgba(139,92,246,0.15)',
},
fontFamily: {
  sans: ['Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
  display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
},
spacing: { /* use the default 4px scale on an 8px rhythm: 2,4,6,8 = 8/16/24/32px */ },
```

**Type hierarchy:** headings semi-bold (`font-semibold`); body regular; labels smaller + muted (`text-ink-muted`); key metrics large + bold (`text-3xl font-bold`). Inter for everything; Space Grotesk optional for display numbers.

**Spacing:** 8px grid. Component inner padding 16–24px (`p-4`–`p-6`). Cards `rounded-2xl`, `shadow-card`, `border border-line`.

---

## 3. ⭐ LAYOUT + THE HEADER-TITLE RULE (fixes the page-naming bug)

**The bug:** opening a page from the sidebar leaves the header reading "Dashboard" while the page's name is printed in the body. **Fix: the header title is ALWAYS the active menu item's label, derived from one nav config. Pages NEVER render their own page-title `<h1>`.**

### Single source of navigation truth — `src/config/nav.js`
```js
// src/config/nav.js — ONE place defines path → label → icon. Sidebar AND Header both read this.
import { LayoutGrid, Users, ListChecks, Workflow, Settings } from 'lucide-react';

export const NAV = [
  { path: '/admin',           label: 'Overview',   icon: LayoutGrid },
  { path: '/admin/customers', label: 'Customers',  icon: Users },
  { path: '/admin/tasks',     label: 'Tasks',      icon: ListChecks },
  { path: '/admin/workflows', label: 'Workflows',  icon: Workflow },
  { path: '/admin/settings',  label: 'Settings',   icon: Settings },
];

// Resolve the current page's title from the path (longest-prefix match so nested routes work).
export function titleForPath(pathname) {
  const hit = [...NAV].sort((a, b) => b.path.length - a.path.length)
    .find(n => pathname === n.path || pathname.startsWith(n.path + '/'));
  return hit ? hit.label : 'Overview';
}
```

### Header derives its title — `src/components/Header.jsx`
```jsx
import { useLocation } from 'react-router-dom';
import { titleForPath } from '../config/nav';

export default function Header({ subtitle, actions }) {
  const { pathname } = useLocation();
  const title = titleForPath(pathname);              // ← always the active menu label
  return (
    <header className="sticky top-0 z-20 h-16 px-6 flex items-center justify-between
                       bg-white/80 backdrop-blur-xl border-b border-line">
      <div className="flex flex-col justify-center">
        <h1 className="text-lg font-semibold text-ink leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted mt-1 leading-none">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
```

### Sidebar reads the SAME config — labels can never drift
```jsx
import { Link, useLocation } from 'react-router-dom';
import { NAV } from '../config/nav';

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-white border-r border-line flex flex-col">
      {/* logo ... */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <Link key={path} to={path}
              className={`flex items-center gap-2.5 h-10 px-3 rounded-2xl text-sm font-medium transition-colors
                ${active ? 'bg-brand-50 text-ink' : 'text-ink-muted hover:bg-canvas-soft'}`}>
              <Icon className="w-5 h-5 opacity-70" />{label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

> ⛔ **HEADER-TITLE RULES (mandatory):**
> 1. The header `<h1>` is ALWAYS the active menu item's label, via `titleForPath()`. Never hardcode `"Dashboard"`.
> 2. Pages render their content only — NEVER their own page-title `<h1>`. (A page may use smaller section headings inside cards.)
> 3. Sidebar label and header title both come from `NAV` — one source, so they can never disagree.
> 4. Optional breadcrumbs sit under the header for nested routes, also derived from `NAV`.

### Layout shell (flush sidebar, no gap)
```jsx
// src/layouts/DashboardLayout.jsx
import { Outlet } from 'react-router-dom';
export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}
```
Parent `flex h-screen overflow-hidden` — no `gap-*`. Sidebar fixed width, no `margin`. Only `<main>` gets padding.

---

## 4. CORE COMPONENTS (minimal style)

**Card** — soft bg, hairline border, low shadow, rounded-2xl, 16–24px padding.
```jsx
const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick}
    className={`bg-white rounded-2xl border border-line shadow-card p-5 transition-shadow
      ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} ${className}`}>
    {children}
  </div>
);
```

**StatCard** — large bold number, muted label, soft icon chip.
```jsx
const StatCard = ({ icon: Icon, label, value, delta }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand">
        <Icon className="w-5 h-5" />
      </div>
      {delta != null && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'}`}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-ink leading-tight">{value}</h3>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  </Card>
);
```

**Button** — primary = soft brand fill, pill, subtle hover; secondary = light outline.
```jsx
const Button = ({ children, variant = 'primary', icon: Icon, className = '', ...p }) => {
  const base = 'h-10 px-4 inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all disabled:opacity-60';
  const styles = {
    primary:   'text-white shadow-soft hover:brightness-105',
    secondary: 'bg-white border border-gray-200 text-ink hover:bg-canvas-soft',
    ghost:     'text-ink-muted hover:bg-canvas-soft',
  };
  const style = variant === 'primary'
    ? { background: 'linear-gradient(180deg,#5833EF 0%,#3A10CE 100%)', boxShadow: '0 4px 9px rgba(58,16,206,0.25)' } : undefined;
  return (
    <button className={`${base} ${styles[variant]} ${className}`} style={style} {...p}>
      {Icon && <Icon className="w-4 h-4" />}{children}
    </button>
  );
};
```

**Input** — see canonical `src/components/ui/Input.jsx` in §6 reference (label above, rounded-2xl, soft brand focus ring). Use it for every form field.

**StatusPill** — soft bg, never solid harsh color.
```jsx
const StatusPill = ({ status }) => {
  const map = {
    success:'bg-ok-bg text-ok', completed:'bg-ok-bg text-ok', running:'bg-ok-bg text-ok',
    error:'bg-err-bg text-err', failed:'bg-err-bg text-err',
    warning:'bg-warn-bg text-warn', pending:'bg-warn-bg text-warn', queued:'bg-warn-bg text-warn',
    inactive:'bg-off-bg text-off', idle:'bg-off-bg text-off',
  };
  const k = String(status).toLowerCase();
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[k] || 'bg-off-bg text-off'}`}>{status}</span>;
};
```

**Table / list** — readable rows, subtle separators (`divide-y divide-line`), row hover (`hover:bg-canvas-soft`), sticky header, optional avatars/tags/status pills; hairline borders, never heavy. Use `@tanstack/react-table` for sortable/filterable/paginated grids (or the themed Ant `<Table>` from §4A for data-heavy admin panels — pick ONE per project, never both).

```jsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Search, Download } from 'lucide-react';

const DataGrid = ({ data, columns }) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input value={globalFilter ?? ''} onChange={e => setGlobalFilter(e.target.value)} placeholder="Search…"
            className="w-full pl-9 pr-4 h-10 bg-canvas-soft border border-line rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all" />
        </div>
        <Button variant="secondary" icon={Download}>Export</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas-soft text-ink-muted font-medium sticky top-0">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>{hg.headers.map(h => (
                <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="px-4 py-3 cursor-pointer select-none hover:bg-line/40">
                  <span className="inline-flex items-center gap-1.5">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: '↑', desc: '↓' }[h.column.getIsSorted()] ?? ''}
                  </span>
                </th>))}
              </tr>))}
          </thead>
          <tbody className="divide-y divide-line">
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="hover:bg-canvas-soft transition-colors">
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="px-4 py-3 text-ink">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                ))}
              </tr>))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
          <Button variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </Card>
  );
};
```

**Form** — labels above inputs, spacious, fields grouped into cards/sections, inline validation messages, dropdowns/toggles/date-pickers as needed. Validate with `zod` + `react-hook-form` on the client for UX, AND on the server per §8 (client validation is never the security boundary).

**Modal / Drawer** — rounded-3xl container, dimmed `bg-black/10 backdrop-blur-sm` overlay, clear primary + secondary actions.

**Charts** — `recharts`, soft palette, rounded bars, smooth lines with gradient area fills, minimal grid, no clutter. Wrap in `<Card>`; always `<ResponsiveContainer>`.
```jsx
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartColors = { brand: '#8b5cf6', blue: '#3B82F6', green: '#16A34A', amber: '#D97706', gray: '#9CA3AF' };

const TrendChart = ({ data, dataKey = 'value', xKey = 'label' }) => (
  <Card>
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.18} />
            <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', fontSize: 12 }} />
        <Area type="monotone" dataKey={dataKey} stroke={chartColors.brand} strokeWidth={2} fill="url(#fillBrand)" />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

// Bars: rounded tops via radius={[8,8,0,0]}, fill={chartColors.brand}, same soft grid/axes.
```

**Feedback** — `sonner` toasts for success/error; skeleton loaders on initial load; `<EmptyState>` for empty tables; `react-error-boundary` around complex widgets (see §8 for the non-leaking error fallback).

---

## 4A. ANT DESIGN (optional — themed to the minimal tokens)

Ant Design is supported for **data-heavy admin panels** (complex tables, filters, forms). It is the only UI library carried here — do NOT mix it with HeroUI/MUI/Chakra, and pick Ant **or** the Tailwind/TanStack components above, never both in one project. When Ant is used, it MUST be themed to the Pucho minimal tokens via `ConfigProvider` so it inherits the soft, rounded, low-contrast look — never raw default Ant blue/sharp corners.

Install: `npm i antd @ant-design/icons`

**Theme it to the minimal system — wrap the app once:**
```jsx
// src/main.jsx (or App root)
import { ConfigProvider } from 'antd';

const puchoAntTheme = {
  token: {
    colorPrimary: '#8b5cf6',          // Pucho violet, not Ant blue
    colorInfo: '#8b5cf6',
    colorSuccess: '#16A34A', colorWarning: '#D97706', colorError: '#DC2626',
    colorText: '#111834', colorTextSecondary: '#6B7280',
    colorBorder: '#F0F0F0', colorBgContainer: '#FFFFFF', colorBgLayout: '#FAFAFF',
    borderRadius: 14,                 // matches rounded-2xl rhythm
    fontFamily: 'Inter, "SF Pro Text", system-ui, sans-serif',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    controlHeight: 40,
  },
  components: {
    Button: { borderRadius: 999, controlHeight: 40, primaryShadow: '0 4px 9px rgba(58,16,206,0.25)' },
    Card:   { borderRadiusLG: 16, paddingLG: 20, boxShadowTertiary: '0 2px 10px rgba(0,0,0,0.04)' },
    Table:  { headerBg: '#F8F9FC', headerColor: '#6B7280', rowHoverBg: '#F8F9FC', borderColor: '#F0F0F0' },
    Input:  { borderRadius: 14, controlHeight: 48, activeBorderColor: '#8b5cf6', activeShadow: '0 0 0 3px rgba(139,92,246,0.15)' },
    Modal:  { borderRadiusLG: 24 },
    Tag:    { borderRadiusSM: 999 },
  },
};

export default function Root() {
  return <ConfigProvider theme={puchoAntTheme}>{/* <App /> */}</ConfigProvider>;
}
```
Primary buttons keep the brand gradient via `style={{ background:'linear-gradient(180deg,#5833EF,#3A10CE)' }}`. Status uses Ant `<Tag>` with soft colors (`color="success|warning|error|default"`). Use Ant `<Table>` for big datasets, `<Form>`+`<Form.Item>` for complex forms (still mirror Zod rules on the server per §8), `<Layout.Sider>` only if you keep the header-title rule (§3) — the Sider menu items must still come from `NAV`.

> ⛔ **Ant v5+ deprecations (never use):** `<Card bodyStyle>` → `styles={{ body }}`; `<Card headStyle>` → `styles={{ header }}`; `<Modal bodyStyle>` / `<Drawer bodyStyle>` → `styles={{ body }}`; `<Table scroll={{ x: true }}>` → `scroll={{ x: 'max-content' }}`.

---

## 4B. MOCK / SEED DATA (Indian MSME context)

When no live data source is given, seed with realistic Indian context — names, cities, ₹ amounts — so tables/charts look full. Keep mock data in `src/data/mockData.js`, never inline in pages. Show a visible "MOCK DATA — NOT CONNECTED" pill (soft `bg-warn-bg text-warn`) in the UI until a real source is wired.
```js
// src/data/mockData.js
export const orders = [
  { id: 'ORD-9021', customer: 'Rajesh Sharma',   company: 'Reliance Retail',     amount: 45000,  status: 'Completed',   date: '2026-01-24', region: 'Mumbai' },
  { id: 'ORD-9022', customer: 'Priya Patel',      company: 'Tata Consultancy',    amount: 120000, status: 'Pending',     date: '2026-01-23', region: 'Ahmedabad' },
  { id: 'ORD-9023', customer: 'Amit Singh',       company: 'Adani Green',         amount: 85500,  status: 'In Progress', date: '2026-01-22', region: 'Delhi' },
  { id: 'ORD-9024', customer: 'Sneha Reddy',      company: 'Infosys',             amount: 32000,  status: 'Failed',      date: '2026-01-21', region: 'Bengaluru' },
  { id: 'ORD-9025', customer: 'Vikram Malhotra',  company: 'Wipro',               amount: 67800,  status: 'Completed',   date: '2026-01-20', region: 'Pune' },
  // add 10–15 rows for full-looking tables
];
export const summary = { customers: 2847, active: 2156, expiring: 342, dnd: 89 };
export const taskStats = { pending: 156, inProgress: 48, completed: 892, failed: 34 };
export const workflows = [
  { id: 'WF1', name: 'Receivables Autopilot', status: 'running', lastRun: '2026-01-24 09:00', nextRun: '2026-01-25 09:00' },
];
// Render ₹ with toLocaleString('en-IN'): `₹ ${amount.toLocaleString('en-IN')}`
```

---

## 5. NAV / RESPONSIVENESS
Left sidebar (collapsible to icon-only), rounded icon+label items, top header with contextual actions/filters/user controls, breadcrumbs for deep routes. Desktop-first, scalable to tablet: stat grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, tables horizontal-scroll on small screens, sidebar behind a hamburger on mobile.

---

## 6. ⭐ CANONICAL LOGIN PAGE — reproduce EXACTLY (do not restyle)

The Pucho Login is the app's signature surface and is **fixed**. Use the verbatim component below. It depends on: `AuthContext` (`useAuth().login`), `react-router-dom`, the canonical `Input` (§4), and these assets — `brand/logo.png`, `mascot_1/3/4/5.png`, and icons `Users / Lock / Arrow Right / Moon / Magic-pen / agent`. Keep glassmorphism, the violet/blue ambient blurs, the mouse-tracking radial glow, the four floating mascots with their stagger/rotation/hover, the responsive grid, and the `#5833EF→#3A10CE` button gradient. The reference files (Login.jsx, Input.jsx, assets) ship alongside this skill — copy them in unchanged.

> The full `Login.jsx` is provided as a reference file with this skill (`reference/login/Login.jsx`). Treat it as read-only canonical source. If the project's auth differs, only the `handleSubmit` wiring may change; the markup, classes, assets, and animations must remain byte-for-byte.

Minimal `AuthContext` contract the page expects:
```jsx
// src/context/AuthContext.jsx — login() returns { success, message }
import { createContext, useContext, useState } from 'react';
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = async (email, password) => {
    // PRODUCTION: call your Supabase Auth / Edge Function here — never validate against client-side secrets.
    const res = await fetch('/functions/v1/auth-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()).catch(() => ({ success: false, message: 'Network error' }));
    if (res.success) setUser(res.user);
    return res;
  };
  return <AuthCtx.Provider value={{ user, login }}>{children}</AuthCtx.Provider>;
}
```
The `animate-float` keyframe must exist in `tailwind.config.js`:
```js
keyframes: { float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } } },
animation: { float: 'float 6s ease-in-out infinite' },
```

---

## 7. ⭐ CANONICAL BRANDING BADGE — reproduce EXACTLY

Every Pucho dashboard carries the "Powered by Pucho.ai" badge. Place it at the very bottom of the app's root return (just before the closing Router/Provider tag). Verbatim — do not alter the logo URL, glassmorphism, or copy.

```jsx
import { motion } from 'framer-motion';

{/* Global Powered By Badge */}
<div className="fixed bottom-6 right-6 z-[9999] pointer-events-none select-none">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2.5 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(139,92,246,0.15)] border border-white/50">
    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Powered By</span>
    <img src="https://cdn.prod.website-files.com/690ec911550adb97c4a56495/69399fa4c6253325791cd9ce_pucho%20logo.webp"
         alt="Pucho.ai" className="h-4 w-auto object-contain" />
  </motion.div>
</div>
```
Position may move to `bottom-6 left-6`; opacity may soften to `bg-white/70`. Nothing else changes.

---

## 8. SECURITY (baked in — Pucho stack: React/Vite · Supabase · Pucho webhooks)

Apply by deliverable type. A throwaway demo gets the notes; a client/production app gets all controls.

### Two-tier webhook delivery (THE keystone — resolves the direct-call risk)
The Pucho webhook URL is a **credential**. Never put it in a `VITE_` var or call it from the browser in production.

**`src/utils/api.js`** — one helper, two tiers:
```js
// TIER 1 (demo/internal): mock-by-default; direct call only when explicitly allowed.
// TIER 2 (production): calls a Supabase Edge Function proxy that holds the webhook URL server-side.
export async function triggerWorkflow(action, payload) {
  const proxy = import.meta.env.VITE_PUCHO_PROXY_URL; // points to the Edge Function, NOT the raw webhook
  if (!proxy) {                                       // demo mode
    await new Promise(r => setTimeout(r, 1000));
    return { success: true, mock: true, message: 'Mock response — connect the proxy for production' };
  }
  const res = await fetch(proxy, {                    // the COMPLETE endpoint — never append /sync, /trigger, /run
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) throw new Error('Request failed');     // generic — never surface internals
  return res.json();
}
```
The Supabase Edge Function `pucho-proxy` holds `PUCHO_WEBHOOK_URL` (server-side env, no `VITE_`), verifies the session, enforces `client_id` tenant scoping, rate-limits, validates the body with Zod, then forwards to the real Pucho webhook.

> ⛔ Webhook rules (corrected — single rule): the Studio webhook URL is the COMPLETE endpoint. **Never append `/sync`, `/trigger`, `/run`, or any suffix** — those cause 404s. If a synchronous response is needed, the Edge Function awaits it; the URL is never modified. (This supersedes the old dashboard-template guidance that contradicted itself on `/sync`.)

### The controls (scope per deliverable)
1. **Secrets:** only `VITE_`-prefixed, non-secret vars reach the browser. Supabase anon key is the only client-side key (RLS-gated). Webhook URL, service_role key, Pucho AI Studio key → server-side Edge Function only. `.env` git-ignored; ship `.env.example` with empty values; never return a secret in any response.
2. **Rate limiting** (Edge Functions): auth 5/15min·IP, data 60/min·IP, webhook-proxy 10/min·user, uploads 5/min·IP → 429 + Retry-After.
3. **Input validation:** Zod server-side in every Edge Function (type/length/enum/required); parameterized Supabase queries only; client Zod is UX only. 400 + log on invalid.
4. **RLS & ownership:** Supabase RLS on every user/client table; `auth.uid() = owner_id`; multi-client dashboards scope every policy and every proxy call by `client_id`; cross-owner = 403.
5. **Auth:** Supabase Auth; refresh tokens in httpOnly cookies (never localStorage); lockout on repeated failures.
6. **CORS:** explicit origin from env; no wildcard in prod.
7. **Headers** (vercel.json/netlify.toml): CSP (self + Supabase + Pucho host), X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy; remove X-Powered-By.
8. **Uploads** (if any): server MIME+size check, UUID rename, private Supabase Storage bucket, signed URLs.
9. **No error leakage:** the error fallback shows a generic message + request id; full error to Sentry server-side.
   ```jsx
   const ErrorFallback = ({ resetErrorBoundary }) => (
     <div className="p-6 bg-err-bg border border-line rounded-2xl text-center">
       <p className="text-sm font-semibold text-err">Something went wrong</p>
       <p className="text-xs text-ink-muted mt-1">Please retry. If it persists, contact support.</p>
       <button onClick={resetErrorBoundary} className="mt-3 text-xs font-medium px-3 py-1.5 bg-white border border-line rounded-full text-ink">Try again</button>
     </div>
   );  // never render error.message in production UI
   ```
10. **LLM/webhook output trust:** treat Pucho `askLlm`/`askTally` output as untrusted — validate shape and escape before render. Per-user Pucho call budget + usage logging.
11. **Browser-storage in Claude artifacts:** never use localStorage/sessionStorage in artifact builds (unsupported); keep state in React. Never embed a live webhook URL or key in a demo artifact.

### Google Sheets as a data source (secured)
The dashboard-template's old pattern fetched a **public CSV export URL** directly in the browser — that requires the sheet to be world-readable (data exposure) and is demo-only.
- **Demo/internal:** `papaparse` over `VITE_GOOGLE_SHEET_CSV_URL` with cache-busting (`url + '&t=' + Date.now()`) and 30s `setInterval` polling is acceptable ONLY for non-sensitive, intentionally-public sheets. Show the "MOCK/PUBLIC DATA" pill.
- **Production:** read the sheet **through the proxy** — a Supabase Edge Function (or a Pucho workflow) holds the service credential, reads the sheet, and returns only the rows the authenticated `client_id` may see. The browser calls `triggerWorkflow('get_rows', {...})`, never a Google URL. Or sync the sheet into a Supabase table and read it RLS-gated.
```js
// demo-only CSV read
import Papa from 'papaparse';
async function loadSheet() {
  const url = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;
  if (!url) return [];
  const text = await fetch(`${url}&t=${Date.now()}`).then(r => r.text());
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}
```

---

## 9. PROJECT SETUP

**Vite + React** (never CRA). Dependencies that MUST be in `package.json` if imported: `react-router-dom`, `recharts`, `framer-motion`, `lucide-react`, `sonner`, `date-fns`, `clsx`, `tailwind-merge`, `react-error-boundary`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-table`, `papaparse` (if CSV). Optional, only if Ant chosen: `antd`, `@ant-design/icons`. Tailwind via `tailwindcss @tailwindcss/vite`. Import Inter + Space Grotesk in `index.css`.

**Standardized `.env.example`** (one format; webhook URL is NOT client-side in prod):
```env
# Client-safe (Vite-exposed). The proxy URL points to a Supabase Edge Function, NOT the raw Pucho webhook.
VITE_PUCHO_PROXY_URL=https://<project>.supabase.co/functions/v1/pucho-proxy
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Server-side ONLY (set in Supabase / hosting env — never prefixed VITE_, never committed):
# PUCHO_WEBHOOK_URL=...
# PUCHO_AISTUDIO_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

**Structure:** `src/{components,components/ui,pages,layouts,config,context,utils,data}` + `Login.jsx` in `pages/`, `Input.jsx` in `components/ui/`, `nav.js` in `config/`, `api.js` in `utils/`, badge in root `App.jsx`. One route per page file; mock data in `data/`; never inline large components in pages.

---

## 10. PRE-OUTPUT CHECKLIST
- [ ] **Header title = active menu label** via `titleForPath()`; no page hardcodes its own title; Sidebar + Header both read `NAV`
- [ ] Tokens used: `bg-canvas`, `text-ink`, brand violet accent, `rounded-2xl`, `shadow-card`, hairline `border-line`
- [ ] Minimal aesthetic: soft shadows, no neon, generous whitespace, no raw unstyled `<button>`/`<div>`/`<table>`
- [ ] Status uses soft-bg pills; charts use the soft palette; feedback via sonner + skeletons + EmptyState
- [ ] Login page reproduced EXACTLY (markup, classes, assets, animations, gradient); only `handleSubmit` wiring may change
- [ ] "Powered by Pucho.ai" badge present, verbatim, bottom-right, `z-[9999]`
- [ ] Webhook calls go through `triggerWorkflow()` → proxy; **never append `/sync`/`/trigger`/`/run`**; raw webhook URL never in a `VITE_` var (prod)
- [ ] Secrets server-side only; `.env` git-ignored; `.env.example` standardized; Supabase anon key is the only client key
- [ ] Server-side Zod validation + RLS + `client_id` tenant scoping for production/multi-client; cross-owner = 403
- [ ] Error fallback shows generic message (no `error.message`); errors logged to Sentry
- [ ] Every imported library is in `package.json`; Vite (not CRA); Inter + Space Grotesk loaded
- [ ] If Ant Design used: wrapped in `ConfigProvider` with `puchoAntTheme`; no v5 deprecated props; not mixed with other UI libs; Sider menu still reads `NAV`
- [ ] Mock data in `src/data/`, Indian context, ₹ via `toLocaleString('en-IN')`; visible "MOCK DATA — NOT CONNECTED" pill until wired
- [ ] Google Sheets: production reads via proxy/RLS, never a public CSV URL in the browser
- [ ] Responsive: sidebar → hamburger on mobile; stat grids and tables adapt; layout has no gap between sidebar and body
- [ ] No localStorage/sessionStorage in Claude-artifact builds
