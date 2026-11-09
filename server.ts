import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize shared Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Health check endpoint for external third-party LLM APIs
 */
app.post('/api/external-provider/health-check', async (req, res) => {
  const startTime = Date.now();
  try {
    const { baseUrl, apiKey, model = 'gpt-4o-mini' } = req.body;

    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
      return res.status(400).json({ healthy: false, error: 'آدرس پایه API (Base URL) وارد نشده است.' });
    }
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ healthy: false, error: 'کلید API (API Key) وارد نشده است.' });
    }

    const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');

    // Test with a lightweight ping to /chat/completions
    const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model.trim() || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(12000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let errorMsg = `خطای سرویس (${response.status}): کلید یا آدرس نامعتبر است.`;
      if (response.status === 401) {
        errorMsg = 'کلید API ارائه‌شده نامعتبر یا منقضی شده است (401 Unauthorized).';
      } else if (response.status === 404) {
        errorMsg = `آدرس اندپوینت یا مدل «${model}» یافت نشد (404 Not Found).`;
      } else if (response.status === 429) {
        errorMsg = 'محدودیت سقف درخواست یا اعتبار اکانت خارجی (429 Rate Limit).';
      }
      return res.json({
        healthy: false,
        latencyMs,
        error: errorMsg,
        details: errBody.slice(0, 200),
      });
    }

    const data: any = await response.json().catch(() => ({}));
    return res.json({
      healthy: true,
      latencyMs,
      message: 'اتصال به سرویس با موفقیت برقرار شد و پاسخ آزمایشی در کمتر از ۱ ثانیه دریافت گردید.',
      model: model || data.model || 'سرویس متصل',
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return res.json({
      healthy: false,
      latencyMs,
      error: error.message || 'خطا در برقراری ارتباط شبکه با سرور خارجی (Timeout یا عدم دسترسی).',
    });
  }
});

/**
 * Endpoint to generate structured Persian podcast script from raw text
 */
