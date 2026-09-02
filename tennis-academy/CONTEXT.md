# Tennis Academy Management — Project Context

## Overview

A production-quality, fully responsive, role-based (RBAC) frontend-only mock dashboard for **Tennis Academy Management (The Club & TOTS Tennis)**. Built with React 19 + Vite + Tailwind CSS v4. Supports 3 roles (Admin, Coach, Parent) with strict data isolation.

- **Tech Stack:** React 19.2, Vite 8.2, Tailwind CSS 4.3, React Router 7, TanStack Table 8.21, Recharts 3.10, Framer Motion 13, Lucide React 1.30, Sonner 2.0
- **Lint:** oxlint (zero errors)
- **Dev server:** `npm run dev` -> http://localhost:5173

---

## File Tree

```
tennis-academy/
├── index.html                    # Inter + Space Grotesk fonts, viewport meta
├── vite.config.js                # @tailwindcss/vite + react plugins
├── package.json                  # Dependencies (see above)
├── CONTEXT.md                    # This file
├── src/
│   ├── main.jsx                  # StrictMode entry, renders <App />
│   ├── App.jsx                   # Routes, CanAccess wrappers, Pucho branding badge
│   ├── index.css                 # @theme tokens, global reset, scrollbar, z-index scale
│   ├── config/
│   │   ├── nav.js                # Navigation configs (admin/coach/parent), BUSINESS_ENTITIES
│   │   └── roles.js              # ROLES, PERMISSIONS, MOCK_ACCOUNTS, hasPermission()
│   ├── context/
│   │   └── AuthContext.jsx       # Mock auth: login/logout, selectedEntity, switchEntity
│   ├── components/
│   │   ├── rbac/
│   │   │   └── CanAccess.jsx     # Role + permission-based route gating
│   │   ├── ui/
│   │   │   ├── Card.jsx          # Card container
│   │   │   ├── StatCard.jsx      # Metric card with icon, value, delta, sublabel
│   │   │   ├── Button.jsx        # Primary (gradient), secondary, ghost, danger variants
│   │   │   ├── Input.jsx         # Text/password input with show/hide toggle
│   │   │   ├── StatusPill.jsx    # 40+ status color variants
│   │   │   ├── Badge.jsx         # mock/info/entity badge variants
│   │   │   ├── Modal.jsx         # Centered modal with backdrop blur
│   │   │   ├── Dropdown.jsx       # Single/multi-select, searchable, keyboard accessible, viewport-aware
│   │   │   ├── EmptyState.jsx    # Centered icon + text + action
│   │   │   └── Skeleton.jsx      # SkeletonCard, SkeletonRow, SkeletonTable
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx   # h-screen flex, single scroll area, max-w-[1600px]
│   │   │   ├── Sidebar.jsx           # 240px/64px sidebar with nav sections + collapse button in footer
│   │   │   ├── Header.jsx            # 68px sticky header with entity selector, dynamic page title
│   │   │   ├── BottomNav.jsx         # Mobile bottom tab bar (dormant, not imported)
│   │   │   └── PageHeader.jsx        # Shared responsive page heading component (21 pages)
│   │   ├── data/
│   │   │   ├── DataGrid.jsx          # TanStack Table v8, sticky headers, sort icons, page size selector, row animations
│   │   │   ├── CardListView.jsx      # Card-based mobile list with Load More, stagger animations
│   │   │   ├── AdaptiveTable.jsx     # Switches DataGrid/CardListView by screen size
│   │   │   ├── FilterBar.jsx         # Declarative filters, search, chips, Clear All, mobile bottom sheet
│   │   │   ├── RowActionsMenu.jsx    # ChevronDown dropdown with sections, separators, addon support
│   │   │   └── ResponsiveChart.jsx   # TrendChart, BarChartWidget, DonutChart
│   │   └── pages/
│   │       ├── Login.jsx             # Premium SaaS login with responsive design, pre-filled demo creds, no theme toggle
│   │       ├── Unauthorized.jsx      # Access denied page
│   │       ├── admin/ (11 files)     # Dashboard~Reports (see Admin Pages below)
│   │       ├── coach/ (6 files)      # Dashboard~MyStats (see Coach Pages below)
│   │       └── parent/ (6 files)     # Dashboard~Progress (see Parent Pages below)
│   ├── data/
│   │   ├── admin/ (11 files)         # Mock data for all admin modules
│   │   ├── coach/ (3 files)          # scheduleData, attendanceData, leaveData
│   │   └── parent/ (4 files)         # childData, scheduleData, attendanceData, paymentData
│   ├── utils/
│   │   ├── cn.js                     # clsx + tailwind-merge helper
│   │   ├── formatters.js             # formatCurrency, formatDate, daysUntil, etc.
│   │   └── api.js                    # triggerWorkflow stub (mock mode by default)
│   └── hooks/
│       └── useMediaQuery.js          # useIsMobile, useIsTablet, useIsDesktop
```

---

## Branding & Design System

### Colors (`src/index.css` @theme block)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand` | `#7C4DFF` | Primary actions, active nav states, chart lines |
| `--color-brand-50` | `#F1ECFF` | Icon bg containers, nav active bg, badge bg |
| `--color-brand-600` | `#6437E8` | Button gradient bottom, hover states |
| `--color-brand-700` | `#4C1FB7` | Dark variant |
| `--color-ink` | `#171B35` | Primary text, headings |
| `--color-ink-muted` | `#62697D` | Secondary text, labels |
| `--color-ink-faint` | `#8C93A6` | Tertiary text, placeholders, icons |
| `--color-canvas` | `#F8F8FC` | Page background |
| `--color-canvas-soft` | `#FAFAFD` | Table headers, soft sections, Nav bg hover |
| `--color-line` | `#E9EAF1` | Borders, dividers |
| `--color-ok` | `#16A34A` | Success text |
| `--color-ok-bg` | `#ECFDF3` | Success background |
| `--color-warn` | `#D97706` | Warning text |
| `--color-warn-bg` | `#FFF7E6` | Warning background |
| `--color-err` | `#DC2626` | Error/danger text |
| `--color-err-bg` | `#FEF2F2` | Error background |
| `--color-off` | `#6B7280` | Inactive/idle text |
| `--color-off-bg` | `#F3F4F6` | Inactive/idle background |

