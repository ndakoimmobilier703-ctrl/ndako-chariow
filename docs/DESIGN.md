# Theme Name: Neumorphic
# Vibe & Description: Interface elements feature a visually pressable, physical form, with extremely diffused shadows and highlights to create a soft, pillowy, tactile experience.

# Color
Follows neumorphic component conventions. Sample code reference below.

/* Core neumorphic base classes: flat (raised) / pressed (indented), foundation for all neumorphic components */
.neu-flat {
  background: var(--neu-base);
  box-shadow: var(--shadow-neu-flat);
  border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.2);
}
.neu-pressed {
  background: var(--neu-base);
  box-shadow: var(--shadow-neu-pressed);
  border-radius: var(--radius);
  border: 1px solid transparent;
}

/* Common neumorphic components: prefixed with neu-, used with Tailwind utilities for interaction / layout */
/* 1. Circular icon button */
.neu-icon-btn {
  @apply flex items-center justify-center w-12 h-12 rounded-full text-foreground transition-all duration-300 hover:text-primary;
  background: var(--neu-base);
  box-shadow: var(--shadow-neu-flat);
  border: 1px solid rgba(255,255,255,0.2);
}
.neu-icon-btn:active {
  box-shadow: var(--shadow-neu-pressed);
  border-color: transparent;
  transform: translateY(0);
}

/* 2. Standard neumorphic button */
.neu-btn {
  @apply px-6 py-3 rounded-lg font-semibold text-foreground transition-all duration-300 hover:text-primary hover:-translate-y-1;
  background: var(--neu-base);
  box-shadow: var(--shadow-neu-flat);
  border: 1px solid rgba(255,255,255,0.2);
}
.neu-btn:active {
  box-shadow: var(--shadow-neu-pressed);
  border-color: transparent;
  transform: translateY(0);
}

/* 3. Primary neumorphic button (with accent background) */
.neu-btn-primary {
  @apply px-6 py-3 rounded-lg font-semibold bg-primary text-primary-foreground transition-all duration-300 hover:brightness-110 hover:-translate-y-1 active:scale-95;
  box-shadow: 5px 5px 10px rgba(0,0,0,0.1), -5px -5px 10px rgba(255,255,255,0.1);
}

/* 4. Neumorphic input (indented style, ring on focus) */
.neu-input {
  @apply w-full px-4 py-3 rounded-lg bg-transparent outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all;
  box-shadow: var(--shadow-neu-pressed);
  border: 1px solid transparent;
}

/* 5. Neumorphic card (raised style, lifts on hover for enhanced depth) */
.neu-card {
  @apply p-6 rounded-xl transition-all duration-300 hover:-translate-y-2;
  background: var(--neu-base);
  box-shadow: var(--shadow-neu-flat);
  border: 1px solid rgba(255,255,255,0.2);
}
etc.

# Font
- Heading & Body: Glow Sans SC (url: https://resource-static.cdn.bcebos.com/fonts/GlowSansSC-Normal-Regular.woff2)
# Animation
- Smooth transitions: slowed easing (e.g., 300ms ease-out) to replicate the damping feel of physical button presses.

# Layout
- Page composed of floating ""cards"" with generous spacing between them.

# Elements
- Precise light and shadow simulation (top-left highlight, bottom-right shadow) makes interface elements feel physically touchable.
- All sharp edges removed; large border radii and soft transitions used throughout.
- Some non-text components feature subtle glow effects on fills or edges.