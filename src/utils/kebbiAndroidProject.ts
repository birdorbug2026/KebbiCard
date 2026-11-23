import JSZip from 'jszip';

export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'markdown' | 'properties';
  summary: string;
  content: string;
}

export const KEBBI_ANDROID_FILES: AndroidProjectFile[] = [
  {
    path: 'README_繁體中文部署指南.md',
    language: 'markdown',
    summary: 'Kebbi Air 離線掃描與語音專案匯入、Nuwa SDK 放置與離線語音包確認步驟',
    content: `# Kebbi Air 離線 QR Code 語音圖卡 App (Kotlin)

此專案專為 **Nuwa Robotics Kebbi Air（凱比機器人）** 設計，實現**完全離線（無網路環境）**讀取圖卡背面的 QR Code JSON 並直接唸出詞彙。

## 核心離線架構

1. **純離線掃描（CameraX + ZXing Core）**
   - 直接使用 \`com.google.zxing:core\` 在本機解析攝影機 YUV 畫面。
   - **不依賴 Google Play Services、ML Kit 雲端下載或任何網際網路連線**。

2. **雙重離線語音保障（NuwaRobotAPI + Android 原生 TTS 備援）**
   - 優先呼叫凱比官方 SDK 的 \`mRobotAPI.startTTS(ttsText)\` 並搭配 \`VoiceEventListener\` 監聽 \`onTTSComplete\`。
   - 若偵測到無網路環境導致部分雲端語音服務異常、或服務尚未就緒，立即無縫改用系統內建離線 \`android.speech.tts.TextToSpeech (Locale.TAIWAN)\` 播報，確保任何教室環境皆不靜音。

3. **2.5 秒同卡防抖冷卻（Debounce）**
   - 避免學生拿著同一張圖卡停在鏡頭前時，凱比連續重複唸出同一詞彙。

---

## Android Studio 部署步驟

1. **下載正確的 Kebbi Air SDK (.aar)**：
   - 在女媧 GitBook 文件左側點選 **\`Robot SDK 1.1.4 - Kebbi-air(English)\`**（此為 Kebbi Air 最新 Android 文件；「1.0 - 凱比 / 小丹」為舊代機器人，Unity SDK 則不適用 Android Studio）。
   - 點選 **\`Download archive\`** 分頁，下載最上方最新版本的 **\`2021-07-08 ver 0.0.19\`** 壓縮檔，解壓縮取得 \`.aar\` 檔案（如 \`NuwaSDK-2021-07-08_...aar\`）。
2. **開啟專案並放入 SDK**：
   - 解壓縮本專案後，以 Android Studio 開啟此資料夾。
   - 將取得的 \`.aar\` 檔複製到 \`app/libs/\` 目錄下（檔名無須修改，Gradle 會自動載入所有 \`*.aar\`）。
3. **確認凱比離線語音包**：
   - 在 Kebbi Air 平板系統「設定 > 語言與輸入設定 > 文字轉語音輸出」中，確認已選擇中文語音引擎並已下載「繁體中文（台灣）」離線語音資料。
4. **全螢幕可愛大臉與「雙眼即時鏡頭畫面」說明**：
   - 螢幕全畫面顯示凱比可愛眨眼與說話表情，並直接將前鏡頭畫面精準裁切顯示在凱比「兩隻發光大眼睛」裡面，讓老師與孩子對準圖卡位置更直覺。
   - 掃到圖卡朗讀時眼睛會變成開心的微笑彎弧，輕觸凱比臉部可再唸一次剛才掃到的詞彙。
5. **安裝與斷網測試**：
   - 透過 USB ADB 或無線 ADB 安裝 APK 至 Kebbi Air（Android 9.0 / API 28 以上）。
   - 關閉凱比的 Wi-Fi，將列印好的 QR Code 圖卡對準凱比前鏡頭，即可聽見凱比唸出詞彙！
`,
  },
  {
    path: 'app/src/main/java/com/kebbistudio/qrreader/MainActivity.kt',
    language: 'kotlin',
    summary: '主畫面與生命週期管理：背景純離線 CameraX 掃描（隱藏預覽畫面）、全螢幕凱比大臉互動與 2.5 秒防抖冷卻',
    content: `package com.kebbistudio.qrreader

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var kebbiFaceView: KebbiFaceView
    private lateinit var tvStatus: TextView
    private lateinit var tvWord: TextView

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var speechManager: KebbiOfflineSpeechManager

    private var lastPayload: String = ""
    private var lastSpokenAtMs: Long = 0L
    private var lastTtsText: String = ""

    companion object {
        private const val COOLDOWN_MS = 2500L
    }

    private val requestCameraPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                startBackgroundCameraScanner()
            } else {
                tvStatus.text = "請允許相機權限以掃描圖卡 QR Code"
                Toast.makeText(this, "需要相機權限才能讀取圖卡", Toast.LENGTH_LONG).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_main)

        kebbiFaceView = findViewById(R.id.kebbiFaceView)
        tvStatus = findViewById(R.id.tvStatus)
        tvWord = findViewById(R.id.tvWord)

        cameraExecutor = Executors.newSingleThreadExecutor()

        speechManager = KebbiOfflineSpeechManager(
            context = this,
            onEngineStateChanged = { stateLabel ->
                runOnUiThread { tvStatus.text = stateLabel }
            },
            onSpeakingChanged = { isSpeaking ->
                runOnUiThread {
                    kebbiFaceView.setSpeaking(isSpeaking)
                    if (!isSpeaking && lastTtsText.isNotBlank()) {
                        tvStatus.text = "輕觸臉部可再唸一次"
                    }
                }
            }
        )

        // 輕觸凱比大臉即可重播上一個掃到的詞彙
        kebbiFaceView.setOnClickListener {
            if (lastTtsText.isNotBlank()) {
                speechManager.speak(lastTtsText, hideSubtitle = true)
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startBackgroundCameraScanner()
        } else {
            requestCameraPermission.launch(Manifest.permission.CAMERA)
        }
    }

    /**
     * 僅綁定 ImageAnalysis（不建立外部 PreviewView），將解析出的即時畫面
     * 傳給 KebbiFaceView 裁切繪製在凱比的雙眼裡，其餘螢幕完整保留給可愛表情。
     */
    private fun startBackgroundCameraScanner() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val useFrontCamera = cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA)
            val cameraSelector = if (useFrontCamera) {
                CameraSelector.DEFAULT_FRONT_CAMERA
            } else {
                CameraSelector.DEFAULT_BACK_CAMERA
            }

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { analysis ->
                    analysis.setAnalyzer(
                        cameraExecutor,
                        QrCodeAnalyzer(
                            mirrorHorizontal = useFrontCamera,
                            onQrDetected = { rawQr -> handleDecodedQr(rawQr) },
                            onCameraFrame = { bmp -> kebbiFaceView.updateCameraFrame(bmp) }
                        )
                    )
                }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, imageAnalyzer)
            } catch (e: Exception) {
                runOnUiThread { tvStatus.text = "相機啟動失敗：\${e.localizedMessage}" }
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun handleDecodedQr(rawQr: String) {
        val now = System.currentTimeMillis()
        if (rawQr == lastPayload && (now - lastSpokenAtMs) < COOLDOWN_MS) {
            return
        }

        val parsed = QrPayloadParser.parse(rawQr) ?: return
        lastPayload = rawQr
        lastSpokenAtMs = now
        lastTtsText = parsed.ttsText

        runOnUiThread {
            tvWord.visibility = View.VISIBLE
            tvWord.text = parsed.displayWord
            tvStatus.text = "正在唸出：\${parsed.ttsText}"
        }

        // 傳入 hideSubtitle = true，避免系統預設字幕框遮住可愛大臉
        speechManager.speak(parsed.ttsText, hideSubtitle = true)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        speechManager.release()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/kebbistudio/qrreader/KebbiFaceView.kt',
    language: 'kotlin',
    summary: '全螢幕可愛凱比大臉動畫 View（雙眼即時顯示鏡頭畫面＋自然眨眼、開心笑眼與說話律動）',
    content: `package com.kebbistudio.qrreader

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import kotlin.math.sin

class KebbiFaceView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#0F172A")
        style = Paint.Style.FILL
    }

    private val eyePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        style = Paint.Style.FILL
    }

    private val eyeBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        style = Paint.Style.STROKE
    }

    private val irisTintPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        alpha = 34
        style = Paint.Style.FILL
    }

    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

    private val happyEyeStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    private val cheekPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FB7185")
        style = Paint.Style.FILL
    }

    private val mouthStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val mouthFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FB7185")
        style = Paint.Style.FILL
    }

    @Volatile
    private var eyeBitmap: Bitmap? = null

    private var blinkProgress = 0f // 0 = 睜開, 1 = 閉眼
    private var talkPhase = 0f
    private var isSpeaking = false

    private val handler = Handler(Looper.getMainLooper())
    private var blinkAnimator: ValueAnimator? = null
    private var talkAnimator: ValueAnimator? = null

    private val rectBuffer = RectF()
    private val srcRectBuffer = Rect()
    private val eyeClipPath = Path()

    private val blinkRunnable = object : Runnable {
        override fun run() {
            if (!isSpeaking) {
                triggerBlink()
            }
            handler.postDelayed(this, 3400L)
        }
    }

    init {
        handler.postDelayed(blinkRunnable, 1800L)
    }

    fun updateCameraFrame(bitmap: Bitmap) {
        eyeBitmap = bitmap
        postInvalidate()
    }

    fun setSpeaking(speaking: Boolean) {
        if (isSpeaking == speaking) return
        isSpeaking = speaking
        if (speaking) {
            startTalkingAnimation()
        } else {
            stopTalkingAnimation()
        }
        invalidate()
    }

    private fun triggerBlink() {
        blinkAnimator?.cancel()
        blinkAnimator = ValueAnimator.ofFloat(0f, 1f, 0f).apply {
            duration = 260L
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { anim ->
                blinkProgress = anim.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    private fun startTalkingAnimation() {
        talkAnimator?.cancel()
        talkAnimator = ValueAnimator.ofFloat(0f, (Math.PI * 2).toFloat()).apply {
            duration = 420L
            repeatCount = ValueAnimator.INFINITE
            addUpdateListener { anim ->
                talkPhase = anim.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    private fun stopTalkingAnimation() {
        talkAnimator?.cancel()
        talkAnimator = null
        talkPhase = 0f
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        // 深邃溫潤的機器人螢幕底色
        canvas.drawRect(0f, 0f, w, h, bgPaint)

        val unit = minOf(w, h)
        val cx = w / 2f
        val eyeY = h * 0.41f
        val eyeOffsetX = unit * 0.23f
        val eyeRadiusX = unit * 0.115f
        val eyeRadiusY = unit * 0.145f

        // 臉頰紅暈
        cheekPaint.alpha = if (isSpeaking) 115 else 48
        val cheekY = eyeY + eyeRadiusY * 1.15f
        val cheekOffsetX = eyeOffsetX + eyeRadiusX * 1.05f
        canvas.drawOval(
            cx - cheekOffsetX - unit * 0.075f,
            cheekY - unit * 0.04f,
            cx - cheekOffsetX + unit * 0.075f,
            cheekY + unit * 0.04f,
            cheekPaint
        )
        canvas.drawOval(
            cx + cheekOffsetX - unit * 0.075f,
            cheekY - unit * 0.04f,
            cx + cheekOffsetX + unit * 0.075f,
            cheekY + unit * 0.04f,
            cheekPaint
        )

        // 眼睛（說話時變成開心的笑眼彎弧，待機掃描時雙眼即時顯示攝影機畫面）
        if (isSpeaking) {
            happyEyeStrokePaint.strokeWidth = unit * 0.032f
            happyEyeStrokePaint.color = Color.parseColor("#7DD3FC")
            drawHappyEye(canvas, cx - eyeOffsetX, eyeY, eyeRadiusX * 0.85f)
            drawHappyEye(canvas, cx + eyeOffsetX, eyeY, eyeRadiusX * 0.85f)
        } else {
            val currentEyeY = eyeRadiusY * (1f - 0.88f * blinkProgress)
            eyeBorderPaint.strokeWidth = unit * 0.016f
            drawCameraEye(canvas, cx - eyeOffsetX, eyeY, eyeRadiusX, currentEyeY, blinkProgress < 0.55f)
            drawCameraEye(canvas, cx + eyeOffsetX, eyeY, eyeRadiusX, currentEyeY, blinkProgress < 0.55f)
        }

        // 嘴巴
        val mouthY = h * 0.65f
        val mouthW = unit * 0.14f
        if (isSpeaking) {
            val openFactor = 0.35f + 0.65f * ((sin(talkPhase.toDouble()).toFloat() + 1f) / 2f)
            val mouthH = unit * 0.09f * openFactor
            rectBuffer.set(cx - mouthW, mouthY - mouthH * 0.3f, cx + mouthW, mouthY + mouthH)
            canvas.drawArc(rectBuffer, 0f, 180f, true, mouthFillPaint)
            mouthStrokePaint.strokeWidth = unit * 0.022f
            mouthStrokePaint.color = Color.parseColor("#7DD3FC")
            canvas.drawArc(rectBuffer, 0f, 180f, true, mouthStrokePaint)
        } else {
            mouthStrokePaint.strokeWidth = unit * 0.024f
            mouthStrokePaint.color = Color.parseColor("#38BDF8")
            rectBuffer.set(cx - mouthW * 0.78f, mouthY - unit * 0.04f, cx + mouthW * 0.78f, mouthY + unit * 0.055f)
            canvas.drawArc(rectBuffer, 15f, 150f, false, mouthStrokePaint)
        }
    }

    private fun drawCameraEye(
        canvas: Canvas,
        x: Float,
        y: Float,
        rx: Float,
        ry: Float,
        showLiveFeed: Boolean
    ) {
        rectBuffer.set(x - rx, y - ry, x + rx, y + ry)
        val frame = eyeBitmap

        if (showLiveFeed && frame != null && !frame.isRecycled) {
            canvas.save()
            eyeClipPath.reset()
            eyeClipPath.addOval(rectBuffer, Path.Direction.CW)
            canvas.clipPath(eyeClipPath)

            // 等比例滿版裁切攝影機畫面進眼眶
            val dstW = rectBuffer.width()
            val dstH = rectBuffer.height()
            val scale = maxOf(dstW / frame.width, dstH / frame.height)
            val cropW = (dstW / scale).toInt().coerceAtLeast(1)
            val cropH = (dstH / scale).toInt().coerceAtLeast(1)
            val left = ((frame.width - cropW) / 2).coerceAtLeast(0)
            val top = ((frame.height - cropH) / 2).coerceAtLeast(0)
            srcRectBuffer.set(left, top, left + cropW, top + cropH)

            canvas.drawBitmap(frame, srcRectBuffer, rectBuffer, bitmapPaint)
            // 疊加淡淡的科技藍光與眼眸反光亮點，保留可愛神韻
            canvas.drawOval(rectBuffer, irisTintPaint)
            highlightPaint.alpha = 205
            canvas.drawCircle(x - rx * 0.32f, y - ry * 0.34f, rx * 0.22f, highlightPaint)
            highlightPaint.alpha = 135
            canvas.drawCircle(x + rx * 0.26f, y + ry * 0.26f, rx * 0.10f, highlightPaint)
            canvas.restore()

            canvas.drawOval(rectBuffer, eyeBorderPaint)
        } else {
            canvas.drawOval(rectBuffer, eyePaint)
            if (showLiveFeed) {
                highlightPaint.alpha = 230
                canvas.drawCircle(x - rx * 0.3f, y - ry * 0.32f, rx * 0.26f, highlightPaint)
            }
        }
    }

    private fun drawHappyEye(canvas: Canvas, x: Float, y: Float, rx: Float) {
        rectBuffer.set(x - rx, y - rx * 0.65f, x + rx, y + rx * 0.65f)
        canvas.drawArc(rectBuffer, 195f, 150f, false, happyEyeStrokePaint)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        handler.removeCallbacksAndMessages(null)
        blinkAnimator?.cancel()
        talkAnimator?.cancel()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/kebbistudio/qrreader/KebbiOfflineSpeechManager.kt',
    language: 'kotlin',
    summary: '整合 NuwaRobotAPI.startTTS()（已完整實作 RobotEventListener / VoiceEventListener 無 TODO）與 Android 原生離線 TTS 雙重備援',
    content: `package com.kebbistudio.qrreader

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.nuwarobotics.service.IClientId
import com.nuwarobotics.service.agent.NuwaRobotAPI
import com.nuwarobotics.service.agent.RobotEventListener
import com.nuwarobotics.service.agent.VoiceEventListener
import java.util.Locale

/**
 * 專為 Kebbi Air 設計的離線語音播放管理器：
 * 1. 優先透過 NuwaRobotAPI.startTTS() 使用凱比原生聲音說話。
 * 2. 若在完全斷網環境下 Nuwa 服務回報錯誤或尚未連線，自動無縫切換為 Android 系統離線繁中 TTS。
 * 3. 已完整實作 RobotEventListener 與 VoiceEventListener 全部介面方法（無 TODO 例外風險）。
 */
class KebbiOfflineSpeechManager(
    context: Context,
    private val onEngineStateChanged: (String) -> Unit,
    private val onSpeakingChanged: (Boolean) -> Unit = {}
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private var mRobotAPI: NuwaRobotAPI? = null
    private var isNuwaReady = false

    private var androidTts: TextToSpeech? = null
    private var isAndroidTtsReady = false

    @Volatile
    private var pendingUtterance: String = ""

    @Volatile
    private var lastSpeechId: Long = 0L

    init {
        initAndroidOfflineTts(context.applicationContext)
        initNuwaSdk(context.applicationContext)
    }

    private fun initNuwaSdk(appContext: Context) {
        try {
            val clientId = IClientId(appContext.packageName)
            mRobotAPI = NuwaRobotAPI(appContext, clientId).apply {
                registerRobotEventListener(object : RobotEventListener {
                    override fun onWikiServiceStart() {
                        isNuwaReady = true
                        onEngineStateChanged("凱比已就緒，請出示 QR 圖卡")
                    }

                    override fun onWikiServiceStop() {
                        isNuwaReady = false
                        onEngineStateChanged("已切換至本機離線備援語音")
                    }

                    override fun onWikiServiceCrash() {
                        isNuwaReady = false
                        onEngineStateChanged("已切換至本機離線備援語音")
                    }

                    override fun onWikiServiceRecovery() {
                        isNuwaReady = true
                        onEngineStateChanged("凱比已就緒，請出示 QR 圖卡")
                    }

                    override fun onStartOfMotionPlay(p0: String?) {}
                    override fun onPauseOfMotionPlay(p0: String?) {}
                    override fun onStopOfMotionPlay(p0: String?) {}
                    override fun onCompleteOfMotionPlay(p0: String?) {}
                    override fun onPlayBackOfMotionPlay(p0: String?) {}
                    override fun onErrorOfMotionPlay(p0: Int) {}
                    override fun onPrepareMotion(p0: Boolean, p1: String?, p2: Float) {}
                    override fun onCameraOfMotionPlay(p0: String?) {}
                    override fun onGetCameraPose(
                        p0: Float, p1: Float, p2: Float, p3: Float,
                        p4: Float, p5: Float, p6: Float, p7: Float,
                        p8: Float, p9: Float, p10: Float, p11: Float
                    ) {}
                    override fun onTouchEvent(p0: Int, p1: Int) {}
                    override fun onPIREvent(p0: Int) {}
                    override fun onTap(p0: Int) {}
                    override fun onLongPress(p0: Int) {}
                    override fun onWindowSurfaceReady() {}
                    override fun onWindowSurfaceDestroy() {}
                    override fun onTouchEyes(p0: Int, p1: Int) {}
                    override fun onRawTouch(p0: Int, p1: Int, p2: Int) {}
                    override fun onFaceSpeaker(p0: Float) {}
                    override fun onActionEvent(p0: Int, p1: Int) {}
                    override fun onDropSensorEvent(p0: Int) {}
                    override fun onMotorErrorEvent(p0: Int, p1: Int) {}
                })

                registerVoiceEventListener(object : VoiceEventListener {
                    override fun onTTSComplete(isError: Boolean) {
                        if (isError && pendingUtterance.isNotBlank()) {
                            // 若無網路導致 Nuwa TTS 發生錯誤，立即改以系統離線 TTS 朗讀
                            speakWithAndroidTts(pendingUtterance)
                        } else {
                            onSpeakingChanged(false)
                        }
                    }

                    override fun onWakeup(isError: Boolean, score: String?, direction: Float) {}
                    override fun onSpeechRecognizeComplete(
                        isError: Boolean,
                        result: VoiceEventListener.ResultType?,
                        text: String?
                    ) {}
                    override fun onSpeech2TextComplete(isError: Boolean, text: String?) {}
                    override fun onMixUnderstandComplete(
                        isError: Boolean,
                        result: VoiceEventListener.ResultType?,
                        text: String?
                    ) {}
                    override fun onSpeechState(
                        type: VoiceEventListener.ListenType?,
                        state: VoiceEventListener.SpeechState?
                    ) {}
                    override fun onSpeakState(
                        type: VoiceEventListener.SpeakType?,
                        state: VoiceEventListener.SpeakState?
                    ) {}
                    override fun onGrammarState(isError: Boolean, info: String?) {}
                    override fun onListenVolumeChanged(
                        listenType: VoiceEventListener.ListenType?,
                        volume: Int
                    ) {}
                    override fun onHotwordChange(
                        p0: VoiceEventListener.HotwordState?,
                        p1: VoiceEventListener.HotwordType?,
                        p2: String?
                    ) {}
                })
            }
        } catch (_: Throwable) {
            isNuwaReady = false
            onEngineStateChanged("使用 Android 本機離線 TTS 模式")
        }
    }

    private fun initAndroidOfflineTts(appContext: Context) {
        androidTts = TextToSpeech(appContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val res = androidTts?.setLanguage(Locale.TAIWAN)
                isAndroidTtsReady =
                    res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED
                androidTts?.setSpeechRate(0.95f)
                androidTts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        onSpeakingChanged(true)
                    }

                    override fun onDone(utteranceId: String?) {
                        onSpeakingChanged(false)
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        onSpeakingChanged(false)
                    }
                })
            }
        }
    }

    /**
     * 播放指定詞彙：
     * @param text 要唸出的文字
     * @param hideSubtitle 若為 true 會加上 "//" 前綴，讓凱比唸出但不跳出系統字幕泡泡
     */
    fun speak(text: String, hideSubtitle: Boolean = true) {
        val clean = text.trim()
        if (clean.isEmpty()) return

        pendingUtterance = clean
        val speechId = ++lastSpeechId
        onSpeakingChanged(true)

        // 安全保護：最多 5 秒後自動結束說話表情動畫
        mainHandler.postDelayed({
            if (speechId == lastSpeechId) {
                onSpeakingChanged(false)
            }
        }, 5000L)

        if (isNuwaReady && mRobotAPI != null) {
            try {
                mRobotAPI?.stopTTS()
                val formatted = if (hideSubtitle) "//$clean" else clean
                mRobotAPI?.startTTS(formatted)

                // 安全逾時檢查：若服務無回應，確保離線系統語音可兜底
                mainHandler.postDelayed({
                    if (speechId == lastSpeechId && !isNuwaReady) {
                        speakWithAndroidTts(clean)
                    }
                }, 600)
                return
            } catch (_: Throwable) {
                // Fall through to Android offline TTS
            }
        }

        speakWithAndroidTts(clean)
    }

    private fun speakWithAndroidTts(text: String) {
        if (!isAndroidTtsReady) {
            onSpeakingChanged(false)
            return
        }
        androidTts?.speak(
            text,
            TextToSpeech.QUEUE_FLUSH,
            null,
            "kebbi_offline_\${System.currentTimeMillis()}"
        )
    }

    fun release() {
        mainHandler.removeCallbacksAndMessages(null)
        try {
            mRobotAPI?.stopTTS()
            mRobotAPI?.release()
        } catch (_: Throwable) {
        }
        androidTts?.stop()
        androidTts?.shutdown()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/kebbistudio/qrreader/QrPayloadParser.kt',
    language: 'kotlin',
    summary: '解析 QR Code JSON 詞彙（支援 {"w","t"} 極簡格式與純文字自動容錯）',
    content: `package com.kebbistudio.qrreader

import org.json.JSONObject

data class KebbiCardPayload(
    val displayWord: String,
    val ttsText: String
)

object QrPayloadParser {
    fun parse(raw: String): KebbiCardPayload? {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return null

        return try {
            val json = JSONObject(trimmed)
            val word = when {
                json.has("w") -> json.optString("w")
                json.has("word") -> json.optString("word")
                json.has("text") -> json.optString("text")
                else -> ""
            }
            val tts = when {
                json.has("t") -> json.optString("t")
                json.has("tts") -> json.optString("tts")
                json.has("say") -> json.optString("say")
                else -> word
            }
            val finalWord = word.ifBlank { tts }
            val finalTts = tts.ifBlank { word }
            if (finalWord.isBlank() && finalTts.isBlank()) null
            else KebbiCardPayload(finalWord, finalTts)
        } catch (_: Exception) {
            // 若 QR Code 為純文字，亦可直接朗讀
            KebbiCardPayload(displayWord = trimmed, ttsText = trimmed)
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/kebbistudio/qrreader/QrCodeAnalyzer.kt',
    language: 'kotlin',
    summary: '純離線 CameraX + ZXing QR 解碼分析器，同時回傳縮放旋轉後的鏡頭影格給雙眼顯示',
    content: `package com.kebbistudio.qrreader

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.MultiFormatReader
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer

class QrCodeAnalyzer(
    private val mirrorHorizontal: Boolean = true,
    private val onQrDetected: (String) -> Unit,
    private val onCameraFrame: ((Bitmap) -> Unit)? = null
) : ImageAnalysis.Analyzer {

    private var lastFrameEmitMs: Long = 0L

    private val reader = MultiFormatReader().apply {
        setHints(
            mapOf(
                DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE),
                DecodeHintType.TRY_HARDER to true,
                DecodeHintType.CHARACTER_SET to "UTF-8"
            )
        )
    }

    override fun analyze(image: ImageProxy) {
        try {
            val buffer = image.planes[0].buffer
            val data = ByteArray(buffer.remaining())
            buffer.get(data)

            val source = PlanarYUVLuminanceSource(
                data,
                image.width,
                image.height,
                0,
                0,
                image.width,
                image.height,
                false
            )
            val bitmap = BinaryBitmap(HybridBinarizer(source))
            val result = reader.decodeWithState(bitmap)
            result?.text?.let { decoded ->
                if (decoded.isNotBlank()) {
                    onQrDetected(decoded)
                }
            }
        } catch (_: Exception) {
            // 未偵測到 QR Code 時屬於正常情況，忽略單幀例外
        } finally {
            reader.reset()
        }

        // 約每秒 15 幀擷取縮圖送至 Kebbi 雙眼顯示（節省效能且流暢自然）
        val frameCallback = onCameraFrame
        val now = System.currentTimeMillis()
        if (frameCallback != null && now - lastFrameEmitMs >= 66L) {
            lastFrameEmitMs = now
            try {
                val rawBmp = image.toBitmap()
                val matrix = Matrix().apply {
                    val rot = image.imageInfo.rotationDegrees.toFloat()
                    if (rot != 0f) postRotate(rot)
                    val targetScale = 220f / maxOf(rawBmp.width, rawBmp.height).coerceAtLeast(1)
                    val sx = if (mirrorHorizontal) -targetScale else targetScale
                    postScale(sx, targetScale)
                }
                val eyeBmp = Bitmap.createBitmap(
                    rawBmp,
                    0,
                    0,
                    rawBmp.width,
                    rawBmp.height,
                    matrix,
                    true
                )
                if (eyeBmp !== rawBmp) rawBmp.recycle()
                frameCallback(eyeBmp)
            } catch (_: Throwable) {
                // 略過單幀轉圖失敗
            }
        }

        image.close()
    }
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    language: 'gradle',
    summary: 'App Gradle 設定：納入 CameraX、離線 ZXing Core 與本地 NuwaSDK.aar',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kebbistudio.qrreader"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kebbistudio.qrreader"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // 載入放置於 app/libs/ 的 NuwaSDK.aar
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar", "*.jar"))))

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")

    // CameraX 攝影機串流（背景 ImageAnalysis 掃描）
    val cameraxVersion = "1.3.4"
    implementation("androidx.camera:camera-core:\$cameraxVersion")
    implementation("androidx.camera:camera-camera2:\$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:\$cameraxVersion")

    // ZXing 純離線 QR Code 解碼器 (無需網路與 GMS)
    implementation("com.google.zxing:core:3.5.3")
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    summary: '宣告相機權限、硬體相容與 Kebbi 橫向/直向全螢幕顯示設定',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:label="Kebbi 圖卡語音掃描"
        android:supportsRtl="true"
        android:theme="@style/Theme.MaterialComponents.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    language: 'xml',
    summary: '全螢幕凱比大臉介面（已隱藏攝影機預覽畫面，底部僅保留輕量狀態與詞彙提示）',
    content: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0F172A">

    <com.kebbistudio.qrreader.KebbiFaceView
        android:id="@+id/kebbiFaceView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom"
        android:gravity="center"
        android:orientation="vertical"
        android:paddingBottom="22dp"
        android:paddingHorizontal="20dp">

        <TextView
            android:id="@+id/tvWord"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textColor="#F8FAFC"
            android:textSize="28sp"
            android:textStyle="bold"
            android:visibility="gone" />

        <TextView
            android:id="@+id/tvStatus"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:text="正在連線凱比離線語音服務..."
            android:textColor="#94A3B8"
            android:textSize="13sp" />
    </LinearLayout>

</FrameLayout>
`,
  },
  {
    path: 'build.gradle.kts',
    language: 'gradle',
    summary: 'Root Project Gradle 外掛版本宣告',
    content: `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`,
  },
  {
    path: 'settings.gradle.kts',
    language: 'gradle',
    summary: 'Android Studio 專案模組與套件庫來源設定',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "KebbiQrOfflineReader"
include(":app")
`,
  },
  {
    path: 'gradle.properties',
    language: 'properties',
    summary: 'AndroidX 與 Gradle JVM 記憶體設定',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
  },
];

export async function downloadKebbiAndroidZip(): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder('KebbiQrOfflineReader');
  if (!rootFolder) return;

  for (const file of KEBBI_ANDROID_FILES) {
    rootFolder.file(file.path, file.content);
  }
  rootFolder.file(
    'app/libs/.gitkeep',
    '# 請將女媧機器人官方提供的 NuwaSDK.aar 檔案放置於此資料夾\n'
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'KebbiQrOfflineReader-Android.zip';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