### Typography

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Body | Inter | 400-500 | 13px |
| Page title | Inter | 650 (semibold) | 24px (`text-2xl`) |
| Section title | Inter | 650 | 14px (`text-sm`) |
| Card title | Inter | 650 | 14px |
| Secondary text | Inter | 400 | 12px |
| Caption | Inter | 400 | 11px |
| Micro label | Inter | 600 | 10px |
| Metric value | Inter | 700 (bold) | 28px |
| Display/hero | Space Grotesk | 700 | 44-72px |

Fonts loaded from Google Fonts in `index.html`:
- Inter: weights 400, 500, 600, 700
- Space Grotesk: weights 500, 600, 700

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Inputs, small buttons |
| `--radius-md` | 10px | Nav items, chart tooltips |
| `--radius-lg` | 14px | Cards |
| `--radius-xl` | 16px | StatCards, modal inner |
| `--radius-2xl` | 18px | Modals |
| `--radius-3xl` | 24px | Login card |

### Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 1px 2px rgba(20,24,40,0.03)` | Standard cards |
| `--shadow-card-hover` | `0 5px 18px rgba(31,24,62,0.05)` | Hovered cards |
| `--shadow-soft` | `0 1px 2px rgba(20,24,40,0.02)` | Active entity toggle |
| `--shadow-focus` | `0 0 0 3px rgba(124,77,255,0.10)` | Focused inputs |
| `--shadow-dropdown` | `0 12px 30px rgba(20,24,40,0.10)` | Dropdowns |
| `--shadow-modal` | `0 24px 70px rgba(20,24,40,0.18)` | Modals |

### Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default |
| Sticky Header | 30 | Header, BottomNav |
| Sidebar | 40 | Desktop sidebar |
| Branding | 50 | Pucho badge |
| Dropdown | 100 | Dropdown menus |
| Mobile Drawer | 200 | Sidebar overlay mobile |
| Modal Backdrop | 300 | Modal backdrop |
| Modal | 310 | Modal content |
| Toast | 500 | Sonner toasts |

### Scrollbar styling
- Width: 5px
- Thumb: `#D9DAE3` (hover: `#C5C6D0`), rounded full
- Track: transparent

### Motion
- `--animate-float`: 6s ease-in-out infinite, translates Y by -12px
- `prefers-reduced-motion`: All animations/transitions set to 0.01ms

### Pucho.ai Branding Badge
Fixed at `bottom-0 right-0 z-[50]` in `App.jsx` with `safe-area-inset-bottom` padding:
```jsx
<div className="fixed bottom-0 right-0 z-[50] ...">
  <span>Powered By</span>
  <img src="pucho logo url" className="h-3.5" />
</div>
```
Includes `safe-area-inset-bottom` padding for notched devices.

---

## RBAC (Role-Based Access Control)

### Permission Matrix (`src/config/roles.js`)

| Role | Permissions |
|------|-------------|
| **Admin** | `students.view/manage`, `parents.view/manage`, `coaches.view/manage`, `batches.view/manage`, `schedule.view/manage`, `attendance.view/manage`, `renewals.view/manage`, `payments.view/manage`, `reconciliation.view/manage`, `reports.view/manage` |
| **Coach** | `schedule.view_own`, `attendance.view_own/manage_own`, `leave.view_own/manage_own`, `stats.view_own`, `one_on_one.view_own/manage_own` |
| **Parent** | `student.view_own`, `schedule.view_own`, `attendance.view_own`, `payments.view_own`, `package.view_own`, `progress.view_own` |

### Mock Accounts
| Email | Password | Role | Name |
|-------|----------|------|------|
| `admin@academy.com` | `admin123` | admin | Admin User |
| `coach@academy.com` | `coach123` | coach | Vikram Singh |
| `parent@academy.com` | `parent123` | parent | Rajesh Mehta |

### Enforcement Levels
1. **Route level:** `<CanAccess role="admin"><DashboardLayout /></CanAccess>` in `App.jsx`
2. **Navigation level:** Each role gets its own nav config via `getNavForRole(role)`
3. **Component level:** `hasPermission(user.role, permission)` for granular checks

### CanAccess Component (`src/components/rbac/CanAccess.jsx`)
- Accepts `role` (exact match required) and/or `permission` (hasPermission check)
- No user -> redirects to `/login`
- Wrong role -> redirects to `/unauthorized`
- Missing permission -> renders null

---

## Auth Context (`src/context/AuthContext.jsx`)

Mock authentication with localStorage persistence:
- `login(email, password)`: Matches against MOCK_ACCOUNTS, sets user state with email/name/role/entity, persists to localStorage
- `logout()`: Clears user, selectedEntity, and localStorage
- `switchEntity(entityId)`: Switches business entity filter (Admin only)
- `selectedEntity`: Current entity filter (`'all'`, `'the-club'`, `'tots-tennis'`)
- Auth state survives page refresh via localStorage

Business entities: **The Club** (`the-club`) and **TOTS Tennis** (`tots-tennis`)

---

## Navigation (`src/config/nav.js`)

### Admin Navigation (11 modules)
- **OVERVIEW:** Overview (`/admin`)
- **CRM:** Students, Parents
- **OPERATIONS:** Coaches, Batches, Schedule, Attendance
- **FINANCE:** Renewals, Payments, Reconciliation, Reports

### Coach Navigation (6 modules)
- **MY WORK:** Dashboard, My Schedule, Attendance, 1-on-1 Sessions, Leave, My Stats

### Parent Navigation (6 modules)
- **MY CHILD:** Dashboard, Schedule, Attendance, Package, Progress
- **ACCOUNT:** Payments

### Title Resolution
`titleForPath(pathname, navItems)` matches the current pathname against nav items using longest-match algorithm (prevents `/admin` from matching `/admin/batches`).

