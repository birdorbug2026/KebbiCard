import React from 'react';

interface ZhuyinWordProps {
  word: string;
  zhuyin: string[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function parseSyllable(raw: string): { symbols: string[]; tone: string; isLight: boolean } {
  const s = raw.trim();
  if (!s) return { symbols: [], tone: '', isLight: false };
  const tones = ['ˊ', 'ˇ', 'ˋ', '˙'];
  if (s.startsWith('˙')) {
    return { symbols: Array.from(s.slice(1)), tone: '˙', isLight: true };
  }
  const last = s[s.length - 1];
  if (tones.includes(last)) {
    return {
      symbols: Array.from(s.slice(0, -1)),
      tone: last,
      isLight: last === '˙',
    };
  }
  return { symbols: Array.from(s), tone: '', isLight: false };
}

const SIZE_CLASSES = {
  sm: {
    gap: 'gap-2',
    char: 'text-xl font-bold leading-none',
    zyBox: 'w-4 text-[10px] leading-[1.05]',
    toneOffset: '-right-2',
  },
  md: {
    gap: 'gap-2.5',
    char: 'text-3xl font-bold leading-none',
    zyBox: 'w-5 text-[12px] leading-[1.08]',
    toneOffset: '-right-2.5',
  },
  lg: {
    gap: 'gap-3',
    char: 'text-4xl font-bold leading-none',
    zyBox: 'w-6 text-[13px] leading-[1.1]',
    toneOffset: '-right-2.5',
  },
  xl: {
    gap: 'gap-4',
    char: 'text-5xl font-bold leading-none',
    zyBox: 'w-7 text-[15px] leading-[1.12]',
    toneOffset: '-right-3',
  },
};

export const ZhuyinWord: React.FC<ZhuyinWordProps> = ({
  word,
  zhuyin,
  size = 'lg',
  className = '',
}) => {
  const chars = Array.from(word);
  const cfg = SIZE_CLASSES[size];

  if (chars.length === 0) {
    return <span className="text-slate-400 text-base">請輸入詞彙</span>;
  }

  return (
    <div className={`inline-flex flex-wrap items-center justify-center ${cfg.gap} ${className}`}>
      {chars.map((ch, idx) => {
        const syllable = zhuyin[idx] ?? '';
        const { symbols, tone, isLight } = parseSyllable(syllable);

        return (
          <div key={`${ch}-${idx}`} className="inline-flex items-center gap-0.5">
            <span className={`${cfg.char} text-slate-900 select-none`}>{ch}</span>
            {syllable && (
              <div
                className={`relative flex flex-col items-center justify-center font-semibold text-slate-600 select-none ${cfg.zyBox}`}
                aria-label={syllable}
              >
                {isLight && tone && (
                  <span className="text-amber-600 font-bold leading-none mb-0.5">{tone}</span>
                )}
                {symbols.map((sym, sIdx) => (
                  <span key={`${sym}-${sIdx}`} className="relative block text-center">
                    {sym}
                    {!isLight && tone && sIdx === symbols.length - 1 && (
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 ${cfg.toneOffset} text-amber-600 font-bold leading-none`}
                      >
                        {tone}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
