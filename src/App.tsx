import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { InputStep } from './components/InputStep';
import { ScreenplayEditor } from './components/ScreenplayEditor';
import { StudioPlayer } from './components/StudioPlayer';
import { ShareAndExportModal } from './components/ShareAndExportModal';
import { LibraryView } from './components/LibraryView';
import { GuideModal } from './components/GuideModal';
import { ApiProviderModal } from './components/ApiProviderModal';
import { CoverArtGeneratorModal } from './components/CoverArtGeneratorModal';
import { RssFeedModal } from './components/RssFeedModal';
import { ExportAppModal } from './components/ExportAppModal';
import {
  PodcastEpisode,
  DialogueTurn,
  PodcastFormat,
  PodcastTone,
  PlaybackSpeed,
  BgmStyle,
  AiProviderType,
  ExternalProviderConfig,
} from './types/podcast';
import {
  getAudioContext,
  decodeAudioBase64,
  mixPodcastAudioBuffer,
  encodeAudioBufferToMp3,
  encodeAudioBufferToWav,
  createSyntheticSfx,
} from './utils/audioEngine';

const STORAGE_KEY = 'radiocast_persian_podcasts_v1';
const EXTERNAL_CONFIG_KEY = 'radiocast_external_ai_v1';

const DEFAULT_EXTERNAL_CONFIG: ExternalProviderConfig = {
  enabled: false,
  name: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'library'>('studio');
  const [studioStep, setStudioStep] = useState<'input' | 'editor' | 'player'>('input');

  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [savedEpisodes, setSavedEpisodes] = useState<PodcastEpisode[]>([]);

  // AI Provider states (Google AI Studio as primary, optional external API)
  const [aiProvider, setAiProvider] = useState<AiProviderType>('google');
  const [externalConfig, setExternalConfig] = useState<ExternalProviderConfig>(DEFAULT_EXTERNAL_CONFIG);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [synthesizingProgress, setSynthesizingProgress] = useState({
    current: 0,
    total: 0,
    message: '',
  });

  const [previewingTurnId, setPreviewingTurnId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [isRssModalOpen, setIsRssModalOpen] = useState<boolean>(false);
  const [isExportAppModalOpen, setIsExportAppModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master Audio playback states
  const [masterAudioBuffer, setMasterAudioBuffer] = useState<AudioBuffer | null>(null);
  const [mp3Blob, setMp3Blob] = useState<Blob | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Audio Node references
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Load saved episodes and external AI config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedEpisodes(JSON.parse(stored));
      }
      const storedExt = localStorage.getItem(EXTERNAL_CONFIG_KEY);
      if (storedExt) {
        const parsedExt = JSON.parse(storedExt);
        setExternalConfig(parsedExt);
        if (parsedExt.enabled) {
          setAiProvider('external');
        }
      }
    } catch (e) {
      console.error('Failed to load saved settings:', e);
    }
  }, []);

  const handleSaveExternalConfig = (config: ExternalProviderConfig) => {
    setExternalConfig(config);
    try {
      localStorage.setItem(EXTERNAL_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to persist external config:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveEpisodeToStorage = (episode: PodcastEpisode) => {
    try {
      const exists = savedEpisodes.some((e) => e.id === episode.id);
      let updated: PodcastEpisode[];
      if (exists) {
        updated = savedEpisodes.map((e) => (e.id === episode.id ? episode : e));
      } else {
        updated = [episode, ...savedEpisodes];
      }
      setSavedEpisodes(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showToast('اپیزود با موفقیت در آرشیو شما ذخیره شد.');
    } catch (e) {
      console.error('Failed to save episode:', e);
    }
  };

  const handleDeleteSavedEpisode = (id: string) => {
    const updated = savedEpisodes.filter((e) => e.id !== id);
    setSavedEpisodes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast('اپیزود از آرشیو حذف گردید.');
  };

  const handleApplyCoverToEpisode = (coverUrl: string) => {
    if (currentEpisode) {
      const updated = { ...currentEpisode, coverArtUrl: coverUrl };
      setCurrentEpisode(updated);
      const exists = savedEpisodes.some((e) => e.id === updated.id);
      if (exists) {
        const newSaved = savedEpisodes.map((e) => (e.id === updated.id ? updated : e));
        setSavedEpisodes(newSaved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
      }
      showToast('کاور آرت با موفقیت روی اپیزود تنظیم گردید.');
    }
  };

  // Step 1: Generate Script via Gemini 3.8 Flash (Primary) or External LLM
  const handleGenerateScript = async (params: {
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
  }) => {
    try {
      setIsGeneratingScript(true);
      const res = await fetch('/api/podcast/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          aiProvider,
          externalConfig: aiProvider === 'external' ? externalConfig : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'خطا در ارتباط با سرور هوش مصنوعی.');
      }

      const data = await res.json();

      const newEpisode: PodcastEpisode = {
        id: 'ep-' + Date.now(),
        createdAt: Date.now(),
        title: data.title || 'اپیزود جدید رادیو کست',
        episodeSummary: data.episodeSummary || '',
        genre: data.genre || 'عمومی',
        format: params.format,
        tone: params.tone,
        dynamicToneEnabled: params.dynamicToneEnabled,
        speed: params.speed,
        host1Name: params.host1Name,
        host2Name: params.host2Name,
        host1Voice: params.host1Voice,
        host2Voice: params.host2Voice,
        suggestedBgm: data.suggestedBgm || params.bgmStyle,
        bgmVolume: 0.35,
        tags: data.tags || ['پادکست_فارسی', 'هوش_مصنوعی'],
        chapters: data.chapters || [{ title: 'مقدمه', startTurnIndex: 0 }],
        script: (data.script || []).map((t: any, idx: number) => ({
          ...t,
          id: 'turn-' + idx + '-' + Date.now(),
          turnTone: t.turnTone || (t.text?.includes('؟') ? 'curious' : t.text?.includes('!') ? 'excited' : 'friendly'),
        })),
        coverGradient: 'from-purple-900 via-indigo-900 to-slate-900',
      };

      setCurrentEpisode(newEpisode);
      setStudioStep('editor');
      showToast('سناریوی پادکست آماده شد! می‌توانید متن‌ها را بررسی کنید.');
    } catch (error: any) {
      console.error('Script generation failed:', error);
      alert(error.message || 'خطا در تولید سناریوی پادکست. لطفاً اتصال اینترنت خود را بررسی کنید.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Preview a single turn
  const handlePreviewTurn = async (turn: DialogueTurn) => {
    if (!currentEpisode) return;
    setPreviewingTurnId(turn.id);

    try {
      const voice = turn.speaker === 'host1' ? currentEpisode.host1Voice : currentEpisode.host2Voice;
      let base64 = turn.audioBase64;

      if (!base64) {
        const res = await fetch('/api/podcast/synthesize-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: turn.text,
            voiceName: voice,
            style: turn.speechStyle,
            speed: currentEpisode.speed,
            turnTone: turn.turnTone || 'auto',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          base64 = data.audioBase64;
          // Cache in turn
          turn.audioBase64 = base64;
        }
      }

      const ctx = getAudioContext();
      if (base64) {
        const buf = await decodeAudioBase64(base64, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.connect(ctx.destination);
        source.start();
      } else {
        // Fallback Web Speech
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(turn.text);
          utter.lang = 'fa-IR';
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (e) {
      console.error('Preview error:', e);
      // Fallback Web Speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(turn.text);
        utter.lang = 'fa-IR';
        window.speechSynthesis.speak(utter);
      }
    } finally {
      setTimeout(() => setPreviewingTurnId(null), 1500);
    }
  };

  // Step 2 & 3: Master Synthesize & Mix Audio
  const handleSynthesizeAndPlay = async (episodeToSynthesize: PodcastEpisode | null = currentEpisode) => {
    if (!episodeToSynthesize) return;

    // Stop and clear previous audio so a failed render cannot leave stale playback attached to a new episode.
    stopAudioPlayback();
    setMasterAudioBuffer(null);
    setMp3Blob(null);
    setWavBlob(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    setIsSynthesizingAudio(true);
    const totalTurns = episodeToSynthesize.script.length;
    setSynthesizingProgress({ current: 0, total: totalTurns, message: 'آغاز پردازش استودیو...' });

    const ctx = getAudioContext();
    const voiceBuffers: { buffer: AudioBuffer; sfxCue?: any }[] = [];

    try {
      for (let i = 0; i < totalTurns; i++) {
        const turn = episodeToSynthesize.script[i];
        setSynthesizingProgress({
          current: i + 1,
          total: totalTurns,
          message: `در حال تولید صدای ${turn.speakerName} (${i + 1} از ${totalTurns})...`,
        });

        let base64 = turn.audioBase64;
        const voice = turn.speaker === 'host1' ? episodeToSynthesize.host1Voice : episodeToSynthesize.host2Voice;

        if (!base64) {
          const res = await fetch('/api/podcast/synthesize-turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: turn.text,
              voiceName: voice,
              style: turn.speechStyle,
              speed: episodeToSynthesize.speed,
              turnTone: turn.turnTone || 'auto',
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || 'تولید صدای گوینده ناموفق بود؛ کد خطا: ' + res.status);
          }
          if (!data.audioBase64) {
            throw new Error('سرویس صوتی برای این بخش فایل صوتی برنگرداند؛ خروجی ناقص ساخته نشد.');
          }
          base64 = data.audioBase64;
          turn.audioBase64 = base64;
        }

        if (!base64) {
          throw new Error('دادهٔ صوتی این بخش در دسترس نیست؛ ساخت خروجی متوقف شد.');
        }
        const audioBuf = await decodeAudioBase64(base64, ctx);

        voiceBuffers.push({ buffer: audioBuf, sfxCue: turn.sfxCue });
      }

      setSynthesizingProgress({
        current: totalTurns,
        total: totalTurns,
        message: 'میکس نهایی گفتار، موسیقی زمینه و افکت‌های صوتی...',
      });

      // Mix voices + BGM + SFX into Master AudioBuffer
      const masterBuf = await mixPodcastAudioBuffer({
        ctx,
        voiceBuffers,
        bgmStyle: episodeToSynthesize.suggestedBgm,
        bgmVolume: episodeToSynthesize.bgmVolume,
        speedMultiplier: playbackRate,
      });

      setMasterAudioBuffer(masterBuf);
      setDuration(masterBuf.duration);
      setCurrentTime(0);

      // Encode MP3 and WAV blobs for download and sharing
      const mp3 = encodeAudioBufferToMp3(masterBuf, 192);
      const wav = encodeAudioBufferToWav(masterBuf);
      setMp3Blob(mp3);
      setWavBlob(wav);

      // Auto save episode with duration
      const updatedEpisode = { ...episodeToSynthesize, durationSeconds: masterBuf.duration };
      setCurrentEpisode(updatedEpisode);
      saveEpisodeToStorage(updatedEpisode);

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981'],
      });

      setStudioStep('player');
      showToast('پادکست شما آماده پخش و دانلود شد!');

      // Start playback automatically
      startAudioPlayback(masterBuf, 0, playbackRate, updatedEpisode);
    } catch (err: any) {
      console.error('Synthesize & Mix error:', err);
      alert('خطا در تولید صدای گویندگان یا میکس پادکست: ' + (err.message || 'لطفاً دوباره تلاش کنید.'));
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Audio Playback Controls
  const startAudioPlayback = (buffer: AudioBuffer, offset: number, rate: number = 1.0, episodeForPlayback: PodcastEpisode | null = currentEpisode) => {
    const ctx = getAudioContext();
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.connect(ctx.destination);

    source.onended = () => {
      // Check if finished naturally
      if (currentTime >= duration - 0.5) {
        setIsPlaying(false);
        setCurrentTime(0);
        pauseOffsetRef.current = 0;
      }
    };

    source.start(0, offset);
    audioSourceRef.current = source;
    startTimeRef.current = ctx.currentTime - offset / rate;
    setIsPlaying(true);

    // Animation frame timer to update progress bar and active turn
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const updatePlayTime = () => {
      if (ctx.state === 'running') {
        const cur = (ctx.currentTime - startTimeRef.current) * rate;
        if (cur <= buffer.duration) {
          setCurrentTime(cur);

          // Calculate which turn is active
          if (episodeForPlayback && episodeForPlayback.script.length > 0) {
            const avgTurnTime = buffer.duration / episodeForPlayback.script.length;
            const turnIdx = Math.min(
              episodeForPlayback.script.length - 1,
              Math.max(0, Math.floor(cur / avgTurnTime))
            );
            setActiveTurnIndex(turnIdx);
          }

          animFrameRef.current = requestAnimationFrame(updatePlayTime);
        } else {
          setIsPlaying(false);
          setCurrentTime(buffer.duration);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(updatePlayTime);
  };

  const stopAudioPlayback = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (!masterAudioBuffer) return;

    if (isPlaying) {
      pauseOffsetRef.current = currentTime;
      stopAudioPlayback();
    } else {
      startAudioPlayback(masterAudioBuffer, currentTime, playbackRate);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!masterAudioBuffer) return;
    setCurrentTime(newTime);
    pauseOffsetRef.current = newTime;

    if (isPlaying) {
      startAudioPlayback(masterAudioBuffer, newTime, playbackRate);
    }
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.value = rate;
    }
  };

  const handleQuickDownloadMp3 = () => {
    if (mp3Blob && currentEpisode) {
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentEpisode.title || 'podcast'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('دانلود فایل MP3 آغاز شد.');
    } else {
      setIsShareModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white" dir="rtl">
      {/* Studio Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedEpisodesCount={savedEpisodes.length}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenRssModal={() => setIsRssModalOpen(true)}
        onOpenExportModal={() => setIsExportAppModalOpen(true)}
        provider={aiProvider}
        externalProviderName={externalConfig.name || 'سرویس خارجی'}
        isGeneratingAudio={isSynthesizingAudio || isGeneratingScript}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {currentTab === 'library' ? (
          <LibraryView
            savedEpisodes={savedEpisodes}
            onSelectEpisode={(ep) => {
              setCurrentEpisode(ep);
              setStudioStep('editor');
              setCurrentTab('studio');
              // Render the selected episode directly; React state updates are asynchronous.
              handleSynthesizeAndPlay(ep);
            }}
            onDeleteEpisode={handleDeleteSavedEpisode}
            onNewPodcast={() => {
              setCurrentTab('studio');
              setStudioStep('input');
            }}
          />
        ) : (
          <div>
            {studioStep === 'input' && (
              <InputStep
                onGenerate={handleGenerateScript}
                isGenerating={isGeneratingScript}
                onOpenApiModal={() => setIsApiModalOpen(true)}
                provider={aiProvider}
                externalProviderName={externalConfig.name || 'سرویس خارجی'}
              />
            )}

            {studioStep === 'editor' && currentEpisode && (
              <ScreenplayEditor
                episode={currentEpisode}
                onUpdateEpisode={setCurrentEpisode}
                onSynthesizeAndPlay={handleSynthesizeAndPlay}
                isSynthesizing={isSynthesizingAudio}
                synthesizingProgress={synthesizingProgress}
                onBackToInput={() => setStudioStep('input')}
                onPreviewTurn={handlePreviewTurn}
                previewingTurnId={previewingTurnId}
                onOpenCoverModal={() => setIsCoverModalOpen(true)}
              />
            )}

            {studioStep === 'player' && currentEpisode && (
              <StudioPlayer
                episode={currentEpisode}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                currentTime={currentTime}
                duration={duration}
                activeTurnIndex={activeTurnIndex}
                currentPlaybackRate={playbackRate}
                onChangePlaybackRate={handleChangePlaybackRate}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onQuickDownloadMp3={handleQuickDownloadMp3}
                onBackToEditor={() => setStudioStep('editor')}
                onSaveToLibrary={() => saveEpisodeToStorage(currentEpisode)}
                onOpenCoverModal={() => setIsCoverModalOpen(true)}
                onOpenRssModal={() => setIsRssModalOpen(true)}
                isSaved={savedEpisodes.some((e) => e.id === currentEpisode.id)}
              />
            )}
          </div>
        )}
      </main>

      {/* Share & Export Modal */}
      {currentEpisode && (
        <ShareAndExportModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          episode={currentEpisode}
          mp3Blob={mp3Blob}
          wavBlob={wavBlob}
          duration={duration}
          onOpenCoverModal={() => setIsCoverModalOpen(true)}
          onOpenRssModal={() => setIsRssModalOpen(true)}
        />
      )}

      {/* Podcast Cover Art Generator Modal */}
      {currentEpisode && (
        <CoverArtGeneratorModal
          isOpen={isCoverModalOpen}
          onClose={() => setIsCoverModalOpen(false)}
          episode={currentEpisode}
          onApplyCoverToEpisode={handleApplyCoverToEpisode}
          onToast={showToast}
        />
      )}

      {/* Podcast RSS 2.0 Feed & Publishing Modal */}
      <RssFeedModal
        isOpen={isRssModalOpen}
        onClose={() => setIsRssModalOpen(false)}
        savedEpisodes={savedEpisodes.length > 0 ? savedEpisodes : currentEpisode ? [currentEpisode] : []}
        onToast={showToast}
      />

      {/* Guide & Help Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Export App, ZIP Source & APK Modal */}
      <ExportAppModal
        isOpen={isExportAppModalOpen}
        onClose={() => setIsExportAppModalOpen(false)}
        onToast={showToast}
      />

      {/* External API Provider & Health Check Modal */}
      <ApiProviderModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        provider={aiProvider}
        onChangeProvider={setAiProvider}
        externalConfig={externalConfig}
        onSaveExternalConfig={handleSaveExternalConfig}
        onToast={showToast}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md text-center break-words px-5 py-2.5 rounded-2xl bg-purple-600/90 text-white text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md border border-purple-400/40 animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
