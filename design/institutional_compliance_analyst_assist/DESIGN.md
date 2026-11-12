---
name: Institutional Compliance Analyst Assist
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#476080'
  primary: '#00162d'
  on-primary: '#ffffff'
  primary-container: '#0f2b48'
  on-primary-container: '#7a93b5'
  inverse-primary: '#afc8ed'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#261000'
  on-tertiary: '#ffffff'
  tertiary-container: '#442100'
  on-tertiary-container: '#da7808'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#afc8ed'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#2f4867'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  metric-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets institutional corporate banking compliance officers, AML investigators, and risk analysts reviewing complex corporate entity structures, sanctions checks, and verified documentation.

The aesthetic blends **Corporate Precision** with **Data-Dense Utility**:
- **Tone:** Authoritative, unshakeable, auditable, and vigilant.
- **Visual Stance:** Crisp, low-elevation surfaces anchored by deep corporate navy framing, purposeful status color-coding, and rigorous information hierarchy.
- **Cognitive Ergonomics:** High data density without visual clutter. Visual cues directly signal confidence thresholds, audit changes, and verification sources to support zero-error compliance decisions.

## Colors

The palette establishes an immediate institutional hierarchy, relying on deep navy for structural weight and vivid functional colors strictly for verification confidence and audit tracking:

- **Brand & Structural Surfaces:**
  - Primary Navy (`#0f2b48`): Used for primary navigation headers, major titles, brand identifiers, and primary structural accents.
  - Interactive Cobalt (`#2563eb`): Used for focus rings, primary action triggers, interactive citation pills, and navigational highlights.
  - Page Canvas (`#f8fafc`): Crisp slate surface delivering high contrast against card panels.
  - Card & Panel Surface (`#ffffff`): Pure white interior containers with crisp borders (`#e2e8f0`).
  - Document & Code Viewer (`#0f172a` / `#1e293b`): Dark-mode inspection container simulating terminal/PDF extraction views, paired with amber source highlights (`#fef3c7` bg / `#f59e0b` border / `#ca8a04` text).

- **Compliance Status & Confidence Roles:**
  - High Confidence & Accepted (`#16a34a`): Signals confidence score >=90%, auto-match pass, or confirmed identity records.
  - Medium Confidence & Override (`#d97706`): Signals confidence score 70–89%, manual field overrides, or pending analyst confirmations.
  - Low Confidence & Discrepancy (`#dc2626`): Signals confidence score <70%, flagged AML hits, missing documentation, or rejected values.
  - Neutral Slate Accents (`#334155`, `#64748b`, `#94a3b8`): For field labels, metadata timestamps, table borders, and inactive elements.

## Typography

Typography prioritizes auditability, clarity at small sizes, and rapid scannability under intense regulatory review:

- **Primary Interface Stack:** Built around Inter with fallback to Segoe UI, -apple-system, and system-ui. Headings use strong navy weights (`#0f2b48`) to anchor analytical zones.
- **Tabular Figures (`tnum`):** All percentage scores, amounts, LEI codes, dates, and comparison tables must enforce monospace tabular numerals to prevent layout jiggle and ensure effortless column comparison.
- **Monospace Document Layer:** `JetBrains Mono` (or Consolas/Menlo) is strictly applied to raw extraction text, OCR bounding coordinates, audit trail checksums, and citation references (`Page X, Line Y`).
- **Scale Restraint:** The system tops out at 24px for top-level dossier titles. Analytical interfaces stay within 12px–14px to maximize screen real estate for multi-column comparison workflows.

## Layout & Spacing

The application enforces a high-density, split-panel workstation layout:

- **Desktop Shell:** Fixed 100vh viewport utilizing an asymmetric multi-pane architecture:
  - Left pane (25%–30% width): Corporate hierarchy tree, dossier checklist, and guardrail risk summaries.
  - Center pane (40%–45% width): Verified field forms, confidence matching tables, and override inputs.
  - Right pane (30%–35% width): Extracted source document viewer (`#0f172a` canvas) with synchronous page/line scroll anchors.
- **Rhythm & Padding:** Spacing operates strictly on a dense 4px/8px modular scale (`0.25rem` to `1.5rem`). Dense layouts favor `space-sm` (8px) for field clusters and `space-md` (12px) for card body padding to prevent vertical blowout.
- **Reflow Behavior:** On smaller laptop screens (under 1280px), the document viewer collapses into an expandable drawer or bottom split view, keeping the field checklist visible at all times.

