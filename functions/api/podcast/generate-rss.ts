import { buildRssXml, json, readJson, type PagesHandler } from "../../_shared";

export const onRequestPost: PagesHandler = async ({ request }) => {
  try {
    const input = await readJson(request);
    return json({ xml: buildRssXml(input.channel, Array.isArray(input.episodes) ? input.episodes : []) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "خطا در تولید RSS." }, 400);
  }
};
