---
name: fieldsync-newsprint
description: 'Newsprint design system (paper background #F9F9F7, neon green accent #00FF41, 1px black borders, 4px hard shadows, editorial type stack of Playfair Display + Inter + JetBrains Mono) for the FieldSync PWA. ALWAYS use this skill when building, modifying, or reviewing any FieldSync interface — booking screens, field availability calendar, tournaments, fixtures, standings tables, player profile, squads, financial dashboard, or notifications — and also whenever the user asks for "a screen", "a component", "a layout", "styles", "Tailwind", "shadcn", or mockups for FieldSync, even if they never say "Newsprint" or "design". Apply it too when generating throwaway HTML/JSX, wireframes, or UI examples for the project.'
---

# Newsprint — FieldSync design system

FieldSync is a multi-tenant SaaS PWA (Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui) for managing football fields: real-time bookings, tournaments, squads, and a portable player profile. Roles: administrator, receptionist, organizer, player.

The aesthetic is **Newsprint**: sports newspaper on paper stock. High contrast, black ink, a single fluorescent accent, no gradients, no rounded corners, no soft shadows. Everything looks printed; every interaction feels physical.

> Note on language: this document is in English, but the product ships in Spanish for the Costa Rican market. All user-facing strings, labels, dates, and mono tags you generate stay in Spanish (`DISPONIBLE`, `CONFIRMADA`, `Lunes, 15 de julio`).

---

## 1. Tokens

| Token | Value | Use |
|---|---|---|
| `paper` | `#F9F9F7` | Global background. Never pure white. |
| `ink` | `#000000` | Text, borders, icons. |
| `neon` | `#00FF41` | Accent: progress fill, active checkbox, alerts, "available" state. |
| `muted` | `#6B6B6B` | Metadata (time, secondary date, counters). |
| `border` | `1px solid #000000` | Every container, button, input, and row. |
| `shadow-hard` | `4px 4px 0px 0px rgba(0,0,0,1)` | Interactive and elevated elements. |
| `radius` | `0` | No exceptions, inputs and avatars included. |

Spacing scale: multiples of 4px. Between sections **2rem (32px)**. Card padding: 16px. Mobile base width: 380–420px.

### Contrast rule (non-negotiable)

Requirement RNF-04 mandates **WCAG 2.1 AA**. `#00FF41` on `#F9F9F7` lands at ~1.4:1 — unreadable. Therefore:

- Green is used **only as a fill or background**, with black text on top (~15:1, clears AAA).
- Never green text on paper, and never green-on-black for small text.
- Focus state: `outline: 2px solid #000; outline-offset: 2px`. Never `outline: none`.
- Color is never the sole carrier of meaning: always pair it with a mono label (`DISPONIBLE`, `OCUPADA`) or an icon.
- Light-only product: set `color-scheme: light` and `theme_color: "#F9F9F7"` in `manifest.json`. Do not implement dark mode.

---

## 2. Typography

Load the families with `next/font/google` and expose them as CSS variables.

- **Playfair Display** (700/900) — editorial headlines, header date, tournament name, match scoreline. Use `tracking-tight` and `leading-none` at large sizes.
- **Inter** (400/600) — body copy, names, forms. Row titles: 14px semibold. Metadata: 12px regular in `muted`.
- **JetBrains Mono** (500–800) — system labels, always **UPPERCASE**, 10–11px, `tracking-wider`: states, tags, counters, booking IDs, match minutes, numbers in standings.

Heuristic: if the text is *system data*, it's mono. If it's *human content*, it's Inter. If it's *the protagonist of the screen*, it's Playfair.

---