---

## Layout System

### DashboardLayout (`src/components/layout/DashboardLayout.jsx`)
```
+------------------------------------------+
| Sidebar | flex-1 (min-w-0 w-0)            |
|         | +---------------------------+  |
|         | | Header (68px sticky)      |  |
|         | +---------------------------+  |
|         | | main (overflow-y-auto)    |  |
|         | |   max-w-[1600px] mx-auto  |  |
|         | |   <Outlet />              |  |
|         | +---------------------------+  |
+------------------------------------------+
```
- `h-screen overflow-hidden` on root prevents double scrollbar
- `flex-1 min-w-0 w-0` ensures content doesn't overflow
- Only `main` has `overflow-y-auto` (single scroll area)
- Responsive padding: `px-4 sm:px-6 md:px-7 lg:px-8`

### Sidebar (`src/components/layout/Sidebar.jsx`)
- **Desktop:** 240px wide (`w-[240px]`), hidden below `md` breakpoint
- **Collapsed:** 64px wide (`w-16`), icon-only with tooltips
- **Mobile:** Framer Motion `AnimatePresence` full-screen overlay at `z-[200]` with backdrop blur, triggered via hamburger
- **Mobile drawer:** 280px wide, X close button, Escape key to close, auto-closes on route change
- **Collapse button:** PanelLeft icon in sidebar footer (above logout), only visible on desktop
- **Logo:** "AJ" monogram in `w-[30px] h-[30px] rounded-[9px]` brand-50 bg
- **Nav items:** `h-10 rounded-[10px]`, 18px icons, 13px Inter medium text
  - Active: `bg-brand-50 text-brand-600 shadow-[inset_2px_0_0_var(--color-brand)]`
  - Inactive: `text-ink-muted hover:bg-[#F7F7FB] hover:text-ink`
- **Section headers:** `text-[10px] font-semibold tracking-[0.08em] uppercase text-[#9AA0B2]`
- **Logout button:** Footer area with LogOut icon, turns red on hover

### Header (`src/components/layout/Header.jsx`)
- `sticky top-0 z-30 h-[68px] min-h-[68px]`
- `bg-white/96 backdrop-blur-md border-b border-line`
- **Left:** Hamburger menu (mobile) + page title (dynamically resolved via `titleForPath`) + role subtitle
- **Right:** Business entity selector (Admin only) + user avatar with initial + name
- **Entity selector:** Pill-style toggle with `bg-canvas-soft rounded-lg`, active state `bg-white shadow-soft`
- **Collapse toggle:** Removed from Header; now in Sidebar footer

### PageHeader (`src/components/layout/PageHeader.jsx`)
Shared responsive page heading component used across all 21 pages:
```jsx
<PageHeader title="Payments" subtitle="Track all payments across entities" />
```
- **Layout:** `flex-col sm:flex-row` for responsive stacking (title above badge on mobile, side-by-side on desktop)
- **Title:** `text-2xl font-semibold text-ink tracking-[-0.025em]`
- **Subtitle:** `text-[13px] text-ink-muted mt-1` (optional)
- **Badge:** Automatically renders MOCK DATA badge internally (no separate Badge import needed in pages)

### BottomNav (`src/components/layout/BottomNav.jsx`)
- Dormant -- not imported in DashboardLayout. Navigation on mobile is via sidebar overlay (hamburger menu).

---

## UI Component Reference

### Card (`src/components/ui/Card.jsx`)
```jsx
<Card className="..." onClick={handler} padding={true}>
```
- `bg-white rounded-xl border border-line shadow-card`
- `p-[18px]` (default padding via `padding` prop)
- Optional click: adds `cursor-pointer hover:shadow-card-hover hover:-translate-y-px hover:border-[#DDDCE8]`
- `transition-all duration-180`

### StatCard (`src/components/ui/StatCard.jsx`)
```jsx
<StatCard icon={Users} label="Total Students" value={296} delta={12} sublabel="..." color="ok" />
```
- `min-h-[142px]`, flex column layout
- **Icon:** `w-[38px] h-[38px] rounded-[11px]`, icon 18px
- **Color prop:** `brand` (purple, default), `ok` (green), `warn` (amber), `err` (red) -- controls icon background/text
- **Delta:** Top-right, `text-[11px] font-semibold`, green (`text-ok`) for positive, red (`text-err`) for negative
- **Value:** `text-[28px] font-bold text-ink leading-none tracking-[-0.035em]`
- **Label:** `text-xs font-medium text-ink-muted mt-1.5`
- **Sublabel:** `text-[11px] text-ink-faint mt-0.5`
- **Layout rule:** Max 4 StatCards per primary row (use `lg:grid-cols-4`); never use 5-column rows -- split overflow into a secondary row

### Button (`src/components/ui/Button.jsx`)
```jsx
<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" icon={Icon}>Text</Button>
```
- **Base:** `inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all duration-150`
- **Primary:** Gradient `linear-gradient(180deg, #7C4DFF 0%, #6437E8 100%)`, shadow `0 1px 3px rgba(100,55,232,0.20)`, white text
- **Secondary:** `bg-white border border-line text-ink hover:bg-canvas-soft`
- **Ghost:** `text-ink-muted hover:bg-canvas-soft`
- **Danger:** `text-white bg-err hover:brightness-110`
- **Sizes:** sm=`h-8 px-3 text-[11px]`, md=`h-9 px-3.5`, lg=`h-11 px-5 text-[13px]`

### Input (`src/components/ui/Input.jsx`)
```jsx
<Input label="Email" type="text|password" icon={Mail} placeholder="..." value={...} onChange={...} error="..." />
```
- `h-[38px] px-3 rounded-lg bg-white border border-line`
- Focus: `border-brand shadow-focus`
- Error: `border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]`
- Password type: Show/Hide toggle button (text, not icon)
- Label: `text-xs font-medium text-ink-muted`
- Inner input: `text-[13px] text-ink placeholder:text-ink-faint`

