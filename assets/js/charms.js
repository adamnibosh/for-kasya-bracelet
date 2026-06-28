/** Italian charm link catalog — Nomination-style 9mm modular links */
const CHARM_CATEGORIES = [
  { id: 'love', label: 'Hearts & Love', icon: '♥' },
  { id: 'letters', label: 'Letters', icon: 'A' },
  { id: 'symbols', label: 'Symbols', icon: '✦' },
  { id: 'nature', label: 'Nature', icon: '🌸' },
  { id: 'birthstone', label: 'Birthstones', icon: '💎' },
  { id: 'colors', label: 'Enamel Colors', icon: '◼' },
];

const CHARMS = [
  // Love
  { id: 'heart-red', name: 'Red Heart', category: 'love', glyph: '♥', bg: '#8b1538', fg: '#ffd4dc' },
  { id: 'heart-pink', name: 'Pink Heart', category: 'love', glyph: '♥', bg: '#e8a0b4', fg: '#fff5f8' },
  { id: 'heart-gold', name: 'Gold Heart', category: 'love', glyph: '♥', bg: '#c9a227', fg: '#fff8e7' },
  { id: 'infinity', name: 'Infinity', category: 'love', glyph: '∞', bg: '#4a3728', fg: '#f5e6d3' },
  { id: 'kiss', name: 'Kiss', category: 'love', glyph: '💋', bg: '#c41e3a', fg: '#fff' },
  { id: 'couple', name: 'Together', category: 'love', glyph: '♡', bg: '#6b2d5c', fg: '#fce4ec' },
  { id: 'ring', name: 'Ring', category: 'love', glyph: '💍', bg: '#2c2c34', fg: '#e8d5b7' },
  { id: 'rose', name: 'Rose', category: 'love', glyph: '🌹', bg: '#5c1a2e', fg: '#fff' },

  // Letters A–Z
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
    id: `letter-${letter.toLowerCase()}`,
    name: `Letter ${letter}`,
    category: 'letters',
    glyph: letter,
    bg: '#d4af37',
    fg: '#1a1208',
  })),

  // Symbols
  { id: 'star', name: 'Star', category: 'symbols', glyph: '★', bg: '#1e3a5f', fg: '#ffd700' },
  { id: 'moon', name: 'Moon', category: 'symbols', glyph: '☽', bg: '#2d3561', fg: '#e8e0ff' },
  { id: 'sun', name: 'Sun', category: 'symbols', glyph: '☀', bg: '#c45c26', fg: '#fff8dc' },
  { id: 'cross', name: 'Cross', category: 'symbols', glyph: '✝', bg: '#d4af37', fg: '#fff' },
  { id: 'angel', name: 'Angel', category: 'symbols', glyph: '👼', bg: '#e8e0f0', fg: '#4a4063' },
  { id: 'music', name: 'Music', category: 'symbols', glyph: '♪', bg: '#1a1a2e', fg: '#a8d8ea' },
  { id: 'camera', name: 'Memories', category: 'symbols', glyph: '📷', bg: '#3d3d3d', fg: '#fff' },
  { id: 'paw', name: 'Paw Print', category: 'symbols', glyph: '🐾', bg: '#5d4037', fg: '#ffccbc' },
  { id: 'lucky-7', name: 'Lucky 7', category: 'symbols', glyph: '7', bg: '#0d5c2e', fg: '#ffd700' },
  { id: 'italy', name: 'Italy', category: 'symbols', glyph: '🇮🇹', bg: '#fff', fg: '#000' },
  { id: 'horn', name: 'Cornicello', category: 'symbols', glyph: '🤞', bg: '#c41e3a', fg: '#ffd700' },

  // Nature
  { id: 'butterfly', name: 'Butterfly', category: 'nature', glyph: '🦋', bg: '#7b5ea7', fg: '#fff' },
  { id: 'flower', name: 'Flower', category: 'nature', glyph: '🌸', bg: '#f8bbd0', fg: '#880e4f' },
  { id: 'leaf', name: 'Leaf', category: 'nature', glyph: '🍃', bg: '#2e7d32', fg: '#c8e6c9' },
  { id: 'tree', name: 'Tree', category: 'nature', glyph: '🌳', bg: '#33691e', fg: '#fff' },
  { id: 'ocean', name: 'Ocean', category: 'nature', glyph: '🌊', bg: '#0277bd', fg: '#e1f5fe' },
  { id: 'snowflake', name: 'Snowflake', category: 'nature', glyph: '❄', bg: '#b3e5fc', fg: '#01579b' },

  // Birthstones (month abbreviations)
  { id: 'jan-garnet', name: 'January · Garnet', category: 'birthstone', glyph: 'JAN', bg: '#7b1f1f', fg: '#ffcdd2', small: true },
  { id: 'feb-amethyst', name: 'February · Amethyst', category: 'birthstone', glyph: 'FEB', bg: '#6a1b9a', fg: '#e1bee7', small: true },
  { id: 'mar-aquamarine', name: 'March · Aquamarine', category: 'birthstone', glyph: 'MAR', bg: '#00838f', fg: '#e0f7fa', small: true },
  { id: 'apr-diamond', name: 'April · Diamond', category: 'birthstone', glyph: 'APR', bg: '#eceff1', fg: '#455a64', small: true },
  { id: 'may-emerald', name: 'May · Emerald', category: 'birthstone', glyph: 'MAY', bg: '#1b5e20', fg: '#c8e6c9', small: true },
  { id: 'jun-pearl', name: 'June · Pearl', category: 'birthstone', glyph: 'JUN', bg: '#f5f5f5', fg: '#616161', small: true },
  { id: 'jul-ruby', name: 'July · Ruby', category: 'birthstone', glyph: 'JUL', bg: '#b71c1c', fg: '#ffcdd2', small: true },
  { id: 'aug-peridot', name: 'August · Peridot', category: 'birthstone', glyph: 'AUG', bg: '#558b2f', fg: '#f1f8e9', small: true },
  { id: 'sep-sapphire', name: 'September · Sapphire', category: 'birthstone', glyph: 'SEP', bg: '#0d47a1', fg: '#bbdefb', small: true },
  { id: 'oct-opal', name: 'October · Opal', category: 'birthstone', glyph: 'OCT', bg: '#e1bee7', fg: '#4a148c', small: true },
  { id: 'nov-topaz', name: 'November · Topaz', category: 'birthstone', glyph: 'NOV', bg: '#e65100', fg: '#fff3e0', small: true },
  { id: 'dec-turquoise', name: 'December · Turquoise', category: 'birthstone', glyph: 'DEC', bg: '#00695c', fg: '#b2dfdb', small: true },

  // Enamel colors (blank links)
  { id: 'enamel-white', name: 'White Enamel', category: 'colors', glyph: '', bg: '#fafafa', fg: '#ccc', blank: true },
  { id: 'enamel-black', name: 'Black Enamel', category: 'colors', glyph: '', bg: '#1a1a1a', fg: '#333', blank: true },
  { id: 'enamel-navy', name: 'Navy Enamel', category: 'colors', glyph: '', bg: '#1a237e', fg: '#3949ab', blank: true },
  { id: 'enamel-rose', name: 'Rose Enamel', category: 'colors', glyph: '', bg: '#f48fb1', fg: '#ec407a', blank: true },
  { id: 'enamel-mint', name: 'Mint Enamel', category: 'colors', glyph: '', bg: '#a5d6a7', fg: '#66bb6a', blank: true },
  { id: 'enamel-lavender', name: 'Lavender Enamel', category: 'colors', glyph: '', bg: '#ce93d8', fg: '#ab47bc', blank: true },
];

const CHARM_MAP = Object.fromEntries(CHARMS.map((c) => [c.id, c]));

const DEFAULT_BRACELET = [
  'heart-pink',
  'letter-k',
  'heart-red',
  'letter-a',
  'letter-s',
  'letter-y',
  'letter-a',
  'heart-gold',
];