// AuraHealth Design System — Nature Distilled 2026
// PANTONE 11-4201 Cloud Dancer inspired
// 70% neutrals · 20% primary · 8% support · 2% accent

export const theme = {

  // ── Primary — EMR uses forest, Portal uses teal ──
  // In EMR: primary = forest green
  // In Portal: override primary = teal
  primary:       '#2F5D46',   // moss green (EMR)
  primaryHover:  '#264B39',   // hover
  primaryLight:  '#F1F5EE',   // mist
  primaryDark:   '#18382C',   // forest

  // ── Background & Surface ──
  background:    '#FAF7F2',   // cream — PANTONE Cloud Dancer
  surface:       '#FFFFFF',   // white cards
  surfaceWarm:   '#F7FAF5',   // green-tinted card
  border:        '#E8E1D6',   // parchment
  borderLight:   '#D6CEC1',   // sand
  white:         '#FFFFFF',

  // ── Text ──
  text:          '#18382C',   // forest headings
  textSub:       '#4A4A42',   // body text
  muted:         '#7C7A70',   // stone labels

  // ── Named Neutrals ──
  cream:         '#FAF7F2',
  parchment:     '#E8E1D6',
  sand:          '#D6CEC1',   // middle neutral
  stone:         '#7C7A70',
  bark:          '#34281F',   // dark sidebar

  // ── Earthy Accents ──
  clay:          '#C4A882',
  soil:          '#8B6F47',
  wood:          '#5C4A32',

  // ── Forest Greens ──
  forest:        '#18382C',
  moss:          '#2F5D46',
  sage:          '#6B8F71',
  leaf:          '#B7D39A',
  mist:          '#F1F5EE',

  // ── Teal (Portal) ──
  teal:          '#0F8DA8',
  tealLight:     '#E6F7FA',
  tealDark:      '#0C6F86',
  tealBadge:     '#D7F0F5',

  // ── Brand Accent — Muted Iris ──
  // Use sparingly: focus rings, selected chips, highlights
  accent:        '#9A8FBF',
  accentLight:   '#EDE9F5',

  // ── Status Colors ──
  success:       '#4F7D5C',
  successLight:  '#EAF2EC',
  warning:       '#C98A04',   // amber — caution
  warningLight:  '#FEF3C7',
  danger:        '#B8402A',   // earthy red — error
  dangerLight:   '#FDECEA',
  info:          '#0F8DA8',   // teal
  infoLight:     '#E6F7FA',

  // ── Shape ──
  radiusSm:   8,
  radiusMd:   12,
  radiusLg:   16,
  radiusXl:   20,
  radiusFull: 999,

  // ── Animation Durations (ms) ──
  animFast:   150,
  animNormal: 250,
  animSlow:   350,

  // ── Shadow ──
  shadow: {
    boxShadow: '0px 2px 12px rgba(47,93,70,0.08)',
  } as any,

  shadowCard: {
    boxShadow: '0px 1px 4px rgba(52,40,31,0.06)',
  } as any,
}

// Portal theme override — import this in portal app
export const portalTheme = {
  ...theme,
  primary:      '#0F8DA8',   // teal
  primaryHover: '#0C6F86',
  primaryLight: '#E6F7FA',
  primaryDark:  '#0C6F86',
  shadow: {
    boxShadow: '0px 2px 12px rgba(15,141,168,0.08)',
  } as any,
}