/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#16352D',
    tint: '#23866D',

    // Core surfaces
    background: '#F6F8F5',
    foreground: '#16352D',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#16352D',

    // Primary action color (buttons, links, active states)
    primary: '#23866D',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E8F1EC',
    secondaryForeground: '#245344',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF2EF',
    mutedForeground: '#78877F',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F3E8D5',
    accentForeground: '#72562C',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#E3EAE5',
    input: '#DCE5DF',
    success: '#23866D',
    successSoft: '#E5F3EC',
    danger: '#C95F56',
    dangerSoft: '#FBECEA',
    gold: '#D59C42',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
