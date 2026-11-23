export type CardArtType = 'image' | 'icon';

export type CardAccentColor = 'sky' | 'amber' | 'rose' | 'emerald' | 'violet';

export interface Flashcard {
  id: string;
  word: string;
  /** Zhuyin syllables aligned 1:1 with characters in `word` */
  zhuyin: string[];
  /** Spoken text for Kebbi TTS; defaults to `word` if empty */
  ttsText: string;
  artType: CardArtType;
  /** Either an image URL / dataURL (for 'image') or a built-in vector art key (for 'icon') */
  artValue: string;
  accentColor: CardAccentColor;
  createdAt: number;
}

export interface KebbiQrPayload {
  /** Display word */
  w: string;
  /** Text for Kebbi TTS speech synthesis */
  t: string;
}

export type PrintLayoutMode = 'duplex' | 'fold';
export type PrintGridDensity = '2x2' | '2x3';

export type AppTab = 'studio' | 'print' | 'simulator' | 'sdk';
