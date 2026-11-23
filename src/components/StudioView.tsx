import React, { useRef, useState } from 'react';
import {
  Download,
  ImagePlus,
  Plus,
  RotateCw,
  Trash2,
  Upload,
  Volume2,
  FolderDown,
  FolderUp,
} from 'lucide-react';
import { BUILT_IN_ARTS, BuiltInArtPreview } from '../data/builtInArts';
import { QUICK_WORD_PRESETS, lookupZhuyinForWord } from '../data/zhuyinDict';
import { CardAccentColor, Flashcard } from '../types/flashcard';
import { exportFlashcardPng } from '../utils/cardExporter';
import { buildKebbiQrJson } from '../utils/qr';
import { FlashcardFace } from './FlashcardView';

interface StudioViewProps {
  cards: Flashcard[];
  selectedId: string;
  onSelectCard: (id: string) => void;
  onUpdateCard: (updated: Flashcard) => void;
  onAddCard: (card: Flashcard) => void;
  onDeleteCard: (id: string) => void;
  onReplaceAllCards: (cards: Flashcard[]) => void;
  onNotify: (message: string) => void;
}

const ACCENT_OPTIONS: Array<{ value: CardAccentColor; label: string; dotClass: string }> = [
  { value: 'rose', label: '莓果紅', dotClass: 'bg-rose-500' },
  { value: 'amber', label: '暖陽黃', dotClass: 'bg-amber-500' },
  { value: 'emerald', label: '青草綠', dotClass: 'bg-emerald-600' },
  { value: 'sky', label: '晴空藍', dotClass: 'bg-sky-500' },
  { value: 'violet', label: '葡萄紫', dotClass: 'bg-violet-500' },
];

const TONE_MARKS = ['ˊ', 'ˇ', 'ˋ', '˙'];

