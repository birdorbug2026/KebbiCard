import React from 'react';

export interface BuiltInArtItem {
  key: string;
  label: string;
  category: 'starter' | 'food' | 'animal' | 'classroom';
  type: 'image' | 'svg';
  imageSrc?: string;
  bgTint: string;
  svgBody?: string;
}

export const BUILT_IN_ARTS: BuiltInArtItem[] = [
  {
    key: 'starter_piglet',
    label: '佩佩小豬',
    category: 'starter',
    type: 'image',
    imageSrc: './src/assets/images/card_pink_piglet_1794995755489.jpg',
    bgTint: '#FFF1F2',
  },
  {
    key: 'starter_star',
    label: '加分獎牌',
    category: 'starter',
    type: 'image',
    imageSrc: './src/assets/images/card_add_point_1794995755627.jpg',
    bgTint: '#FFFBEB',
  },
  {
    key: 'starter_cookie',
    label: '餅乾盤子',
    category: 'starter',
    type: 'image',
    imageSrc: './src/assets/images/card_cookie_1794995756488.jpg',
    bgTint: '#ECFDF5',
  },
  {
    key: 'starter_water',
    label: '喝水水杯',
    category: 'starter',
    type: 'image',
    imageSrc: './src/assets/images/card_drink_water_1794995756266.jpg',
    bgTint: '#F0F9FF',
  },
  {
    key: 'apple',
    label: '紅蘋果',
    category: 'food',
    type: 'svg',
    bgTint: '#FFF1F2',
    svgBody: `
      <circle cx="64" cy="70" r="34" fill="#F43F5E"/>
      <ellipse cx="52" cy="58" rx="8" ry="13" transform="rotate(-22 52 58)" fill="#FDA4AF" opacity="0.65"/>
      <path d="M64 38 C64 26, 72 20, 76 18" stroke="#78350F" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M66 32 C78 22, 92 26, 88 38 C82 42, 70 40, 66 32 Z" fill="#22C55E"/>
    `,
  },
  {
    key: 'banana',
    label: '黃香蕉',
    category: 'food',
    type: 'svg',
    bgTint: '#FEFCE8',
    svgBody: `
      <path d="M32 84 C52 96, 86 80, 96 42 C98 34, 92 30, 88 36 C78 62, 54 74, 34 72 C28 72, 26 80, 32 84 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="3" stroke-linejoin="round"/>
      <path d="M90 34 L95 26" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  {
    key: 'milk',
    label: '鮮牛奶',
    category: 'food',
    type: 'svg',
    bgTint: '#F0F9FF',
    svgBody: `
      <path d="M44 40 L84 40 L88 54 L88 100 L40 100 L40 54 Z" fill="#FFFFFF" stroke="#38BDF8" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 40 L52 26 L76 26 L84 40 Z" fill="#E0F2FE" stroke="#38BDF8" stroke-width="4" stroke-linejoin="round"/>
      <rect x="42" y="64" width="44" height="22" fill="#38BDF8" opacity="0.25"/>
      <circle cx="64" cy="75" r="9" fill="#0284C7"/>
    `,
  },
  {
    key: 'cake',
    label: '小蛋糕',
    category: 'food',
    type: 'svg',
    bgTint: '#FDF2F8',
    svgBody: `
      <rect x="32" y="60" width="64" height="36" rx="8" fill="#FDBA74" stroke="#C2410C" stroke-width="3"/>
      <path d="M32 64 C40 74, 52 62, 64 70 C76 76, 86 62, 96 68 L96 60 C96 54, 90 50, 84 50 L44 50 C38 50, 32 54, 32 60 Z" fill="#F472B6"/>
      <rect x="61" y="30" width="6" height="20" rx="2" fill="#38BDF8"/>
      <path d="M64 16 C69 22, 69 29, 64 29 C59 29, 59 22, 64 16 Z" fill="#FACC15"/>
    `,
  },
  {
    key: 'strawberry',
    label: '甜草莓',
    category: 'food',
    type: 'svg',
    bgTint: '#FFF1F2',
    svgBody: `
      <path d="M64 102 C44 96, 32 72, 36 52 C40 38, 88 38, 92 52 C96 72, 84 96, 64 102 Z" fill="#FB7185" stroke="#E11D48" stroke-width="3"/>
      <path d="M44 42 C52 34, 60 34, 64 42 C68 34, 76 34, 84 42 L74 48 L64 45 L54 48 Z" fill="#22C55E"/>
      <circle cx="52" cy="62" r="2.5" fill="#FEF08A"/>
      <circle cx="66" cy="58" r="2.5" fill="#FEF08A"/>
      <circle cx="76" cy="68" r="2.5" fill="#FEF08A"/>
      <circle cx="58" cy="78" r="2.5" fill="#FEF08A"/>
      <circle cx="68" cy="86" r="2.5" fill="#FEF08A"/>
    `,
  },
  {
    key: 'cat',
    label: '可愛小貓',
    category: 'animal',
    type: 'svg',
    bgTint: '#FFF7ED',
    svgBody: `
      <polygon points="36,52 40,26 58,42" fill="#FDBA74" stroke="#EA580C" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="92,52 88,26 70,42" fill="#FDBA74" stroke="#EA580C" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="64" cy="68" rx="34" ry="30" fill="#FED7AA" stroke="#EA580C" stroke-width="3"/>
      <circle cx="51" cy="64" r="4" fill="#1E293B"/>
      <circle cx="77" cy="64" r="4" fill="#1E293B"/>
      <polygon points="60,72 68,72 64,77" fill="#FB7185"/>
      <path d="M56 80 Q64 86 72 80" stroke="#9A3412" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M24 68 L38 70 M24 76 L38 75 M104 68 L90 70 M104 76 L90 75" stroke="#9A3412" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  {
    key: 'dog',
    label: '乖乖小狗',
    category: 'animal',
    type: 'svg',
    bgTint: '#FEF3C7',
    svgBody: `
      <ellipse cx="32" cy="64" rx="11" ry="22" transform="rotate(14 32 64)" fill="#B45309"/>
      <ellipse cx="96" cy="64" rx="11" ry="22" transform="rotate(-14 96 64)" fill="#B45309"/>
      <circle cx="64" cy="64" r="31" fill="#FDE68A" stroke="#B45309" stroke-width="3"/>
      <circle cx="52" cy="58" r="4" fill="#1E293B"/>
      <circle cx="76" cy="58" r="4" fill="#1E293B"/>
      <ellipse cx="64" cy="74" rx="13" ry="10" fill="#FFFBEB"/>
      <ellipse cx="64" cy="69" rx="6" ry="4" fill="#1E293B"/>
      <path d="M58 78 Q64 84 70 78" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    `,
  },
  {
    key: 'rabbit',
    label: '長耳兔',
    category: 'animal',
    type: 'svg',
    bgTint: '#FDF2F8',
    svgBody: `
      <ellipse cx="49" cy="36" rx="9" ry="24" transform="rotate(-8 49 36)" fill="#FFFFFF" stroke="#EC4899" stroke-width="3"/>
      <ellipse cx="79" cy="36" rx="9" ry="24" transform="rotate(8 79 36)" fill="#FFFFFF" stroke="#EC4899" stroke-width="3"/>
      <ellipse cx="49" cy="37" rx="4" ry="15" transform="rotate(-8 49 37)" fill="#FBCFE8"/>
      <ellipse cx="79" cy="37" rx="4" ry="15" transform="rotate(8 79 37)" fill="#FBCFE8"/>
      <circle cx="64" cy="74" r="29" fill="#FFFFFF" stroke="#EC4899" stroke-width="3"/>
      <circle cx="53" cy="70" r="3.5" fill="#1E293B"/>
      <circle cx="75" cy="70" r="3.5" fill="#1E293B"/>
      <circle cx="46" cy="78" r="5" fill="#FBCFE8"/>
      <circle cx="82" cy="78" r="5" fill="#FBCFE8"/>
      <polygon points="61,76 67,76 64,80" fill="#F43F5E"/>
    `,
  },
  {
    key: 'elephant',
    label: '小大象',
    category: 'animal',
    type: 'svg',
    bgTint: '#EFF6FF',
    svgBody: `
      <ellipse cx="32" cy="62" rx="16" ry="22" fill="#93C5FD" stroke="#2563EB" stroke-width="3"/>
      <ellipse cx="96" cy="62" rx="16" ry="22" fill="#93C5FD" stroke="#2563EB" stroke-width="3"/>
      <circle cx="64" cy="62" r="28" fill="#BFDBFE" stroke="#2563EB" stroke-width="3"/>
      <circle cx="52" cy="56" r="3.5" fill="#1E293B"/>
      <circle cx="76" cy="56" r="3.5" fill="#1E293B"/>
      <path d="M59 64 C59 86, 62 98, 76 96 C82 95, 83 87, 77 86 C70 86, 69 78, 69 64 Z" fill="#93C5FD" stroke="#2563EB" stroke-width="3"/>
    `,
  },
  {
    key: 'hands',
    label: '洗洗手',
    category: 'classroom',
    type: 'svg',
    bgTint: '#ECFEFF',
    svgBody: `
      <circle cx="48" cy="40" r="10" fill="#A5F3FC" stroke="#0891B2" stroke-width="2.5"/>
      <circle cx="80" cy="36" r="7" fill="#CFFAFE" stroke="#0891B2" stroke-width="2.5"/>
      <circle cx="68" cy="26" r="5" fill="#ECFEFF" stroke="#0891B2" stroke-width="2"/>
      <path d="M34 76 C34 62, 52 58, 64 66 C76 58, 94 62, 94 76 C94 90, 80 96, 64 96 C48 96, 34 90, 34 76 Z" fill="#FED7AA" stroke="#C2410C" stroke-width="3"/>
      <path d="M44 74 Q64 84 84 74" stroke="#0891B2" stroke-width="3" stroke-linecap="round" fill="none"/>
    `,
  },
  {
    key: 'book',
    label: '故事書',
    category: 'classroom',
    type: 'svg',
    bgTint: '#ECFDF5',
    svgBody: `
      <path d="M24 38 C40 34, 56 38, 64 46 L64 94 C54 86, 40 84, 24 88 Z" fill="#FFFFFF" stroke="#059669" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M104 38 C88 34, 72 38, 64 46 L64 94 C74 86, 88 84, 104 88 Z" fill="#ECFDF5" stroke="#059669" stroke-width="3.5" stroke-linejoin="round"/>
      <line x1="34" y1="54" x2="54" y2="57" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="34" y1="68" x2="54" y2="71" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="74" y1="57" x2="94" y2="54" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="74" y1="71" x2="94" y2="68" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
    `,
  },
  {
    key: 'thumbsup',
    label: '很棒喔',
    category: 'classroom',
    type: 'svg',
    bgTint: '#FFFBEB',
    svgBody: `
      <rect x="28" y="56" width="18" height="40" rx="5" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
      <path d="M46 60 L60 30 C64 24, 72 26, 70 36 L67 52 L90 52 C97 52, 100 60, 96 66 L90 88 C88 94, 82 96, 76 96 L46 96 Z" fill="#FDE68A" stroke="#D97706" stroke-width="3" stroke-linejoin="round"/>
    `,
  },
  {
    key: 'train',
    label: '排隊火車',
    category: 'classroom',
    type: 'svg',
    bgTint: '#F0F9FF',
    svgBody: `
      <rect x="26" y="46" width="76" height="36" rx="10" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
      <rect x="34" y="34" width="24" height="14" rx="4" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5"/>
      <rect x="82" y="32" width="12" height="14" rx="3" fill="#F87171" stroke="#DC2626" stroke-width="2.5"/>
      <rect x="36" y="54" width="16" height="14" rx="3" fill="#E0F2FE"/>
      <rect x="60" y="54" width="16" height="14" rx="3" fill="#E0F2FE"/>
      <circle cx="44" cy="88" r="10" fill="#334155"/>
      <circle cx="84" cy="88" r="10" fill="#334155"/>
      <circle cx="44" cy="88" r="4" fill="#CBD5E1"/>
      <circle cx="84" cy="88" r="4" fill="#CBD5E1"/>
    `,
  },
  {
    key: 'sun',
    label: '大太陽',
    category: 'classroom',
    type: 'svg',
    bgTint: '#FEFCE8',
    svgBody: `
      <circle cx="64" cy="64" r="24" fill="#FACC15" stroke="#EA580C" stroke-width="3"/>
      <path d="M64 20 V30 M64 98 V108 M20 64 H30 M98 64 H108 M33 33 L40 40 M88 88 L95 95 M95 33 L88 40 M40 88 L33 95" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>
      <circle cx="56" cy="61" r="3" fill="#78350F"/>
      <circle cx="72" cy="61" r="3" fill="#78350F"/>
      <path d="M57 70 Q64 76 71 70" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    `,
  },
  {
    key: 'music',
    label: '唱歌音樂',
    category: 'classroom',
    type: 'svg',
    bgTint: '#F5F3FF',
    svgBody: `
      <path d="M48 84 V36 L94 26 V74" stroke="#7C3AED" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M48 48 L94 38" stroke="#7C3AED" stroke-width="6" stroke-linecap="round"/>
      <circle cx="38" cy="86" r="12" fill="#A78BFA" stroke="#7C3AED" stroke-width="3"/>
      <circle cx="84" cy="76" r="12" fill="#A78BFA" stroke="#7C3AED" stroke-width="3"/>
    `,
  },
  {
    key: 'umbrella',
    label: '小雨傘',
    category: 'classroom',
    type: 'svg',
    bgTint: '#F0FDF4',
    svgBody: `
      <path d="M24 64 C24 38, 104 38, 104 64 C90 58, 78 58, 64 64 C50 58, 38 58, 24 64 Z" fill="#FB7185" stroke="#E11D48" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64 30 V88 C64 98, 50 98, 50 88" stroke="#475569" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    `,
  },
];

export function buildSvgDataMarkup(art: BuiltInArtItem): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256"><rect width="128" height="128" rx="24" fill="${art.bgTint}"/>${art.svgBody ?? ''}</svg>`;
}

export const BuiltInArtPreview: React.FC<{
  artKey: string;
  className?: string;
}> = ({ artKey, className = 'w-full h-full' }) => {
  const art = BUILT_IN_ARTS.find((item) => item.key === artKey) ?? BUILT_IN_ARTS[0];
  if (art.type === 'image' && art.imageSrc) {
    return (
      <img
        src={art.imageSrc}
        alt={art.label}
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{ backgroundColor: art.bgTint }}
      dangerouslySetInnerHTML={{ __html: buildSvgDataMarkup(art) }}
    />
  );
};
