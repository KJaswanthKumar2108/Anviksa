export type ThemePalette = 'botanical' | 'oxford' | 'sage' | 'tech';
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  palette: ThemePalette;
  mode: ThemeMode;
}

export interface PaletteMetadata {
  id: ThemePalette;
  name: string;
  field: string;
  description: string;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
    primary: string;
    text: string;
  };
}

export const RESEARCH_PALETTES: PaletteMetadata[] = [
  {
    id: 'botanical',
    name: 'Warm Botanical',
    field: 'Natural & Earth Sciences',
    description: 'Earthy, low eye-strain tones matching scholarly herbal & botanical manuscripts.',
    previewColors: {
      bg: '#FEFAE0',
      surface: '#FAEDCD',
      accent: '#CCD5AE',
      primary: '#D4A373',
      text: '#342F27'
    }
  },
  {
    id: 'oxford',
    name: 'Oxford Academic',
    field: 'Mathematics, Physics & Formal Inquiry',
    description: 'Authoritative collegiate deep navy and slate parchment with crisp editorial contrast.',
    previewColors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      accent: '#E0E7FF',
      primary: '#2563EB',
      text: '#0F172A'
    }
  },
  {
    id: 'sage',
    name: 'Nature Sage',
    field: 'Genomics, Molecular & Bio-Medicine',
    description: 'Restorative pale dew and deep forest pine inspired by high-containment bioscience labs.',
    previewColors: {
      bg: '#F3F7F2',
      surface: '#FFFFFF',
      accent: '#CEE0CC',
      primary: '#2D6A4F',
      text: '#14281B'
    }
  },
  {
    id: 'tech',
    name: 'Deep Tech',
    field: 'Quantum Computing, AI & Clean Energy',
    description: 'Hyper-focused crystalline silicon, clean teal, and alloy slate for deep computing.',
    previewColors: {
      bg: '#F4F6F9',
      surface: '#FFFFFF',
      accent: '#CCFBF1',
      primary: '#0F766E',
      text: '#0F172A'
    }
  }
];

const STORAGE_PALETTE_KEY = 'openresearch_theme_palette_v2';
const STORAGE_MODE_KEY = 'openresearch_theme_mode_v2';

export function getInitialTheme(): ThemeConfig {
  if (typeof window === 'undefined') {
    return { palette: 'botanical', mode: 'light' };
  }
  try {
    const savedPalette = (localStorage.getItem(STORAGE_PALETTE_KEY) as ThemePalette) || 'botanical';
    const savedMode = (localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode) || 'light';
    return {
      palette: ['botanical', 'oxford', 'sage', 'tech'].includes(savedPalette) ? savedPalette : 'botanical',
      mode: ['light', 'dark'].includes(savedMode) ? savedMode : 'light'
    };
  } catch {
    return { palette: 'botanical', mode: 'light' };
  }
}

export function applyTheme(palette: ThemePalette, mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-palette', palette);
  root.setAttribute('data-theme', mode);
  try {
    localStorage.setItem(STORAGE_PALETTE_KEY, palette);
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  } catch {}
}
