import { json, type Env } from "../_shared";

export const onRequestGet: PagesFunction<Env> = async () =>
  json({ status: "ok", runtime: "cloudflare-pages" });
