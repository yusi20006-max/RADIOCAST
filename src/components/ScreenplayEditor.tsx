import React, { useState } from 'react';
import {
  Mic,
  Play,
  Volume2,
  Trash2,
  Plus,
  Sparkles,
  Sliders,
  Music,
  CheckCircle,
  RefreshCw,
  Wand2,
  VolumeX,
  Gauge,
  ArrowRight,
  Disc,
  Palette,
} from 'lucide-react';
import { DialogueTurn, PodcastEpisode, SfxType, BgmStyle, PlaybackSpeed, ParagraphTone } from '../types/podcast';
import { BGM_PRESETS, SFX_OPTIONS, SPEED_OPTIONS, VOICE_OPTIONS, PARAGRAPH_TONE_OPTIONS } from '../utils/constants';

interface ScreenplayEditorProps {
  episode: PodcastEpisode;
  onUpdateEpisode: (updated: PodcastEpisode) => void;
  onSynthesizeAndPlay: () => void;
  isSynthesizing: boolean;
  synthesizingProgress: { current: number; total: number; message: string };
  onBackToInput: () => void;
  onPreviewTurn: (turn: DialogueTurn) => void;
  previewingTurnId: string | null;
  onOpenCoverModal?: () => void;
  onPreviewBgm: (style: BgmStyle) => void;
}

