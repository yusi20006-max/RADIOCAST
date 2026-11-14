import { errorMessage, geminiGenerate, json, readJson, requireGeminiKey, type Env } from "../../_shared";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

function pcmToWavBase64(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const pcm = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) pcm[i] = binary.charCodeAt(i);
  const rateMatch = mimeType.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const channels = 1;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcm.length, true);
  const wav = new Uint8Array(44 + pcm.length);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcm, 44);
  return toBase64(wav);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const input = await readJson(request);
    const text = typeof input.text === "string" ? input.text.trim() : "";
    if (!text) return json({ error: "متن جهت تبدیل به صدا الزامی است." }, 400);
    const voiceName = typeof input.voiceName === "string" && input.voiceName.trim() ? input.voiceName.trim() : "Puck";
    const speedMap: Record<string, string> = { slow: "آهسته و شمرده", normal: "با سرعت طبیعی", fast: "کمی سریع‌تر از حالت عادی", veryFast: "سریع اما کاملاً واضح" };
    const speed = speedMap[String(input.speed)] || "با سرعت طبیعی";
    const tone = String(input.turnTone || "friendly");
    const style = String(input.style || "بیان طبیعی و واضح");
    const instruction = `فقط متن داخل بخش «متن برای خواندن» را بخوان. هیچ مقدمه، توضیح، ترجمه، برچسب یا جمله اضافه‌ای تولید نکن. زبان فارسی معیار و تلفظ روان باشد. لحن اجرا: ${tone}. راهنمای بیان: ${style}. سرعت: ${speed}. متن را دقیقاً با همین محتوا بخوان و کلمات را حذف یا اضافه نکن.\n\nمتن برای خواندن:\n${text}`;
    const result = await geminiGenerate(requireGeminiKey(env), "gemini-2.5-flash-preview-tts", {
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    const parts = result?.candidates?.[0]?.content?.parts;
    const audioPart = Array.isArray(parts) ? parts.find((part: any) => part?.inlineData?.data && String(part.inlineData.mimeType || "").startsWith("audio/")) : null;
    if (!audioPart) throw new Error("پاسخ صوتی معتبری از Gemini دریافت نشد.");
    const rawMime = String(audioPart.inlineData.mimeType || "audio/wav");
    const isPcm = /audio\/(?:l16|pcm)/i.test(rawMime);
    return json({
      audioBase64: isPcm ? pcmToWavBase64(audioPart.inlineData.data, rawMime) : audioPart.inlineData.data,
      mimeType: isPcm ? "audio/wav" : rawMime,
    });
  } catch (error) {
    return json({ error: errorMessage(error, "خطا در تولید صدای دیالوگ.") }, 500);
  }
};