export const StudioView: React.FC<StudioViewProps> = ({
  cards,
  selectedId,
  onSelectCard,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
  onReplaceAllCards,
  onNotify,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [artTab, setArtTab] = useState<'gallery' | 'upload'>('gallery');
  const [artFilter, setArtFilter] = useState<'all' | 'starter' | 'food' | 'animal' | 'classroom'>('all');
  const [activeZhuyinIdx, setActiveZhuyinIdx] = useState<number>(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  const selectedCard = cards.find((c) => c.id === selectedId) ?? cards[0];

  const handleWordChange = (nextWord: string) => {
    if (!selectedCard) return;
    const autoZhuyin = lookupZhuyinForWord(nextWord, selectedCard.zhuyin);
    const shouldSyncTts =
      !selectedCard.ttsText || selectedCard.ttsText === selectedCard.word;
    onUpdateCard({
      ...selectedCard,
      word: nextWord,
      zhuyin: autoZhuyin,
      ttsText: shouldSyncTts ? nextWord : selectedCard.ttsText,
    });
  };

  const handleZhuyinCharChange = (index: number, value: string) => {
    if (!selectedCard) return;
    const next = [...selectedCard.zhuyin];
    while (next.length <= index) next.push('');
    next[index] = value;
    onUpdateCard({ ...selectedCard, zhuyin: next });
  };

  const appendToneToActiveChar = (tone: string) => {
    if (!selectedCard) return;
    const chars = Array.from(selectedCard.word);
    if (chars.length === 0) return;
    const idx = Math.min(activeZhuyinIdx, chars.length - 1);
    const current = (selectedCard.zhuyin[idx] ?? '').replace(/[ˊˇˋ˙]/g, '');
    const nextVal = tone === '˙' ? `˙${current}` : `${current}${tone}`;
    handleZhuyinCharChange(idx, nextVal);
  };

  const handleCreateBlankCard = () => {
    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      word: '蘋果',
      zhuyin: lookupZhuyinForWord('蘋果'),
      ttsText: '蘋果',
      artType: 'icon',
      artValue: 'apple',
      accentColor: 'rose',
      createdAt: Date.now(),
    };
    onAddCard(newCard);
    setFlipped(false);
    onNotify('已新增圖卡「蘋果」，可自由修改文字、注音與圖案');
  };

  const handleQuickPreset = (preset: (typeof QUICK_WORD_PRESETS)[number]) => {
    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      word: preset.word,
      zhuyin: lookupZhuyinForWord(preset.word),
      ttsText: preset.word,
      artType: 'icon',
      artValue: preset.iconKey,
      accentColor: preset.accent,
      createdAt: Date.now(),
    };
    onAddCard(newCard);
    setFlipped(false);
    onNotify(`已加入範例圖卡「${preset.word}」`);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCard) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 600;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        onUpdateCard({
          ...selectedCard,
          artType: 'image',
          artValue: dataUrl,
        });
        onNotify('圖片已自動最佳化並套用到圖卡正面');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSpeakPreview = (text: string) => {
    if (!('speechSynthesis' in window)) {
      onNotify('此瀏覽器不支援語音合成試聽');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find((v) => v.lang.includes('zh-TW') || v.lang.includes('zh_TW'));
    if (zhVoice) utterance.voice = zhVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleExportDeckJson = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kebbi-flashcards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('已匯出全部圖卡資料備份 (.json)');
  };

  const handleImportDeckJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Flashcard[];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word) {
          onReplaceAllCards(parsed);
          onNotify(`已成功匯入 ${parsed.length} 張圖卡`);
        } else {
          onNotify('匯入失敗：檔案格式不正確');
        }
      } catch {
        onNotify('匯入失敗：無法解析 JSON 檔案');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!selectedCard) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-600 mb-4">目前沒有任何圖卡，請新增一張開始製作。</p>
        <button
          onClick={handleCreateBlankCard}
          className="px-5 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors cursor-pointer"
        >
          新增第一張圖卡
        </button>
      </div>
    );
  }

  const wordChars = Array.from(selectedCard.word);
  const qrJson = buildKebbiQrJson(selectedCard);
  const filteredArts =
    artFilter === 'all'
      ? BUILT_IN_ARTS
      : BUILT_IN_ARTS.filter((a) => a.category === artFilter);

  return (
    <div className="space-y-6">
      {/* Top Deck Bar */}
      <section className="bg-white border border-[#E4E4DF] rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <h2 className="text-base font-semibold text-slate-900">詞彙圖卡庫</h2>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">共 {cards.length} 張</span>
            <span aria-hidden="true">·</span>
            <span>點擊卡片切換編輯</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportDeckJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderDown className="w-3.5 h-3.5" />
              備份卡組
            </button>
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderUp className="w-3.5 h-3.5" />
              匯入卡組
            </button>
            <input
              ref={jsonImportRef}
              type="file"
              accept="application/json"
              onChange={handleImportDeckJson}
              className="hidden"
            />
            <button
              onClick={handleCreateBlankCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              新增圖卡
            </button>
          </div>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
          {cards.map((card) => {
            const isActive = card.id === selectedCard.id;
            return (
              <button
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`group shrink-0 w-32 text-left rounded-xl p-2 border transition-all cursor-pointer ${
                  isActive
                    ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-1.5 flex items-center justify-center">
                  {card.artType === 'icon' ? (
                    <BuiltInArtPreview artKey={card.artValue} className="w-full h-full" />
                  ) : (
                    <img
                      src={card.artValue}
                      alt={card.word}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {card.word || '未命名'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick add presets */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">快速加入常用詞卡：</span>
          {QUICK_WORD_PRESETS.map((preset) => (
            <button
              key={preset.word}
              onClick={() => handleQuickPreset(preset)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              + {preset.word}
            </button>
          ))}
        </div>
      </section>

      {/* Main Two-Zone Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Zone: Interactive Dual-Sided Card Preview */}
        <section className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-xl p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setFlipped(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  !flipped ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                正面（圖案＋注音）
              </button>
              <button
                onClick={() => setFlipped(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  flipped ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                背面（QR＋注音）
              </button>
            </div>

            <button
              onClick={() => setFlipped((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCw className="w-3.5 h-3.5" />
              翻面預覽
            </button>
          </div>

          {/* 3D Flip Container */}
          <div
            onClick={() => setFlipped((prev) => !prev)}
            className="w-full max-w-[300px] aspect-[3/4] perspective-1200 cursor-pointer my-2"
            title="點擊圖卡翻面"
          >
            <div
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
                flipped ? 'rotate-y-180' : ''
              }`}
            >
              <div className="absolute inset-0 backface-hidden">
                <FlashcardFace card={selectedCard} side="front" className="w-full h-full shadow-sm" />
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <FlashcardFace card={selectedCard} side="back" className="w-full h-full shadow-sm" />
              </div>
            </div>
          </div>

          {/* Card Quick Actions */}
          <div className="w-full mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => exportFlashcardPng(selectedCard, 'front')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                下載正面 PNG
              </button>
              <button
                onClick={() => exportFlashcardPng(selectedCard, 'back')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                下載背面 PNG
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-[#FAFAF8] border border-slate-200 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">QR Code 寫入 JSON（給凱比讀取）</p>
                <p className="font-mono text-xs text-slate-800 truncate">{qrJson}</p>
              </div>
              <button
                onClick={() => handleSpeakPreview(selectedCard.ttsText || selectedCard.word)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 rounded-md transition-colors shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5" />
                試聽發音
              </button>
            </div>
          </div>
        </section>

        {/* Right Zone: Card Editor Controls */}
        <section className="lg:col-span-7 bg-white border border-[#E4E4DF] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">編輯圖卡內容與注音</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                修改文字會自動匹配常用字注音，也可為每個國字微調聲調或破音字。
              </p>
            </div>
            {cards.length > 1 && (
              <button
                onClick={() => onDeleteCard(selectedCard.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                刪除此卡
              </button>
            )}
          </div>

          {/* Word & Spoken TTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                圖卡文字（國字）
              </label>
              <input
                type="text"
                value={selectedCard.word}
                onChange={(e) => handleWordChange(e.target.value)}
                placeholder="例如：佩佩豬、加一分"
                className="w-full px-3.5 py-2 text-base font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                凱比朗讀文字（寫入 JSON t 欄位）
              </label>
              <input
                type="text"
                value={selectedCard.ttsText}
                onChange={(e) =>
                  onUpdateCard({ ...selectedCard, ttsText: e.target.value })
                }
                placeholder="預設同圖卡文字，可微調唸法"
                className="w-full px-3.5 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
              />
            </div>
          </div>

          {/* Per-character Zhuyin editor */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-slate-700">
                逐字注音設定（支援二聲 ˊ、三聲 ˇ、四聲 ˋ、輕聲 ˙）
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">快速加上聲調：</span>
                {TONE_MARKS.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => appendToneToActiveChar(tone)}
                    className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 rounded-md transition-colors cursor-pointer"
                    title={`套用聲調 ${tone}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {wordChars.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {wordChars.map((ch, idx) => (
                  <div
                    key={`${idx}-${ch}`}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      activeZhuyinIdx === idx
                        ? 'border-sky-500 bg-sky-50/40'
                        : 'border-slate-200 bg-[#FAFAF8]'
                    }`}
                  >
                    <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                      <span>第 {idx + 1} 字</span>
                      <span className="text-base font-bold text-slate-900">{ch}</span>
                    </div>
                    <input
                      type="text"
                      value={selectedCard.zhuyin[idx] ?? ''}
                      onFocus={() => setActiveZhuyinIdx(idx)}
                      onChange={(e) => handleZhuyinCharChange(idx, e.target.value)}
                      placeholder="輸入注音"
                      className="w-full px-2.5 py-1.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-600"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">輸入文字後即可編輯每個字的注音。</p>
            )}
          </div>

          {/* Card Accent Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              圖卡邊框色彩
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {ACCENT_OPTIONS.map((opt) => {
                const active = selectedCard.accentColor === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateCard({ ...selectedCard, accentColor: opt.value })
                    }
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Artwork Source Selector */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <label className="text-sm font-medium text-slate-700">
                圖卡正面圖案
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setArtTab('gallery')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    artTab === 'gallery'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  內建插畫與圖示庫
                </button>
                <button
                  type="button"
                  onClick={() => setArtTab('upload')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    artTab === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  上傳本地圖片
                </button>
              </div>
            </div>

            {artTab === 'gallery' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(
                    [
                      ['all', '全部'],
                      ['starter', '繪本範例'],
                      ['food', '食物飲品'],
                      ['animal', '可愛動物'],
                      ['classroom', '教室生活'],
                    ] as const
                  ).map(([cat, label]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setArtFilter(cat)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        artFilter === cat
                          ? 'bg-sky-600 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {filteredArts.map((art) => {
                    const isSelected =
                      (art.type === 'image' &&
                        selectedCard.artType === 'image' &&
                        selectedCard.artValue === art.imageSrc) ||
                      (art.type === 'svg' &&
                        selectedCard.artType === 'icon' &&
                        selectedCard.artValue === art.key);
                    return (
                      <button
                        key={art.key}
                        type="button"
                        onClick={() =>
                          onUpdateCard({
                            ...selectedCard,
                            artType: art.type === 'image' ? 'image' : 'icon',
                            artValue: art.type === 'image' ? art.imageSrc! : art.key,
                          })
                        }
                        className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-1">
                          <BuiltInArtPreview artKey={art.key} className="w-full h-full" />
                        </div>
                        <span className="text-[11px] text-slate-700 truncate w-full text-center">
                          {art.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-[#FAFAF8] rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  點擊選擇圖片檔案（JPG、PNG、WebP）
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  圖片會自動縮放最佳化並儲存在您的瀏覽器中，不會上傳至外部伺服器
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  選擇圖片
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
