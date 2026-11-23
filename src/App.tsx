import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { STARTER_FLASHCARDS } from './data/zhuyinDict';
import { AppTab, Flashcard } from './types/flashcard';
import { StudioView } from './components/StudioView';
import { PrintWorkbench } from './components/PrintWorkbench';
import { KebbiSimulator } from './components/KebbiSimulator';
import { AndroidSdkHub } from './components/AndroidSdkHub';

const STORAGE_KEY = 'kebbi_card_studio_deck_v1';

function loadInitialCards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Flashcard[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to starter cards
  }
  return STARTER_FLASHCARDS;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('studio');
  const [cards, setCards] = useState<Flashcard[]>(loadInitialCards);
  const [selectedId, setSelectedId] = useState<string>(() => loadInitialCards()[0]?.id ?? '');
  const [toast, setToast] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [cards]);

  const notify = (message: string) => {
    setToast(message);
    window.clearTimeout((notify as unknown as { timer?: number }).timer);
    (notify as unknown as { timer?: number }).timer = window.setTimeout(() => {
      setToast('');
    }, 2800);
  };

  const handleUpdateCard = (updated: Flashcard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddCard = (newCard: Flashcard) => {
    setCards((prev) => [...prev, newCard]);
    setSelectedId(newCard.id);
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (selectedId === id && next.length > 0) {
        setSelectedId(next[0].id);
      }
      return next;
    });
    notify('已刪除圖卡');
  };

  const handleReplaceAllCards = (imported: Flashcard[]) => {
    setCards(imported);
    if (imported.length > 0) {
      setSelectedId(imported[0].id);
    }
  };

  const handlePrimaryPrintAction = () => {
    if (activeTab !== 'print') {
      setActiveTab('print');
      setTimeout(() => window.print(), 250);
    } else {
      window.print();
    }
  };

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'studio', label: '圖卡工作室' },
    { id: 'print', label: 'A4 列印排版' },
    { id: 'simulator', label: '凱比模擬器' },
    { id: 'sdk', label: '機器人 SDK' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-slate-900">
      {/* Three-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E4E4DF]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('studio');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            KebbiCard Studio
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="flex items-center gap-6 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action button */}
          <div className="shrink-0">
            <button
              onClick={handlePrimaryPrintAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              列印圖卡
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8 print:p-0 print:max-w-none">
        {activeTab === 'studio' && (
          <StudioView
            cards={cards}
            selectedId={selectedId}
            onSelectCard={setSelectedId}
            onUpdateCard={handleUpdateCard}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onReplaceAllCards={handleReplaceAllCards}
            onNotify={notify}
          />
        )}

        {activeTab === 'print' && <PrintWorkbench cards={cards} />}

        {activeTab === 'simulator' && <KebbiSimulator cards={cards} />}

        {activeTab === 'sdk' && <AndroidSdkHub onNotify={notify} />}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-[#E4E4DF] bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>KebbiCard Studio · 離線 QR Code 語音圖卡與 Kebbi Air SDK 工具</span>
          <button
            onClick={() => {
              setCards(STARTER_FLASHCARDS);
              setSelectedId(STARTER_FLASHCARDS[0].id);
              notify('已恢復預設 4 張範例圖卡（佩佩豬、加一分、餅乾、喝水）');
            }}
            className="text-slate-500 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
          >
            重設為預設範例圖卡
          </button>
        </div>
      </footer>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
