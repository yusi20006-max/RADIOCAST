import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const EPISODES_FILE = path.join(__dirname, "episodes.json");

app.use(cors());
app.use(express.json({ limit: "15mb" }));

// مدیریت فایل پایدار اپیزودها
function loadEpisodes(): any[] {
  try {
    if (fs.existsSync(EPISODES_FILE)) {
      const data = fs.readFileSync(EPISODES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("خطا در خواندن episodes.json:", err);
  }
  return [];
}

function saveEpisodes(episodes: any[]): void {
  try {
    fs.writeFileSync(EPISODES_FILE, JSON.stringify(episodes, null, 2), "utf-8");
  } catch (err) {
    console.error("خطا در ذخیره episodes.json:", err);
  }
}

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("کلید GEMINI_API_KEY تنظیم نشده است.");
  }
  return new GoogleGenAI({ apiKey });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/podcast/generate-script", async (req, res) => {
  try {
    const { topic, sourceText, hostsCount = 2, tone = "conversational", targetDurationMinutes = 3, apiKey } = req.body;

    if (!topic && !sourceText) {
      return res.status(400).json({ error: "ارائه موضوع یا متن مرجع الزامی است." });
    }

    const ai = getGeminiClient(apiKey);

    const prompt = `
شما یک سردبیر و سناریونویس ارشد پادکست رادیویی به زبان فارسی هستید.
وظیفه شما تبدیل موضوع و محتوای زیر به یک سناریوی جذاب گفتگومحور با ${hostsCount} گوینده است.

مشخصات سناریو:
- موضوع: ${topic || "استخراج شده از متن"}
- لحن: ${tone}
- مدت زمان تقریبی: حدود ${targetDurationMinutes} دقیقه
- متن ورودی / مرجع:
"""
${sourceText || topic}
"""

قوانین مهم:
۱. خروجی باید یک آرایه JSON معتبر و تمیز باشد، بدون هیچ توضیح اضافی یا فرمت Markdown در اطراف آن.
۲. هر عضو آرایه یک آبجکت شامل کلیدهای زیر باشد:
   - "speaker": نام گوینده (مثلاً "سارا" یا "نیما")
   - "text": دیالوگ روان فارسی با نشانه‌گذاری دقیق برای خوانش صوتی
   - "bgmPrompt": حس موزیک زیرصدا در صورت لزوم (اختیاری)
   - "sfx": افکت صوتی مناسب در صورت نیاز (مثلاً "intro", "chime", "transition" یا خالی)

تنها فرمت مجاز:
[
  {"speaker": "سارا", "text": "...", "bgmPrompt": "ambient soft", "sfx": "intro"},
  {"speaker": "نیما", "text": "...", "bgmPrompt": "", "sfx": ""}
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const outputText = response.text || "[]";
    let scriptData = [];
    try {
      scriptData = JSON.parse(outputText);
    } catch {
      const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      scriptData = JSON.parse(cleaned);
    }

    res.json({ script: scriptData });
  } catch (error: any) {
    console.error("Error generating script:", error);
    res.status(500).json({ error: error.message || "خطا در تولید اسکریپت" });
  }
});

app.post("/api/podcast/synthesize-turn", async (req, res) => {
  try {
    const { text, voiceName = "Puck", apiKey } = req.body;

    if (!text) {
      return res.status(400).json({ error: "متن جهت تبدیل به صدا الزامی است." });
    }

    const ai = getGeminiClient(apiKey);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((part: any) => part.inlineData?.mimeType?.startsWith("audio/"));

    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error("پاسخ صوتی معتبری از جمینای دریافت نشد.");
    }

    res.json({
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || "audio/wav",
    });
  } catch (error: any) {
    console.error("Error synthesizing audio:", error);
    res.status(500).json({ error: error.message || "خطا در تولید صدای دیالوگ" });
  }
});

app.get("/api/rss/feed", (req, res) => {
  const episodes = loadEpisodes();
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>RadioCast Persian Studio</title>
    <link>https://github.com/yusi20006-max/RADIOCAST</link>
    <description>پادکست‌های تولید شده توسط استودیو رادیوکست فارسی با هوش مصنوعی</description>
    <language>fa</language>
    ${episodes
      .map(
        (ep) => `
    <item>
      <title>${ep.title || "اپیزود جدید"}</title>
      <description>${ep.description || ""}</description>
      <pubDate>${new Date(ep.createdAt || Date.now()).toUTCString()}</pubDate>
      <enclosure url="${ep.audioUrl || ""}" type="audio/mpeg" length="0"/>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  res.header("Content-Type", "application/xml");
  res.send(rssXml);
});

app.get("/api/rss/episodes", (req, res) => {
  res.json(loadEpisodes());
});

app.post("/api/rss/episodes", (req, res) => {
  const { title, description, audioUrl } = req.body;
  const episodes = loadEpisodes();
  const newEpisode = {
    id: Date.now().toString(),
    title,
    description,
    audioUrl,
    createdAt: new Date().toISOString(),
  };
  episodes.unshift(newEpisode);
  saveEpisodes(episodes);
  res.status(201).json(newEpisode);
});

app.listen(port, () => {
  console.log(`RadioCast backend running on port ${port}`);
});
