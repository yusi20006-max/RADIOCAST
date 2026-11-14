import { json, readJson, type Env, type PagesHandler } from "../../_shared";

const FEED_KEY = "radiocast:podcast-feed:v1";

export const onRequestPost: PagesHandler = async ({ request, env }) => {
  try {
    const input = await readJson(request);
    const payload = {
      channel: input.channel && typeof input.channel === "object" ? input.channel : {},
      episodes: Array.isArray(input.episodes) ? input.episodes : [],
      updatedAt: new Date().toISOString(),
    };
    if (env.PODCAST_KV) {
      await env.PODCAST_KV.put(FEED_KEY, JSON.stringify(payload));
      return json({ success: true });
    }
    // KV is optional: accept the request without crashing. Persistence requires a KV binding.
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "ذخیره فید ناموفق بود." }, 400);
  }
};