### StatusPill (`src/components/ui/StatusPill.jsx`)
```jsx
<StatusPill status="active|pending|paid|overdue|..." />
```
- `inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold`
- 40+ status color mappings in `colorMap` object
- Categories: success (green bg), error (red bg), warning (amber bg), neutral (gray bg), info (blue bg)
- Key `status` is lowercased with spaces replaced by underscores

### Badge (`src/components/ui/Badge.jsx`)
```jsx
<Badge variant="mock|info|entity">MOCK DATA</Badge>
```
- `h-[22px] px-2 rounded-full text-[10px] font-semibold tracking-[0.04em]`
- **mock:** `bg-warn-bg text-warn border border-[#F6DDAA]`
- **info:** `bg-blue-50 text-blue-600 border border-blue-100`
- **entity:** `bg-brand-50 text-brand-600 border border-brand-100`

### Modal (`src/components/ui/Modal.jsx`)
```jsx
<Modal open={bool} onClose={fn} title="..." size="sm|md|lg|xl|full">
```
- `fixed inset-0 z-[310]`, backdrop `bg-black/30 backdrop-blur-sm`
- Content: `bg-white rounded-2xl shadow-modal border border-line`
- `max-h-[90vh] overflow-y-auto`, `m-4 sm:m-0`
- Title header: `px-5 py-4 border-b border-line`, X close button `p-1.5 rounded-lg hover:bg-canvas-soft`
- Body: `p-5`

### EmptyState (`src/components/ui/EmptyState.jsx`)
```jsx
<EmptyState icon={Icon} title="..." description="..." action={<Button>...</Button>} />
```
- Centered flex column, `py-16 px-4`
- Icon: `w-12 h-12 text-ink-faint`
- Title: `text-base font-semibold text-ink`
- Description: `text-sm text-ink-muted max-w-sm`

### Dropdown (`src/components/ui/Dropdown.jsx`)
```jsx
<Dropdown
  options={items}
  value={selected}
  onChange={setSelected}
  label="Coach"
  placeholder="Select coach..."
  searchable={true}
  multi={false}
  getOptionLabel={(o) => o.name}
  getOptionValue={(o) => o.id}
/>
```
- Trigger: `h-[38px] px-3 rounded-lg bg-white border border-line`, matches Input styling
- Single-select: Displays selected label with checkmark, closes on select
- Multi-select: Shows tag chips (max 3 + "+N" overflow), checkboxes, stays open on select
- Search: Inline search input with `Search` icon, filters options
- Keyboard: ArrowDown/Up to navigate, Enter to select, Escape to close, Tab to dismiss
- Click-outside: Closes on outside click via `mousedown` listener
- Viewport-aware: Auto-flips menu above trigger when bottom overflow detected
- Animation: Framer Motion `scale` + `y` entrance/exit, 150ms
- Error state: Red border + shadow matching Input pattern
- Disabled: Opacity reduction + cursor-not-allowed

### Skeleton (`src/components/ui/Skeleton.jsx`)
- **Skeleton:** `animate-pulse bg-canvas-soft rounded-2xl`
- **SkeletonCard:** Card wrapper + three skeleton blocks (icon, title, subtitle)
- **SkeletonRow:** Flex row with avatar circle + two text lines
- **SkeletonTable:** Card with `rows` skeleton rows (default 5)

---

## Data Components

### DataGrid (`src/components/data/DataGrid.jsx`)
TanStack React Table v8.21.3 with:
- **hideSearch** prop: When true, hides the global search input (used when FilterBar provides search externally)
- Global search: `Search` icon + input, `h-[38px] rounded-lg bg-canvas-soft`
- **Header:** `sticky top-0 z-10 bg-canvas-soft text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-faint`, `h-[42px]`, clickable for sort
- **Sort indicators:** Lucide `ArrowUp`/`ArrowDown` icons in `text-brand` for active sort column
- **Body rows:** `h-[52px]`, `hover:bg-canvas-soft`, optional `cursor-pointer` for row click
- **Row animations:** Framer Motion stagger entrance (opacity + translateY, 180ms, 30ms stagger, respects `prefers-reduced-motion`)
- **Empty state:** Uses `EmptyState` component with `SearchX` icon and description
- **Pagination:** Footer with result count ("Showing X-Y of Z"), page size selector (10/25/50/All), First/Previous/Next/Last buttons using `ChevronsLeft`/`ChevronLeft`/`ChevronRight`/`ChevronsRight` icons
- Page size: 10 rows default, configurable via dropdown

### CardListView (`src/components/data/CardListView.jsx`)
- Mobile-first card-based list with `space-y-3`
- **Search:** Built-in search input with `Search` icon, filters across all string fields in data items. Controlled via `searchPlaceholder` prop; hidden when searchPlaceholder is falsy (e.g., when FilterBar provides external search via `hideSearch`)
- Each item rendered via `renderCard(item, idx)` callback inside a `<Card>`
- **Load More:** Initially shows 10 cards, "Load More (N remaining)" button appends 10 more
- **End state:** "No more results" text when all cards loaded
- **Row animations:** Framer Motion stagger entrance (opacity + translateY, 180ms, respects `prefers-reduced-motion`)
- Empty state: Uses `EmptyState` component with `Inbox` icon and description

### AdaptiveTable (`src/components/data/AdaptiveTable.jsx`)
- Uses `useIsMobile()` hook to switch between DataGrid and CardListView
- Mobile (<768px): CardListView with search via `searchPlaceholder` prop
- Desktop (768px+): DataGrid with TanStack global search
- Passes through `hideSearch` prop: when true, suppresses search on both DataGrid and CardListView (used when FilterBar handles search externally)

