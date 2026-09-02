# UI Component Inventory — ATA Tennis Academy

> **Status:** Step 0 foundation document. Every reusable component in the existing
> codebase catalogued with its full prop signature. New screens compose from these;
> zero new visual language is created.

---

## Scope Decisions

### 1. Business-Entity Toggle Removed (The Club / TOTS Tennis)
Phase 1 scope is The Club only, per Aug 2026 meeting decision. The entity filter
toggle (The Club / TOTS Tennis / All) has been removed from Header.jsx,
AuthContext.jsx, nav.js, and all admin pages that filtered by `business_entity`.
TOTS Tennis integration, when it resumes, will be scoped separately — do not
assume this toggle pattern applies to it, given TOTS Tennis's differing payroll
model (hourly vs. half/full-day) and existing Spin App data.

### 2. OPS_HEAD Role Added (4th RBAC Tier)
OPS_HEAD (Parth Kalke, `coach_parth`) granted operational access but not financial
visibility, per the original blueprint's Roles & Access table restricting full
payment/payroll data to Super Admin/Head Coach.

**Permissions granted:** students.view/manage, coaches.view/manage, batches.view/manage,
schedule.view/manage, attendance.view/manage, reports.view, verification.manage.

**Not granted:** payments, reconciliation, payroll, devtools.

**Open:** Confirm this boundary with Arnav — may need broader or narrower access.

### 3. Skill-Band Mapping Deferred
Batches carry `ballLevel` (Yellow/Green/Orange/Red) that doesn't cleanly map 1:1
to PROGRAMS (ADV/JDP/INT/GREEN/ORANGE/RED). Reports.jsx renders `ballLevel` data
as-is from seed without inventing a crosswalk. Confirm correct mapping with Arnav
at Thursday demo review.

### 4. PIN-Based Authentication
Login now uses role-grouped user-select dropdown + 4-digit PIN (from `SEED.users[].pin`).
Email/password form replaced; glassmorphism shell preserved. Admin default credentials:
`user_admin / 1234`. Coach: `user_coach_jagdish / 1234`.

### 5. Parent Accounts Synthesized
No PARENT-role users exist in seed (0 of 10 users). Parent login is synthesized
from `students[].guardianName` / `guardianPhone`. Multiple children with the same
`guardianPhone` are grouped under one synthesized parent account with a child-selector.

---

## Open Questions

1. **Head Coach role:** Meeting notes reference "head coach or admin approval"
   for Club payroll finalization. Confirm whether Head Coach needs a distinct
   permission tier from Admin, or if this is informal language for the same role.

2. **Support coach payroll attribution:** When a support coach covers a session,
   does their private-session verification count toward their own payroll?
   Currently `db.getPayroll()` only counts sessions where `coachId === coach.id`.
   Need client confirmation.

3. **Date-picker component:** No dedicated date-picker exists in the current UI
   library. Attendance back-dating and schedule navigation will need one — candidate
   for `docs/UI_GAPS.md`. Fallback: native `<input type="date">` with Input.jsx styling.

4. **Print stylesheet:** No print-optimized CSS pattern exists. Printable roster
   (Step 4 enhancement) will need a dedicated `@media print` stylesheet class.

5. **PWA manifest:** No `manifest.json` or service worker exists. PWA installable-icon
   experience (Step 7.5) needs from-scratch creation.

6. **Make-up session policy:** Standard (30-day expiry, max 2 per package,
   non-transferable). Implemented — confirm with client.

