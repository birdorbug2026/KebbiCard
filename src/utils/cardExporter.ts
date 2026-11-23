import { BUILT_IN_ARTS, buildSvgDataMarkup } from '../data/builtInArts';
import { Flashcard } from '../types/flashcard';
import { buildKebbiQrJson, renderQrToDataUrl } from './qr';

const ACCENT_HEX: Record<
  Flashcard['accentColor'],
  { border: string; tint: string; gripFill: string }
> = {
  sky: { border: '#0284C7', tint: '#F0F9FF', gripFill: '#E0F2FE' },
  amber: { border: '#D97706', tint: '#FFFBEB', gripFill: '#FEF3C7' },
  rose: { border: '#E11D48', tint: '#FFF1F2', gripFill: '#FFE4E6' },
  emerald: { border: '#059669', tint: '#ECFDF5', gripFill: '#D1FAE5' },
  violet: { border: '#7C3AED', tint: '#F5F3FF', gripFill: '#EDE9FE' },
};

function drawSemiCircleGrip(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  radius: number,
  fill: string,
  stroke: string
) {
  ctx.save();

  // Filled semi-circle resting on the bottom inner edge
  ctx.beginPath();
  ctx.arc(centerX, bottomY, radius, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Dashed outer arch
  ctx.beginPath();
  ctx.arc(centerX, bottomY, radius, Math.PI, 0, false);
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 9]);
  ctx.lineCap = 'round';
  ctx.stroke();

  // Solid inner concentric tactile arch
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(centerX, bottomY, radius * 0.6, Math.PI, 0, false);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Center finger placement dot
  ctx.beginPath();
  ctx.arc(centerX, bottomY - radius * 0.28, 7, 0, Math.PI * 2);
  ctx.fillStyle = stroke;
  ctx.globalAlpha = 0.55;
  ctx.fill();

  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function splitZhuyinTone(syllable: string): { base: string[]; tone: string; isLight: boolean } {
  const trimmed = syllable.trim();
  if (!trimmed) return { base: [], tone: '', isLight: false };
  const toneChars = ['ˊ', 'ˇ', 'ˋ', '˙'];
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (first === '˙') {
    return { base: Array.from(trimmed.slice(1)), tone: '˙', isLight: true };
  }
  if (toneChars.includes(last)) {
    return {
      base: Array.from(trimmed.slice(0, -1)),
      tone: last,
      isLight: last === '˙',
    };
  }
  return { base: Array.from(trimmed), tone: '', isLight: false };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function drawZhuyinWordOnCanvas(
  ctx: CanvasRenderingContext2D,
  word: string,
  zhuyin: string[],
  centerX: number,
  centerY: number,
  charSize: number
) {
  const chars = Array.from(word);
  if (chars.length === 0) return;

  const unitWidth = charSize * 1.48;
  const totalWidth = chars.length * unitWidth;
  let startX = centerX - totalWidth / 2;

  ctx.textBaseline = 'middle';
  chars.forEach((ch, idx) => {
    const zy = zhuyin[idx] ?? '';
    const { base, tone, isLight } = splitZhuyinTone(zy);
    const charCenterX = startX + charSize * 0.48;

    // Chinese character
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 ${charSize}px "Noto Sans TC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ch, charCenterX, centerY);

    // Vertical Zhuyin column to the right
    const zyX = startX + charSize * 1.06;
    const symSize = Math.round(charSize * 0.27);
    ctx.font = `600 ${symSize}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = '#334155';

    const count = base.length;
    const step = symSize * 1.12;
    const blockHeight = Math.max(0, count - 1) * step;
    const firstY = centerY - blockHeight / 2 + (isLight ? symSize * 0.35 : 0);

    if (isLight && tone) {
      ctx.fillStyle = '#D97706';
      ctx.fillText(tone, zyX, firstY - step * 0.85);
      ctx.fillStyle = '#334155';
    }

    base.forEach((sym, sIdx) => {
      const sy = firstY + sIdx * step;
      ctx.fillText(sym, zyX, sy);
    });

    if (!isLight && tone) {
      const lastY = firstY + Math.max(0, count - 1) * step;
      ctx.fillStyle = '#D97706';
      ctx.fillText(tone, zyX + symSize * 0.72, lastY - symSize * 0.15);
    }

    startX += unitWidth;
  });
}

export async function exportFlashcardPng(
  card: Flashcard,
  side: 'front' | 'back'
): Promise<void> {
  const width = 900;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const palette = ACCENT_HEX[card.accentColor] ?? ACCENT_HEX.sky;

  // Card background & outer border
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 44);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  if (side === 'front') {
    // Inner soft frame on front only
    drawRoundedRect(ctx, 72, 72, width - 144, 680, 32);
    ctx.fillStyle = palette.tint;
    ctx.fill();

    try {
      let imgSrc = card.artValue;
      let isObjectUrl = false;
      if (card.artType === 'icon') {
        const art = BUILT_IN_ARTS.find((item) => item.key === card.artValue) ?? BUILT_IN_ARTS[0];
        if (art.type === 'image' && art.imageSrc) {
          imgSrc = art.imageSrc;
        } else {
          const svgBlob = new Blob([buildSvgDataMarkup(art)], { type: 'image/svg+xml' });
          imgSrc = URL.createObjectURL(svgBlob);
          isObjectUrl = true;
        }
      }
      const img = await loadImage(imgSrc);
      ctx.save();
      drawRoundedRect(ctx, 110, 102, 680, 620, 26);
      ctx.clip();
      const ratio = Math.min(680 / img.width, 620 / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const dx = 110 + (680 - drawW) / 2;
      const dy = 102 + (620 - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
      if (isObjectUrl) URL.revokeObjectURL(imgSrc);
    } catch {
      ctx.fillStyle = '#64748B';
      ctx.font = '600 32px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(card.word, width / 2, 412);
    }
  } else {
    // Generous pure-white quiet zone around the QR code so fingers won't block it
    const payload = buildKebbiQrJson(card);
    const qrSize = 540;
    const qrDataUrl = await renderQrToDataUrl(payload, qrSize);
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, (width - qrSize) / 2, 130, qrSize, qrSize);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 20px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(payload, width / 2, 720);
  }

  // Word + Zhuyin in bottom zone (positioned cleanly above the bottom grip semi-circles)
  const charCount = Array.from(card.word).length;
  const charSize = charCount <= 2 ? 120 : charCount === 3 ? 100 : 82;
  drawZhuyinWordOnCanvas(ctx, card.word, card.zhuyin, width / 2, 920, charSize);

  // Bottom-left and bottom-right semi-circle finger-hold guides on BOTH sides
  const gripBottomY = height - 33;
  const gripRadius = 74;
  drawSemiCircleGrip(ctx, 155, gripBottomY, gripRadius, palette.gripFill, palette.border);
  drawSemiCircleGrip(ctx, width - 155, gripBottomY, gripRadius, palette.gripFill, palette.border);

  // Trigger download
  const link = document.createElement('a');
  link.download = `${card.word || 'kebbi-card'}_${side === 'front' ? '正面' : '背面QR'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
