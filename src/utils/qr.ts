import QRCode from 'qrcode';
import { Flashcard, KebbiQrPayload } from '../types/flashcard';

/**
 * Generates ultra-compact JSON for Kebbi Air QR codes:
 * {"w":"顯示詞彙","t":"凱比朗讀文字"}
 * Keeping the JSON concise lowers QR version density so Kebbi's camera scans fast offline.
 */
export function buildKebbiQrJson(card: Pick<Flashcard, 'word' | 'ttsText'>): string {
  const cleanWord = card.word.trim();
  const cleanTts = (card.ttsText || card.word).trim();
  const payload: KebbiQrPayload = {
    w: cleanWord,
    t: cleanTts,
  };
  return JSON.stringify(payload);
}

/**
 * Parses QR string back into word + spoken TTS text.
 * Supports minimal {"w","t"}, standard {"word","tts"}, and raw plain-text fallback.
 */
export function parseKebbiQrPayload(raw: string): { word: string; tts: string; isJson: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { word: '', tts: '', isJson: false };
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      const w =
        typeof parsed.w === 'string'
          ? parsed.w
          : typeof parsed.word === 'string'
            ? parsed.word
            : typeof parsed.text === 'string'
              ? parsed.text
              : '';
      const t =
        typeof parsed.t === 'string'
          ? parsed.t
          : typeof parsed.tts === 'string'
            ? parsed.tts
            : typeof parsed.say === 'string'
              ? parsed.say
              : w;
      if (w || t) {
        return { word: w || t, tts: t || w, isJson: true };
      }
    }
  } catch {
    // Fallback to plain text if QR does not contain JSON
  }
  return { word: trimmed, tts: trimmed, isJson: false };
}

export async function renderQrToDataUrl(payload: string, size = 400): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  size = 400
): Promise<void> {
  await QRCode.toCanvas(canvas, payload, {
    width: size,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
}