7. **Guest occupancy:** Guest/trial students excluded from club occupancy
   (don't count toward the 130). Implemented — confirm with client.

8. **Attendance lock:** Coach 2 days back, Admin 30 days back for amendments.
   Implemented — confirm with client.

---

## UI Primitives (10 components)

### Card — `src/components/ui/Card.jsx`
```jsx
<Card className="..." onClick={handler} padding={true}>
```
- Renders: `<div>` with `bg-white rounded-xl border border-line shadow-card p-[18px]`
- Props: `children`, `className?`, `onClick?`, `padding?` (default true)
- onClick present: adds `cursor-pointer hover:shadow-card-hover hover:-translate-y-px hover:border-[#DDDCE8]`
- Uses: `transition-all duration-180`

### StatCard — `src/components/ui/StatCard.jsx`
```jsx
<StatCard icon={Users} label="Students" value={296} delta={12} sublabel="..." color="brand" />
```
- Renders: `Card` wrapper with flex column layout, `min-h-[142px]`
- Props: `icon` (Lucide component), `label` (string), `value` (string|number), `delta?` (number), `sublabel?` (string), `color?` (brand|ok|warn|err, default brand)
- Icon: `w-[38px] h-[38px] rounded-[11px]`, icon at 18px
- Delta: top-right pill, green for positive, red for negative
- Value: `text-[28px] font-bold text-ink leading-none tracking-[-0.035em]`
- Max 4 per row (`lg:grid-cols-4`)

### Button — `src/components/ui/Button.jsx`
```jsx
<Button variant="primary" size="md" icon={Icon} disabled={false}>Text</Button>
```
- Props: `variant` (primary|secondary|ghost|danger), `size` (sm|md|lg), `icon?`, `disabled?`, `className?`, + `button` attributes
- Base: `inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all duration-150`
- Primary: gradient `linear-gradient(180deg, #7C4DFF 0%, #6437E8 100%)`, shadow, white text
- Secondary: `bg-white border border-line text-ink hover:bg-canvas-soft`
- Ghost: `text-ink-muted hover:bg-canvas-soft`
- Danger: `text-white bg-err hover:brightness-110`
- Sizes: sm=`h-8 px-3 text-[11px]`, md=`h-9 px-3.5`, lg=`h-11 px-5 text-[13px]`

### Input — `src/components/ui/Input.jsx`
```jsx
<Input label="Email" type="text" icon={Mail} placeholder="..." value={v} onChange={fn} error="..." />
```
- Renders: label above + `h-[52px] px-4 rounded-2xl bg-white/80 border` input row
- Props: `label?`, `type` (text|password), `icon?` (Lucide component or string path), `placeholder?`, `value`, `onChange`, `error?`, `name?`, `autoComplete?`
- Focus: `border-[#8b5cf6] focus-within:ring-2 focus-within:ring-[#8b5cf6]/15`
- Error: red border + ring
- Password: Show/Hide text toggle button
- Uses: `transition-all`

### StatusPill — `src/components/ui/StatusPill.jsx`
```jsx
<StatusPill status="active" />
```
- Renders: `inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold`
- Props: `status` (string) — 40+ mappings to soft-bg colors
- Categories: success (green), error (red), warning (amber), neutral (gray), info (blue)
- Key is lowercased + spaces→underscores for lookup

### Badge — `src/components/ui/Badge.jsx`
```jsx
<Badge variant="mock">MOCK DATA</Badge>
```
- Renders: `h-[22px] px-2 rounded-full text-[10px] font-semibold tracking-[0.04em]`
- Props: `variant` (mock|info|entity), `children`
- mock: `bg-warn-bg text-warn border border-[#F6DDAA]`
- info: `bg-blue-50 text-blue-600 border border-blue-100`
- entity: `bg-brand-50 text-brand-600 border border-brand-100`

### Modal — `src/components/ui/Modal.jsx`
```jsx
<Modal open={bool} onClose={fn} title="Modal Title" size="md">{children}</Modal>
```
- Renders: `fixed inset-0 z-[310]` with `bg-black/30 backdrop-blur-sm` backdrop
- Props: `open`, `onClose`, `title?`, `size?` (sm|md|lg|xl|full, default md), `children`
- Content: `bg-white rounded-2xl shadow-modal border border-line max-h-[90vh] overflow-y-auto`
- Title header: `px-5 py-4 border-b border-line` with X close button
- Body: `p-5`

### Dropdown — `src/components/ui/Dropdown.jsx`
```jsx
<Dropdown options={items} value={sel} onChange={fn} label="Coach" placeholder="..." searchable multi getOptionLabel getOptionValue />
```
- Props: `options` (array), `value`, `onChange`, `label?`, `placeholder?`, `searchable?`, `multi?`, `getOptionLabel` (fn), `getOptionValue` (fn), `disabled?`, `error?`
- Trigger: `h-[38px] px-3 rounded-lg bg-white border border-line`, matches Input styling
- Single: displays selected label with checkmark, closes on select
- Multi: tag chips (max 3 + "+N"), checkboxes, stays open
- Viewport-aware: flips above when bottom overflow
- Keyboard: Arrow keys navigate, Enter selects, Escape closes

### EmptyState — `src/components/ui/EmptyState.jsx`
```jsx
<EmptyState icon={Inbox} title="No data" description="..." action={<Button>Add</Button>} />
```
- Renders: centered flex column, `py-16 px-4`
- Props: `icon` (Lucide), `title`, `description?`, `action?` (ReactNode)
- Icon: `w-12 h-12 text-ink-faint`

### Skeleton — `src/components/ui/Skeleton.jsx`
```jsx
<Skeleton className="h-4 w-32" />
```
- Named exports: `Skeleton` (base), `SkeletonCard`, `SkeletonRow`, `SkeletonTable`
- Base: `animate-pulse bg-canvas-soft rounded-2xl`
- SkeletonCard: card + icon + title + subtitle blocks
- SkeletonRow: flex row with avatar circle + text lines
- SkeletonTable: card with configurable `rows` (default 5)

---

## Data Components (6 components)

### DataGrid — `src/components/data/DataGrid.jsx`
```jsx
<DataGrid data={rows} columns={colDefs} hideSearch={false} />
```
- Uses: TanStack React Table v8.21.3 (`@tanstack/react-table`)
- Props: `data` (array), `columns` (TanStack column defs), `hideSearch?` (bool)
- Search: global search input with `Search` icon, `h-[38px] rounded-lg bg-canvas-soft`
- Header: `sticky top-0 z-10 bg-canvas-soft text-[10px] font-semibold uppercase`, clickable sort
- Sort icons: Lucide `ArrowUp`/`ArrowDown` in `text-brand`
- Rows: `h-[52px]`, `hover:bg-canvas-soft`
- Animations: Framer Motion stagger (opacity + translateY, 180ms, respects `prefers-reduced-motion`)
- Empty: uses `EmptyState` with `SearchX` icon
- Pagination: footer with count + page size selector (10/25/50) + nav buttons

### CardListView — `src/components/data/CardListView.jsx`
```jsx
<CardListView data={rows} renderCard={(item, idx) => <Card>...</Card>} searchPlaceholder="Search..." />
```
- Mobile-first card list with `space-y-3`
- Props: `data` (array), `renderCard` (fn), `searchPlaceholder?`
- Load More: initially 10 cards, "Load More (N remaining)" button
- Animations: Framer Motion stagger (same as DataGrid)
- Empty: uses `EmptyState`

### AdaptiveTable — `src/components/data/AdaptiveTable.jsx`
```jsx
<AdaptiveTable data={rows} columns={colDefs} renderCard={fn} searchPlaceholder="..." hideSearch={false} />
```
- Switches DataGrid (desktop 768px+) / CardListView (mobile) via `useIsMobile()`
- Props: same as DataGrid + CardListView combined
- Passes `hideSearch` through to both sub-components

### FilterBar — `src/components/data/FilterBar.jsx`
```jsx
<FilterBar filters={[...]} searchValue={q} onSearchChange={fn} searchPlaceholder="Search..." />
```
- Props: `filters` (array of `{key, label, value, onChange, options, defaultValue}`), `searchValue?`, `onSearchChange?`, `searchPlaceholder?`
- Desktop: inline selects + search + active filter chips + Clear All button
- Mobile: filter button with badge count → bottom sheet
- Backward compatible: accepts raw `children`

### RowActionsMenu — `src/components/data/RowActionsMenu.jsx`
```jsx
<RowActionsMenu actions={[{label, icon, onClick, variant, separator}]} itemLabel="Name" />
```
- Trigger: ChevronDown icon with hover background reveal
- Props: `actions` (array), `itemLabel?` (for toast)
- Sections: `{ separator: true }` creates visual dividers
- Addon: `action.addon` prop for right-aligned text (e.g., keyboard shortcut)
- Dropdown: Framer Motion scale animation, 120ms, `z-[100]`
- Variant: `danger` → red text + hover bg

### ResponsiveChart — `src/components/data/ResponsiveChart.jsx`
```jsx
<TrendChart data={data} dataKey="value" xKey="label" title="Revenue" subtitle="..." indicator="..." />
```
- Named exports: `TrendChart`, `BarChartWidget`, `DonutChart`
- All use `Recharts` + `ResponsiveContainer`, wrapped in `<Card>`
- Colors: brand `#7C4DFF`, blue `#3B82F6`, green `#16A34A`, amber `#D97706`, gray `#9CA3AF`
- Title bar: optional `title`, `subtitle`, `indicator` props
- TrendChart: area with gradient fill, Cartesian grid, tooltips `rounded-[10px]`
- BarChartWidget: bars with `radius={[8,8,0,0]}`
- DonutChart: `innerRadius={56} outerRadius={96} paddingAngle={4}`

---

## Layout Components (5 components)

### DashboardLayout — `src/components/layout/DashboardLayout.jsx`
```jsx
<DashboardLayout><Outlet /></DashboardLayout>
```
- Structure: `h-screen overflow-hidden flex` (sidebar + flex-1 column)
- Column: Header (68px sticky) + main (`overflow-y-auto`, `max-w-[1600px] mx-auto`)
- Props: none (renders `<Outlet />` from react-router)

### Sidebar — `src/components/layout/Sidebar.jsx`
```jsx
<Sidebar mobileOpen={bool} onMobileClose={fn} collapsed={bool} onToggleCollapse={fn} />
```
- Desktop: 240px or 64px (collapsed), icon-only with tooltips
- Mobile: AnimatePresence overlay at `z-[200]` with backdrop blur
- Nav: reads from `getNavForRole(user.role)` in `nav.js`
- Props: `mobileOpen`, `onMobileClose`, `collapsed`, `onToggleCollapse`

### Header — `src/components/layout/Header.jsx`
```jsx
<Header onMenuClick={fn} />
```
- Renders: `sticky top-0 z-30 h-[68px] bg-white/96 backdrop-blur-md border-b border-line`
- Page title: dynamically resolved via `titleForPath(pathname, nav)`
- Props: `onMenuClick` (hamburger toggle for mobile)

### BottomNav — `src/components/layout/BottomNav.jsx`
- Dormant — not currently imported in DashboardLayout
- Reusable for mobile bottom tab bar if needed for coach mobile screens

### PageHeader — `src/components/layout/PageHeader.jsx`
```jsx
<PageHeader title="Page Title" subtitle="Optional subtitle" />
```
- Shared responsive heading across all pages
- Props: `title`, `subtitle?`
- Renders: MOCK DATA badge automatically

---

## RBAC Component

### CanAccess — `src/components/rbac/CanAccess.jsx`
```jsx
<CanAccess role="admin" permission="payroll.view" fallback={<Unauthorized />}><Children /></CanAccess>
```
- Props: `role?` (exact match), `permission?` (hasPermission check), `fallback?`, `children`
- No user → redirects to `/login`
- Wrong role → redirects to `/unauthorized`
- Missing permission → renders `null`
- Uses: `useAuth()` + `hasPermission()` from `config/roles.js`

---

## Hooks (2 files)

### useMediaQuery — `src/hooks/useMediaQuery.js`
```js
const isMobile = useIsMobile();   // (max-width: 767px)
const isTablet = useIsTablet();   // (min-width: 768px) and (max-width: 1023px)
const isDesktop = useIsDesktop(); // (min-width: 1024px)
```

### Utility hooks (to be created in Steps 1-7)
- `useDashboard.js` — Step 1
- `useSchedule.js` — Step 2
- `useStudents.js` — Step 3
- `useAttendance.js` — Step 4
- `useCoach.js` — Step 5
- `usePrivateSessions.js` — Step 5
- `useVerification.js` — Step 6
- `usePayroll.js` — Step 6

---

## Utilities (3 files)

### cn.js — `src/utils/cn.js`
```js
cn('base-cls', condition && 'conditional-cls')  // clsx + tailwind-merge
```

### formatters.js — `src/utils/formatters.js`
```js
formatCurrency(4500)     // "Rs.4,500"
formatDate('2026-08-07') // "7 Aug 2026"
formatDateShort(...)     // "7 Aug"
formatTime(...)          // "4:00 PM"
formatDateTime(...)      // "7 Aug 2026, 4:00 PM"
formatPhone(...)         // "+91 98765 43210"
daysUntil(...)           // 39
relativeTime(...)        // "2d left" / "Tomorrow"
```

### api.js — `src/utils/api.js` (dormant in this phase)
```js
triggerWorkflow(action, payload)  // mock mode, returns after 1s delay
```
- Not used in Phase 1 localStorage build. Available for future backend integration.

---

## Design Tokens (`src/index.css` @theme block)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#7C4DFF` | Primary actions, active nav |
| `--color-brand-50` | `#F1ECFF` | Icon backgrounds, active nav |
| `--color-brand-600` | `#6437E8` | Button gradient bottom |
| `--color-ink` | `#171B35` | Primary text |
| `--color-ink-muted` | `#62697D` | Secondary text |
| `--color-ink-faint` | `#8C93A6` | Tertiary/placeholders |
| `--color-canvas` | `#F8F8FC` | Page background |
| `--color-canvas-soft` | `#FAFAFD` | Table headers |
| `--color-line` | `#E9EAF1` | Borders |
| `--color-ok` / `--color-ok-bg` | `#16A34A` / `#ECFDF3` | Success |
| `--color-warn` / `--color-warn-bg` | `#D97706` / `#FFF7E6` | Warning |
| `--color-err` / `--color-err-bg` | `#DC2626` / `#FEF2F2` | Error |
| `--font-sans` | Inter | Body text |
| `--font-display` | Space Grotesk | Hero/display |

---

*Last updated: Step 0 — Aug 2026*