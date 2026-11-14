import { buildRssXml, json, readJson, type Env } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  try {
    const input = await readJson(request);
    return json({ xml: buildRssXml(input.channel, Array.isArray(input.episodes) ? input.episodes : []) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "خطا در تولید RSS." }, 400);
  }
};
