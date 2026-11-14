import { buildRssXml, type Env } from "../../_shared";

const FEED_KEY = "radiocast:podcast-feed:v1";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let channel: any = {
    title: "رادیوکست | پادکست‌های هوش مصنوعی",
    description: "پادکست‌های فارسی تولیدشده با استودیوی رادیوکست.",
    author: "تیم رادیوکست",
    category: "Technology",
    language: "fa",
    website: "https://github.com/yusi20006-max/RADIOCAST",
  };
  let episodes: any[] = [];
  if (env.PODCAST_KV) {
    try {
      const saved = await env.PODCAST_KV.get(FEED_KEY, "json") as any;
      if (saved && typeof saved === "object") {
        channel = saved.channel || channel;
        episodes = Array.isArray(saved.episodes) ? saved.episodes : [];
      }
    } catch {
      // A missing/unavailable optional KV must not take down the public feed route.
    }
  }
  return new Response(buildRssXml(channel, episodes), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
};
