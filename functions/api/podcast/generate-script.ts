import {
  errorMessage, extractGeminiText, geminiGenerate, json, openAiChat,
  parseModelJson, readJson, requireGeminiKey, type Env, type PagesHandler,
} from "../../_shared";

const MODEL = "gemini-2.5-flash";
const allowedTones = "curious | excited | reflective | friendly | serious | humorous | dramatic";

function makePrompt(input: any): string {
  return `شما نویسنده و تهیه‌کننده ارشد پادکست فارسی هستید. بر اساس متن مرجع، یک سناریوی کامل، دقیق، شنیدنی و طبیعی تولید کنید.
متن مرجع:
${String(input.sourceText || "").slice(0, 50000)}

تنظیمات:
- قالب: ${input.format || "dual"}
- لحن کلی: ${input.tone || "friendly"}
- سرعت خوانش: ${input.speed || "normal"}
- گوینده اول: ${input.host1Name || "گوینده اول"}، صدای ${input.host1Voice || "Puck"}
- گوینده دوم: ${input.host2Name || "گوینده دوم"}، صدای ${input.host2Voice || "Kore"}
- سبک موسیقی: ${input.bgmStyle || "ambient"}
- مدت هدف: ${input.durationTarget || "medium"}
- تشخیص لحن مستقل هر دیالوگ: ${input.dynamicToneEnabled ? "فعال" : "غیرفعال"}

فقط یک شیء JSON معتبر برگردان و هیچ متن یا Markdown بیرون JSON ننویس.
ساختار خروجی دقیقاً:
{
  "title": "عنوان فارسی اپیزود",
  "episodeSummary": "خلاصه ۲ تا ۳ جمله‌ای",
  "genre": "دسته‌بندی",
  "suggestedBgm": "lofi | ambient | acoustic | cinematic | iranian-fusion | none",
  "tags": ["تگ۱", "تگ۲"],
  "chapters": [{"title": "مقدمه", "startTurnIndex": 0}],
  "script": [{
    "speaker": "host1 | host2 | narrator",
    "speakerName": "نام گوینده",
    "text": "متن دیالوگ فارسی",
    "speechStyle": "راهنمای کوتاه حس و شیوه بیان",
    "turnTone": "یکی از مقادیر مجاز",
    "sfxCue": "none | intro | outro | transition | ding | applause"
  }]
}
قواعد:
- متن دیالوگ‌ها فارسی روان، محاوره‌ایِ حرفه‌ای و مناسب خوانش صوتی باشد؛ از جملات بیش از حد بلند پرهیز کنید.
- خروجی شامل مقدمه، بدنه منسجم و جمع‌بندی باشد. عنوان، خلاصه، تگ‌ها و فصل‌ها متناسب با منبع باشند.
- برای قالب solo فقط از host1 استفاده کنید؛ در قالب‌های دیگر بین گویندگان تعادل طبیعی برقرار کنید.
- speaker فقط host1 یا host2 یا narrator باشد و speakerName با نام گوینده منطبق باشد.
- suggestedBgm فقط یکی از مقادیر مجاز و sfxCue فقط یکی از مقادیر مجاز باشد.
- turnTone فقط یکی از این مقادیر باشد: ${allowedTones}.
- اگر تشخیص لحن پویا فعال است، turnTone هر دیالوگ را بر اساس محتوای همان دیالوگ تعیین کنید؛ پرسش واقعی curious، هیجان excited، تأمل reflective، شوخی humorous، هشدار/اطلاعات حساس serious، روایت پرکشش dramatic و گفتگوی معمول friendly.
- startTurnIndex عدد صحیح صفرمبنا و در محدوده script باشد.
- تعداد دیالوگ‌ها متناسب با مدت هدف باشد و متن منبع را بدون جعل واقعیت بسط دهید.`;
}

export const onRequestPost: PagesHandler = async ({ request, env }) => {
  try {
    const input = await readJson(request);
    if (typeof input.sourceText !== "string" || !input.sourceText.trim()) {
      return json({ error: "متن مرجع برای تولید سناریو الزامی است." }, 400);
    }
    const prompt = makePrompt(input);
    let parsed: any;
    let externalError = "";

    if (input.aiProvider === "external" && input.externalConfig?.baseUrl && input.externalConfig?.apiKey) {
      try {
        const content = await openAiChat(
          String(input.externalConfig.baseUrl),
          String(input.externalConfig.apiKey),
          String(input.externalConfig.model || "gpt-4o-mini"),
          [{ role: "system", content: "فقط JSON معتبر مطابق ساختار درخواستی تولید کن." }, { role: "user", content: prompt }],
        );
        parsed = parseModelJson<any>(content);
      } catch (error) {
        externalError = errorMessage(error);
      }
    }

    if (!parsed) {
      const apiKey = requireGeminiKey(env);
      const result = await geminiGenerate(apiKey, MODEL, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      });
      parsed = parseModelJson<any>(extractGeminiText(result));
    }

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.script)) {
      throw new Error("ساختار خروجی سناریو معتبر نیست.");
    }
    const tones = new Set(["curious", "excited", "reflective", "friendly", "serious", "humorous", "dramatic"]);
    const sfx = new Set(["none", "intro", "outro", "transition", "ding", "applause"]);
    parsed.script = parsed.script.map((turn: any) => ({
      speaker: ["host1", "host2", "narrator"].includes(turn?.speaker) ? turn.speaker : "host1",
      speakerName: String(turn?.speakerName || (turn?.speaker === "host2" ? input.host2Name : input.host1Name) || "گوینده"),
      text: String(turn?.text || ""),
      speechStyle: String(turn?.speechStyle || ""),
      turnTone: tones.has(turn?.turnTone) ? turn.turnTone : "friendly",
      sfxCue: sfx.has(turn?.sfxCue) ? turn.sfxCue : "none",
    })).filter((turn: any) => turn.text.trim());
    if (!parsed.script.length) throw new Error("سناریوی تولیدشده دیالوگ قابل استفاده ندارد.");
    if (externalError) parsed.fallbackReason = externalError;
    return json({
      title: String(parsed.title || "اپیزود جدید"),
      episodeSummary: String(parsed.episodeSummary || ""),
      genre: String(parsed.genre || "عمومی"),
      suggestedBgm: ["lofi", "ambient", "acoustic", "cinematic", "iranian-fusion", "none"].includes(parsed.suggestedBgm) ? parsed.suggestedBgm : (input.bgmStyle || "ambient"),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [{ title: "مقدمه", startTurnIndex: 0 }],
      script: parsed.script,
    });
  } catch (error) {
    return json({ error: errorMessage(error, "خطا در تولید سناریو.") }, 500);
  }
};