## 3. Base configuration

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: { paper: '#F9F9F7', ink: '#000000', neon: '#00FF41', muted: '#6B6B6B' },
    borderRadius: { none: '0px', DEFAULT: '0px' },
    boxShadow: { hard: '4px 4px 0px 0px rgba(0,0,0,1)', 'hard-sm': '2px 2px 0px 0px rgba(0,0,0,1)' },
    fontFamily: {
      display: ['var(--font-playfair)', 'serif'],
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-jetbrains)', 'monospace'],
    },
    transitionTimingFunction: { pop: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  },
}
```

```css
/* globals.css */
:root { color-scheme: light; }
body { background: #F9F9F7; color: #000; }

@view-transition { navigation: auto; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.25s; animation-timing-function: ease-in-out; }

@media (prefers-reduced-motion: reduce) {
  *, ::view-transition-old(root), ::view-transition-new(root) {
    animation: none !important; transition-duration: 0.01ms !important;
  }
}
```

### shadcn/ui

shadcn components ship with `rounded-md`, soft shadows, and a colored `ring`. After installing any of them, edit the generated file and swap:

- `rounded-*` → `rounded-none`
- `shadow-sm|md|lg` → `shadow-hard`
- `ring-2 ring-ring` → `outline outline-2 outline-black outline-offset-2`
- `border-input`, `bg-muted`, `bg-background` → `border-black`, `bg-paper`
- Any accent `transition-colors` → keep the accent as a background only: `bg-neon text-black`

---

## 4. Screen structure

### Mobile-first, for real

Always write base styles for mobile and add `md:`/`lg:` only to expand. Never the other way around: if a screen needs `max-md:` to behave, it was designed backwards.

- **Base (0–767px)**: single column, 380–420px content width, one data point per row, fixed bottom nav. This is the reference viewport — the booking client and the player live here.
- **`md:` (768px+, tablet / front desk)**: two columns where it earns its place (list + booking detail), the header stops being fixed and goes static, the bottom nav stays.
- **`lg:` (1024px+, admin and organizer panel)**: the bottom nav disappears (`lg:hidden`) and becomes a 240px left sidebar with a 1px black right border and the same mono labels. The views that never fit on mobile show up here: weekly field calendar, full standings table, financial reports. Center content with `max-w-6xl`.

Rules that don't change with the breakpoint: minimum 44×44px touch targets, system text never below 10px, wide tables scroll horizontally with a sticky first column instead of shrinking, `env(safe-area-inset-*)` respected, and `text-size-adjust: 100%` so iOS doesn't rescale the Playfair headlines.

On mobile, the `Row` replaces the table: no 8-column tables at 380px. Standings render on mobile as a row of `POS · EQUIPO · PTS` with an expandable detail; the full `PJ PG PE PP GF GC DIF PTS` matrix appears from `md:` up.

### Anatomy

Vertical stack, three zones:

**Fixed header.** Date in Playfair (`Lunes, 15 de julio`) → below it, a large Playfair title next to a percentage or counter on the right (`68%`, `12/18`) → a 6–8px progress bar spanning the full width, 1px black border, `bg-neon` fill, animated with `transition: width 0.6s cubic-bezier(0.175,0.885,0.32,1.275)`.

In FieldSync that progress always represents something real, depending on the role:
- Administrator / receptionist → field occupancy for the day.
- Organizer → matchdays played in the tournament.
- Player → matches played this season, or call-up confirmations.

**Scrollable content.** Grouped into semantic sections separated by 2rem. Each section opens with an icon (Lucide, `size=14`, `strokeWidth=2`) plus a 10px uppercase mono label with a **black background and white text**, padding `1px 6px`. Examples: `RESERVAS DE HOY`, `PRÓXIMOS PARTIDOS`, `PLANTILLA`, `PAGOS PENDIENTES`, `TABLA DE POSICIONES`.

**Persistent bottom navigation.** 80px tall, 1px black top border, paper background. Three actions: Home, a highlighted center action (`bg-neon`, black border, `shadow-hard`), and Stats. The active item is distinguished by opacity/weight, not by color alone. The center action changes with the role: *Reservar* (client), *Nueva reserva* (receptionist), *Registrar resultado* (organizer/admin).

Respect `env(safe-area-inset-bottom)` and leave `padding-bottom: 96px` on the content so the nav never covers the last row.

---

## 5. Components

### Row (the base of every list)

Container with a 1px black bottom border. Three-zone grid: **checkbox/state on the left (24×24px)**, **title + metadata in the center**, **tags on the right**.

```tsx
<li className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-black py-3">
  <button
    role="checkbox" aria-checked={done}
    className="size-6 border border-black bg-paper data-[on=true]:bg-neon
               transition-transform duration-150 ease-pop active:scale-110"
  >{done && <Check className="size-4 stroke-[3] text-black" />}</button>

  <div className="min-w-0">
    <p className="truncate text-sm font-semibold">Cancha 3 · Fútbol 7</p>
    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">19:00 – 20:00 · Sintética</p>
  </div>

  <span className="border border-black px-1.5 py-0.5 font-mono text-[10px] font-black uppercase">
    Confirmada
  </span>
</li>
```

FieldSync variants — same anatomy, different payload:

| Variant | Left | Center | Right |
|---|---|---|---|
| `ReservaRow` | State (green = confirmed) | Field + type / time | `CONFIRMADA` · `PENDIENTE` · `CANCELADA` |
| `FranjaRow` | Green square if free | Time slot / rate | `DISPONIBLE` · `OCUPADA` |
| `PartidoRow` | Crest or initial | Teams / date and field | Score in mono, or `POR JUGAR` |
| `JugadorRow` | Call-up checkbox | Name / position and number | `GOL 3` · `ASIST 1` |
| `PagoRow` | — | Concept / method | Amount in mono, right-aligned |

Disabled row (occupied slot): `opacity-60`, no shadow, `cursor-not-allowed`, plus an explicit mono label. Never rely on the grey alone.

### Card / container

`border border-black bg-paper p-4 shadow-hard`. Use it for the day summary, the tournament card, the player stats block. Don't nest hard shadows inside hard shadows: nested cards get a border only.

### Button

```tsx
// Primary
"border border-black bg-neon px-4 py-2 font-mono text-xs font-black uppercase tracking-wider shadow-hard
 transition-transform duration-150 ease-pop active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm"
// Secondary: bg-paper. Destructive: bg-black text-paper.
```

The press sinks the button into its own shadow — that physical feedback is what defines the system.

### Standings table

Header in 10px uppercase mono on black. Rows separated by 1px borders. Numeric columns (`PJ PG PE PP GF GC DIF PTS`) in mono, right-aligned, tabular-nums. Points in bold. Mark the qualification zone with a left bar, `border-l-4 border-neon` — not with a green background.

### Floating alert

Fixed at `bottom: 110px; right: 24px` (above the nav). `bg-neon` background, black text, 10px black uppercase mono, 1px black border, `shadow-hard`. Bounce-in animation (`ease-pop`, ~300ms), auto-dismiss after 4s, `role="status"` and `aria-live="polite"`.

This is the visual channel for FieldSync notifications: booking confirmed, slot released, call-up sent, result recorded, match reminder. For simultaneous-booking conflicts use the negative variant: `bg-black text-paper`, `role="alert"`, `aria-live="assertive"`.

### Empty and offline states

Empty: a large thin-stroke Lucide icon, a short Playfair headline (`Sin reservas hoy`), and one mono line naming the next action. No colorful illustrations.

Offline (PWA): a 24px band anchored under the header, `bg-black text-paper`, 10px mono: `MODO OFFLINE · DATOS DEL <hora>`. On reconnect, fire a floating alert reading `SINCRONIZADO`.

---

## 6. Motion

- Active-state pop: `scale(1.1)` with `ease-pop`, 150ms.
- Progress bar: `transition: width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)`.
- Route changes: View Transitions API, crossfade `0.25s ease-in-out`.
- No long fades, blur, parallax, or gradient skeletons. For loading: a black-bordered block with mono text `CARGANDO…`.
- Everything must degrade cleanly under `prefers-reduced-motion`.

---

## 7. Before calling a screen done

1. Background `#F9F9F7`, zero `rounded`, zero soft shadows?
2. Does every container and button carry a 1px black border?
3. Does green appear only as a fill with black text on top?
4. Does every state have a mono label in addition to color?
5. Do the three type families hold their roles (Playfair headline / Inter content / Mono system)?
6. Visible focus with a black outline and full keyboard navigation?
7. Touch targets ≥44×44px, and enough `padding-bottom` to clear the 80px nav?
8. Are the base styles the mobile ones, with `md:`/`lg:` only expanding? Did you test at 380px wide?
9. System copy in Spanish, with Costa Rican date and 24h time formats?
10. Does the screen hold up with empty data and in offline mode?
11. Does the center nav action match the authenticated role?

## Anti-patterns

Gradients · soft or colored shadows · rounded corners · green text · green as a large block background (it saturates and breaks contrast) · more than one accent · filled multicolor icons · dark mode · semantic color badges (red/yellow/green) instead of mono labels · animations longer than 600ms.
