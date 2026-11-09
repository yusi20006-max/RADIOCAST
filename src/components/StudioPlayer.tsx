import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Disc,
  Radio,
  Sliders,
  Sparkles,
  ArrowRight,
  Gauge,
  Music,
  Bookmark,
  Check,
  Palette,
  Rss,
  Image as ImageIcon,
} from 'lucide-react';
import { DialogueTurn, PodcastEpisode, PlaybackSpeed } from '../types/podcast';
import { SPEED_OPTIONS, BGM_PRESETS } from '../utils/constants';

interface StudioPlayerProps {
  episode: PodcastEpisode;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  activeTurnIndex: number;
  currentPlaybackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onOpenShareModal: () => void;
  onQuickDownloadMp3: () => void;
  onBackToEditor: () => void;
  onSaveToLibrary: () => void;
  onOpenCoverModal: () => void;
  onOpenRssModal: () => void;
  isSaved: boolean;
}

export const StudioPlayer: React.FC<StudioPlayerProps> = ({
  episode,
  isPlaying,
  onTogglePlay,
  onSeek,
  currentTime,
  duration,
  activeTurnIndex,
  currentPlaybackRate,
  onChangePlaybackRate,
  onOpenShareModal,
  onQuickDownloadMp3,
  onBackToEditor,
  onSaveToLibrary,
  onOpenCoverModal,
  onOpenRssModal,
  isSaved,
}) => {
  const activeTurnRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll active dialogue turn into view smoothly
  useEffect(() => {
    if (activeTurnRef.current) {
      activeTurnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeTurnIndex]);

  // Audio wave visualizer canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 48;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        // Wave formula based on time and index
        let barHeight = 4;
        if (isPlaying) {
          const wave1 = Math.sin(phase + i * 0.25);
          const wave2 = Math.cos(phase * 0.7 + i * 0.15);
          const amp = Math.abs(wave1 * 0.6 + wave2 * 0.4);
          barHeight = 4 + amp * (height - 8);
        } else {
          barHeight = 4 + Math.sin(i * 0.3) * 3;
        }

        const y = (height - barHeight) / 2;

        // Gradient color: purple to pink
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#c084fc');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#ec4899');

        ctx.fillStyle = isPlaying ? grad : '#475569';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08 * currentPlaybackRate;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentPlaybackRate]);

  // Format seconds into mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '۰۰:۰۰';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '۰' + m : m}:${s < 10 ? '۰' + s : s}`.replace(/\d/g, (d) =>
      '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]
    );
  };

  const activeTurn = episode.script[activeTurnIndex] || episode.script[0];
  const isHost1 = activeTurn?.speaker === 'host1';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToEditor}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>ویرایش متن و دیالوگ‌ها</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCoverModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white transition-all cursor-pointer"
            title="طراحی و دانلود کاور آرت ۳۰۰۰×۳۰۰۰"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>کاور آرت</span>
          </button>

          <button
            onClick={onOpenRssModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer"
            title="فید RSS پادکست و انتشار در پادگیرها"
          >
            <Rss className="w-4 h-4 text-amber-400" />
            <span>فید RSS</span>
          </button>

          <button
            onClick={onSaveToLibrary}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? 'ذخیره شد' : 'ذخیره'}</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>اشتراک‌گذاری</span>
          </button>
        </div>
      </div>

      {/* Hero Visualizer & Active Speaker Spotlight */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Active Host Avatar & Info */}
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="relative">
              {episode.coverArtUrl ? (
                <div
                  onClick={onOpenCoverModal}
                  className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl ring-4 ring-purple-500/40 cursor-pointer hover:scale-105 transition-transform"
                  title="کلیک برای ویرایش کاور آرت"
                >
                  <img src={episode.coverArtUrl} alt="Cover Art" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl ring-4 transition-all duration-500 ${
                    isHost1
                      ? 'bg-gradient-to-tr from-purple-700 to-indigo-500 text-white ring-purple-500/40 shadow-purple-900/40'
                      : 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white ring-pink-500/40 shadow-pink-900/40'
                  }`}
                >
                  {activeTurn?.speakerName?.[0] || '🎙️'}
                </div>
              )}
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  <span>در حال صحبت</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-lg font-bold text-white">{activeTurn?.speakerName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-mono">
                  {isHost1 ? episode.host1Voice : episode.host2Voice}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm line-clamp-1">
                {activeTurn?.speechStyle || 'پادکست رادیویی با بیان طبیعی'}
              </p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start text-[11px] text-slate-400">
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>
                  موسیقی:{' '}
                  {BGM_PRESETS.find((b) => b.id === episode.suggestedBgm)?.nameFa.split(' ')[0] ||
                    'خاموش'}
                </span>
                <span className="text-slate-600">•</span>
                <span>بخش {activeTurnIndex + 1} از {episode.script.length}</span>
              </div>
            </div>
          </div>

          {/* Real-time Waveform Canvas */}
          <div className="w-full sm:w-64 flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={240}
              height={44}
              className="w-full max-w-[240px] h-11 rounded-xl bg-slate-950/60 p-1 border border-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              ویژوالایزر امواج صوتی
            </span>
          </div>
        </div>

        {/* Highlighted current speech line (Large billboard) */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-5 min-h-[90px] flex items-center justify-center text-center">
          <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed max-w-2xl">
            «{activeTurn?.text}»
          </p>
        </div>
      </div>

      {/* Floating Audio Controller Bar */}
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-purple-500/30 p-5 shadow-2xl space-y-4">
        {/* Progress Bar & Timers */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={Math.max(1, duration)}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Quick Speed Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-1">
            <Gauge className="w-4 h-4 text-slate-400 ml-1" />
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  Math.abs(currentPlaybackRate - rate) < 0.05
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Central Play/Pause Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="۱۰ ثانیه عقب"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={onTogglePlay}
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40 transition-all transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'توقف' : 'پخش پادکست'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="۱۰ ثانیه جلو"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Quick MP3 Download */}
          <button
            onClick={onQuickDownloadMp3}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            title="دانلود فایل خروجی MP3"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>دانلود MP3</span>
          </button>
        </div>
      </div>

      {/* Synchronized Transcript View (Karaoke auto-scrolling) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>متن کامل پادکست (همگام با صدای گوینده)</span>
          </h3>
          <span className="text-xs text-slate-400">
            روی هر بخش کلیک کنید تا پخش از آنجا شروع شود
          </span>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto p-2 rounded-3xl bg-slate-950/40 border border-slate-900 scroll-smooth">
          {episode.script.map((turn, idx) => {
            const isActive = idx === activeTurnIndex;
            const isTurnHost1 = turn.speaker === 'host1';

            return (
              <div
                key={turn.id}
                ref={isActive ? activeTurnRef : null}
                onClick={() => {
                  // Calculate approximate seek time
                  const avgTurnDuration = duration / Math.max(1, episode.script.length);
                  onSeek(idx * avgTurnDuration);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-900/40 border-purple-500 shadow-xl ring-2 ring-purple-500/20 scale-[1.01]'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isTurnHost1
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-pink-500/20 text-pink-300'
                      }`}
                    >
                      {turn.speakerName}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        در حال پخش
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    بخش {idx + 1}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{turn.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
