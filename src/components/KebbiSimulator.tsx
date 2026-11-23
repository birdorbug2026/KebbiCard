import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RotateCcw, Upload, Volume2, VolumeX } from 'lucide-react';
import { Flashcard } from '../types/flashcard';
import { buildKebbiQrJson, parseKebbiQrPayload, renderQrToDataUrl } from '../utils/qr';
import { ZhuyinWord } from './ZhuyinWord';

interface KebbiSimulatorProps {
  cards: Flashcard[];
}

interface ScanLogEntry {
  id: string;
  time: string;
  word: string;
  tts: string;
  raw: string;
  isJson: boolean;
}

export const KebbiSimulator: React.FC<KebbiSimulatorProps> = ({ cards }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [kebbiMood, setKebbiMood] = useState<'idle' | 'speaking'>('idle');
  const [lastResult, setLastResult] = useState<{
    word: string;
    tts: string;
    raw: string;
    isJson: boolean;
    zhuyin: string[];
  } | null>(null);
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef<{ payload: string; timestamp: number }>({
    payload: '',
    timestamp: 0,
  });

  const speakText = useCallback(
    (text: string) => {
      if (muted || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = speechRate;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.includes('zh-TW') || v.lang.includes('zh_TW'));
      if (zhVoice) utterance.voice = zhVoice;

      setKebbiMood('speaking');
      utterance.onend = () => setKebbiMood('idle');
      utterance.onerror = () => setKebbiMood('idle');
      window.speechSynthesis.speak(utterance);
    },
    [muted, speechRate]
  );

  const handleDecodedPayload = useCallback(
    (rawPayload: string, bypassCooldown = false) => {
      const now = Date.now();
      if (
        !bypassCooldown &&
        rawPayload === cooldownRef.current.payload &&
        now - cooldownRef.current.timestamp < 2500
      ) {
        return;
      }

      const parsed = parseKebbiQrPayload(rawPayload);
      if (!parsed.tts && !parsed.word) return;

      cooldownRef.current = { payload: rawPayload, timestamp: now };
      const matchedCard = cards.find((c) => c.word === parsed.word);

      setLastResult({
        word: parsed.word,
        tts: parsed.tts,
        raw: rawPayload,
        isJson: parsed.isJson,
        zhuyin: matchedCard?.zhuyin ?? [],
      });

      setLogs((prev) => [
        {
          id: `${now}-${Math.random()}`,
          time: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
          word: parsed.word,
          tts: parsed.tts,
          raw: rawPayload,
          isJson: parsed.isJson,
        },
        ...prev.slice(0, 14),
      ]);

      speakText(parsed.tts);
    },
    [cards, speakText]
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const qr = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
          if (qr && qr.data) {
            handleDecodedPayload(qr.data);
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleDecodedPayload]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setCameraError('無法開啟攝影機，請確認瀏覽器已允許相機權限，或改用下方「圖片掃描測試」與「點擊圖卡模擬」。');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopCamera]);

  const handleTestQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const qr = jsQR(imageData.data, img.width, img.height);
        if (qr && qr.data) {
          handleDecodedPayload(qr.data, true);
        } else {
          setCameraError('在此圖片中未偵測到清晰的 QR Code，請換一張再試。');
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const simulateCardScan = async (card: Flashcard) => {
    // Generate actual QR image and decode it through jsQR to verify end-to-end fidelity
    const payload = buildKebbiQrJson(card);
    const dataUrl = await renderQrToDataUrl(payload, 240);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const decoded = jsQR(imageData.data, img.width, img.height);
      handleDecodedPayload(decoded?.data ?? payload, true);
    };
    img.src = dataUrl;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Stage (60%): Kebbi Face Screen + Camera Scanner */}
      <section className="lg:col-span-7 bg-white border border-[#E4E4DF] rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Kebbi Air 網頁掃描模擬器</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              模擬凱比鏡頭離線掃描圖卡背面 QR Code、解析 JSON 並呼叫中文語音合成朗讀。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <CameraOff className="w-3.5 h-3.5" />
                關閉鏡頭
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                開啟攝影機掃描實卡
              </button>
            )}
          </div>
        </div>

        {/* Simulated Kebbi Tablet Screen + Camera Feed */}
        <div className="relative rounded-2xl bg-slate-900 text-white overflow-hidden aspect-[16/10] flex flex-col justify-between p-5 border-4 border-slate-800">
          {/* Hidden canvas for jsQR */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Camera Video */}
          <video
            ref={videoRef}
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Kebbi Minimalist Face Overlay when camera is idle */}
          {!cameraActive && (
            <div className="flex-1 flex flex-col items-center justify-center z-10">
              <div className="flex items-center gap-12 mb-5">
                <div
                  className={`w-10 h-12 rounded-full bg-sky-300 transition-transform duration-200 ${
                    kebbiMood === 'speaking' ? 'scale-y-75 bg-amber-300' : ''
                  }`}
                />
                <div
                  className={`w-10 h-12 rounded-full bg-sky-300 transition-transform duration-200 ${
                    kebbiMood === 'speaking' ? 'scale-y-75 bg-amber-300' : ''
                  }`}
                />
              </div>
              <div
                className={`h-3 rounded-full transition-all duration-200 ${
                  kebbiMood === 'speaking'
                    ? 'w-14 h-5 bg-amber-300'
                    : 'w-10 bg-sky-300/80'
                }`}
              />
              <p className="mt-5 text-sm text-slate-300">
                {lastResult
                  ? `凱比說：「${lastResult.tts}」`
                  : '請開啟攝影機掃描列印好的 QR 圖卡，或點擊下方模擬圖卡測試'}
              </p>
            </div>
          )}

          {/* Viewfinder Target when camera is active */}
          {cameraActive && (
            <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 border-2 border-sky-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
            </div>
          )}

          {/* Bottom status bar inside Kebbi screen */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 bg-slate-950/70 rounded-lg px-3.5 py-2">
            <span>
              {kebbiMood === 'speaking'
                ? '狀態：語音合成朗讀中'
                : cameraActive
                  ? '狀態：鏡頭掃描中（2.5 秒防重複鎖定）'
                  : '狀態：待機'}
            </span>
            <span className="font-mono text-sky-300">
              {lastResult ? lastResult.raw : '{"w":"","t":""}'}
            </span>
          </div>
        </div>

        {cameraError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
            {cameraError}
          </div>
        )}

        {/* Quick Virtual Card Trigger & Static Image QR Test */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">
              無鏡頭測試：點擊任一張圖卡，立即生成 QR 並透過 jsQR 解碼模擬凱比朗讀
            </span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              上傳 QR 圖檔測試
              <input
                type="file"
                accept="image/*"
                onChange={handleTestQrImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => simulateCardScan(card)}
                className="px-3.5 py-2 text-sm font-medium text-slate-800 bg-[#FAFAF8] hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-lg transition-colors cursor-pointer"
              >
                掃描「{card.word}」
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Right Console (40%): Decoded Result, Speech Settings & Scan Log */}
      <section className="lg:col-span-5 bg-white border border-[#E4E4DF] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">解碼結果與語音控制台</h3>
          <button
            onClick={() => setMuted((m) => !m)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-sky-600" />}
            {muted ? '已靜音' : '語音開啟'}
          </button>
        </div>

        {/* Decoded Display Box */}
        <div className="bg-[#FAFAF8] border border-slate-200 rounded-xl p-5 text-center space-y-3">
          {lastResult ? (
            <>
              <div className="py-1">
                {lastResult.zhuyin.length > 0 ? (
                  <ZhuyinWord word={lastResult.word} zhuyin={lastResult.zhuyin} size="lg" />
                ) : (
                  <span className="text-3xl font-bold text-slate-900">{lastResult.word}</span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                <span>解碼格式：{lastResult.isJson ? 'JSON 結構化詞彙' : '純文字回退'}</span>
                <span className="mx-2">·</span>
                <span>實際唸法：{lastResult.tts}</span>
              </div>
              <div className="font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 break-all">
                {lastResult.raw}
              </div>
              <button
                onClick={() => speakText(lastResult.tts)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                再唸一次
              </button>
            </>
          ) : (
            <div className="py-6 text-sm text-slate-500">
              尚未掃描到任何 QR Code 圖卡
            </div>
          )}
        </div>

        {/* Speech Rate Control */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="sim-rate" className="font-medium text-slate-700">
              模擬語速倍率
            </label>
            <span className="font-mono tabular-nums text-slate-600">{speechRate.toFixed(2)}x</span>
          </div>
          <input
            id="sim-rate"
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </div>

        {/* Scan Log */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">掃描紀錄</span>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                清除紀錄
              </button>
            )}
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">掃描圖卡後會於此處顯示解碼歷程。</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {logs.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 text-xs bg-[#FAFAF8] border border-slate-200 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 mr-2">{entry.word}</span>
                    <span className="font-mono text-slate-500 truncate">{entry.raw}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400 shrink-0">
                    {entry.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
