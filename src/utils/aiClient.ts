import type { ExternalProviderConfig, PlaybackSpeed } from '../types/podcast';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function getEndpoint(config: ExternalProviderConfig, path: string): string {
  const raw = config.baseUrl.trim();
  if (!raw) throw new Error('آدرس پایه API را وارد کنید.');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('آدرس پایه API معتبر نیست. نمونه: https://provider.example/v1');
  }
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
    throw new Error('برای امنیت، Base URL باید HTTPS باشد؛ فقط آدرس محلی می‌تواند HTTP باشد.');
  }
  return `${raw.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function assertConfig(config: ExternalProviderConfig): void {
  if (!config.apiKey.trim()) throw new Error('کلید API را در تنظیمات هوش مصنوعی وارد کنید.');
  if (!config.model.trim()) throw new Error('شناسه مدل را در تنظیمات هوش مصنوعی وارد کنید.');
  getEndpoint(config, 'chat/completions');
}

async function readApiError(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error?.message || parsed?.message || raw || `HTTP ${response.status}`;
  } catch {
    return raw || `HTTP ${response.status}`;
  }
}

async function chatCompletion(
  config: ExternalProviderConfig,
  messages: ChatMessage[],
  maxTokens = 4096,
): Promise<string> {
  assertConfig(config);
  const response = await fetch(getEndpoint(config, 'chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: config.model.trim(),
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) throw new Error(`خطای سرویس AI (${response.status}): ${await readApiError(response)}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('پاسخ سرویس AI خالی یا با قالب ناشناخته بود.');
  }
  return content.trim();
}

export async function testAiConnection(config: ExternalProviderConfig): Promise<number> {
  const startedAt = Date.now();
  await chatCompletion(config, [
    { role: 'user', content: 'Reply with exactly: OK' },
  ], 8);
  return Date.now() - startedAt;
}

export async function generatePodcastScript(
  config: ExternalProviderConfig,
  params: {
    sourceText: string;
    format: string;
    tone: string;
    speed: PlaybackSpeed;
    host1Name: string;
    host2Name: string;
    host1Voice: string;
    host2Voice: string;
    bgmStyle: string;
    durationTarget: string;
    dynamicToneEnabled: boolean;
  },
): Promise<any> {
  const formatNames: Record<string, string> = {
    dual: 'گفتگوی دو نفره',
    solo: 'روایت تک‌نفره',
    interview: 'مصاحبه تخصصی',
    briefing: 'خلاصه و مرور خبری',
  };
  const lengthNames: Record<string, string> = {
    short: '۵ تا ۸ نوبت گفتگو',
    medium: '۸ تا ۱۴ نوبت گفتگو',
    detailed: '۱۴ تا ۲۰ نوبت گفتگو',
  };
  const prompt = `به‌عنوان سردبیر و سناریونویس حرفه‌ای پادکست فارسی، متن مرجع را به سناریویی دقیق، جذاب و طبیعی تبدیل کن.
قالب: ${formatNames[params.format] || params.format}
لحن: ${params.tone}
طول: ${lengthNames[params.durationTarget] || params.durationTarget}
میزبان اول: ${params.host1Name}
میزبان دوم: ${params.host2Name}
موسیقی پیشنهادی: ${params.bgmStyle}
تغییر لحن متناسب با متن: ${params.dynamicToneEnabled ? 'فعال' : 'غیرفعال'}

فقط یک شیء JSON معتبر و بدون Markdown برگردان، با این ساختار:
{
  "title": "عنوان فارسی",
  "episodeSummary": "خلاصه کوتاه",
  "genre": "دسته‌بندی",
  "suggestedBgm": "${params.bgmStyle}",
  "tags": ["برچسب"],
  "chapters": [{"title":"عنوان بخش","startTurnIndex":0}],
  "script": [
    {"speaker":"host1","speakerName":"${params.host1Name}","text":"متن دیالوگ","turnTone":"friendly","sfxCue":"none"}
  ]
}
قواعد: متن کاملاً فارسی و طبیعی باشد؛ از اطلاعات خارج از متن مرجع ادعای قطعی نساز؛ برای قالب solo فقط host1 را به‌کار ببر؛ در قالب‌های دیگر میان host1 و host2 تعادل ایجاد کن؛ دیالوگ‌ها را کوتاه و مناسب گفتار بنویس؛ turnTone یکی از auto, curious, excited, reflective, friendly, serious, humorous, dramatic باشد؛ sfxCue یکی از none, intro, transition, ding, applause, outro باشد؛ حداقل ۵ نوبت تولید کن؛ خروجی فقط JSON باشد.

متن مرجع:
<source>
${params.sourceText}
</source>`;
  const raw = await chatCompletion(config, [
    { role: 'system', content: 'You generate valid JSON podcast scripts. Never wrap JSON in Markdown.' },
    { role: 'user', content: prompt },
  ], 6000);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('پاسخ مدل شامل JSON معتبر برای سناریو نبود.');
  }
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    throw new Error('ساختار JSON پاسخ مدل قابل‌خواندن نیست؛ دوباره تلاش کنید یا مدل دیگری انتخاب کنید.');
  }
  if (!Array.isArray(parsed.script) || parsed.script.length < 1) {
    throw new Error('مدل سناریو تولید کرد اما آرایه دیالوگ‌ها خالی یا نامعتبر است.');
  }
  return parsed;
}

const TTS_VOICE_MAP: Record<string, string> = {
  Puck: 'echo',
  Kore: 'nova',
  Fenrir: 'onyx',
  Zephyr: 'shimmer',
  Charon: 'fable',
};

const SPEED_MAP: Record<PlaybackSpeed, number> = {
  slow: 0.8,
  normal: 1,
  fast: 1.25,
  veryFast: 1.5,
};

export async function synthesizeSpeech(
  config: ExternalProviderConfig,
  text: string,
  voiceName: string,
  speed: PlaybackSpeed,
): Promise<ArrayBuffer> {
  if (config.ttsProvider === 'google-cloud') {
    const apiKey = config.googleTtsApiKey?.trim();
    if (!apiKey) throw new Error('کلید Google Cloud Text-to-Speech را در تنظیمات TTS وارد کنید.');
    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: config.googleTtsLanguageCode?.trim() || 'fa-IR',
          name: config.googleTtsVoice?.trim() || 'fa-IR-Standard-A',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: SPEED_MAP[speed] || 1,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`خطای Google Cloud TTS (${response.status}): ${await readApiError(response)}`);
    }
    const data = await response.json();
    if (typeof data?.audioContent !== 'string' || !data.audioContent) {
      throw new Error('Google Cloud TTS خروجی صوتی معتبری برنگرداند.');
    }
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  assertConfig(config);
  const response = await fetch(getEndpoint(config, 'audio/speech'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: TTS_VOICE_MAP[voiceName] || 'alloy',
      response_format: 'mp3',
      speed: SPEED_MAP[speed] || 1,
    }),
  });
  if (!response.ok) {
    throw new Error(`سرویس گفتار (TTS) در دسترس نیست (${response.status}): ${await readApiError(response)}. این سرویس باید از مسیر OpenAI-compatible /audio/speech پشتیبانی کند.`);
  }
  const audio = await response.arrayBuffer();
  if (!audio.byteLength) throw new Error('سرویس گفتار فایل صوتی خالی برگرداند.');
  return audio;
}
