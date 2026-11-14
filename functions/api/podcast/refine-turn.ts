import { errorMessage, extractGeminiText, geminiGenerate, json, readJson, requireGeminiKey, type Env } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const input = await readJson(request);
    const currentText = typeof input.currentText === "string" ? input.currentText.trim() : "";
    const instruction = typeof input.instruction === "string" ? input.instruction.trim() : "";
    if (!currentText || !instruction) return json({ error: "متن فعلی و دستور بازنویسی الزامی هستند." }, 400);
    const prompt = `شما ویراستار حرفه‌ای دیالوگ پادکست فارسی هستید.
گوینده: ${input.speakerName || "گوینده"}
لحن کلی: ${input.tone || "friendly"}
دستور کاربر: ${instruction}
متن فعلی:
${currentText}

فقط متن نهایی بازنویسی‌شده را به فارسی برگردان. هیچ توضیح، عنوان، نقل‌قول یا مقدمه‌ای اضافه نکن. معنی و واقعیت‌های متن را حفظ کن و متن را برای گفتار طبیعی و روان مناسب‌سازی کن.`;
    const result = await geminiGenerate(requireGeminiKey(env), "gemini-2.5-flash", {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65 },
    });
    const refinedText = extractGeminiText(result).replace(/^["«]|["»]$/g, "").trim();
    if (!refinedText) throw new Error("متن بازنویسی‌شده خالی است.");
    return json({ refinedText });
  } catch (error) {
    return json({ error: errorMessage(error, "خطا در بازنویسی دیالوگ.") }, 500);
  }
};
