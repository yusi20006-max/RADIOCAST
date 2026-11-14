export interface KvBinding {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

export interface Env {
  GEMINI_API_KEY?: string;
  PODCAST_KV?: KvBinding;
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
  data: Record<string, unknown>;
}

export type PagesHandler = (context: PagesContext) => Response | Promise<Response>;

export type JsonRecord = Record<string, unknown>;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function errorMessage(error: unknown, fallback = "خطای غیرمنتظره رخ داد."): string {
  return error instanceof Error ? error.message : fallback;
}

export async function readJson<T = any>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("درخواست باید با Content-Type: application/json ارسال شود.");
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("بدنه درخواست JSON معتبر نیست.");
  }
}

export function requireGeminiKey(env: Env): string {
  if (!env.GEMINI_API_KEY) throw new Error("کلید GEMINI_API_KEY در تنظیمات Cloudflare Pages تعریف نشده است.");
  return env.GEMINI_API_KEY;
}

export async function geminiGenerate(
  apiKey: string,
  model: string,
  payload: Record<string, unknown>,
): Promise<any> {
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (result as any)?.error?.message || `Gemini API پاسخ ${response.status} برگرداند.`;
    throw new Error(message);
  }
  return result;
}

export function extractGeminiText(result: any): string {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.filter((part: any) => typeof part?.text === "string").map((part: any) => part.text).join("\n").trim();
}

export function parseModelJson<T>(text: string): T {
  const cleaned = text.replace(/^﻿/, "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstObject = cleaned.indexOf("{");
    const lastObject = cleaned.lastIndexOf("}");
    const firstArray = cleaned.indexOf("[");
    const lastArray = cleaned.lastIndexOf("]");
    const start = firstObject >= 0 && (firstArray < 0 || firstObject < firstArray) ? firstObject : firstArray;
    const end = lastObject >= 0 && lastObject > lastArray ? lastObject : lastArray;
    if (start < 0 || end < start) throw new Error("مدل خروجی JSON معتبری تولید نکرد.");
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
}

export function normalizeOpenAiEndpoint(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error("Base URL معتبر نیست.");
  }
  if (url.protocol !== "https:") throw new Error("برای اتصال امن، Base URL باید با HTTPS شروع شود.");
  if (url.username || url.password) throw new Error("قرار دادن اطلاعات ورود داخل Base URL مجاز نیست.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1" || hostname === "::1" || hostname.startsWith("10.") || hostname.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
    throw new Error("اتصال Cloudflare به آدرس‌های محلی یا شبکه خصوصی پشتیبانی نمی‌شود.");
  }
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
  return new URL(`${url.pathname}/chat/completions`, url.origin).toString();
}

export async function openAiChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 4096,
): Promise<string> {
  if (!apiKey.trim()) throw new Error("کلید API سرویس خارجی خالی است.");
  const endpoint = normalizeOpenAiEndpoint(baseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as any)?.error?.message || `سرویس خارجی پاسخ ${response.status} برگرداند.`);
  const content = (data as any)?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("پاسخ سرویس خارجی فاقد متن معتبر است.");
  return content.trim();
}

export function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRssXml(channelInput: any, episodesInput: any[]): string {
  const channel = channelInput || {};
  const episodes = Array.isArray(episodesInput) ? episodesInput : [];
  const title = channel.title || "رادیوکست | پادکست فارسی";
  const description = channel.description || "پادکست‌های فارسی تولیدشده با استودیوی رادیوکست.";
  const author = channel.author || "RadioCast";
  const category = channel.category || "Technology";
  const language = channel.language || "fa";
  const website = channel.website || "https://github.com/yusi20006-max/RADIOCAST";
  const image = typeof channel.coverImageUrl === "string" && /^https?:\/\//i.test(channel.coverImageUrl) ? channel.coverImageUrl : "";
  const items = episodes.map((episode: any) => {
    const episodeTitle = episode.title || "اپیزود جدید";
    const summary = episode.episodeSummary || episode.description || "";
    const id = episode.id || episode.guid || episodeTitle;
    const created = episode.createdAt ? new Date(typeof episode.createdAt === "number" ? episode.createdAt : episode.createdAt).toUTCString() : new Date().toUTCString();
    const enclosure = [episode.audioUrl, episode.mp3Url, episode.audioFileUrl].find((candidate) => typeof candidate === "string" && /^https?:\/\//i.test(candidate));
    const episodeImage = typeof episode.coverArtUrl === "string" && /^https?:\/\//i.test(episode.coverArtUrl) ? episode.coverArtUrl : "";
    const duration = Number(episode.durationSeconds);
    return `    <item>
      <title>${xmlEscape(episodeTitle)}</title>
      <description>${xmlEscape(summary)}</description>
      <guid isPermaLink="false">${xmlEscape(id)}</guid>
      <pubDate>${xmlEscape(created)}</pubDate>
      <itunes:author>${xmlEscape(author)}</itunes:author>
      <itunes:summary>${xmlEscape(summary)}</itunes:summary>
      <itunes:explicit>false</itunes:explicit>
      ${Number.isFinite(duration) && duration > 0 ? `<itunes:duration>${Math.floor(duration)}</itunes:duration>` : ""}
      ${episodeImage ? `<itunes:image href="${xmlEscape(episodeImage)}" />` : ""}
      ${enclosure ? `<enclosure url="${xmlEscape(enclosure)}" type="audio/mpeg" length="0" />` : ""}
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(website)}</link>
    <description>${xmlEscape(description)}</description>
    <language>${xmlEscape(language)}</language>
    <itunes:author>${xmlEscape(author)}</itunes:author>
    <itunes:owner><itunes:name>${xmlEscape(author)}</itunes:name><itunes:email>${xmlEscape(channel.email || "")}</itunes:email></itunes:owner>
    <itunes:summary>${xmlEscape(description)}</itunes:summary>
    <itunes:category text="${xmlEscape(category)}" />
    <itunes:explicit>false</itunes:explicit>
    ${image ? `<itunes:image href="${xmlEscape(image)}" />` : ""}
${items}
  </channel>
</rss>`;
}