### FilterBar (`src/components/data/FilterBar.jsx`)
```jsx
<FilterBar
  filters={[
    { key: 'gateway', label: 'Gateway', value: gwFilter, onChange: setGwFilter, options: [...], defaultValue: 'all' },
    { key: 'status', label: 'Status', value: stFilter, onChange: setStFilter, options: [...], defaultValue: 'all' },
  ]}
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search..."
/>
```
- **Declarative API:** Accepts `filters` array with key/label/value/onChange/options/defaultValue
- **Search:** Integrated search input with `Search` icon, optional via `searchValue`/`onSearchChange`
- **Active filter chips:** Tag-style pills showing current filter values with X to remove individual filters
- **Clear All:** `RotateCcw` icon button resets all filters and search to defaults
- **Desktop:** `flex items-center gap-2 flex-wrap` with inline selects, chips below
- **Mobile:** Filter button with active count badge, bottom sheet, Apply/Clear All buttons
- **Backward compatible:** Still accepts raw `children` for gradual migration

### RowActionsMenu (`src/components/data/RowActionsMenu.jsx`)
```jsx
<RowActionsMenu
  actions={[
    { label: 'View Details', icon: Eye },
    { label: 'Send Reminder', icon: Send },
    { separator: true },
    { label: 'Mark as Paid', icon: CheckCircle, variant: 'danger' },
  ]}
  itemLabel="Arjun Mehta"
/>
```
- **Trigger:** ChevronDown icon `w-8 h-8 rounded-lg group [&_svg]:size-4 [&_svg]:stroke-[2.25px]`, hover background reveal
- **Sections & separators:** Actions array supports `{ separator: true }` to create visual dividers between groups
- **Addon support:** Each action can include `addon` prop (e.g., keyboard shortcut) displayed as right-aligned faint text
- **Dropdown menu:** Framer Motion scale animation, 120ms, `z-[100]`, `shadow-dropdown`
- Triggers toast on click unless `action.onClick` provided
- `variant: 'danger'` renders red text + hover bg for destructive actions
- Click-outside closes menu, Escape key dismisses

### ResponsiveChart (`src/components/data/ResponsiveChart.jsx`)
Recharts-based chart components wrapped in `ResponsiveContainer`:
- **Colors:** brand `#7C4DFF`, blue `#3B82F6`, green `#16A34A`, amber `#D97706`, gray `#9CA3AF`
- **Title bar:** All charts accept optional `title`, `subtitle`, and `indicator` props. Title rendered as `text-sm font-semibold text-ink`, subtitle as `text-[11px] text-ink-muted mt-0.5`, indicator right-aligned as `text-xs font-semibold text-ink-muted`
- **TrendChart:** Area chart with gradient fill, Cartesian grid `#EEEFF4`, axis labels `#969CAF` at 11px, tooltips `rounded-[10px]` with shadow
- **BarChartWidget:** Bar chart with `radius={[8,8,0,0]}` rounded top corners
- **DonutChart:** Pie chart with `innerRadius={56} outerRadius={96} paddingAngle={4}`, 5-color palette

---

## Page Details

### Login Page (`src/components/pages/Login.jsx`)
Responsive, premium SaaS login page:
- **Container:** `h-dvh overflow-y-auto md:overflow-hidden` -- scrollable on mobile, locked on desktop
- **Background:** `#FAFAFF` solid, dot grid overlay with gradient mask fade
- **Ambient orbs:** Purple top-left + blue bottom-right, smaller on mobile
- **Header:** "AJ" monogram + "Tennis Academy Management" brand (no theme toggle)
- **Hero section:**
  - "Academy Management" + "BUILT ON PUCHO.AI" micro labels
  - "Coach. Train. Excel." -- Space Grotesk, responsive `text-[32px] sm:text-[44px] lg:text-[52px]`
  - Feature badges: "Role-Based Access" + "Secure Platform"
  - Content wrapper: `items-start sm:items-center` (top-aligned on mobile to prevent cutoff)
- **Login card:**
  - `rgba(255,255,255,0.75)` with `backdrop-filter: blur(24px)`, `border-radius: 24px`
  - Responsive padding: `clamp(20px, 5vw, 32px)` (adapts to narrow mobile screens)
  - Shadow: `0 20px 60px -15px rgba(0,0,0,0.08)`
  - "Welcome Back" heading + subtitle
  - Email input: Pre-filled with `admin@academy.com` for quick demo
  - Password input: Pre-filled with `admin123`, Lock icon + Eye/EyeOff toggle
  - All inputs: `min-w-0` to prevent flex overflow, responsive `sm:` breakpoints for sizes
  - Error banner: Red tinted
  - Submit button: Purple gradient, responsive `h-[44px] sm:h-[48px]`
- **Quick login pills:** ADMIN / COACH / PARENT buttons with hover purple transition
- **Auto-redirect:** If already logged in, redirects to role-specific dashboard
- **Bottom padding:** `pb-6` for all sizes (reduced from excessive safe-area calculation)

### Unauthorized Page (`src/components/pages/Unauthorized.jsx`)
- Centered `Card max-w-md`
- ShieldOff icon in red circle (`bg-err-bg`)
- "Access Denied" title + description
- Two buttons: "Go Back" (secondary) + "Sign In" (primary)

---

### Admin Pages (11)

#### 1. Dashboard (`admin/Dashboard.jsx`)
- **Page heading:** "Overview" + "Daily academy snapshot" subtitle + MOCK DATA badge
- **Stats row (4):** Total Students (296, +12%), Monthly Revenue (₹48,500, +8%), Attendance Rate (87%, +2%), Batch Occupancy (74%, 296/400 seats)
- **Charts row (2):** Revenue trend (area chart, Jul 2025-Aug 2026, 14 months, $32K-$56K with seasonal trend), Attendance trend (bar chart, Mon-Sun)
- **Chart titles & indicators:** Revenue Trend with "₹49K this month" indicator, Weekly Attendance with "87% overall" indicator
- **Advanced Player Roster:** Filterable by business entity, shows top 5 players with avatar circle, name, age group/batch, entity, status
- **Entity filter:** Uses `selectedEntity` from AuthContext to filter students

