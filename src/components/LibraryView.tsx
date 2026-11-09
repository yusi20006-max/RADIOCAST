import React from 'react';
import {
  Library,
  Play,
  Trash2,
  Calendar,
  Clock,
  Music,
  Download,
  Share2,
  Mic2,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { PodcastEpisode } from '../types/podcast';
import { BGM_PRESETS, FORMAT_OPTIONS, TONE_OPTIONS } from '../utils/constants';

interface LibraryViewProps {
  savedEpisodes: PodcastEpisode[];
  onSelectEpisode: (episode: PodcastEpisode) => void;
  onDeleteEpisode: (id: string) => void;
  onNewPodcast: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  savedEpisodes,
  onSelectEpisode,
  onDeleteEpisode,
  onNewPodcast,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Library className="w-6 h-6 text-purple-400" />
            <span>آرشیو پادکست‌های من</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تمامی اپیزودهای تولید شده در مرورگر شما ذخیره شده و در هر زمان قابل بازپخش و دانلود هستند.
          </p>
        </div>

        <button
          onClick={onNewPodcast}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ساخت اپیزود جدید</span>
        </button>
      </div>

      {/* Episodes Grid or Empty State */}
      {savedEpisodes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto">
            <Mic2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">هنوز هیچ پادکستی ذخیره نکرده‌اید!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            به بخش استودیوی ساخت بروید و با وارد کردن هر متن فارسی، اولین پادکست رادیویی خود را خلق کنید.
          </p>
          <button
            onClick={onNewPodcast}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
          >
            شروع ساخت پادکست
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedEpisodes.map((ep) => {
            const formatInfo = FORMAT_OPTIONS.find((f) => f.id === ep.format);
            const toneInfo = TONE_OPTIONS.find((t) => t.id === ep.tone);
            const bgmInfo = BGM_PRESETS.find((b) => b.id === ep.suggestedBgm);

            return (
              <div
                key={ep.id}
                className="group relative rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 p-5 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between gap-4"
              >
                {/* Top: Badges & Delete */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                      {formatInfo?.labelFa.split(' ')[0] || 'پادکست'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {toneInfo?.emoji} {toneInfo?.labelFa}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteEpisode(ep.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                    title="حذف از آرشیو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Middle: Title & Summary with Cover Art */}
                <div className="flex gap-3.5 items-start cursor-pointer" onClick={() => onSelectEpisode(ep)}>
                  {ep.coverArtUrl && (
                    <img
                      src={ep.coverArtUrl}
                      alt={ep.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-purple-500/30 shadow-md"
                    />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ep.episodeSummary}
                    </p>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ep.createdAt).toLocaleDateString('fa-IR')}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-pink-400" />
                    <span>{bgmInfo?.nameFa.split(' ')[0] || 'خاموش'}</span>
                  </span>
                  <span>{ep.script.length} نوبت گفتگو</span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onSelectEpisode(ep)}
                  className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>پخش و ویرایش در استودیو</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
