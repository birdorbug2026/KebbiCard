import React, { useState } from 'react';
import { Check, Copy, Download, FileCode2, ShieldCheck } from 'lucide-react';
import { KEBBI_ANDROID_FILES, downloadKebbiAndroidZip } from '../utils/kebbiAndroidProject';

export const AndroidSdkHub: React.FC<{ onNotify: (msg: string) => void }> = ({ onNotify }) => {
  const [selectedPath, setSelectedPath] = useState(KEBBI_ANDROID_FILES[1].path);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const activeFile =
    KEBBI_ANDROID_FILES.find((f) => f.path === selectedPath) ?? KEBBI_ANDROID_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      onNotify(`已複製 ${activeFile.path}`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('複製失敗，請手動選取程式碼');
    }
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      await downloadKebbiAndroidZip();
      onNotify('已開始下載 KebbiQrOfflineReader-Android.zip');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Offline Architecture Overview */}
      <section className="bg-white border border-[#E4E4DF] rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Kebbi Air 離線掃碼語音 Android 專案 (Nuwa SDK)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              專為凱比機器人無網路環境打造：採用 CameraX + ZXing 純本機 QR 解碼，並結合 NuwaRobotAPI.startTTS() 與 Android 原生繁體中文離線 TextToSpeech 雙重語音備援。
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            {downloading ? '正在打包專案...' : '下載完整 Android Studio 專案 (.zip)'}
          </button>
        </div>

        {/* 4-step offline deployment checklist */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5">
          {[
            {
              step: '01. 雙眼即時鏡頭畫面',
              detail: '使用 CameraX ImageAnalysis + ZXing Core 離線解碼，並將鏡頭畫面直接嵌入凱比兩隻眼睛內。',
            },
            {
              step: '02. 雙重離線 TTS',
              detail: '優先呼叫 NuwaRobotAPI.startTTS()；若斷網導致服務異常，自動接手 Android 系統離線繁中語音。',
            },
            {
              step: '03. 下載並放入 NuwaSDK',
              detail: '至官方 GitBook「Download archive」下載最新 2021-07-08 ver 0.0.19（對應 Robot SDK 1.1.4 - Kebbi-air），將解壓出的 .aar 放入 app/libs/。',
            },
            {
              step: '04. 可愛大臉表情動畫',
              detail: '螢幕全畫面顯示凱比眨眼與說話笑臉動畫（無系統字幕遮擋），輕觸臉部即可重播詞彙。',
            },
          ].map((item) => (
            <div key={item.step} className="bg-[#FAFAF8] border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 mb-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{item.step}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code Browser */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* File List */}
        <aside className="lg:col-span-4 bg-white border border-[#E4E4DF] rounded-xl p-4 space-y-1.5">
          <div className="px-2 pb-2 mb-1 border-b border-slate-100 text-xs font-semibold text-slate-500">
            專案檔案結構（KebbiQrOfflineReader）
          </div>
          {KEBBI_ANDROID_FILES.map((file) => {
            const active = file.path === activeFile.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedPath(file.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                  active
                    ? 'bg-sky-50 text-sky-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileCode2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                <span className="font-mono break-all leading-snug">{file.path}</span>
              </button>
            );
          })}
        </aside>

        {/* Source Viewer */}
        <div className="lg:col-span-8 bg-white border border-[#E4E4DF] rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-[#FAFAF8]">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-slate-900 truncate">
                {activeFile.path}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{activeFile.summary}</p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已複製' : '複製程式碼'}
            </button>
          </div>
          <pre className="p-5 text-xs leading-relaxed font-mono text-slate-800 bg-white overflow-x-auto max-h-[600px] overflow-y-auto">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </section>
    </div>
  );
};
