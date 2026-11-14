# استقرار RadioCast روی Cloudflare Pages

## ساخت پروژه Pages از طریق داشبورد
1. در Cloudflare Dashboard وارد **Workers & Pages** شوید.
2. گزینه **Create application → Pages → Import an existing Git repository** را انتخاب کنید.
3. مخزن GitHub با نام `yusi20006-max/RADIOCAST` را متصل کنید.
4. شاخه انتشار را `main` انتخاب کنید. تا زمان Merge شدن PR شماره ۵، شاخه قابلیت‌های جدید در Production نیست.
5. نام پروژه را `radiocast` بگذارید و شاخه Production را `main` انتخاب کنید. تنظیمات Build را چنین وارد کنید:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
6. اولین Deployment را اجرا کنید. Pages فایل‌های پوشه `functions/` را به‌عنوان Pages Functions شناسایی می‌کند.

## نصب ابزارهای توسعه
برای تایپ‌های Cloudflare و اجرای محلی Pages:

```bash
npm install -D @cloudflare/workers-types wrangler
```

کد Functions از Web API و تایپ‌های ساختاری Pages استفاده می‌کند؛ نصب بسته بالا ابزارهای رسمی تایپ و Wrangler را برای توسعه و بررسی دقیق‌تر فراهم می‌کند.

اجرای محلی با Pages Functions (نه Express قدیمی):

```bash
npm run dev:pages
```

## متغیر محرمانه Gemini
1. در Cloudflare Dashboard وارد **Workers & Pages** شوید.
2. پروژه Pages با نام `radiocast` را باز کنید.
3. به **Settings → Variables and Secrets** بروید.
4. در بخش Production، متغیر جدیدی با نام `GEMINI_API_KEY` بسازید.
5. نوع مقدار را **Secret** انتخاب کنید و کلید Google AI Studio را وارد کنید.
6. در صورت استفاده از Preview Deployments، همین Secret را برای Preview نیز جداگانه تعریف کنید.
7. پس از ذخیره، یک Deployment جدید اجرا کنید تا مقدار در Functions در دسترس باشد.

کلید را در کد فرانت‌اند، فایل `.env` عمومی، `wrangler.toml` یا GitHub قرار ندهید.

## فعال‌سازی KV (اختیاری)
1. در Cloudflare Dashboard به **Storage & databases → Workers KV** بروید.
2. Namespace جدیدی با نام `radiocast-podcast-feed` بسازید.
3. شناسه Namespace را کپی کنید.
4. بلوک `[[kv_namespaces]]` را در `wrangler.toml` از حالت کامنت خارج کنید و مقدار `id` را با شناسه واقعی جایگزین کنید.
5. در Pages Project به **Settings → Bindings → Add → KV namespace** بروید.
6. Binding با نام `PODCAST_KV` را به همان Namespace متصل کنید؛ برای Preview نیز در صورت نیاز Binding جداگانه تنظیم کنید.
7. Deployment جدید اجرا کنید.

بدون Binding، endpointهای API همچنان پاسخ می‌دهند؛ اما ذخیره فید بین درخواست‌ها پایدار نخواهد بود و RSS از داده پیش‌فرض استفاده می‌کند.

## تست پس از انتشار
- `GET /api/health`
- `POST /api/podcast/generate-script`
- `POST /api/podcast/synthesize-turn`
- `POST /api/podcast/refine-turn`
- `POST /api/external-provider/health-check`
- `POST /api/podcast/generate-rss`
- `POST /api/podcast/update-feed`
- `GET /api/podcast/rss.xml`

## نکته مهم درباره فایل صوتی RSS
KV برای نگهداری متادیتا و فهرست اپیزودها مناسب است، نه فایل‌های صوتی حجیم. برای فید قابل انتشار در پادگیرها، فایل MP3 هر اپیزود باید URL عمومی HTTPS داشته باشد (مثلاً Cloudflare R2 با دامنه عمومی). XML فقط زمانی تگ `enclosure` را اضافه می‌کند که یکی از فیلدهای `audioUrl`، `mp3Url` یا `audioFileUrl` دارای URL عمومی HTTPS باشد. آدرس‌های محلی `blob:` مرورگر در RSS معتبر نیستند.
