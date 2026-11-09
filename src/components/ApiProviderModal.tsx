import React, { useState } from 'react';
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Activity,
  Key,
  Globe,
  RefreshCw,
  Sparkles,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AiProviderType, ExternalProviderConfig } from '../types/podcast';

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
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    desc: 'مدل‌های هوشمند شرکت OpenAI',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    desc: 'دسترسی جامع به ده‌ها مدل منبع‌باز و تجاری',
  },
  {
    name: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    desc: 'سرعت پردازش فوق‌سریع و کم‌تاخیر',
  },
  {
    name: 'Ollama (Local / سرور محلی)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    desc: 'مدل‌های لوکال نصب‌شده روی سیستم شما',
  },
  {
    name: 'سرویس سفارشی (Custom)',
    baseUrl: '',
    defaultModel: '',
    desc: 'هر اندپوینت سازگار با ساختار استاندارد OpenAI',
  },
];

export const ApiProviderModal: React.FC<ApiProviderModalProps> = ({
  isOpen,
  onClose,
  provider,
  onChangeProvider,
  externalConfig,
  onSaveExternalConfig,
  onToast,
}) => {
  const [localConfig, setLocalConfig] = useState<ExternalProviderConfig>(externalConfig);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [healthResult, setHealthResult] = useState<{
    healthy?: boolean;
    message?: string;
    latencyMs?: number;
    error?: string;
  } | null>(localConfig.lastHealthCheck || null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof PRESET_PROVIDERS)[0]) => {
    if (preset.name === 'سرویس سفارشی (Custom)') {
      setLocalConfig({
        ...localConfig,
        name: preset.name,
      });
    } else {
      setLocalConfig({
        ...localConfig,
        name: preset.name,
        baseUrl: preset.baseUrl,
        model: preset.defaultModel,
      });
    }
  };

  const handleTestHealth = async () => {
    if (!localConfig.baseUrl.trim()) {
      alert('لطفاً آدرس پایه API (Base URL) را وارد فرمایید.');
      return;
    }
    if (!localConfig.apiKey.trim()) {
      alert('لطفاً کلید API را وارد فرمایید.');
      return;
    }

    try {
      setIsCheckingHealth(true);
      setHealthResult(null);

      const res = await fetch('/api/external-provider/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: localConfig.baseUrl,
          apiKey: localConfig.apiKey,
          model: localConfig.model,
        }),
      });

      const data = await res.json();
      setHealthResult(data);

      const updated = {
        ...localConfig,
        lastHealthCheck: {
          healthy: !!data.healthy,
          timestamp: Date.now(),
          latencyMs: data.latencyMs,
          message: data.message || data.error,
        },
      };
      setLocalConfig(updated);
      onSaveExternalConfig(updated);

      if (data.healthy) {
        onToast(`سرویس خارجی با پینگ ${data.latencyMs} میلی‌ثانیه تأیید شد.`);
      }
    } catch (e: any) {
      setHealthResult({
        healthy: false,
        error: e.message || 'خطا در ارتباط با سرور تست سلامت.',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveAndUseExternal = () => {
    onSaveExternalConfig(localConfig);
    onChangeProvider('external');
    onToast(`سرویس هوش مصنوعی به «${localConfig.name || 'سرویس خارجی'}» تغییر یافت.`);
    onClose();
  };

  const handleUseGoogle = () => {
    onChangeProvider('google');
    onToast('موتور اصلی Google AI Studio فعال شد.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-black text-white">تنظیمات موتور هوش مصنوعی</h3>
          </div>
          <p className="text-xs text-slate-400">
            خوراک اصلی این استودیو هوش مصنوعی Google AI Studio است؛ اما می‌توانید سرویس‌های خارجی دلخواه را نیز متصل و تست سلامت کنید.
          </p>
        </div>

        {/* Option 1: Primary Engine (Google AI Studio) */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            provider === 'google'
              ? 'bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-purple-500 ring-2 ring-purple-500/30 shadow-xl'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">
                    Google AI Studio (Gemini 3.8 Flash)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    خوراک اصلی و پیش‌فرض
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  موتور اصلی پردازش سناریوها با جدیدترین مدل‌های هوش مصنوعی صوتی و متنی گوگل، با بالاترین کیفیت، بیان طبیعی فارسی و بدون نیاز به ورود کلید.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseGoogle}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                provider === 'google'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {provider === 'google' ? '✓ فعال است' : 'انتخاب به عنوان موتور فعال'}
            </button>
          </div>
        </div>

        {/* Option 2: External API Provider (User Requested) */}
        <div
          className={`p-5 rounded-2xl border transition-all space-y-4 ${
            provider === 'external'
              ? 'bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">
                اتصال سرویس خارجی هوش مصنوعی (External LLM API)
              </h4>
            </div>
            {provider === 'external' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                موتور فعال فعلی
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            می‌توانید کلید و آدرس هر سرویس سازگار با استاندارد OpenAI (مانند OpenAI، Groq، OpenRouter یا مدل‌های محلی) را وارد کرده و سلامت اتصال آن را بسنجید.
          </p>

          {/* Presets Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">سرویس‌های آماده:</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROVIDERS.map((preset) => {
                const isSelected = localConfig.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Base URL */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>آدرس پایه API (Base URL):</span>
              </label>
              <input
                type="text"
                value={localConfig.baseUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* API Key */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>کلید API (API Key خارجی):</span>
              </label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* Model Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>نام مدل (Model Identifier):</span>
              </label>
              <input
                type="text"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>

          {/* Health Check Button & Status Banner (Requested Feature) */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestHealth}
                disabled={isCheckingHealth || !localConfig.baseUrl || !localConfig.apiKey}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCheckingHealth ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>تست سلامت و اعلام وضعیت اتصال</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndUseExternal}
                disabled={!localConfig.apiKey}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
              >
                ذخیره و استفاده از سرویس خارجی
              </button>
            </div>

            {/* Health status result card */}
            {healthResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  healthResult.healthy
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/30 border-red-500/40 text-red-200'
                }`}
              >
                {healthResult.healthy ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {healthResult.healthy ? 'سالم و متصل (Online)' : 'خطا در سلامت اتصال (Offline)'}
                    </span>
                    {healthResult.latencyMs && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                        پینگ: {healthResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {healthResult.message || healthResult.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & Fallback Note */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>نکته امنیت و پایداری:</strong> کلیدهای خارجی شما صرفاً در مرورگر ذخیره شده و از طریق پروکسی سرور برای تولید ارسال می‌شوند. در صورت بروز هرگونه قطعی یا محدودیت اعتبار در سرویس خارجی، برنامه به صورت خودکار به هوش مصنوعی پرسرعت Google AI Studio سوئیچ می‌کند تا فرآیند ساخت پادکست متوقف نشود.
          </p>
        </div>
      </div>
    </div>
  );
};
