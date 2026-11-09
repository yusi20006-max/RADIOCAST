import { Mic2, Radio, Library, Sparkles, Volume2, Info, Cpu, Rss, Download } from 'lucide-react';
import { AiProviderType } from '../types/podcast';

interface HeaderProps {
  currentTab: 'studio' | 'library';
  setCurrentTab: (tab: 'studio' | 'library') => void;
  savedEpisodesCount: number;
  onOpenGuide: () => void;
  onOpenApiModal: () => void;
  onOpenRssModal: () => void;
  onOpenExportModal?: () => void;
  provider: AiProviderType;
  externalProviderName: string;
  isGeneratingAudio?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  savedEpisodesCount,
  onOpenGuide,
  onOpenApiModal,
  onOpenRssModal,
  onOpenExportModal,
  provider,
  externalProviderName,
  isGeneratingAudio,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl w-full min-w-0 mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          <div className="relative flex shrink-0 items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/30">
            <Radio className="w-6 h-6 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black bg-gradient-to-r from-purple-200 via-white to-pink-200 bg-clip-text text-transparent">
                رادیو کست
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider">
                استودیو هوش مصنوعی
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              تولید خودکار پادکست‌های حرفه‌ای فارسی با صدای طبیعی و موسیقی متن
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-2">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            <span>استودیوی ساخت</span>
            {isGeneratingAudio && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('library')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'library'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>آرشیو پادکست‌ها</span>
            {savedEpisodesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-purple-500/30 text-purple-200 text-xs font-bold">
                {savedEpisodesCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 hover:border-purple-500/60 text-slate-200 transition-all cursor-pointer"
            title="مدیریت موتور هوش مصنوعی و کلیدهای خارجی"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">موتور AI:</span>
            <span className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {provider === 'google' ? 'Google AI Studio' : externalProviderName || 'خارجی'}
            </span>
          </button>

          <button
            onClick={onOpenRssModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer shadow-sm shadow-amber-950/40"
            title="ساخت و دریافت پیش‌نویس فایل RSS"
          >
            <Rss className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">فید RSS</span>
          </button>

          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 hover:border-purple-300 text-purple-200 hover:text-white transition-all cursor-pointer shadow-sm shadow-purple-950/40"
              title="دریافت فایل زیپ سورس کامل پروژه و راهنمای ساخت APK اندروید"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">خروجی (ZIP / APK)</span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            title="راهنمای استودیو و امکانات"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
