import React from 'react';
import { X, Sparkles, Music, Gauge, Share2, Mic2, HelpCircle, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl min-w-0 my-auto bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-black text-white">راهنمای ساخت پادکست رادیو کست</h3>
          </div>
          <p className="text-xs text-slate-400">
            چگونه با هوش مصنوعی هر متن، خبر یا مقاله‌ای را به یک پادکست حرفه‌ای تبدیل کنیم؟
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs">
                ۱
              </span>
              ورود متن و انتخاب قالب
            </h4>
            <p className="text-slate-400 text-xs">
              متن مقاله، داستان، خبر یا خلاصهٔ کتاب را تا سقف ۸۰۰۰ نویسه می‌توانید وارد کنید. سپس از بین قالب‌های گفتگوی دونفره (شبیه به NotebookLM)، تک‌نفره، مصاحبه یا کپسول خلاصه یکی را انتخاب کنید.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">
                ۲
              </span>
              تنظیم لحن و سرعت صدا (همراه با لحن تطبیقی پاراگراف‌ها)
            </h4>
            <p className="text-slate-400 text-xs">
              لحن کلی گفتار (شاد، جدی، دوستانه، داستانی یا طنزآمیز) و تمایل سرعت خوانش قابل تنظیم هستند؛ سرعت دقیق پخش را می‌توانید در پلیر تغییر دهید. همچنین با فعال‌سازی <strong>«لحن تطبیقی پاراگراف به پاراگراف»</strong>، جملات پرسشی به صورت خودکار با لحن کنجکاوانه، تعجب‌ها با هیجان و شگفتی، و استنتاج‌ها با لحنی متفکرانه ادا می‌شوند. همچنین می‌توانید در ویرایشگر، لحن هر پاراگراف را به صورت جداگانه تغییر دهید.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center text-xs">
                ۳
              </span>
              موسیقی پس‌زمینه و افکت‌ها (Audio Ducking)
            </h4>
            <p className="text-slate-400 text-xs">
              می‌توانید از چند سبک موسیقی زمینهٔ الگوریتمی (لوفای، امبینت، ریتم گرم، سینمایی یا الهام‌گرفته از موسیقی ایرانی) استفاده کنید؛ این‌ها اجرای ساز زنده یا قطعات ضبط‌شده نیستند. سیستم به صورت خودکار قابلیت Ducking دارد؛ یعنی موقع صحبت گوینده، صدای موسیقی آرام می‌شود و در فواصل سکوت و اینترو بالا می‌آید.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs">
                ۴
              </span>
              دانلود و اشتراک‌گذاری خروجی
            </h4>
            <p className="text-slate-400 text-xs">
              پس از موفقیت تولید صدا و میکس، فایل MP3 با نرخ ۱۹۲ کیلوبیت‌برثانیه قابل دانلود است. همچنین می‌توانید متن دیالوگ‌ها و یادداشت‌های برنامه را دریافت یا لینک برنامه را به اشتراک بگذارید.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            متوجه شدم، بزن بریم استودیو!
          </button>
        </div>
      </div>
    </div>
  );
};
