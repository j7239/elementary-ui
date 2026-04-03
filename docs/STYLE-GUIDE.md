<img src="../elementary-assets/elementary-logo.png" alt="Elementary-UI" style="height: 120px; margin-bottom: 24px; display: block;">

# Style Guide

Essential visual reference for component styles.

---

## Colors

### Brand

| Variable | Swatch | Value | Usage |
|---|---|---|---|
| `--elm-action-primary` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#635bff;vertical-align:middle;"></span> | `#635bff` | Buttons, links, focus states |
| `--elm-action-secondary` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#ff3e76;vertical-align:middle;"></span> | `#ff3e76` | Secondary buttons, accents |
| `--elm-purple-900` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#100d2e;vertical-align:middle;"></span> | `#100d2e` | Headings, dark surfaces |

### Status

| Variable | Swatch | Value | Usage |
|---|---|---|---|
| `--elm-action-success` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#10b981;vertical-align:middle;"></span> | `#10b981` | Success states |
| `--elm-action-danger` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#ff3e76;vertical-align:middle;"></span> | `#ff3e76` | Errors, destructive actions |
| `--elm-action-warning` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#f59e0b;vertical-align:middle;"></span> | `#f59e0b` | Warnings |
| `--elm-action-info` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#635bff;vertical-align:middle;"></span> | `#635bff` | Informational |

### Highlights

#### Dark (text color)

| Variable | Swatch | Value | Usage |
|---|---|---|---|
| `--elm-purple-600` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#4540d0;vertical-align:middle;"></span> | `#4540d0` | Category 1, badges |
| `--elm-pink-700` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#b2002c;vertical-align:middle;"></span> | `#b2002c` | Category 2, badges |
| `--elm-emerald-700` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#0a9468;vertical-align:middle;"></span> | `#0a9468` | Category 3, badges |
| `--elm-amber-600` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#d48809;vertical-align:middle;"></span> | `#d48809` | Category 4, badges |
| `--elm-indigo-700` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#3d38c0;vertical-align:middle;"></span> | `#3d38c0` | Category 5, badges |

#### Light (background color)

| Variable | Swatch | Value | Usage |
|---|---|---|---|
| `--elm-purple-100` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#ece9ff;vertical-align:middle;border:1px solid #ddd;"></span> | `#ece9ff` | Category 1, light backgrounds |
| `--elm-pink-100` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#ffe0ea;vertical-align:middle;border:1px solid #ddd;"></span> | `#ffe0ea` | Category 2, light backgrounds |
| `--elm-emerald-50` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#dbf5ec;vertical-align:middle;border:1px solid #ddd;"></span> | `#dbf5ec` | Category 3, light backgrounds |
| `--elm-amber-50` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#fef0da;vertical-align:middle;border:1px solid #ddd;"></span> | `#fef0da` | Category 4, light backgrounds |
| `--elm-indigo-50` | <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#e4e3fa;vertical-align:middle;border:1px solid #ddd;"></span> | `#e4e3fa` | Category 5, light backgrounds |

---

## Typography

**Font family:** Inter

```css
--bs-body-font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

Base size is `1rem` (16px). Headings are `700` weight and use `--elm-text-default` for color.

| Variable | Preview | Size |
|---|---|---|
| `--elm-text-2xl` | <span style="font-size:2rem;font-weight:700;">Heading 1</span> | 32px |
| `--elm-text-xl` | <span style="font-size:1.5rem;font-weight:700;">Heading 2</span> | 24px |
| `--elm-text-lg` | <span style="font-size:1.25rem;font-weight:700;">Heading 3</span> | 20px |
| `--elm-text-md` | <span style="font-size:1.125rem;font-weight:700;">Heading 4</span> | 18px |
| `--elm-text-base` | <span style="font-size:1rem;font-weight:700;">Heading 5</span> | 16px |
| `--elm-text-sm` | <span style="font-size:0.82rem;font-weight:700;">Heading 6</span> | 13px |
| `--elm-text-base` | <span style="font-size:1rem;font-weight:400;">Body text</span> | 16px |

---

## Spacing

- **Buttons and inline elements** - use `--elm-space-2`. E.g. `gap: var(--elm-space-2)` when placing multiple buttons side by side in a toolbar or action row.
- **Cards and stacked components** - use `--elm-space-4`. E.g. `gap: var(--elm-space-4)` in a card grid or `padding: var(--elm-space-6)` for content area padding.

| Key | Bar | Value | Usage |
|---|---|---|---|
| `--elm-space-1` | <div style="width:4px;height:16px;background:#cbd5e1;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `0.25rem` (4px) | Icon nudges |
| `--elm-space-2` | <div style="width:8px;height:16px;background:#635bff;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `0.5rem` (8px) | Buttons, inline elements |
| `--elm-space-3` | <div style="width:12px;height:16px;background:#cbd5e1;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `0.75rem` (12px) | Icon-label gaps, tight spacing |
| `--elm-space-4` | <div style="width:16px;height:16px;background:#635bff;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `1rem` (16px) | Cards, stacked components, content padding |
| `--elm-space-6` | <div style="width:24px;height:16px;background:#cbd5e1;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `1.5rem` (24px) | Section padding |
| `--elm-space-12` | <div style="width:48px;height:16px;background:#cbd5e1;border-radius:2px;display:inline-block;vertical-align:middle;"></div> | `3rem` (48px) | Section separation |
| `--elm-space-16+` | | `4rem+` (64px+) | Hero / display whitespace |

---

## Shadows

| Variable | Preview | Usage |
|---|---|---|
| `--elm-shadow-sm` | <div style="width:60px;height:32px;border-radius:6px;background:#fff;box-shadow:0 2px 4px -1px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);border:1px solid #f0f0f0;display:inline-block;vertical-align:middle;"></div> | Subtle lift - cards, inputs |
| `--elm-shadow-md` | <div style="width:60px;height:32px;border-radius:6px;background:#fff;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -1px rgba(0,0,0,0.04);border:1px solid #f0f0f0;display:inline-block;vertical-align:middle;"></div> | Default elevation |
| `--elm-shadow-lg` | <div style="width:60px;height:32px;border-radius:6px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.08),0 4px 6px -2px rgba(0,0,0,0.04);border:1px solid #f0f0f0;display:inline-block;vertical-align:middle;"></div> | Modals, flyouts |
| `--elm-shadow-brand-sm` | <div style="width:60px;height:32px;border-radius:6px;background:#635bff;box-shadow:0 4px 12px rgba(99,91,255,0.25);display:inline-block;vertical-align:middle;"></div> | Primary button glow |
