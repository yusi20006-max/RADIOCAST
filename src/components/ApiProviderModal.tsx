import React, { useEffect, useState } from 'react';
import {
  X, Cpu, CheckCircle2, AlertCircle, Activity, Key, Globe,
  RefreshCw, Server, ShieldCheck, Save,
} from 'lucide-react';
import { AiProviderType, ExternalProviderConfig } from '../types/podcast';
import { testAiConnection } from '../utils/aiClient';

interface ApiProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AiProviderType;
  onChangeProvider: (p: AiProviderType) => void;
  externalConfig: ExternalProviderConfig;
  onSaveExternalConfig: (config: ExternalProviderConfig) => void;
  onToast: (msg: string) => void;
}

const PRESET_PROVIDERS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct' },
  { name: 'Groq Cloud', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  { name: 'سرویس سفارشی', baseUrl: '', model: '' },
];

type HealthResult = {
  healthy: boolean;
  message: string;
  latencyMs?: number;
};

export const ApiProviderModal: React.FC<ApiProviderModalProps> = ({
  isOpen, onClose, provider, onChangeProvider, externalConfig,
  onSaveExternalConfig, onToast,
}) => {
  const [localConfig, setLocalConfig] = useState<ExternalProviderConfig>(externalConfig);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(externalConfig);
      setHealthResult(externalConfig.lastHealthCheck
        ? {
            healthy: externalConfig.lastHealthCheck.healthy,
            message: externalConfig.lastHealthCheck.message || '',
            latencyMs: externalConfig.lastHealthCheck.latencyMs,
          }
        : null);
    }
  }, [isOpen, externalConfig]);

  if (!isOpen) return null;

  const selectPreset = (preset: (typeof PRESET_PROVIDERS)[number]) => {
    setLocalConfig({
      ...localConfig,
      name: preset.name,
      baseUrl: preset.baseUrl,
      model: preset.model,
      lastHealthCheck: undefined,
    });
    setHealthResult(null);
  };

  const handleTestHealth = async () => {
    if (!localConfig.baseUrl.trim() || !localConfig.apiKey.trim() || !localConfig.model.trim()) {
      setHealthResult({ healthy: false, message: 'برای تست اتصال، Base URL، کلید API و شناسه مدل را وارد کنید.' });
      return;
    }
    setIsCheckingHealth(true);
    setHealthResult(null);
    try {
      const latencyMs = await testAiConnection(localConfig);
      const result = { healthy: true, message: 'پاسخ معتبر از مدل دریافت شد.', latencyMs };
      setHealthResult(result);
      setLocalConfig({
        ...localConfig,
        enabled: true,
        lastHealthCheck: { ...result, timestamp: Date.now() },
      });
      onToast(`اتصال هوش مصنوعی موفق بود؛ زمان پاسخ ${latencyMs} میلی‌ثانیه.`);
    } catch (error: any) {
      const message = error?.message || 'اتصال به سرویس ناموفق بود.';
      setHealthResult({ healthy: false, message });
      setLocalConfig({
        ...localConfig,
        lastHealthCheck: { healthy: false, timestamp: Date.now(), message },
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSave = () => {
    if (!localConfig.baseUrl.trim() || !localConfig.apiKey.trim() || !localConfig.model.trim()) {
      setHealthResult({ healthy: false, message: 'قبل از ذخیره، Base URL، کلید API و شناسه مدل را کامل کنید.' });
      return;
    }
    if (localConfig.ttsProvider === 'google-cloud' && !localConfig.googleTtsApiKey?.trim()) {
      setHealthResult({ healthy: false, message: 'برای Google Cloud TTS باید کلید API این سرویس را جداگانه وارد کنید.' });
      return;
    }
    const config = { ...localConfig, enabled: true };
    onSaveExternalConfig(config);
    onChangeProvider('external');
    onToast('تنظیمات سرویس هوش مصنوعی در همین دستگاه ذخیره شد.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl min-w-0 bg-slate-900 border border-purple-500/30 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-5 max-h-[92dvh] overflow-y-auto overflow-x-hidden">
        <button onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400 shrink-0" />
            <h3 className="text-lg sm:text-xl font-black text-white">تنظیمات هوش مصنوعی</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            اطلاعات سرویس را خودتان وارد کنید. هیچ آدرس پایه یا کلید API از پیش تنظیم نشده است.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Server className="w-4 h-4 text-indigo-400" />
            سرویس سازگار با OpenAI API
            {provider === 'external' && <span className="text-[10px] text-emerald-300 mr-auto">حالت انتخاب‌شده</span>}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            سرویس باید از مسیرهای chat/completions و برای تولید صدا از audio/speech پشتیبانی کند. پشتیبانی گفتار در همه ارائه‌دهندگان یکسان نیست.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">انتخاب الگوی سرویس (اختیاری)</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROVIDERS.map((preset) => (
                <button key={preset.name} type="button" onClick={() => selectPreset(preset)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-colors ${localConfig.name === preset.name ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="ai-provider-name" className="text-xs font-semibold text-slate-300">نام سرویس</label>
            <input id="ai-provider-name" value={localConfig.name} onChange={(e) => setLocalConfig({ ...localConfig, name: e.target.value, lastHealthCheck: undefined })}
              placeholder="مثلاً سرویس شخصی من" className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-indigo-500" />
          </div>

          <div className="space-y-1">
            <label htmlFor="ai-base-url" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> آدرس پایه API (Base URL)
            </label>
            <input id="ai-base-url" type="url" autoComplete="url" value={localConfig.baseUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value, lastHealthCheck: undefined })}
              placeholder="https://your-provider.example/v1"
              className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono outline-none focus:border-indigo-500" dir="ltr" />
          </div>

          <div className="space-y-1">
            <label htmlFor="ai-api-key" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> کلید API
            </label>
            <input id="ai-api-key" type="password" autoComplete="new-password" value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value, lastHealthCheck: undefined })}
              placeholder="کلید API را اینجا وارد کنید"
              className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono outline-none focus:border-indigo-500" dir="ltr" />
          </div>

          <div className="space-y-1">
            <label htmlFor="ai-model" className="text-xs font-semibold text-slate-300">شناسه مدل (Model ID)</label>
            <input id="ai-model" value={localConfig.model} onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value, lastHealthCheck: undefined })}
              placeholder="مثلاً gpt-4o-mini" className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono outline-none focus:border-indigo-500" dir="ltr" />
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-4 h-4 text-emerald-400" />
            سرویس مستقل تولید گفتار (TTS)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            موتور تولید متن و موتور گفتار جدا هستند. برای استفاده از Gemini در تولید متن، می‌توانید Google Cloud TTS را برای ساخت فایل صوتی انتخاب کنید.
          </p>
          <div className="space-y-1">
            <label htmlFor="tts-provider" className="text-xs font-semibold text-slate-300">ارائه‌دهنده گفتار</label>
            <select id="tts-provider" value={localConfig.ttsProvider || 'openai-compatible'}
              onChange={(e) => setLocalConfig({ ...localConfig, ttsProvider: e.target.value as 'openai-compatible' | 'google-cloud' })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white">
              <option value="openai-compatible">OpenAI-compatible TTS</option>
              <option value="google-cloud">Google Cloud Text-to-Speech</option>
            </select>
          </div>
          {localConfig.ttsProvider === 'google-cloud' && (
            <>
              <div className="space-y-1">
                <label htmlFor="google-tts-key" className="text-xs font-semibold text-slate-300">Google Cloud TTS API Key</label>
                <input id="google-tts-key" type="password" autoComplete="new-password"
                  value={localConfig.googleTtsApiKey || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, googleTtsApiKey: e.target.value })}
                  placeholder="کلید API پروژه Google Cloud"
                  className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono" dir="ltr" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="google-tts-language" className="text-xs font-semibold text-slate-300">کد زبان</label>
                  <input id="google-tts-language" value={localConfig.googleTtsLanguageCode || 'fa-IR'}
                    onChange={(e) => setLocalConfig({ ...localConfig, googleTtsLanguageCode: e.target.value })}
                    className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="google-tts-voice" className="text-xs font-semibold text-slate-300">نام صدا (Voice name)</label>
                  <input id="google-tts-voice" value={localConfig.googleTtsVoice || 'fa-IR-Standard-A'}
                    onChange={(e) => setLocalConfig({ ...localConfig, googleTtsVoice: e.target.value })}
                    className="w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white font-mono" dir="ltr" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Base URL ثابت: https://texttospeech.googleapis.com/v1/ — مسیر text:synthesize به‌صورت خودکار استفاده می‌شود. خروجی MP3 است. کلید این سرویس مستقل از کلید Gemini است.
              </p>
            </>
          )}
        </section>

        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> حریم خصوصی و اتصال
          </div>
          کلید در فضای ذخیره‌سازی محلی همین اپ نگهداری و مستقیماً از دستگاه شما برای ارائه‌دهنده ارسال می‌شود؛ از سرور واسط RadioCast عبور نمی‌کند. فقط به ارائه‌دهنده‌ای اعتماد کنید که به آن کلید می‌دهید. برخی سرویس‌ها برای درخواست مستقیم از اپ، دسترسی CORS را محدود می‌کنند.
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={handleTestHealth} disabled={isCheckingHealth || !localConfig.baseUrl.trim() || !localConfig.apiKey.trim() || !localConfig.model.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/30 text-indigo-200 text-sm font-bold disabled:opacity-40">
            {isCheckingHealth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            تست واقعی اتصال مدل
          </button>
          <button type="button" onClick={handleSave} disabled={!localConfig.baseUrl.trim() || !localConfig.apiKey.trim() || !localConfig.model.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-40">
            <Save className="w-4 h-4" /> ذخیره و فعال‌سازی
          </button>
        </div>

        {healthResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${healthResult.healthy ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-red-950/30 border-red-500/40 text-red-200'}`}>
            {healthResult.healthy ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <div className="font-bold">{healthResult.healthy ? 'اتصال موفق' : 'اتصال ناموفق'}</div>
              <p className="mt-1 break-words">{healthResult.message}</p>
              {healthResult.latencyMs !== undefined && <p className="mt-1">زمان پاسخ: {healthResult.latencyMs} ms</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
