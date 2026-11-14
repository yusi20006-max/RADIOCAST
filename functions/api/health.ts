import { json, type PagesHandler } from "../_shared";

export const onRequestGet: PagesHandler = async () =>
  json({ status: "ok", runtime: "cloudflare-pages" });
