import React, { useMemo, useState } from 'react';
import { CheckSquare, Printer, Scissors, Square } from 'lucide-react';
import { Flashcard, PrintGridDensity, PrintLayoutMode } from '../types/flashcard';
import { FlashcardFace } from './FlashcardView';

interface PrintWorkbenchProps {
  cards: Flashcard[];
}

export const PrintWorkbench: React.FC<PrintWorkbenchProps> = ({ cards }) => {
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('duplex');
  const [gridDensity, setGridDensity] = useState<PrintGridDensity>('2x2');
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [showJsonCaption, setShowJsonCaption] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => cards.map((c) => c.id));

  const activeCards = useMemo(() => {
    const idSet = new Set(selectedIds);
    const filtered = cards.filter((c) => idSet.has(c.id));
    return filtered.length > 0 ? filtered : cards;
  }, [cards, selectedIds]);

  const toggleCardSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map((c) => c.id));
    }
  };

  // Chunk cards for A4 pages
  const duplexPages = useMemo(() => {
    const perPage = gridDensity === '2x2' ? 4 : 6;
    const pages: Array<{ frontSlots: Array<Flashcard | null>; backSlots: Array<Flashcard | null> }> = [];
    for (let i = 0; i < activeCards.length; i += perPage) {
      const slice = activeCards.slice(i, i + perPage);
      const frontSlots: Array<Flashcard | null> = Array.from(
        { length: perPage },
        (_, idx) => slice[idx] ?? null
      );
      // Mirror every row of 2 columns so duplex long-edge flip aligns Front & Back
      const backSlots: Array<Flashcard | null> = [];
      for (let r = 0; r < perPage; r += 2) {
        backSlots.push(frontSlots[r + 1] ?? null);
        backSlots.push(frontSlots[r] ?? null);
      }
      pages.push({ frontSlots, backSlots });
    }
    return pages;
  }, [activeCards, gridDensity]);

  const foldPages = useMemo(() => {
    const perPage = 3;
    const pages: Flashcard[][] = [];
    for (let i = 0; i < activeCards.length; i += perPage) {
      pages.push(activeCards.slice(i, i + perPage));
    }
    return pages;
  }, [activeCards]);

  return (
    <div className="space-y-6">
      {/* Print Controls Toolbar (Hidden on actual print) */}
      <section className="no-print bg-white border border-[#E4E4DF] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">A4 圖卡列印與裁切工作台</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              雙面模式會自動水平鏡像背面欄位，確保雙面列印（長邊翻面）正反位置精準重合；單面折疊模式適合家用印表機印出後對折黏貼。
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            列印 / 另存 A4 PDF
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 text-xs">
          {/* Layout Mode */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">列印方式：</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setLayoutMode('duplex')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  layoutMode === 'duplex'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 雙面正反對齊
              </button>
              <button
                onClick={() => setLayoutMode('fold')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  layoutMode === 'fold'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                單面折疊對折卡
              </button>
            </div>
          </div>

          {/* Grid Density (Duplex mode) */}
          {layoutMode === 'duplex' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">每頁張數：</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setGridDensity('2x2')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    gridDensity === '2x2'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2×2 大字卡 (4 張/頁)
                </button>
                <button
                  onClick={() => setGridDensity('2x3')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    gridDensity === '2x3'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2×3 標準卡 (6 張/頁)
                </button>
              </div>
            </div>
          )}

          {/* Toggles */}
          <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCropMarks}
              onChange={(e) => setShowCropMarks(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            顯示裁切參考線
          </label>

          <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showJsonCaption}
              onChange={(e) => setShowJsonCaption(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            背面顯示 JSON 原文
          </label>
        </div>

        {/* Card Batch Filter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
          >
            {selectedIds.length === cards.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {selectedIds.length === cards.length ? '取消全選' : '全選圖卡'}
          </button>
          <span className="text-slate-400">|</span>
          {cards.map((card) => {
            const checked = selectedIds.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => toggleCardSelection(card.id)}
                className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  checked
                    ? 'border-sky-600 bg-sky-50 text-sky-800 font-medium'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                }`}
              >
                {card.word}
              </button>
            );
          })}
        </div>
      </section>

      {/* A4 Sheets Preview & Print Output */}
      <div className="space-y-8 flex flex-col items-center">
        {layoutMode === 'duplex'
          ? duplexPages.map((page, pageIdx) => (
              <React.Fragment key={`duplex-${pageIdx}`}>
                {/* FRONT SHEET */}
                <div className="print-only-sheet w-full max-w-[794px] bg-white border border-slate-200 shadow-sm rounded-xl p-6 print:p-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-100">
                    <span>KebbiCard Studio · A4 雙面列印正面</span>
                    <span className="tabular-nums">第 {pageIdx + 1} 組 — 正面（圖案＋文字＋注音）</span>
                  </div>
                  <div
                    className={`grid grid-cols-2 ${
                      gridDensity === '2x2' ? 'gap-6' : 'gap-4'
                    }`}
                  >
                    {page.frontSlots.map((slot, sIdx) => (
                      <div
                        key={`f-${pageIdx}-${sIdx}`}
                        className={`relative ${
                          showCropMarks ? 'p-2 border border-dashed border-slate-300 rounded-2xl' : ''
                        }`}
                      >
                        {slot ? (
                          <FlashcardFace
                            card={slot}
                            side="front"
                            compact={gridDensity === '2x3'}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full aspect-[3/4]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BACK SHEET (Horizontally mirrored rows for duplex alignment) */}
                <div className="print-only-sheet w-full max-w-[794px] bg-white border border-slate-200 shadow-sm rounded-xl p-6 print:p-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-100">
                    <span>KebbiCard Studio · A4 雙面列印背面（已自動左右鏡像對齊）</span>
                    <span className="tabular-nums">第 {pageIdx + 1} 組 — 背面（QR Code＋文字＋注音）</span>
                  </div>
                  <div
                    className={`grid grid-cols-2 ${
                      gridDensity === '2x2' ? 'gap-6' : 'gap-4'
                    }`}
                  >
                    {page.backSlots.map((slot, sIdx) => (
                      <div
                        key={`b-${pageIdx}-${sIdx}`}
                        className={`relative ${
                          showCropMarks ? 'p-2 border border-dashed border-slate-300 rounded-2xl' : ''
                        }`}
                      >
                        {slot ? (
                          <FlashcardFace
                            card={slot}
                            side="back"
                            compact={gridDensity === '2x3'}
                            showJsonCaption={showJsonCaption}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full aspect-[3/4]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            ))
          : foldPages.map((pageCards, pageIdx) => (
              <div
                key={`fold-${pageIdx}`}
                className="print-only-sheet w-full max-w-[794px] bg-white border border-slate-200 shadow-sm rounded-xl p-6 print:p-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-100">
                  <span>KebbiCard Studio · 單面列印對折卡片</span>
                  <span className="tabular-nums">第 {pageIdx + 1} 頁（沿中央虛線對折黏貼）</span>
                </div>
                <div className="space-y-4">
                  {pageCards.map((card) => (
                    <div
                      key={`fold-card-${card.id}`}
                      className={`grid grid-cols-[1fr_auto_1fr] items-stretch gap-3 ${
                        showCropMarks
                          ? 'p-2.5 border border-dashed border-slate-300 rounded-2xl'
                          : ''
                      }`}
                    >
                      <FlashcardFace card={card} side="front" compact className="w-full" />
                      <div className="flex flex-col items-center justify-center px-1">
                        <div className="w-px flex-1 border-l-2 border-dashed border-amber-400" />
                        <span className="text-[10px] text-amber-600 font-medium py-1.5 [writing-mode:vertical-rl]">
                          對折線
                        </span>
                        <div className="w-px flex-1 border-l-2 border-dashed border-amber-400" />
                      </div>
                      <FlashcardFace
                        card={card}
                        side="back"
                        compact
                        showJsonCaption={showJsonCaption}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
