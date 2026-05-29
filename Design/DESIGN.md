---
name: Кращий крипто Партнер
colors:
  surface: '#141410'
  surface-dim: '#141410'
  surface-bright: '#3a3934'
  surface-container-lowest: '#0e0e0a'
  surface-container-low: '#1c1c17'
  surface-container: '#20201b'
  surface-container-high: '#2b2a26'
  surface-container-highest: '#353530'
  on-surface: '#e5e2db'
  on-surface-variant: '#d1c5af'
  inverse-surface: '#e5e2db'
  inverse-on-surface: '#31302c'
  outline: '#99907b'
  outline-variant: '#4d4635'
  surface-tint: '#ecc246'
  primary: '#ecc246'
  on-primary: '#3d2e00'
  primary-container: '#c9a227'
  on-primary-container: '#4b3a00'
  inverse-primary: '#755b00'
  secondary: '#d8c591'
  on-secondary: '#3a2f09'
  secondary-container: '#52461d'
  on-secondary-container: '#c6b481'
  tertiary: '#c9c6c3'
  on-tertiary: '#31302e'
  tertiary-container: '#a9a6a3'
  on-tertiary-container: '#3d3c3a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe08e'
  primary-fixed-dim: '#ecc246'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#f5e1ab'
  secondary-fixed-dim: '#d8c591'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#52461d'
  tertiary-fixed: '#e6e2de'
  tertiary-fixed-dim: '#c9c6c3'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484644'
  background: '#141410'
  on-background: '#e5e2db'
  surface-variant: '#353530'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: 0.04em
  headline-lg:
    fontFamily: Syne
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  technical-data:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 128px
---

## Brand & Style
The design system is engineered for a high-end e-commerce experience catering to the hardware elite. The brand personality is authoritative, precise, and unapologetically premium, drawing inspiration from luxury automotive interfaces and high-fashion editorial layouts. 

The aesthetic is a fusion of **Modern Minimalism** and **Industrial Luxury**. It utilizes deep obsidian surfaces to allow metallic accents to shimmer, evoking the feeling of a clean-room facility or a private showroom. The emotional response is one of confidence and exclusivity—positioning ASIC mining hardware not just as equipment, but as a high-value asset. Visuals are defined by high contrast, razor-sharp execution, and an obsession with technical detail.

## Colors
This design system operates on a strictly "Dark Mode" foundation to emphasize the metallic quality of the hardware and the warmth of the gold accents. 

- **Primary (Antique Gold):** Used for critical calls to action, active states, and highlighting premium specifications.
- **Secondary (Champagne):** A softer metallic used for hover states and subtle interactive highlights.
- **Neutral/Text:** A warm-tinted off-white that prevents visual fatigue while maintaining high legibility against the dark background.
- **Surface & Borders:** Tonal variations of charcoal and deep bronze provide structure without breaking the immersive dark environment. Borders are kept thin (1px) to maintain a technical, blueprint-like feel.

## Typography
The typography strategy creates a sharp tension between the expressive, wide-set headlines and the precise, functional body text.

**Headlines:** Utilize *Syne* in bold weights. Always apply wide letter-spacing (2-4%) and uppercase transformation for primary headings to emulate high-end architectural branding.
**Body:** *Hanken Grotesk* provides a clean, contemporary sans-serif experience that ensures technical specifications and long-form descriptions remain legible.
**Labels:** Use small, bold, all-caps labels for metadata (e.g., Hashrate, Power Consumption) to reinforce the industrial aesthetic.

## Layout & Spacing
The layout follows a strict **Fixed Grid** philosophy on desktop to ensure an editorial composition, transitioning to a fluid model on smaller devices.

- **Grid:** 12-column grid with generous 24px gutters.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Whitespace:** Use significant vertical padding (`section-gap`) between product blocks to allow the "Кращий крипто Партнер" of each item to breathe.
- **Desktop:** 64px outer margins to frame content like a gallery piece.
- **Mobile:** Margins compress to 16px, with 1-column layouts for product cards to maintain image impact.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Subtle Outlines** rather than traditional shadows.

1.  **Base:** The `#111110` background is the absolute floor.
2.  **Surface:** Interactive cards and containers use `#1a1918`.
3.  **Borders:** Elements are defined by 1px solid borders (`#2e2d2b`). On hover, borders may transition to the primary Gold accent.
4.  **Accents:** Real depth is simulated through "Inner Glows" on primary buttons—a subtle 1px top highlight in `#e8d5a0` to give a metallic, machined edge feel.
5.  **Overlays:** Use 80% opacity on surfaces with a 12px backdrop blur for modal windows to maintain the dark, atmospheric quality.

## Shapes
The shape language is "Soft-Technical." Elements are predominantly rectangular to reflect the boxy, robust nature of ASIC hardware, but with micro-radii to ensure the UI feels modern and polished rather than aggressive.

- **Components:** Standard buttons and input fields use a **4px** corner radius.
- **Cards/Containers:** Large surface areas use an **8px** radius to provide a slight softenening of the industrial grid.
- **Media:** Product imagery should maintain sharp 4px corners to align with the hardware’s form factor.

## Components
- **Buttons:** Primary buttons are solid `#c9a227` with black text. Secondary buttons are "Ghost" style with 1px `#2e2d2b` borders that transition to gold on hover. All buttons use the `label-caps` typography style.
- **Input Fields:** Dark backgrounds (`#111110`) with a 1px border. The label sits above the field in `label-caps` muted text. Active states feature a 1px Primary Gold border.
- **Product Cards:** Minimalist. No drop shadows. Use a subtle `#1a1918` background and `#2e2d2b` border. Technical specs are displayed in a disciplined grid at the bottom of the card.
- **Chips/Badges:** Used for "In Stock" or "New" status. Use a technical, rectangular shape with 0px or 2px radius and monospaced-style technical-data typography.
- **Data Tables:** High-density, thin 1px horizontal dividers only. Row highlights use a very subtle `#1a1918` fill.
- **Progress Bars:** For stock levels or shipping—ultra-thin 2px lines using Primary Gold against a Dark Neutral track.