#### 2. Students (`admin/Students.jsx`)
- **AdaptiveTable** with columns: Name, Age Group, Level, Batch, Coach, Entity, Attendance %, Package Expiry (red if <=7 days), Status
- **Student Detail Modal:**
  - Large avatar (`w-16 h-16`), name, age/batch/coach, status pills
  - Automated Communications section: 3 email log items (Thank You, Certificate, 45-Day Progress) with sent/pending status
  - Documents section: Upload Photo and Upload Document cards with Upload icon

#### 3. Parents (`admin/Parents.jsx`)
- **AdaptiveTable** with columns: Name, Phone, Email, Children count, Payment Status, Renewal Status, Entity, Account Status
- **Parent Detail Modal:**
  - Avatar, name, phone/email with icons, status pills
  - Children list: Each child card with avatar, name, age group, batch
  - Recent Payments: 3 payment rows with description, date, amount, status
  - Communication History: 3 entries with type, date/channel, status

#### 4. Coaches (`admin/Coaches.jsx`)
- **Stats row (3):** Total Coaches (10), Active, On Leave
- **AdaptiveTable** with columns: Name (with initials avatar), Phone, Email, Specialization, Entity, Students count, Status, Payroll (Rs. formatted)
- **Card view:** Avatar with initials, name/specialization, 2x2 grid of email/phone/students/payroll, entity badge

#### 5. Batches (`admin/Batches.jsx`)
- **Stats row (3):** Total Batches, Total Capacity, Enrolled
- **AdaptiveTable** with columns: Name, Coach, Entity, Level, Schedule, Capacity, Enrolled (progress bar), Status
- **Enrolled column:** Shows `enrolled/capacity` + progress bar + percentage

#### 6. Schedule (`admin/Schedule.jsx`)
- **Stats row (3):** Total Classes Today, 1-on-1 Pending Confirmation, Cancelled Today
- **AdaptiveTable** with columns: Type (group/1-on-1/cancelled), Batch/Student, Coach, Day, Time, Entity, Status
- **Status column:** Shows confirmation labels (Confirmed/Awaiting Reply/Declined/Not Sent) or cancellation types (Full Charge/Advance)

#### 7. Attendance (`admin/Attendance.jsx`)
- **Stats row (3):** Daily 1-on-1 Confirmations (confirmed/total), Classes Nearing 45-Day Expiry, Coach Attendance Tracker (present/absent/late/leave counts)
- **Student Attendance table:** Name, Batch, Date, Status, Check-in, Check-out
- **Coach Attendance table:** Coach Name, Date, Status (present/absent/late/leave), Sessions count

#### 8. Renewals (`admin/Renewals.jsx`)
- **Stats row (3):** Upcoming Renewals (7 days), Overdue Payments, Reminder Campaign Status (active/paused)
- **AdaptiveTable** with columns: Student, Parent, Entity, Plan, Amount, Expiry, Days Remaining (color-coded with progress bar), Payment Status, Last/Next Reminder dates
- **Reminder Drip Modal (on row click):**
  - Student/plan/expiry header card
  - Vertical timeline of touchpoints with colored dots (sent=green, pending=amber, skipped=gray)
  - Each touchpoint: Day label (Day -6, Day 0, Day +7 etc.), date, channel (WhatsApp/SMS/Email), status pill
  - Auto-stop warning banner if enabled

#### 9. Payments (`admin/Payments.jsx`)
- **Stats row (3):** Total Revenue (IndianRupee icon), Collected, Outstanding (all computed from filtered data)
- **FilterBar:** Gateway filter (All/Stripe/CCAvenue/Excel) + Status filter (All/Paid/Pending/Overdue)
- **AdaptiveTable** with columns: Student, Parent, Entity, Amount, Date, Gateway, Type, Status

#### 10. Reconciliation (`admin/Reconciliation.jsx`)
- **Header:** Upload Excel button + MOCK DATA badge
- **Stats row (5):** Total Entries, Matched, Mismatched, New, Total Difference
- **AdaptiveTable** with columns: Student, Entity, Excel Amount, System Amount, Difference (green=0, red=non-zero), Gateway, Status, Date
- **Upload Excel Modal:**
  - Drop zone area (dashed border, Upload icon, "Upload .xlsx" text)
  - "Mock Upload" button -> 1.5s loading spinner -> preview table with parsed rows
  - Preview table: Student, Batch, Amount, Gateway, Status columns

#### 11. Reports (`admin/Reports.jsx`)
- **Available Reports cards (3-column grid):** Each card shows name, description, category badge, last generated date, status, "Generate" button (toast on click)
- **Occupancy / Slot Analysis:** AdaptiveTable with columns: Time Slot, Batch, Capacity, Enrolled, Occupancy % (color-coded bar), Status
- **Sample Invoices:** 2-column card grid, clickable to open Invoice Detail Modal
- **Invoice Detail Modal:**
  - Invoice header (ID + period)
  - Revenue Breakdown: Group Classes (sessions x rate), 1-on-1 (sessions x rate)
  - Revenue Split: Academy Share (70%), Coach Share (30%), Net to Academy
  - Action buttons: Download PDF, Mark as Sent



---

### Coach Pages (6)

#### 1. Dashboard (`coach/Dashboard.jsx`)
- **Stats row (4):** Today's Classes, My Students (45), Avg Attendance (89%), Sessions This Month (42)
- **Today's Schedule:** AdaptiveTable filtered to current day, shows Type, Batch/Student, Time, Confirmation
- **My Students table:** Name (with avatar), Age Group, Level, Attendance %, all 45 students

#### 2. Schedule (`coach/Schedule.jsx`)
- **AdaptiveTable** with columns: Day, Time, Type (Group/1-on-1), Batch/Student, Students count, Location, Status
- Full weekly schedule for coach Vikram Singh

#### 3. Attendance (`coach/Attendance.jsx`)
- **Summary card:** Date, batch, Present/Absent counts, marked/total indicator
- **Today's Attendance table (interactive):** Student (with avatar), Status (clickable cycle: present -> absent -> late -> present), Check-in time
- Clicking status pill toggles through 3 states

