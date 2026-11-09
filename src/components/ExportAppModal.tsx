import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  FolderArchive,
  Github,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  Layers,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
} from 'lucide-react';

interface ExportAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ExportAppModal: React.FC<ExportAppModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'apk' | 'github'>('zip');
  const [copiedPwaUrl, setCopiedPwaUrl] = useState(false);
  const [copiedNpmCmd, setCopiedNpmCmd] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://radiocast.studio';
  const zipDownloadUrl = '/api/download/source-zip';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedPwaUrl(true);
    onToast('آدرس برنامه جهت ساخت APK یا نصب موبایل کپی شد.');
    setTimeout(() => setCopiedPwaUrl(false), 2500);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npm install && npm run dev');
    setCopiedNpmCmd(true);
    onToast('دستور اجرای لوکال کپی شد.');
    setTimeout(() => setCopiedNpmCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl min-w-0 my-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">دریافت خروجی، فایل ZIP و APK اپلیکیشن</h3>
              <p className="text-xs text-slate-400">دریافت بستهٔ ZIP موجود، راهنمای ساخت APK و دسترسی به مخزن GitHub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/70 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>دانلود بستهٔ ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>فایل APK و نسخه اندروید</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'github'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>اتصال به GitHub</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-200 min-w-0">
          {/* TAB 1: ZIP FILE DOWNLOAD */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-purple-400" />
                      فایل ZIP ذخیره‌شده در مخزن آماده دریافت است
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      این فایل یک snapshot از سورس است و ممکن است آخرین تغییرات مخزن را نداشته باشد. برای دریافت نسخهٔ به‌روز، مخزن GitHub را باز کنید.
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold shrink-0">
                    بستهٔ سورس
                  </span>
                </div>

                <a
                  href={zipDownloadUrl}
                  download="radiocast-podcast-studio.zip"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>دریافت فایل radiocast-podcast-studio.zip</span>
                </a>
              </div>

              {/* What's inside */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300">محتویات داخل بسته فشرده:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>کد کامل فرانت‌اند (React 19, TypeScript, Tailwind)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <span>سرور Express با Gemini AI و تولید فید RSS</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                    <span>موتور صوتی Web Audio + خروجی MP3 استودیویی</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>استودیوی تولید خودکار کاور آرت (Canvas)</span>
                  </div>
                </div>
              </div>

              {/* How to run locally */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    نحوه اجرا روی کامپیوتر شخصی (Localhost):
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedNpmCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedNpmCmd ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs text-purple-300 flex items-center justify-between">
                  <code>npm install && npm run dev</code>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  فایل <span className="font-mono text-slate-200">.env.example</span> را به <span className="font-mono text-slate-200">.env</span> کپی کنید و کلید Gemini را فقط روی سرور امن قرار دهید؛ کلید را داخل کد فرانت‌اند یا مخزن عمومی قرار ندهید.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: APK & ANDROID */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  دو روش ساده برای استفاده در گوشی اندروید:
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  این برنامه را می‌توانید از مرورگر به صفحهٔ اصلی گوشی اضافه کنید. ساخت APK با ابزارهایی مانند PWABuilder به اعتبارسنجی PWA، تنظیمات بسته و امضای خروجی وابسته است و زمان یا نتیجهٔ آن تضمین‌شده نیست.
                </p>
              </div>

              {/* Method 1: Instant Install (PWA) */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    ۱
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-white">
                    نصب مستقیم روی گوشی (سریع‌ترین راه - بدون نیاز به دانلود APK)
                  </h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  آدرس این برنامه را در مرورگر کروم یا سامسونگ گوشی اندرویدی خود باز کنید. منوی ۳ نقطه مرورگر را باز کرده و گزینه <strong className="text-emerald-300">«افزودن به صفحه اصلی» (Install app / Add to Home screen)</strong> را لمس کنید. برنامه با آیکون اختصاصی و پنجره تمام‌صفحه دقیقاً مانند یک اپلیکیشن بومی روی گوشی شما قرار می‌گیرد.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedPwaUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPwaUrl ? 'کپی شد' : 'کپی لینک'}</span>
                  </button>
                </div>
              </div>

              {/* Method 2: Convert to APK via PWABuilder */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    ۲
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-white">
                    ساخت بستهٔ اندروید با PWABuilder
                  </h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ابزار <strong>PWABuilder</strong> می‌تواند برای وب‌اپلیکیشن‌های سازگار بستهٔ اندروید بسازد. ممکن است برای تکمیل تنظیمات، اعتبارسنجی دامنه و امضای بسته به مراحل بیشتری نیاز باشد:
                </p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside pr-1">
                  <li>لینک بالا را کپی کنید.</li>
                  <li>وارد سایت <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-purple-400 underline font-mono">pwabuilder.com</a> شوید.</li>
                  <li>لینک را در کادر قرار داده و دکمه Start را بزنید.</li>
                  <li>در بخش Android تنظیمات بسته را بررسی و فرایند ساخت را دنبال کنید؛ تحویل APK فوری یا بدون خطا تضمین نمی‌شود.</li>
                </ol>
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ورود مستقیم به PWABuilder و ساخت APK</span>
                </a>
              </div>

              {/* Method 3: Capacitor */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                💡 <span className="text-slate-300 font-bold">برای برنامه‌نویسان:</span> با دانلود سورس و ساخت پروژه با Capacitor می‌توانید APK اختصاصی بسازید. نصب برنامه به‌تنهایی به معنی اجرای آفلاین نیست؛ تولید سناریو و صدا همچنان به سرور و اینترنت نیاز دارد.
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB EXPORT */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Github className="w-4 h-4 text-indigo-400" />
                  خروجی مستقیم به گیت‌هاب (Google AI Studio Export)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اگر می‌خواهید این پروژه مستقیماً در مخزن گیت‌هاب شما (GitHub Repository) ذخیره شود و کنترل نسخه‌ها، مشارکت تیمی یا دیپلوی روی Vercel / Render / Cloud Run را فعال کنید:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <p className="font-semibold text-indigo-300">مراحل خروجی گیت‌هاب در همین صفحه:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pr-1">
                    <li>در بالای صفحه AI Studio، روی آیکون منو یا گزینه <strong>Export</strong> کلیک کنید.</li>
                    <li>گزینه <strong>Push to GitHub</strong> یا <strong>Export to GitHub</strong> را انتخاب کنید.</li>
                    <li>اکانت گیت‌هاب خود را تایید کنید تا تمامی کدهای استودیو در یک ریپازیتوری جدید برای شما بارگذاری شوند.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            نسخه ۱.۰.۰ استودیو رادیو کست
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