## Elevation & Depth

To maintain institutional trust and eliminate visual distraction, this design system avoids heavy drop shadows and decorative blurs:

- **Surface Tiers & Ghost Borders:** Depth is generated primarily through crisp, 1px structural borders (`#e2e8f0` on light surfaces; `#334155` on dark document surfaces) against tinted canvas backgrounds (`#f8fafc`).
- **Low-Elevation Ambient Shadows:**
  - Resting Card: Pure flat white `#ffffff` with a 1px solid border `#e2e8f0`. No shadow.
  - Hover / Interactive Row: Subtle tint shift to `#f1f5f9` with a hairline border tint to `#cbd5e1`.
  - Floating Overlays & Audit Modals: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)` combined with a 1px `#cbd5e1` outline.
- **Document Focus Illumination:** Source document viewer uses high-contrast amber translucent highlighting (`rgba(254, 240, 138, 0.15)` fill with `rgba(245, 158, 11, 0.8)` dashed bounding boxes) to direct attention to specific verification evidence.

## Shapes

The design system standardizes on precise, controlled geometries:

- **Base Radius (10px / `rounded-xl`):** Applied uniformly to main review cards, document inspection containers, and modal dialogs to soften the institutional tool without feeling playful.
- **Compact Radius (6px to 8px):** Applied to input fields, table rows, and nested sub-panels.
- **Pill Radius (9999px):** Reserved exclusively for confidence tags, citation anchors, and status badges to clearly distinguish non-editable metadata from interactive rectangular form elements.

## Components

### Confidence Badges
- **High Confidence (>=90%):** Pill container with `#dcfce7` background, `#166534` text, and `#86efac` border. Prefix icon: checkmark. Displays exact percentage in tabular mono (e.g., `98.4% HIGH`).
- **Medium Confidence (70–89%):** Pill container with `#fef3c7` background, `#92400e` text, and `#fde68a` border. Prefix icon: alert triangle (e.g., `78.2% REVIEW`).
- **Low Confidence (<70%):** Pill container with `#fee2e2` background, `#991b1b` text, and `#fca5a5` border. Text explicitly reads: `54.1% LOW: CHECK SOURCE`.

### Field Status Chips
- **Pending:** Slate grey background (`#f1f5f9`), slate text (`#475569`), border `#cbd5e1`.
- **Accepted:** Muted green tint (`#ecfdf5`), text `#047857`, border `#a7f3d0`.
- **Edited / Override:** Amber warning tint (`#fffbeb`), text `#b45309`, border `#fcd34d`. Displays label: `Analyst Override`.
- **Rejected:** Rose tint (`#fff1f2`), text `#be123c`, border `#fecdd3`. Field value is rendered with strikethrough and audit flag.

### Citation Interactive Chips
- Monospace label formatted as `[p.14:L9]`.
- Default: `#eff6ff` background, `#1d4ed8` text, `#bfdbfe` hairline border.
- Hover / Active: `#1d4ed8` background, `#ffffff` text. Clicking scrolls and cross-highlights the exact bounding box in the right-hand document canvas.

### Input Fields & Analyst Override Controls
- Default: `#ffffff` surface, 1px `#cbd5e1` border, 6px border radius, 14px typography.
- Focus: 1px `#2563eb` border with a 2px `#bfdbfe` outer ring.
- Overridden State: Left border becomes 3px solid `#d97706` with an inline "Show Original Machine Value" diff drawer.

### Compliance-Grade Data Tables
- Header: `#f8fafc` background, `#475569` uppercase 11px bold text, bottom border 1px solid `#e2e8f0`.
- Rows: 36px–40px dense height, alternating subtle rows (`#ffffff` / `#fbfcfd`), 1px `#f1f5f9` horizontal dividers.
- Numeric / Score columns aligned right using tabular figures.

### Guardrail & Sanctions Indicators
- Persistent top-level summary strip displaying active blocklists checked (OFAC, PEP, Adverse Media). Passed checks appear in solid emerald dots; potential hits pulse with a `#dc2626` warning badge and required sign-off checkbox.