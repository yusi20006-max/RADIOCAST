import React, { useState } from 'react';
import {
  Wand2,
  FileText,
  Sparkles,
  Users,
  User,
  MessageSquareText,
  Zap,
  Volume2,
  Gauge,
  Sliders,
  Music,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { PodcastFormat, PodcastTone, PlaybackSpeed, BgmStyle, AiProviderType } from '../types/podcast';
import { FORMAT_OPTIONS, TONE_OPTIONS, SPEED_OPTIONS, BGM_PRESETS, VOICE_OPTIONS } from '../utils/constants';
import { PERSIAN_SAMPLE_ARTICLES, SampleArticle } from '../utils/persianSamples';

interface InputStepProps {
  onGenerate: (params: {
    sourceText: string;
    format: PodcastFormat;
    tone: PodcastTone;
    speed: PlaybackSpeed;
    host1Name: string;
    host2Name: string;
    host1Voice: string;
    host2Voice: string;
    bgmStyle: BgmStyle;
    durationTarget: 'short' | 'medium' | 'detailed';
    dynamicToneEnabled: boolean;
  }) => void;
  isGenerating: boolean;
  onOpenApiModal: () => void;
  provider: AiProviderType;
  externalProviderName: string;
}

export const InputStep: React.FC<InputStepProps> = ({
  onGenerate,
  isGenerating,
  onOpenApiModal,
  provider,
  externalProviderName,
}) => {
  const [sourceText, setSourceText] = useState<string>(PERSIAN_SAMPLE_ARTICLES[0].text);
  const [selectedFormat, setSelectedFormat] = useState<PodcastFormat>('dual');
  const [selectedTone, setSelectedTone] = useState<PodcastTone>('friendly');
  const [selectedSpeed, setSelectedSpeed] = useState<PlaybackSpeed>('normal');
  const [selectedBgm, setSelectedBgm] = useState<BgmStyle>('lofi');
  const [durationTarget, setDurationTarget] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [dynamicToneEnabled, setDynamicToneEnabled] = useState<boolean>(true);

  const [host1Name, setHost1Name] = useState<string>('نیما');
  const [host2Name, setHost2Name] = useState<string>('سارا');
  const [host1Voice, setHost1Voice] = useState<string>('Puck');
  const [host2Voice, setHost2Voice] = useState<string>('Kore');

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;

  const handleSelectSample = (sample: SampleArticle) => {
    setSourceText(sample.text);
    setSelectedTone(sample.suggestedTone);
    setSelectedBgm(sample.suggestedBgm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) return;

    onGenerate({
      sourceText,
      format: selectedFormat,
      tone: selectedTone,
      speed: selectedSpeed,
      host1Name,
      host2Name,
      host1Voice,
      host2Voice,
      bgmStyle: selectedBgm,
      durationTarget,
      dynamicToneEnabled,
    });
  };

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-slate-900/90 border border-purple-500/20 p-5 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تبدیل هوشمند هر متنی به یک پادکست رادیویی شنیدنی</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            استودیوی ساخت پادکست فارسی با هوش مصنوعی
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            کافیست مقاله، خلاصه کتاب، خبر یا یادداشت‌های خود را در کادر زیر وارد کنید. هوش مصنوعی آن را به یک فیلم‌نامه رادیویی طبیعی با گفتگوهای جذاب، لحن دلخواه، موسیقی متن هماهنگ و صدای فوق‌العاده باکیفیت تبدیل می‌کند.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-purple-500/20">
            <span className="text-xs text-slate-400 font-medium">موتور فعال هوش مصنوعی:</span>
            <button
              type="button"
              onClick={onOpenApiModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{provider === 'google' ? 'Google AI Studio (Gemini 3.8 Flash)' : externalProviderName}</span>
              <span className="text-[10px] text-purple-400 underline mr-1">تغییر یا تست سلامت API</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Text Input & Sample Pickers */}
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                ۱
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                متن اولیه یا موضوع پادکست
              </h3>
            </div>

            {/* Samples loader */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">نمونه‌های آماده:</span>
              {PERSIAN_SAMPLE_ARTICLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-purple-900/30 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 transition-all font-medium"
                >
                  {sample.category}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="متن، مقاله، خلاصه یا ایده پادکست خود را به زبان فارسی در اینجا بنویسید یا کپی کنید..."
              rows={7}
              maxLength={8000}
              className="w-full bg-slate-950/70 border border-slate-700/70 rounded-2xl p-4 text-slate-100 text-sm leading-relaxed placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
              dir="rtl"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-xs text-slate-400">
              <span>تعداد واژگان: {wordCount.toLocaleString('fa-IR')} کلمه</span>
              <span>نویسه‌ها: {sourceText.length.toLocaleString('fa-IR')} از ۸۰۰۰</span>
            </div>
          </div>
        </div>

        {/* Step 2: Format & Podcast Style */}
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              ۲
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">قالب و سبک برنامه</h3>
              <p className="text-xs text-slate-400">ساختار روایت پادکست خود را انتخاب نمایید</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {fmt.id === 'dual' && '🎙️👥'}
                      {fmt.id === 'solo' && '🎙️👤'}
                      {fmt.id === 'interview' && '🎙️💬'}
                      {fmt.id === 'briefing' && '⚡📻'}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{fmt.labelFa}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{fmt.descFa}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Speed & Tone Customization (Requested Feature) */}
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              ۳
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تنظیم لحن و سرعت صدا</h3>
              <p className="text-xs text-slate-400">حس و ریتم گویندگی خروجی را مشخص کنید</p>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🎭</span>
              <span>لحن و احساس بیان (Tone):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {TONE_OPTIONS.map((tone) => {
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{tone.emoji}</span>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                    </div>
                    <span className="text-xs font-bold text-white">{tone.labelFa}</span>
                    <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">{tone.descFa}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed Selector */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>سرعت خوانش و پخش صدا (Playback Speed):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SPEED_OPTIONS.map((spd) => {
                const isSelected = selectedSpeed === spd.id;
                return (
                  <button
                    key={spd.id}
                    type="button"
                    onClick={() => setSelectedSpeed(spd.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{spd.labelFa}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">{spd.descFa}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Tone by Paragraph Option (Requested Feature) */}
          <div className="pt-2 border-t border-slate-800">
            <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-slate-950/50 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      تغییر خودکار لحن بر اساس پاراگراف (لحن تطبیقی و هوشمند)
                    </h4>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                      پویا
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    جملات پرسشی با لحن کنجکاو، نکات غافلگیرکننده با لحن هیجان‌زده و پرانرژی، و استنتاج‌ها با لحن متفکرانه و عمیق بیان می‌شوند.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={dynamicToneEnabled}
                  onChange={(e) => setDynamicToneEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Step 4: Background Music & Audio Cues */}
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              ۴
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">موسیقی پس‌زمینه و افکت‌ها</h3>
              <p className="text-xs text-slate-400">اتمسفر صوتی و استایل موزیک اپیزود را انتخاب کنید</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BGM_PRESETS.map((bgm) => {
              const isSelected = selectedBgm === bgm.id;
              return (
                <button
                  key={bgm.id}
                  type="button"
                  onClick={() => setSelectedBgm(bgm.id)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-pink-600/15 border-pink-500 ring-1 ring-pink-500'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Music className={`w-4 h-4 ${isSelected ? 'text-pink-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-white">{bgm.nameFa}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{bgm.descriptionFa}</p>
                    <span className="inline-block text-[10px] text-purple-300 font-mono mt-1">
                      {bgm.tempo}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options Toggle (Host Names & Voices) */}
        <div className="border border-slate-800/80 rounded-2xl bg-slate-950/50 p-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-slate-300 hover:text-white text-xs font-semibold"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              تنظیمات پیشرفته گویندگان و مدت‌زمان اپیزود
            </span>
            <span className="text-purple-400">{showAdvanced ? 'بستن ▲' : 'مشاهده جزییات ▼'}</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
              {/* Host 1 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">نام و صدای میزبان اول:</label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="text"
                    value={host1Name}
                    onChange={(e) => setHost1Name(e.target.value)}
                    placeholder="نام میزبان اول"
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <select
                    value={host1Voice}
                    onChange={(e) => setHost1Voice(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameFa.split(' ')[0]} ({v.genderFa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Host 2 */}
              {selectedFormat !== 'solo' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">نام و صدای میزبان دوم / کارشناس:</label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={host2Name}
                      onChange={(e) => setHost2Name(e.target.value)}
                      placeholder="نام همکار"
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={host2Voice}
                      onChange={(e) => setHost2Voice(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white"
                    >
                      {VOICE_OPTIONS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nameFa.split(' ')[0]} ({v.genderFa})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Duration target */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">عمق و طول اپیزود:</label>
                <select
                  value={durationTarget}
                  onChange={(e) => setDurationTarget(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="short">کوتاه و متمرکز (۵ تا ۸ دیالوگ)</option>
                  <option value="medium">متوسط استاندارد (۸ تا ۱۴ دیالوگ)</option>
                  <option value="detailed">جامع و تحلیلی (۱۴ تا ۲۰ دیالوگ)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center justify-center pt-2 gap-3">
          <button
            type="submit"
            disabled={isGenerating || !sourceText.trim()}
            className="relative group w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-extrabold text-base shadow-xl shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>در حال نگارش سناریوی پادکست با هوش مصنوعی...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>ساخت سناریو و استارت پادکست فارسی</span>
              </>
            )}
          </button>
          <span className="text-xs text-slate-400">
            پس از ساخت سناریو، می‌توانید تک‌تک دیالوگ‌ها را ویرایش و با موسیقی ترکیب کنید.
          </span>
        </div>
      </form>
    </div>
  );
};