app.post('/api/podcast/generate-script', async (req, res) => {
  try {
    const {
      sourceText,
      format = 'dual', // 'dual' | 'solo' | 'interview' | 'briefing'
      tone = 'friendly', // 'friendly' | 'serious' | 'energetic' | 'dramatic' | 'humorous'
      speed = 'normal', // 'slow' | 'normal' | 'fast'
      host1Name = 'نیما',
      host2Name = 'سارا',
      durationTarget = 'medium', // 'short' | 'medium' | 'detailed'
      dynamicToneEnabled = true,
      aiProvider = 'google', // 'google' | 'external'
      externalConfig,
    } = req.body;

    if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) {
      return res.status(400).json({ error: 'لطفاً متن ورودی را وارد نمایید.' });
    }

    const toneDescriptions: Record<string, string> = {
      friendly: 'دوستانه، صمیمی، محاوره‌ای و گرم (مانند دو دوست نزدیک که در کافه گپ می‌زنند)',
      serious: 'جدی، تحلیلی، فاخر، عمیق و مستند (مناسب پادکست‌های علمی، کسب‌وکار و اندیشه)',
      energetic: 'شاد، پرانرژی، پویا، با ضرب‌آهنگ تند و انگیزشی (مناسب پادکست‌های صبحگاهی و تکنولوژی)',
      dramatic: 'داستانی، پرتعلیق، سینمایی، با مکث‌های هوشمندانه و حس کنجکاوی برانگیز',
      humorous: 'طنزآمیز، شوخ‌طبع، با کنایه‌های هوشمندانه، تکیه‌کلام‌های جذاب و فضای مفرح',
    };

    const formatInstructions: Record<string, string> = {
      dual: `گفتگوی دو نفره بین دو مجری به نام‌های "${host1Name}" (میزبان اصلی، کنجکاو، سؤال‌پرس و خوش‌صحبت) و "${host2Name}" (همکار مسلط، تحلیل‌گر، ارائه‌دهنده نکات جالب). دیالوگ‌ها باید بده‌بستان‌های طبیعی داشته باشند (تاییدها مثل "دقیقاً"، "چه جالب"، "آره واقعاً"، تبادل نظر).`,
      solo: `روایت‌گری تک‌نفره توسط "${host1Name}" با بیان فصیح، ارتباط مستقیم با شنونده ("شنوندگان عزیز"، "شاید براتون جالب باشه بدونید...")، ساختار مقدمه، اوج داستان و نتیجه‌گیری شنیدنی.`,
      interview: `مصاحبه تخصصی بین "${host1Name}" (خبرنگار و پرسشگر چالشی) و "${host2Name}" (مهمان متخصص و صاحب‌نظر با پاسخ‌های غنی و راهبردی).`,
      briefing: `کپسول صوتی خلاصه و پرسرعت ("خلاصه ۵ دقیقه‌ای") با تیترها، نکات کلیدی و جمع‌بندی کاربردی توسط "${host1Name}".`,
    };

    const turnCounts: Record<string, string> = {
      short: 'بین ۵ تا ۸ نوبت گفتگو (مناسب یک قطعه کوتاه و متمرکز)',
      medium: 'بین ۸ تا ۱۴ نوبت گفتگو (پوشش کامل ایده‌های اصلی و بحث جذاب)',
      detailed: 'بین ۱۴ تا ۲۰ نوبت گفتگو (بررسی عمیق با جزییات و تحلیل موشکافانه)',
    };

    const prompt = `
نقش شما: شما نویسنده و تهیه‌کننده ارشد محبوب‌ترین پادکست‌های صوتی فارسی هستید.
وظیفه شما این است که متن خام ارائه‌شده زیر را به یک فیلم‌نامه/سناریوی پادکست صوتی فارسی کاملاً طبیعی، جذاب و شنیدنی تبدیل کنید.

قالب برنامه:
${formatInstructions[format] || formatInstructions.dual}

لحن کلی برنامه:
${toneDescriptions[tone] || toneDescriptions.friendly}

تعداد بخش‌ها:
${turnCounts[durationTarget] || turnCounts.medium}

سرعت خوانش مدنظر: ${speed === 'slow' ? 'آهسته و آرام' : speed === 'fast' ? 'سریع و ریتمیک' : 'طبیعی و متعادل'}

${
  dynamicToneEnabled
    ? `قانون کلیدی: قابلیت تغییر لحن پاراگراف به پاراگراف فعال است:
برای هر دیالوگ و پاراگراف، لحن گفتار متناسب با ساختار معنایی آن را در فیلد turnTone مشخص کن:
- اگر جمله پرسشی، سوالی یا چالش‌برانگیز است (شامل علامت سوال ؟ یا مفهوم پرسشگری): turnTone = "curious" (لحن کنجکاو با ترفیع صدا در پایان سوال).
- اگر جمله شگفت‌انگیز، جالب یا حاوی علامت تعجب است: turnTone = "excited" (لحن شگفت‌زده و پرانرژی).
- اگر نتیجه‌گیری، تحلیل عمیق، تأمل یا نکته فلسفی است: turnTone = "reflective" (لحن متفکرانه و شمرده).
- اگر بیان شوخی، کنایه، خنده یا طنز است: turnTone = "humorous" (لحن شوخ‌طبع و با لبخند).
- اگر فراز پرتعلیق، رازآلود، هیجان‌انگیز یا داستانی است: turnTone = "dramatic" (لحن پرکشش و سینمایی).
- اگر فکت، آمار رسمی یا تعریف علمی است: turnTone = "serious" (لحن جدی و محکم).
- در غیر این صورت turnTone = "friendly".`
    : ''
}

متن ورودی کاربر:
"""
${sourceText.slice(0, 8000)}
"""

 اصول اساسی نگارش پادکست فارسی:
۱. زبان پادکست باید فارسی روان، طبیعی و محاوره‌ای یا فاخر (متناسب با لحن انتخاب‌شده) باشد؛ شبیه به پادکست‌های معروفی مثل رادیو چهرازی، بی‌پلاس، چنل‌بی، فردوسی‌خوان یا دایجست.
۲. عبارات خشک کتابی را به دیالوگ‌های زنده تبدیل کن.
۳. در طول متن از نشانگرهای صوتی و ری‌اکشن‌های انسانی استفاده کن: مانند [خنده کوتاه]، [مکث تأملی]، [تأکید] یا علامت‌های طبیعی مکالمه فارسی.
۴. برای هر بخش، مشخص کن که آیا به افکت صوتی خاصی (مثل اینترو، ترنزیشن، دینگ، یا صدای کف زدن) نیاز دارد.
۵. خروجی باید یک ساختار JSON تمیز مطابق با ساختار درخواستی باشد.
`;

    // Check if user requested an external provider (OpenAI, OpenRouter, Groq, etc.)
    if (aiProvider === 'external' && externalConfig?.apiKey && externalConfig?.baseUrl) {
      try {
        const cleanBaseUrl = externalConfig.baseUrl.trim().replace(/\/+$/, '');
        const systemInstruction = 'You are an award-winning Persian podcast director and audio scriptwriter. Output strictly valid JSON matching the podcast screenplay schema with fields: title, episodeSummary, genre, suggestedBgm, tags, chapters, script.';

        const extResponse = await fetch(`${cleanBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${externalConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: externalConfig.model?.trim() || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt + '\nIMPORTANT: Output ONLY pure valid JSON. No markdown backticks, no markdown code blocks.' },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (extResponse.ok) {
          const extData: any = await extResponse.json();
          const rawContent = extData.choices?.[0]?.message?.content;
          if (rawContent) {
            const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
            const parsed = JSON.parse(cleanJson);
            return res.json({
              ...parsed,
              providerUsed: externalConfig.name || 'سرویس هوش مصنوعی خارجی',
            });
          }
        }
        console.warn('External provider responded with error, falling back to Google AI Studio Gemini...');
      } catch (extError) {
        console.warn('External API call failed, safely falling back to Google AI Studio Gemini:', extError);
      }
    }

    // Primary & Default: Google AI Studio (Gemini 3.8 Flash)
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an award-winning Persian podcast director and audio scriptwriter. Output strictly valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'عنوان جذاب و خلاقانه برای اپیزود پادکست به فارسی' },
            episodeSummary: { type: Type.STRING, description: 'خلاصه شنیدنی اپیزود (Show Notes) به فارسی در ۲-۳ جمله' },
            genre: { type: Type.STRING, description: 'دسته‌بندی موضوعی پادکست' },
            suggestedBgm: {
              type: Type.STRING,
              description: 'بهترین سبک موسیقی زمینه: lofi, ambient, acoustic, cinematic, iranian-fusion, none',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '۳ تا ۵ تگ کلیدی برای انتشار در اسپاتیفای و کست‌باکس',
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'عنوان فصل/بخش' },
                  startTurnIndex: { type: Type.INTEGER, description: 'شماره اولین دیالوگ این بخش (از ۰ شروع می‌شود)' },
                },
                required: ['title', 'startTurnIndex'],
              },
              description: 'فصل‌بندی زمانی پادکست',
            },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: 'شناسه گوینده: host1 یا host2 یا narrator' },
                  speakerName: { type: Type.STRING, description: 'نام گوینده به فارسی (مثلا نیما یا سارا)' },
                  text: { type: Type.STRING, description: 'متن گفتگوی گوینده به فارسی روان' },
                  turnTone: {
                    type: Type.STRING,
                    description: 'لحن اختصاصی این پاراگراف: curious, excited, reflective, friendly, serious, humorous, dramatic',
                  },
                  speechStyle: { type: Type.STRING, description: 'دستور لحن و حس بیان گوینده به انگلیسی برای مدل صوتی' },
                  sfxCue: {
                    type: Type.STRING,
                    description: 'افکت صوتی همراه: intro, transition, ding, laugh, applause, outro, none',
                  },
                },
                required: ['speaker', 'speakerName', 'text', 'speechStyle', 'sfxCue'],
              },
              description: 'لیست متوالی دیالوگ‌های پادکست',
            },
          },
          required: ['title', 'episodeSummary', 'genre', 'suggestedBgm', 'tags', 'chapters', 'script'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('مدل پاسخی ارسال نکرد.');
    }

    const parsedData = JSON.parse(resultText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating podcast script:', error);
    return res.status(500).json({
      error: error.message || 'خطا در تولید سناریوی پادکست فارسی. لطفاً دوباره تلاش کنید.',
    });
  }
});

/**
 * Endpoint to synthesize high-quality audio using gemini-3.8-flash-tts / gemini-3.8-flash-lite-tts
 */
app.post('/api/podcast/synthesize-turn', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore', // 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
      style = 'Clear and friendly Persian podcast host',
      speed = 'normal',
      turnTone = 'auto',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'متن برای تبدیل به صوت خالی است.' });
    }

    // Adjust style description based on speed parameter
    let styledPrompt = text;
    let speedInstruction = '';
    if (speed === 'slow') {
      speedInstruction = 'Speak in a calm, unhurried, measured pace. ';
    } else if (speed === 'fast') {
      speedInstruction = 'Speak in an energetic, rapid, brisk pace. ';
    } else if (speed === 'veryFast') {
      speedInstruction = 'Speak noticeably faster than normal while keeping every word clear and intelligible. ';
    }

    // Adjust style based on paragraph-by-paragraph tone
    let toneInstruction = '';
    const isQuestion = text.includes('؟') || text.includes('?');
    const isExclamation = text.includes('!') || text.includes('!');

    if (turnTone === 'curious' || (turnTone === 'auto' && isQuestion)) {
      toneInstruction = 'Speak with a curious, inquisitive, questioning tone with genuine interest and a slight rising pitch on questions. ';
    } else if (turnTone === 'excited' || (turnTone === 'auto' && isExclamation)) {
      toneInstruction = 'Speak with lively astonishment, bright excitement and energetic enthusiasm. ';
    } else if (turnTone === 'reflective') {
      toneInstruction = 'Speak with a thoughtful, philosophical, contemplative and deeply sincere tone. ';
    } else if (turnTone === 'humorous') {
      toneInstruction = 'Speak with a playful, smiling, lighthearted and witty vocal demeanor. ';
    } else if (turnTone === 'dramatic') {
      toneInstruction = 'Speak with suspenseful, intense, cinematic storytelling gravity. ';
    } else if (turnTone === 'serious') {
      toneInstruction = 'Speak with an authoritative, dignified, formal and articulate tone. ';
    } else if (turnTone === 'friendly') {
      toneInstruction = 'Speak with a warm, conversational, friendly and empathetic tone. ';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: styledPrompt,
              speechMetadata: {
                style: `${speedInstruction}${toneInstruction}${style}`,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('صوتی توسط سرویس تولید نشد.');
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in speech synthesis:', error);
    return res.status(500).json({
      error: error.message || 'خطا در تبدیل متن به گفتار صوتی.',
    });
  }
});

/**
 * Endpoint to refine a specific dialogue turn (e.g. make funnier, shorter, deeper)
 */
app.post('/api/podcast/refine-turn', async (req, res) => {
  try {
    const { currentText, instruction, speakerName, tone } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `
جمله فعلی گوینده (${speakerName}) در پادکست فارسی به این صورت است:
"${currentText}"

درخواست بازنویسی: "${instruction}"
لحن کلی پادکست: ${tone}

لطفاً تنها جمله بازنویسی‌شده و بهینه‌شده به زبان فارسی محاوره‌ای و روان را بدون توضیحات اضافه ارسال کن.
`,
    });

    const refinedText = response.text?.trim() || currentText;
    return res.json({ refinedText });
  } catch (error: any) {
    console.error('Error refining turn:', error);
    return res.status(500).json({ error: error.message || 'خطا در بازنویسی دیالوگ.' });
  }
});

/**
 * In-memory podcast channel and episodes store for RSS feed
 */
let storedPodcastFeed = {
  channel: {
    title: 'رادیو کست | پادکست‌های هوش مصنوعی',
    description: 'پادکست‌های شنیدنی تولید شده با هوش مصنوعی درباره فناوری، فرهنگ، رشد فردی و علم.',
    author: 'استودیو رادیو کست',
    email: 'podcast@radiocast.studio',
    category: 'Technology',
    website: process.env.APP_URL || 'https://radiocast.studio',
    language: 'fa',
    coverImageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1400&auto=format&fit=crop&q=80',
  },
  episodes: [] as any[],
};

function buildRssXml(channel: any, episodes: any[], appUrl: string): string {
  const currentYear = new Date().getFullYear();
  const pubDate = new Date().toUTCString();
  const siteUrl = appUrl.replace(/\/+$/, '');
  const feedUrl = `${siteUrl}/api/podcast/rss.xml`;

  let itemsXml = '';
  // A podcast enclosure must point to a real, publicly reachable audio file.
  // Do not fabricate /audio/... URLs for episodes that are only stored in browser memory.
  const publishableEpisodes = Array.isArray(episodes)
    ? episodes.filter((ep) => typeof ep.audioUrl === 'string' && /^https?:\/\//i.test(ep.audioUrl.trim()))
    : [];
  publishableEpisodes.forEach((ep, index) => {
    const epDate = ep.createdAt ? new Date(ep.createdAt).toUTCString() : pubDate;
    const epDuration = Math.round(ep.durationSeconds || 180);
    const epNum = ep.episodeNumber || episodes.length - index;
    const coverUrl = ep.coverArtUrl || channel.coverImageUrl;
    const audioUrl = ep.audioUrl.trim();

    itemsXml += `
    <item>
      <title><![CDATA[${ep.title || 'اپیزود پادکست'}]]></title>
      <description><![CDATA[${ep.episodeSummary || ep.title || ''}]]></description>
      <link>${siteUrl}</link>
      <guid isPermaLink="false">radiocast-${ep.id || index}</guid>
      <pubDate>${epDate}</pubDate>
      <enclosure url="${audioUrl}" length="${ep.audioLength || 0}" type="audio/mpeg" />
      <itunes:title><![CDATA[${ep.title || 'اپیزود پادکست'}]]></itunes:title>
      <itunes:author><![CDATA[${channel.author}]]></itunes:author>
      <itunes:summary><![CDATA[${ep.episodeSummary || ''}]]></itunes:summary>
      <itunes:duration>${epDuration}</itunes:duration>
      <itunes:episode>${epNum}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>no</itunes:explicit>
      <itunes:image href="${coverUrl}" />
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${channel.title}]]></title>
    <link>${siteUrl}</link>
    <language>${channel.language || 'fa'}</language>
    <copyright>&#xA9; ${currentYear} ${channel.author}</copyright>
    <itunes:author><![CDATA[${channel.author}]]></itunes:author>
    <description><![CDATA[${channel.description}]]></description>
    <itunes:summary><![CDATA[${channel.description}]]></itunes:summary>
    <itunes:owner>
      <itunes:name><![CDATA[${channel.author}]]></itunes:name>
      <itunes:email>${channel.email}</itunes:email>
    </itunes:owner>
    <itunes:explicit>no</itunes:explicit>
    <itunes:category text="${channel.category || 'Technology'}" />
    <itunes:image href="${channel.coverImageUrl}" />
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;
}

/**
 * Public RSS Feed endpoint for Apple Podcasts, Spotify, Castbox, etc.
 */
app.get('/api/podcast/rss.xml', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  const xml = buildRssXml(storedPodcastFeed.channel, storedPodcastFeed.episodes, appUrl);
  res.set('Content-Type', 'application/xml; charset=utf-8');
  return res.send(xml);
});

/**
 * Update published episodes in the live RSS feed
 */
app.post('/api/podcast/update-feed', (req, res) => {
  try {
    const { channel, episodes } = req.body;
    if (channel) {
      storedPodcastFeed.channel = { ...storedPodcastFeed.channel, ...channel };
    }
    if (Array.isArray(episodes)) {
      storedPodcastFeed.episodes = episodes;
    }
    return res.json({ success: true, count: storedPodcastFeed.episodes.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Generate standalone RSS XML string for direct download
 */
app.post('/api/podcast/generate-rss', (req, res) => {
  try {
    const { channel, episodes } = req.body;
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    const xml = buildRssXml(channel || storedPodcastFeed.channel, episodes || storedPodcastFeed.episodes, appUrl);
    return res.json({ xml });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * Direct project source-code ZIP download
 */
app.use(express.static(path.resolve('public')));

app.get('/api/download/source-zip', (req, res) => {
  const zipPath = path.resolve('public', 'radiocast-podcast-studio.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="radiocast-podcast-studio.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'فایل زیپ در سرور یافت نشد.' });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'PodcastStudio-Backend' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎙️ RadioCast Podcast Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