export const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  episode,
  onUpdateEpisode,
  onSynthesizeAndPlay,
  isSynthesizing,
  synthesizingProgress,
  onBackToInput,
  onPreviewTurn,
  previewingTurnId,
  onOpenCoverModal,
  onPreviewBgm,
}) => {
  const [refiningTurnId, setRefiningTurnId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Update a single turn's fields
  const handleTurnTextChange = (id: string, newText: string) => {
    const updatedScript = episode.script.map((turn) =>
      turn.id === id ? { ...turn, text: newText, audioBase64: undefined } : turn
    );
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleSpeakerToggle = (id: string) => {
    const updatedScript = episode.script.map((turn) => {
      if (turn.id === id) {
        const nextSpeaker = turn.speaker === 'host1' ? 'host2' : 'host1';
        const nextName = nextSpeaker === 'host1' ? episode.host1Name : episode.host2Name;
        return {
          ...turn,
          speaker: nextSpeaker as 'host1' | 'host2',
          speakerName: nextName,
          audioBase64: undefined,
        };
      }
      return turn;
    });
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleSfxChange = (id: string, sfx: SfxType) => {
    const updatedScript = episode.script.map((turn) =>
      turn.id === id ? { ...turn, sfxCue: sfx } : turn
    );
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleTurnToneChange = (id: string, tone: ParagraphTone) => {
    const updatedScript = episode.script.map((turn) =>
      turn.id === id ? { ...turn, turnTone: tone, audioBase64: undefined } : turn
    );
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleAutoDetectAllTones = () => {
    const updatedScript = episode.script.map((turn) => {
      let detectedTone: ParagraphTone = 'friendly';
      const text = turn.text;
      if (text.includes('؟') || text.includes('?')) {
        detectedTone = 'curious';
      } else if (text.includes('!') || text.includes('!')) {
        detectedTone = 'excited';
      } else if (text.length > 120 || text.includes('نتیجه') || text.includes('پژوهش') || text.includes('نشان')) {
        detectedTone = 'reflective';
      } else if (text.includes('خنده') || text.includes('جالب') || text.includes('شوخی')) {
        detectedTone = 'humorous';
      }
      return { ...turn, turnTone: detectedTone, audioBase64: undefined };
    });
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleDeleteTurn = (id: string) => {
    if (episode.script.length <= 1) return;
    const updatedScript = episode.script.filter((turn) => turn.id !== id);
    onUpdateEpisode({ ...episode, script: updatedScript });
  };

  const handleAddTurnAfter = (index: number) => {
    const currentTurn = episode.script[index];
    const nextSpeaker = currentTurn.speaker === 'host1' ? 'host2' : 'host1';
    const nextName = nextSpeaker === 'host1' ? episode.host1Name : episode.host2Name;

    const newTurn: DialogueTurn = {
      id: 'turn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      speaker: nextSpeaker as 'host1' | 'host2',
      speakerName: nextName,
      text: 'ادامه گفتگو در اینجا...',
      speechStyle: 'Natural Persian conversation',
      sfxCue: 'none',
    };

    const newScript = [...episode.script];
    newScript.splice(index + 1, 0, newTurn);
    onUpdateEpisode({ ...episode, script: newScript });
  };

  // AI Refine a specific turn
  const handleAiRefine = async (turn: DialogueTurn, instruction: string) => {
    try {
      setIsRefining(true);
      const res = await fetch('/api/podcast/refine-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: turn.text,
          instruction,
          speakerName: turn.speakerName,
          tone: episode.tone,
        }),
      });
      const data = await res.json();
      if (data.refinedText) {
        handleTurnTextChange(turn.id, data.refinedText);
      }
    } catch (e) {
      console.error('Refine failed', e);
    } finally {
      setIsRefining(false);
      setRefiningTurnId(null);
      setRefineInstruction('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back button and Episode Header Card */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToInput}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به متن اولیه</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
            تعداد دیالوگ‌ها: {episode.script.length.toLocaleString('fa-IR')}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            دسته‌بندی: {episode.genre}
          </span>
        </div>
      </div>

      {/* Episode Title & Summary banner with Cover Art */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Cover Art thumbnail or designer trigger */}
          <div className="relative shrink-0 group">
            {episode.coverArtUrl ? (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-lg shadow-purple-950/50">
                <img
                  src={episode.coverArtUrl}
                  alt={episode.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {onOpenCoverModal && (
                  <button
                    onClick={onOpenCoverModal}
                    className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-purple-300" />
                    <span>تغییر کاور</span>
                  </button>
                )}
              </div>
            ) : (
              onOpenCoverModal && (
                <button
                  onClick={onOpenCoverModal}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/40 flex flex-col items-center justify-center gap-1.5 text-purple-300 p-2 text-center transition-all cursor-pointer group shadow-inner"
                  title="طراحی کاور آرت اختصاصی پادکست"
                >
                  <Palette className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-[11px] font-bold leading-tight">طراحی کاور آرت</span>
                </button>
              )
            )}
          </div>

          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <input
                type="text"
                value={episode.title}
                onChange={(e) => onUpdateEpisode({ ...episode, title: e.target.value })}
                className="text-xl sm:text-2xl font-extrabold text-white bg-transparent border-b border-dashed border-slate-700 focus:border-purple-500 outline-none w-full py-1"
                placeholder="عنوان اپیزود پادکست"
              />
            </div>
            <textarea
              value={episode.episodeSummary}
              onChange={(e) => onUpdateEpisode({ ...episode, episodeSummary: e.target.value })}
              className="text-xs sm:text-sm text-slate-300 bg-transparent border border-transparent hover:border-slate-800 focus:border-purple-500 rounded-xl p-2 w-full outline-none leading-relaxed resize-none"
              rows={2}
              placeholder="خلاصه اپیزود و توضیحات..."
            />
          </div>
        </div>

        {/* Tags, chapters and cover art quick button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">تگ‌های پادکست:</span>
            {episode.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-purple-300 border border-purple-500/20 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {onOpenCoverModal && (
            <button
              onClick={onOpenCoverModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-950/40 border border-purple-500/30 hover:border-purple-400 text-purple-200 transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>{episode.coverArtUrl ? 'ویرایش کاور آرت' : 'طراحی کاور آرت پادکست'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sound Settings Bar (Speed, BGM, Master Render) */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">سرعت:</span>
              <select
                value={episode.speed}
                onChange={(e) => onUpdateEpisode({ ...episode, speed: e.target.value as PlaybackSpeed })}
                className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-white focus:ring-1 focus:ring-purple-500 outline-none"
              >
                {SPEED_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.labelFa}
                  </option>
                ))}
              </select>
            </div>

            {/* BGM Selector */}
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">موسیقی زمینه:</span>
              <select
                value={episode.suggestedBgm}
                onChange={(e) => onUpdateEpisode({ ...episode, suggestedBgm: e.target.value as BgmStyle })}
                className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-white focus:ring-1 focus:ring-pink-500 outline-none"
              >
                {BGM_PRESETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameFa.split(' ')[0]} ({b.tempo})
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => onPreviewBgm(episode.suggestedBgm)} className="rounded-lg border border-pink-500/30 bg-pink-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-pink-300 hover:bg-pink-500/20">
                <span className="flex items-center gap-1"><Play className="h-3 w-3" /> پیش‌شنوی آفلاین</span>
              </button>
            </div>

            {/* BGM Volume */}
            {episode.suggestedBgm !== 'none' && (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={episode.bgmVolume}
                  onChange={(e) => onUpdateEpisode({ ...episode, bgmVolume: parseFloat(e.target.value) })}
                  className="w-20 accent-pink-500 cursor-pointer"
                  title="بلندی صدای موسیقی زمینه"
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.round(episode.bgmVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Master Render Button */}
          <button
            onClick={onSynthesizeAndPlay}
            disabled={isSynthesizing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال تولید صوت ({synthesizingProgress.current}/{synthesizingProgress.total}) · {synthesizingProgress.percent.toLocaleString('fa-IR')}٪</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>تولید و میکس کامل پادکست</span>
              </>
            )}
          </button>
        </div>

        {/* Progress bar during synthesis */}
        {isSynthesizing && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${synthesizingProgress.percent}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{synthesizingProgress.message}</span>
              <span>
                {synthesizingProgress.percent.toLocaleString('fa-IR')}٪
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Screenplay Turn List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-2">
          <span>دیالوگ‌ها را می‌توانید مستقیماً ویرایش کرده یا با هوش مصنوعی بازنویسی کنید:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoDetectAllTones}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
              title="بررسی ساختار جملات و اعمال خودکار لحن کنجکاو برای سوالات و هیجان‌زده برای تعجب‌ها"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تطبیق هوشمند لحن جملات</span>
            </button>
            <span>کلیک روی نام گوینده جهت جابجایی بین مجری‌ها</span>
          </div>
        </div>

        {episode.script.map((turn, index) => {
          const isHost1 = turn.speaker === 'host1';
          const isPreviewing = previewingTurnId === turn.id;

          return (
            <div
              key={turn.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-3 ${
                isHost1
                  ? 'bg-slate-900/90 border-purple-500/20 hover:border-purple-500/40'
                  : 'bg-slate-900/60 border-indigo-500/20 hover:border-indigo-500/40'
              }`}
            >
              {/* Turn Top Row: Speaker Badge, Tone selector, SFX selector, Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSpeakerToggle(turn.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isHost1
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30'
                        : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30'
                    }`}
                    title="کلیک برای تغییر گوینده"
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{turn.speakerName}</span>
                    <span className="text-[10px] opacity-70">
                      ({isHost1 ? episode.host1Voice : episode.host2Voice})
                    </span>
                  </button>

                  {/* Per-Turn Tone Selector (Requested Feature) */}
                  <div className="flex items-center gap-1 bg-slate-950/70 border border-purple-500/30 hover:border-purple-500/60 rounded-lg px-2 py-0.5 transition-colors">
                    <span className="text-xs">
                      {PARAGRAPH_TONE_OPTIONS.find((t) => t.id === (turn.turnTone || 'auto'))?.emoji || '🎭'}
                    </span>
                    <select
                      value={turn.turnTone || 'auto'}
                      onChange={(e) => handleTurnToneChange(turn.id, e.target.value as ParagraphTone)}
                      className="bg-transparent text-[11px] text-purple-300 font-semibold outline-none cursor-pointer"
                      title="تنظیم لحن اختصاصی گوینده برای این پاراگراف / جمله"
                    >
                      {PARAGRAPH_TONE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {t.labelFa}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SFX Badge Selector */}
                  <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-0.5">
                    <span className="text-xs">
                      {SFX_OPTIONS.find((s) => s.id === (turn.sfxCue || 'none'))?.emoji}
                    </span>
                    <select
                      value={turn.sfxCue || 'none'}
                      onChange={(e) => handleSfxChange(turn.id, e.target.value as SfxType)}
                      className="bg-transparent text-[11px] text-slate-300 outline-none cursor-pointer"
                    >
                      {SFX_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.labelFa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right actions: Preview speech, AI polish, Add, Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPreviewTurn(turn)}
                    disabled={isPreviewing}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                      isPreviewing
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title="پخش تست این جمله"
                  >
                    {isPreviewing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="text-[10px] hidden sm:inline">تست صدا</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRefiningTurnId(refiningTurnId === turn.id ? null : turn.id)
                    }
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-purple-300 hover:text-white hover:bg-purple-900/30 text-xs flex items-center gap-1 transition-all"
                    title="بهبود دیالوگ با هوش مصنوعی"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">بازنویسی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddTurnAfter(index)}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                    title="افزودن دیالوگ بعدی"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {episode.script.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTurn(turn.id)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
                      title="حذف این بخش"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Turn Text Area */}
              <textarea
                value={turn.text}
                onChange={(e) => handleTurnTextChange(turn.id, e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-slate-100 text-sm leading-relaxed outline-none transition-all resize-y"
                rows={2}
                dir="rtl"
              />

              {/* AI Refine Quick Bar */}
              {refiningTurnId === turn.id && (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>بازنویسی هوشمند این بخش:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'طبیعی‌تر و محاوره‌ای‌تر کن',
                      'کمی شوخ‌طبعی و طنز اضافه کن',
                      'خلاصه‌تر و موجزتر بیان کن',
                      'هیجان و انرژی دیالوگ را بالا ببر',
                      'علمی‌تر و مستندتر بیان کن',
                    ].map((promptText, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        disabled={isRefining}
                        onClick={() => handleAiRefine(turn, promptText)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-slate-200 hover:text-white transition-all disabled:opacity-50"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Master Render Call to Action */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 text-center space-y-4">
        <h4 className="text-base sm:text-lg font-bold text-white">
          سناریوی پادکست آماده شد؟ وقت شنیدن نتیجه نهایی است!
        </h4>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          با کلیک روی دکمه زیر، تمامی نوبت‌های گفتگو توسط موتور صوتی سنتز شده و با موسیقی متن «
          {BGM_PRESETS.find((b) => b.id === episode.suggestedBgm)?.nameFa}» میکس می‌گردد.
        </p>
        <button
          onClick={onSynthesizeAndPlay}
          disabled={isSynthesizing}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
        >
          {isSynthesizing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>در حال ساخت و میکس اپیزود...</span>
            </>
          ) : (
            <>
              <Disc className="w-5 h-5 animate-spin-slow" />
              <span>رندر نهایی و بازپخش در استودیو</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
