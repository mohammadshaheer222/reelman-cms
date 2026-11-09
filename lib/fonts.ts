export interface FontOption {
  family: string;
  label: string;
  category: 'Serif' | 'Script' | 'Sans-Serif';
}

export const ALL_FONTS: FontOption[] = [
  // Serifs
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'Serif' },
  { family: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
  { family: 'Bodoni Moda', label: 'Bodoni Moda', category: 'Serif' },
  { family: 'Cinzel', label: 'Cinzel', category: 'Serif' },
  { family: 'Prata', label: 'Prata', category: 'Serif' },
  { family: 'Marcellus', label: 'Marcellus', category: 'Serif' },

  // Scripts
  { family: 'Alex Brush', label: 'Alex Brush (Script)', category: 'Script' },
  { family: 'Great Vibes', label: 'Great Vibes (Script)', category: 'Script' },
  { family: 'Allura', label: 'Allura (Script)', category: 'Script' },
  { family: 'Dancing Script', label: 'Dancing Script', category: 'Script' },
  { family: 'Pinyon Script', label: 'Pinyon Script', category: 'Script' },

  // Sans
  { family: 'Montserrat', label: 'Montserrat', category: 'Sans-Serif' },
  { family: 'Inter', label: 'Inter', category: 'Sans-Serif' },
  { family: 'Lato', label: 'Lato', category: 'Sans-Serif' },
  { family: 'Raleway', label: 'Raleway', category: 'Sans-Serif' },
];

export const FONT_WEIGHTS = [
  { value: '300', label: 'Light 300' },
  { value: '400', label: 'Regular 400' },
  { value: '500', label: 'Medium 500' },
  { value: '600', label: 'SemiBold 600' },
  { value: '700', label: 'Bold 700' },
  { value: '800', label: 'ExtraBold 800' },
];

export const FONT_SIZES = [
  10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72
];

export const LUXURY_COLORS = [
  { label: 'Dark Charcoal', value: '#1F1C1B' },
  { label: 'Deep Neutral', value: '#2B2725' },
  { label: 'Muted Brown', value: '#4A4441' },
  { label: 'Warm Sand', value: '#8C827C' },
  { label: 'Pure White', value: '#FFFFFF' },
  { label: 'Champagne Gold', value: '#C5A880' },
  { label: 'Golden Bronze', value: '#9A7B4F' },
  { label: 'Classic Black', value: '#000000' },
];
