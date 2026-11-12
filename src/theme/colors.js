// Central colour palette for AetherGrid.
// Every screen imports colours from here, so the look stays consistent
// and we can change the whole theme by editing one file.

export const colors = {
  background: '#0B1220', // dark navy page background
  surface: '#131C2E', // cards, header and tab bar
  surfaceAlt: '#1A2540', // slightly lighter surface (buttons, chips)
  border: '#24314F',

  text: '#E6EDF7', // main text (high contrast on navy)
  textMuted: '#93A1BD', // secondary text

  primary: '#38BDF8', // cyan accent (active tab, links)
  accent: '#A78BFA', // violet accent

  // Status colours (always shown together with a text label, not colour alone)
  healthy: '#34D399',
  degraded: '#FBBF24',
  critical: '#F87171',
};
