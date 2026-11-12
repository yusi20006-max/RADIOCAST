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
import { generatePodcastScript, synthesizeSpeech } from './utils/aiClient';
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
  createSyntheticBgmBuffer,
} from './utils/audioEngine';
import { deleteProject, loadProjects, saveProject } from './utils/projectStorage';

const STORAGE_KEY = 'radiocast_persian_podcasts_v1';
const EXTERNAL_CONFIG_KEY = 'radiocast_external_ai_v1';

const DEFAULT_EXTERNAL_CONFIG: ExternalProviderConfig = {
  enabled: false,
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'library'>('studio');
  const [studioStep, setStudioStep] = useState<'input' | 'editor' | 'player'>('input');

  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [savedEpisodes, setSavedEpisodes] = useState<PodcastEpisode[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // AI provider settings are supplied and stored locally by the user.
  const [aiProvider, setAiProvider] = useState<AiProviderType>('external');
  const [externalConfig, setExternalConfig] = useState<ExternalProviderConfig>(DEFAULT_EXTERNAL_CONFIG);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptProgress, setScriptProgress] = useState({ percent: 0, message: '' });
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [synthesizingProgress, setSynthesizingProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
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
  const bgmPreviewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Load projects from IndexedDB and migrate the previous localStorage archive once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let projects = await loadProjects();
        if (projects.length === 0) {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy) {
            const oldProjects = JSON.parse(legacy) as PodcastEpisode[];
            for (const project of oldProjects) await saveProject(project);
            projects = oldProjects;
          }
        }
        if (active) setSavedEpisodes(projects);
      } catch (error) {
        console.error('Failed to load IndexedDB projects:', error);
        try {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy && active) setSavedEpisodes(JSON.parse(legacy));
        } catch (legacyError) { console.error('Legacy project migration failed:', legacyError); }
      } finally {
        if (active) setProjectsLoaded(true);
      }
    })();
    try {
      const storedExt = localStorage.getItem(EXTERNAL_CONFIG_KEY);
      if (storedExt) {
        const parsedExt = { ...DEFAULT_EXTERNAL_CONFIG, ...JSON.parse(storedExt) };
        if (!parsedExt.apiKey?.trim()) {
          parsedExt.name = '';
          parsedExt.baseUrl = '';
          parsedExt.model = '';
          parsedExt.enabled = false;
        }
        setExternalConfig(parsedExt);
        if (parsedExt.enabled) {
          setAiProvider('external');
        }
      }
    } catch (e) {
      console.error('Failed to load saved settings:', e);
    }
  }, []);

  // Autosave the active project after edits, including changes made in the screenplay editor.
  useEffect(() => {
    if (!projectsLoaded || !currentEpisode) return;
    const timer = window.setTimeout(() => {
      saveProject(currentEpisode).catch((error) => console.error('Project autosave failed:', error));
      setSavedEpisodes((previous) => [currentEpisode, ...previous.filter((item) => item.id !== currentEpisode.id)]);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [currentEpisode, projectsLoaded]);

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

  const saveEpisodeToStorage = async (episode: PodcastEpisode) => {
    try {
      await saveProject({ ...episode, projectStatus: episode.projectStatus || 'completed' });
      setSavedEpisodes((previous) => [episode, ...previous.filter((item) => item.id !== episode.id)]);
      showToast('پروژه با موفقیت ذخیره شد.');
    } catch (error) {
      console.error('Failed to save project:', error);
      showToast('ذخیره پروژه انجام نشد؛ فضای ذخیره‌سازی دستگاه را بررسی کنید.');
    }
  };

  const handleDeleteSavedEpisode = async (id: string) => {
    try {
      await deleteProject(id);
      setSavedEpisodes((previous) => previous.filter((episode) => episode.id !== id));
      showToast('پروژه حذف شد.');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('حذف پروژه انجام نشد.');
    }
  };

  const handleApplyCoverToEpisode = async (coverUrl: string) => {
    if (currentEpisode) {
      const updated = { ...currentEpisode, coverArtUrl: coverUrl };
      setCurrentEpisode(updated);
      await saveProject(updated);
      setSavedEpisodes((previous) => [updated, ...previous.filter((item) => item.id !== updated.id)]);
      showToast('کاور آرت با موفقیت روی اپیزود تنظیم گردید.');
    }
  };

  // Generate a podcast script directly through the user's configured OpenAI-compatible API.
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
      setScriptProgress({ percent: 8, message: 'در حال آماده‌سازی درخواست سناریو...' });
      const data = await generatePodcastScript(externalConfig, params, (percent, message) => setScriptProgress({ percent, message }));
      setScriptProgress({ percent: 94, message: 'سناریو استخراج شد؛ در حال ذخیره پروژه...' });
      const newEpisode: PodcastEpisode = {
        id: 'ep-' + Date.now(),
        createdAt: Date.now(),
        sourceText: params.sourceText,
        projectStatus: 'script-ready',
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
        tags: Array.isArray(data.tags) ? data.tags : ['پادکست_فارسی', 'هوش_مصنوعی'],
        chapters: Array.isArray(data.chapters) ? data.chapters : [{ title: 'مقدمه', startTurnIndex: 0 }],
        script: data.script.map((t: any, idx: number) => ({
          ...t,
          id: 'turn-' + idx + '-' + Date.now(),
          speaker: t.speaker === 'host2' ? 'host2' : 'host1',
          speakerName: t.speakerName || (t.speaker === 'host2' ? params.host2Name : params.host1Name),
          turnTone: t.turnTone || (t.text?.includes('؟') ? 'curious' : t.text?.includes('!') ? 'excited' : 'friendly'),
        })),
        coverGradient: 'from-purple-900 via-indigo-900 to-slate-900',
      };

      await saveProject(newEpisode);
      setSavedEpisodes((previous) => [newEpisode, ...previous.filter((item) => item.id !== newEpisode.id)]);
      setCurrentEpisode(newEpisode);
      setScriptProgress({ percent: 100, message: 'سناریو با موفقیت ذخیره شد.' });
      setStudioStep('editor');
      showToast('سناریو ساخته و به‌عنوان پروژه ذخیره شد.');
    } catch (error: any) {
      console.error('Script generation failed:', error);
      setScriptProgress({ percent: 0, message: error.message || 'ساخت سناریو ناموفق بود.' });
      alert(error.message || 'خطا در تولید سناریوی پادکست.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Preview one dialogue turn using the configured provider's speech endpoint.
  const handlePreviewTurn = async (turn: DialogueTurn) => {
    if (!currentEpisode) return;
    setPreviewingTurnId(turn.id);
    try {
      let base64 = turn.audioBase64;
      if (!base64) {
        const audioData = await synthesizeSpeech(externalConfig, turn.text,
          turn.speaker === 'host1' ? currentEpisode.host1Voice : currentEpisode.host2Voice,
          currentEpisode.speed);
        base64 = arrayBufferToBase64(audioData);
        turn.audioBase64 = base64;
      }
      const ctx = getAudioContext();
      const buf = await decodeAudioBase64(base64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(ctx.destination);
      source.start();
    } catch (e: any) {
      console.error('Preview error:', e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(turn.text);
        utter.lang = 'fa-IR';
        window.speechSynthesis.speak(utter);
      } else {
        alert(e.message || 'پیش‌نمایش صدا در دسترس نیست.');
      }
    } finally {
      setTimeout(() => setPreviewingTurnId(null), 1500);
    }
  };

  // Step 2 & 3: Master Synthesize & Mix Audio
  const handleSynthesizeAndPlay = async () => {
    if (!currentEpisode) return;

    // Stop existing audio
    stopAudioPlayback();

    setIsSynthesizingAudio(true);
    const totalTurns = currentEpisode.script.length;
    setSynthesizingProgress({ current: 0, total: totalTurns, percent: 0, message: 'آغاز پردازش پروژه...' });
    let workingEpisode: PodcastEpisode = { ...currentEpisode, projectStatus: 'audio-in-progress' };

    const ctx = getAudioContext();
    const voiceBuffers: { buffer: AudioBuffer; sfxCue?: any }[] = [];

    try {
      for (let i = 0; i < totalTurns; i++) {
        const turn = currentEpisode.script[i];
        const cachedAudio = Boolean(turn.audioBase64);
        setSynthesizingProgress({
          current: i,
          total: totalTurns,
          percent: Math.round((i / Math.max(1, totalTurns)) * 70),
          message: cachedAudio
            ? `بخش ${i + 1} از ${totalTurns} آماده است؛ در حال بازیابی فایل ذخیره‌شده...`
            : `در حال تولید صوت گوینده ${turn.speakerName}؛ بخش ${i + 1} از ${totalTurns}`,
        });

        let base64 = turn.audioBase64;
        const voice = turn.speaker === 'host1' ? currentEpisode.host1Voice : currentEpisode.host2Voice;

        if (!base64) {
          const audioData = await synthesizeSpeech(externalConfig, turn.text, voice, currentEpisode.speed);
          base64 = arrayBufferToBase64(audioData);
        }

        // Persist every completed speech segment. Retries skip cached segments.
        const updatedScript = workingEpisode.script.map((item) =>
          item.id === turn.id ? { ...item, audioBase64: base64 } : item
        );
        workingEpisode = { ...workingEpisode, script: updatedScript, projectStatus: 'audio-in-progress' };
        setCurrentEpisode(workingEpisode);
        await saveProject(workingEpisode);

        // Never substitute synthetic tones for speech: fail clearly if real TTS is unavailable.
        const audioBuf = await decodeAudioBase64(base64, ctx);

        voiceBuffers.push({ buffer: audioBuf, sfxCue: turn.sfxCue });
        setSynthesizingProgress({
          current: i + 1,
          total: totalTurns,
          percent: Math.round(((i + 1) / Math.max(1, totalTurns)) * 70),
          message: `صوت بخش ${i + 1} از ${totalTurns} تولید و ذخیره شد.`,
        });
      }

      setSynthesizingProgress({
        current: totalTurns,
        total: totalTurns,
        percent: 74,
        message: 'گفتارها آماده شدند؛ در حال میکس موسیقی و افکت‌ها...',
      });

      // Mix voices + BGM + SFX into Master AudioBuffer
      const masterBuf = await mixPodcastAudioBuffer({
        ctx,
        voiceBuffers,
        bgmStyle: currentEpisode.suggestedBgm,
        bgmVolume: currentEpisode.bgmVolume,
        speedMultiplier: playbackRate,
      });

      setSynthesizingProgress({ current: totalTurns, total: totalTurns, percent: 84, message: 'میکس انجام شد؛ در حال ساخت فایل MP3...' });
      setMasterAudioBuffer(masterBuf);
      setDuration(masterBuf.duration);
      setCurrentTime(0);

      // Encode MP3 and WAV blobs for download and sharing
      const mp3 = encodeAudioBufferToMp3(masterBuf, 192);
      const wav = encodeAudioBufferToWav(masterBuf);
      setSynthesizingProgress({ current: totalTurns, total: totalTurns, percent: 96, message: 'فایل‌ها آماده شدند؛ در حال ذخیره پروژه...' });
      setMp3Blob(mp3);
      setWavBlob(wav);

      // Auto save episode with duration
      const updatedEpisode = { ...workingEpisode, durationSeconds: masterBuf.duration, projectStatus: 'completed' as const };
      setCurrentEpisode(updatedEpisode);
      await saveProject(updatedEpisode);
      setSavedEpisodes((previous) => [updatedEpisode, ...previous.filter((item) => item.id !== updatedEpisode.id)]);
      setSynthesizingProgress({ current: totalTurns, total: totalTurns, percent: 100, message: 'پروژه و فایل‌های خروجی ذخیره شدند.' });

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
      startAudioPlayback(masterBuf, 0, playbackRate);
    } catch (err: any) {
      console.error('Synthesize & Mix error:', err);
      await saveProject(workingEpisode).catch((saveError) => console.error('Partial project save failed:', saveError));
      setCurrentEpisode(workingEpisode);
      setSynthesizingProgress((previous) => ({ ...previous, message: `کار متوقف شد؛ بخش‌های تکمیل‌شده ذخیره شدند. ${err.message || ''}` }));
      alert('عملیات متوقف شد؛ بخش‌های تکمیل‌شده ذخیره شدند و می‌توانید بعداً ادامه دهید.\n' + (err.message || ''));
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Audio Playback Controls
  const startAudioPlayback = (buffer: AudioBuffer, offset: number, rate: number = 1.0) => {
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
          if (currentEpisode && currentEpisode.script.length > 0) {
            const avgTurnTime = buffer.duration / currentEpisode.script.length;
            const turnIdx = Math.min(
              currentEpisode.script.length - 1,
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
    if (bgmPreviewSourceRef.current) {
      try { bgmPreviewSourceRef.current.stop(); } catch (error) {}
      bgmPreviewSourceRef.current = null;
    }
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

  const handlePreviewBgm = (style: BgmStyle) => {
    const ctx = getAudioContext();
    if (bgmPreviewSourceRef.current) {
      try { bgmPreviewSourceRef.current.stop(); } catch (error) {}
      bgmPreviewSourceRef.current = null;
      return;
    }
    if (style === 'none') { showToast('برای این گزینه موسیقی پخش نمی‌شود.'); return; }
    const preview = createSyntheticBgmBuffer(ctx, style, 18);
    const source = ctx.createBufferSource();
    source.buffer = preview;
    source.loop = true;
    source.connect(ctx.destination);
    source.onended = () => { if (bgmPreviewSourceRef.current === source) bgmPreviewSourceRef.current = null; };
    bgmPreviewSourceRef.current = source;
    source.start();
    showToast('پیش‌شنوی آفلاین موسیقی در حال پخش است؛ برای توقف دوباره بزنید.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white" dir="rtl">
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
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'library' ? (
          <LibraryView
            savedEpisodes={savedEpisodes}
            onSelectEpisode={(ep) => {
              setCurrentEpisode(ep);
              setStudioStep('editor');
              setCurrentTab('studio');
              setMasterAudioBuffer(null);
              setMp3Blob(null);
              setWavBlob(null);
              setSynthesizingProgress({ current: 0, total: ep.script.length, percent: 0, message: 'پروژه بازیابی شد؛ برای ادامه، تولید صوت را انتخاب کنید.' });
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
                scriptProgress={scriptProgress}
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
                onPreviewBgm={handlePreviewBgm}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-purple-600/90 text-white text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md border border-purple-400/40 animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
