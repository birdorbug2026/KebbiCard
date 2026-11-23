import React, { useEffect, useState } from 'react';
import { BuiltInArtPreview } from '../data/builtInArts';
import { Flashcard } from '../types/flashcard';
import { buildKebbiQrJson, renderQrToDataUrl } from '../utils/qr';
import { ZhuyinWord } from './ZhuyinWord';

const ACCENT_STYLES: Record<
  Flashcard['accentColor'],
  {
    border: string;
    frameBg: string;
    labelText: string;
    gripFill: string;
    gripStroke: string;
  }
> = {
  sky: {
    border: 'border-sky-500',
    frameBg: 'bg-sky-50/70',
    labelText: 'text-sky-700',
    gripFill: '#E0F2FE',
    gripStroke: '#0284C7',
  },
  amber: {
    border: 'border-amber-500',
    frameBg: 'bg-amber-50/70',
    labelText: 'text-amber-700',
    gripFill: '#FEF3C7',
    gripStroke: '#D97706',
  },
  rose: {
    border: 'border-rose-500',
    frameBg: 'bg-rose-50/70',
    labelText: 'text-rose-700',
    gripFill: '#FFE4E6',
    gripStroke: '#E11D48',
  },
  emerald: {
    border: 'border-emerald-600',
    frameBg: 'bg-emerald-50/70',
    labelText: 'text-emerald-700',
    gripFill: '#D1FAE5',
    gripStroke: '#059669',
  },
  violet: {
    border: 'border-violet-500',
    frameBg: 'bg-violet-50/70',
    labelText: 'text-violet-700',
    gripFill: '#EDE9FE',
    gripStroke: '#7C3AED',
  },
};

const SemiCircleGrip: React.FC<{
  fill: string;
  stroke: string;
  compact?: boolean;
  position: 'left' | 'right';
}> = ({ fill, stroke, compact = false, position }) => {
  const posClass =
    position === 'left'
      ? compact
        ? 'left-2'
        : 'left-3.5'
      : compact
        ? 'right-2'
        : 'right-3.5';

  return (
    <svg
      viewBox="0 0 68 36"
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 ${posClass} ${
        compact ? 'w-10 h-[21px]' : 'w-14 h-[29px]'
      }`}
    >
      {/* Outer semi-circle grip pad */}
      <path
        d="M 4 36 A 30 30 0 0 1 64 36 Z"
        fill={fill}
      />
      <path
        d="M 4 36 A 30 30 0 0 1 64 36"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Inner concentric tactile arc */}
      <path
        d="M 16 36 A 18 18 0 0 1 52 36"
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Center finger placement dot */}
      <circle cx="34" cy="28" r="2.6" fill={stroke} opacity="0.55" />
    </svg>
  );
};

interface FlashcardFaceProps {
  card: Flashcard;
  side: 'front' | 'back';
  compact?: boolean;
  showJsonCaption?: boolean;
  className?: string;
}

export const FlashcardFace: React.FC<FlashcardFaceProps> = ({
  card,
  side,
  compact = false,
  showJsonCaption = true,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [imgError, setImgError] = useState(false);

  const payload = buildKebbiQrJson(card);
  const style = ACCENT_STYLES[card.accentColor] ?? ACCENT_STYLES.sky;

  useEffect(() => {
    setImgError(false);
  }, [card.artType, card.artValue]);

  useEffect(() => {
    if (side !== 'back') return;
    let active = true;
    renderQrToDataUrl(payload, compact ? 260 : 380)
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [side, payload, compact]);

  const charLen = Array.from(card.word).length;
  const wordSize = compact
    ? charLen <= 2
      ? 'md'
      : 'sm'
    : charLen <= 2
      ? 'xl'
      : charLen === 3
        ? 'lg'
        : 'md';

  return (
    <div
      className={`relative flex flex-col justify-between bg-white rounded-2xl border-[3px] ${style.border} ${
        compact ? 'px-3 pt-3 pb-6' : 'px-5 pt-5 pb-9'
      } select-none overflow-hidden ${className}`}
    >
      {/* Top artwork or QR frame (matching aspect-square keeps front & back heights identical for duplex print) */}
      <div
        className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden ${
          side === 'front'
            ? `${style.frameBg} ${compact ? 'p-2' : 'p-3'}`
            : `bg-white ${compact ? 'p-3' : 'p-5'}`
        }`}
      >
        {side === 'front' ? (
          card.artType === 'icon' ? (
            <BuiltInArtPreview artKey={card.artValue} className="w-full h-full rounded-lg" />
          ) : !imgError && card.artValue ? (
            <img
              src={card.artValue}
              alt={card.word}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <span className="font-semibold text-slate-600">{card.word || '無圖片'}</span>
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code: ${card.word}`}
                referrerPolicy="no-referrer"
                className="w-[82%] h-[82%] object-contain"
              />
            ) : (
              <div className="w-3/4 h-3/4 bg-slate-100 rounded-lg animate-pulse" />
            )}
            {showJsonCaption && (
              <span
                className={`font-mono text-slate-400 truncate max-w-full px-1 ${
                  compact ? 'text-[9px] mt-0.5' : 'text-[10px] mt-1'
                }`}
              >
                {payload}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom word + Zhuyin */}
      <div className={`relative z-10 flex flex-col items-center justify-center ${compact ? 'pt-2 pb-1' : 'pt-3 pb-1'}`}>
        <ZhuyinWord word={card.word} zhuyin={card.zhuyin} size={wordSize} />
      </div>

      {/* Bottom-left & bottom-right semi-circle finger-hold indicators on BOTH front and back */}
      <SemiCircleGrip
        fill={style.gripFill}
        stroke={style.gripStroke}
        compact={compact}
        position="left"
      />
      <SemiCircleGrip
        fill={style.gripFill}
        stroke={style.gripStroke}
        compact={compact}
        position="right"
      />
    </div>
  );
};