#### 4. 1-on-1 Sessions (`coach/OneOnOne.jsx`)
- **AdaptiveTable** with columns: Student (with avatar), Day, Time, Confirmation, Actions (Send Confirmation / Reschedule buttons)
- **Card view:** Student avatar + name, day/time, confirmation status, Send Confirmation + Reschedule buttons

#### 5. Leave (`coach/Leave.jsx`)
- **Stats row (2):** Leave Balance (remaining/total, days used), Pending count
- **"Apply Leave" button** -> Modal with form: Type (Casual/Sick dropdown), Start Date, End Date, Reason textarea, Submit/Cancel
- **AdaptiveTable** with columns: Type, Dates, Reason, Status (pending/approved/rejected), Applied Date

#### 6. My Stats (`coach/MyStats.jsx`)
- **Stats row (4):** Total Students (45), Avg Attendance (89%), Monthly Sessions (42), Rating (4.8/5)
- **Attendance Trend bar chart:** Jan-Aug monthly attendance rates
- **Student Performance list:** Each student row with avatar, name, age/level, level StatusPill, attendance %

---

### Parent Pages (6)

#### 1. Dashboard (`parent/Dashboard.jsx`)
- **Coach card:** Avatar circle with initials, name, specialization, join date, next class date/time
- **Stats row (4):** Attendance rate, Package Days Left (with sublabel "X of Y used"), Next Payment (amount + due date), Progress Rating (avg/5)
- **Package Validity bar:** Progress bar with color coding (green=ok, amber=warning <=10 days, red=expired), days used/remaining labels
- **Upcoming Schedule:** Next 3 sessions with Calendar icon, time, location, type, StatusPill
- **Recent Progress:** Last 2 progress entries with category, star rating, date, note

#### 2. Schedule (`parent/Schedule.jsx`)
- **StatCard:** Classes This Week count
- **AdaptiveTable** with columns: Day, Time, Type, Batch/Coach, Location, Status
- Card view shows MapPin and Clock icons

#### 3. Attendance (`parent/Attendance.jsx`)
- **Stats row (4):** This Month %, Attended (X/Y sessions), Absent count, Late count
- **Attendance Trend area chart** (last 7 records, 100/75/0 values for present/late/absent)
- **AdaptiveTable** with columns: Date, Batch, Status, Check-in, Check-out

#### 4. Package (`parent/Package.jsx`)
- **Current Package card:** Active/Expired StatusPill, 2x2 grid (Plan, Amount, Start, Expiry), progress bar with days used/remaining
- **Renewal Details card:** Next payment amount + due date side by side
- **Previous Payments list:** Each with type, date/invoice, amount, status

#### 5. Progress (`parent/Progress.jsx`)
- **Assigned Coach card:** Avatar with initials, name, specialization, since date
- **Recent Achievements card:** Star list with purple bg items, Award icon
- **Progress History:** Full list of progress entries -- category, date, 5-star rating (filled stars = `text-warn fill-warn`), note text
- **Communications:** Vertical timeline with colored dots (green=completed, amber=pending) and connecting line (`bg-line`), each entry shows type, date, StatusPill, optional file link

#### 6. Payments (`parent/Payments.jsx`)
- **Stats row (3):** Total Paid, Next Due (amount + date), Payment Method
- **AdaptiveTable** with columns: Date, Amount, Type, Gateway, Status, Invoice ID
- Card view shows bold amount + type + gateway + invoice ID

---

## Data Layer (`src/data/`)

All mock data is static arrays/objects exported from JS files. No API calls or database connections.

### Admin Data (11 files)
| File | Exports | Description |
|------|---------|-------------|
| `dashboardData.js` | `dashboardStats`, `revenueTrend`, `attendanceTrend`, `enrollmentByEntity`, `studentAgeGroups` | Dashboard KPIs (296 students, ₹48,500/mo revenue) and 14-month chart data |
| `studentsData.js` | `students` (15 records), `getAdvancedPlayers()` | Full student roster with package/attendance |
| `parentsData.js` | `parents` (15 records) | Parent profiles with children IDs |
| `coachesData.js` | `coaches` (10 records) | Coach roster with payroll, specialization |
| `batchesData.js` | `batches` | Training batch data with capacity/enrollment |
| `scheduleData.js` | `scheduleItems` | Mixed group + 1-on-1 + cancelled classes |
| `attendanceData.js` | `attendanceRecords`, `coachAttendance`, `dailyConfirmationStats`, `classesExpiringStats` | Student + coach attendance records |
| `renewalsData.js` | `renewals`, `renewalStats`, `reminderDrips` | Package renewal tracking with drip campaigns |
| `paymentsData.js` | `payments` | Payment history across gateways |
| `reconciliationData.js` | `reconciliationEntries`, `reconciliationStats` | Excel vs system reconciliation records |
| `reportsData.js` | `reportTypes`, `occupancyData`, `sampleInvoices` | Report templates, slot occupancy, invoice samples |

### Coach Data (3 files)
| File | Exports | Description |
|------|---------|-------------|
| `scheduleData.js` | `coachSchedule`, `coachStudents`, `coachStats` | Vikram Singh's schedule + students + stats |
| `attendanceData.js` | `coachAttendanceRecords`, `todaysAttendance` | Today's attendance for coach's batch |
| `leaveData.js` | `leaveRequests`, `leaveStats` | Coach leave records and balance |

### Parent Data (4 files)
| File | Exports | Description |
|------|---------|-------------|
| `childData.js` | `childData` | Arjun Mehta's full profile (package, coach, progress, achievements, email log) |
| `scheduleData.js` | `parentSchedule` | Arjun's class schedule |
| `attendanceData.js` | `parentAttendance`, `attendanceSummary` | Attendance history + monthly summary |
| `paymentData.js` | `parentPayments`, `paymentSummary` | Payment history + next due details |

### Entity Filtering Pattern
All admin pages use this pattern for data isolation:
```js
const filtered = useMemo(() => {
  if (selectedEntity === 'all') return allData;
  return allData.filter(item => item.business_entity === selectedEntity);
}, [selectedEntity]);
```

---

