import { errorMessage, json, normalizeOpenAiEndpoint, readJson, type PagesHandler } from "../../_shared";

export const onRequestPost: PagesHandler = async ({ request }) => {
  const startedAt = Date.now();
  try {
    const input = await readJson(request);
    const baseUrl = typeof input.baseUrl === "string" ? input.baseUrl : "";
    const apiKey = typeof input.apiKey === "string" ? input.apiKey : "";
    const model = typeof input.model === "string" && input.model.trim() ? input.model : "gpt-4o-mini";
    if (!baseUrl.trim() || !apiKey.trim()) {
      return json({ healthy: false, latencyMs: Date.now() - startedAt, message: "Base URL و API Key الزامی هستند.", error: "Missing credentials" }, 400);
    }
    const endpoint = normalizeOpenAiEndpoint(baseUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 5 }),
    });
    const latencyMs = Date.now() - startedAt;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = (data as any)?.error?.message || `Provider returned HTTP ${response.status}`;
      return json({ healthy: false, latencyMs, message: "سرویس پاسخ معتبر نداد.", error });
    }
    return json({ healthy: true, latencyMs, message: "اتصال به سرویس خارجی با موفقیت برقرار شد.", error: "" });
  } catch (error) {
    return json({ healthy: false, latencyMs: Date.now() - startedAt, message: "بررسی اتصال ناموفق بود.", error: errorMessage(error) });
  }
};
