---
name: Industrial Excellence Light
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4d4635'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7f7663'
  outline-variant: '#d1c5af'
  surface-tint: '#755b00'
  primary: '#755b00'
  on-primary: '#ffffff'
  primary-container: '#c9a227'
  on-primary-container: '#4b3a00'
  inverse-primary: '#ecc246'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d5e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#a6a7a8'
  on-tertiary-container: '#3b3d3e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe08e'
  primary-fixed-dim: '#ecc246'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e3'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system embodies a synthesis of industrial precision and luxury craftsmanship. It is designed for high-end manufacturing interfaces, architectural platforms, and premium engineering tools. The brand personality is authoritative yet ethereal, balancing the weight of industrial machinery with the lightness of modern "liquid glass" interfaces.

The visual style is **Industrial Glassmorphism**. It utilizes a sophisticated light-mode palette to evoke a sense of clinical cleanliness and technological superiority. By combining the avant-garde geometry of Syne with frosted, translucent surfaces, the UI creates a high-tech "white room" environment. The emotional response should be one of absolute clarity, premium quality, and forward-thinking innovation.

## Colors

The palette is anchored by **Antique Gold**, used strategically for primary actions and critical status indicators to signify value and precision. 

- **Primary (Antique Gold):** Used for highlights, active states, and call-to-action elements.
- **Secondary (Dark Charcoal):** High-contrast text and structural lines to ensure legibility and "industrial" weight.
- **Surface (White/Off-White):** The base layers consist of pure white and subtly cool off-whites to maintain a pristine, airy feel.
- **Glass Tint:** Translucent layers use a white tint with 40-70% opacity, allowing background elements to bleed through with a soft blur.

## Typography

The typography strategy emphasizes contrast between expressive geometry and technical utility.

- **Headlines (Syne):** Used to project a bold, artistic, and modern industrial presence. Character tracking is slightly tightened in larger sizes to create a "locked-in" feel.
- **Body (Hanken Grotesk):** Provides a contemporary, sharp, and highly legible experience for long-form content and data.
- **Technical Labels (JetBrains Mono):** Monospaced fonts are utilized for metadata, status labels, and code-like identifiers to reinforce the high-tech, engineered nature of the system.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid Grid**. Content is housed within a 12-column grid that centers on large displays while scaling fluidly on smaller screens.

- **Industrial Rhythm:** Spacing is strictly derivative of an 8px base unit. 
- **Borders as Structure:** Use hairline (1px) borders in Deep Gold or Charcoal (10% opacity) to define zones without breaking the glass-like flow.
- **Margins:** Generous outer margins are required to maintain the "Premium" feel, ensuring that elements have room to breathe, mimicking a gallery or a high-end showroom.

## Elevation & Depth

Depth is achieved through **Liquid Glass** layering rather than traditional shadow-based elevation.

- **Backdrop Blur:** Surface containers use a `backdrop-filter: blur(20px)` and a semi-transparent white background.
- **Light Borders:** Every glass element features a 1px solid border at the top and left to simulate a light-catching edge, using a slightly more opaque white or a faint gold tint.
- **Shadows:** Use "Ambient Diffusion"—very large, very light (2-4% opacity) shadows with a slight gold tint to ground elements without creating "dirt" on the light interface.
- **Z-Axis Hierarchy:** Higher elevation layers increase in blur intensity and border opacity.

## Shapes

The shape language follows a **"Round Four"** logic, which translates to a full pill-shaped or heavily rounded aesthetic. This choice softens the "Industrial" hardness, making the high-tech interface feel organic and accessible. 

Buttons, input fields, and tags should utilize maximum rounding (pill-shaped) where possible. Large surface containers should use the `rounded-xl` (3rem) radius to maintain consistency with the fluid, "liquid" metaphor of the glass.

## Components

- **Buttons:** Primary buttons are Antique Gold with high-contrast Charcoal text. They feature a slight "inner glow" on the top edge. Secondary buttons use the frosted glass effect with a gold border.
- **Input Fields:** Semi-transparent white backgrounds with a subtle inner shadow. On focus, the border transitions to a solid 1.5px Antique Gold.
- **Cards:** Defined by high-intensity backdrop blurs and thin, light-catching borders. No harsh shadows. Titles within cards use the Syne font.
- **Chips/Tags:** Always pill-shaped. Use JetBrains Mono for the text. Backgrounds are either Charcoal with white text for high emphasis or light glass with gold text for low emphasis.
- **Progress Indicators:** Use thin, hairline tracks with a solid Antique Gold fill. The "liquid" effect can be enhanced with a subtle shimmer animation on active states.
- **Lists:** Separated by 1px dividers at 5% opacity. Hover states should trigger a light-gold glass tint change.