## Utilities (`src/utils/`)

### `cn.js`
Combines `clsx` and `tailwind-merge` for safe className merging:
```js
export function cn(...inputs) { return twMerge(clsx(inputs)); }
```

### `formatters.js`
| Function | Output Example |
|----------|---------------|
| `formatCurrency(4500)` | `Rs.4,500` (with rupee sign) |
| `formatDate('2026-08-07')` | `7 Aug 2026` |
| `formatDateShort('2026-08-07')` | `7 Aug` |
| `formatTime('2026-08-07T16:00:00')` | `4:00 PM` |
| `formatDateTime('2026-08-07T16:00:00')` | `7 Aug 2026, 4:00 PM` |
| `formatPhone('9876543210')` | `+91 98765 43210` |
| `daysUntil('2026-09-15')` | `39` (days from now) |
| `daysAgo('2026-08-01')` | `6` |
| `relativeTime('2026-08-09')` | `2d left` / `Tomorrow` / `Today` / `Xd ago` |

### `api.js`
```js
export async function triggerWorkflow(action, payload) {
  // If VITE_PUCHO_PROXY_URL is set, makes real POST request
  // Otherwise returns mock response after 1s delay
}
```

---

## Hooks (`src/hooks/`)

### `useMediaQuery.js`
| Hook | Query |
|------|-------|
| `useIsMobile()` | `(max-width: 767px)` |
| `useIsTablet()` | `(min-width: 768px) and (max-width: 1023px)` |
| `useIsDesktop()` | `(min-width: 1024px)` |

Used by `AdaptiveTable` and `FilterBar` to switch between mobile/desktop layouts.

---

## Responsive Breakpoint Strategy

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | <768px | CardListView, drawer nav (Sidebar overlay), BottomNav, FilterBar bottom sheet |
| Tablet | 768-1024px | Collapsed sidebar (64px), simplified tables |
| Desktop | 1024px+ | Full sidebar (240px), DataGrid, multi-column grids |
| Ultrawide | 1920px+ | `max-w-[1600px] mx-auto` constraint |

CSS-first approach with Tailwind responsive prefixes. `useMediaQuery` hooks only used when DOM structure must change (e.g., AdaptiveTable component swap).

---

## Styling Patterns

### Page Structure (consistent across all pages)
All pages use the shared `PageHeader` component:
```jsx
<div className="space-y-4">
  <PageHeader title="Page Title" subtitle="Page subtitle" />
  // Stats row: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-N gap-4
  // Content sections: space-y-4
</div>
```

### Common CSS Classes by Element
| Element | Classes |
|---------|---------|
| Page heading | `text-2xl font-semibold text-ink tracking-[-0.025em]` |
| Page subtitle | `text-[13px] text-ink-muted mt-1` |
| Section heading | `text-sm font-semibold text-ink mb-2.5` or `mb-3` |
| Filter inputs/selects | `h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand` |
| Avatar circle | `w-[34px] h-[34px] rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold shrink-0` |
| Progress bar track | `w-full h-2 bg-canvas-soft rounded-full overflow-hidden` |
| Progress bar fill | `h-full rounded-full transition-all` + color class |
| Entity badge | `px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-600 capitalize` |
| List divider | `divide-y divide-line` |
| List item vertical rhythm | `py-3 first:pt-0 last:pb-0` |

---

## App Entry & Routing (`src/App.jsx`)

- **BrowserRouter** wraps entire app
- **AuthProvider** provides user context
- **Sonner Toaster** at `top-right` with richColors
- **Routes:**
  - `/login` -> Login page (public)
  - `/unauthorized` -> Unauthorized page (public)
-   `/admin/*` -> 11 routes, guarded by `<CanAccess role="admin">`, DashboardLayout wrapper
  - `/coach/*` -> 6 routes, guarded by `<CanAccess role="coach">`, DashboardLayout wrapper
  - `/parent/*` -> 6 routes, guarded by `<CanAccess role="parent">`, DashboardLayout wrapper
  - `*` -> Redirect to `/login`
- **Pucho badge:** Rendered outside `<Routes>`, always visible at bottom-right

---

## Dependencies

```json
{
  "@tailwindcss/vite": "^4.3.3",
  "@tanstack/react-table": "^8.21.3",
  "clsx": "^2.1.1",
  "date-fns": "^4.4.0",
  "framer-motion": "^13.0.0",
  "lucide-react": "^1.30.0",
  "react": "^19.2.8",
  "react-dom": "^19.2.8",
  "react-error-boundary": "^6.1.2",
  "react-router-dom": "^7.18.2",
  "recharts": "^3.10.1",
  "sonner": "^2.0.7",
  "tailwind-merge": "^3.6.0",
  "tailwindcss": "^4.3.3"
}
```

Dev dependencies: `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, `vite`

---

## Build & Lint

- **Build:** 2846 modules transformed, ~1MB JS + ~45KB CSS, ~5.7s build time
- **Lint:** 0 errors, only pre-existing unused import warnings
- **Dev server:** `npm run dev` -> `http://localhost:5173`

---

## Key Implementation Notes

1. **TanStack Table v8** (not v9) -- v9 had missing exports (`useReactTable`, `getCoreRowModel`, etc.). Downgraded to `@tanstack/react-table@8.21.3`.
2. **Tailwind CSS v4** uses `@theme` block in `index.css` instead of `tailwind.config.js`. Custom colors, fonts, radii, shadows, and keyframes are all defined there.
3. **Single scroll area** -- Only the `<main>` element has `overflow-y-auto`. The root layout uses `h-screen overflow-hidden` and `flex-1 min-w-0 w-0` to prevent double scrollbars.
4. **Mock auth with persistence** -- No backend. Login validates against hardcoded `MOCK_ACCOUNTS` array. Auth state stored in React context and persisted to localStorage (survives page refresh).
5. **Business entity filtering** -- All admin pages filter data by `selectedEntity` state. The entity selector in Header is admin-only.
6. **All pages tagged with `MOCK DATA` badge** in top-right for clarity.