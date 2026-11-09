import { BgmPreset, VoiceOption, PodcastTone, PlaybackSpeed, PodcastFormat, ParagraphTone } from '../types/podcast';

export const PARAGRAPH_TONE_OPTIONS: {
  id: ParagraphTone;
  labelFa: string;
  emoji: string;
  promptDescription: string;
}[] = [
  { id: 'auto', labelFa: 'تشخیص هوشمند خودکار', emoji: '🤖', promptDescription: 'Context-adaptive natural inflection' },
  { id: 'curious', labelFa: 'کنجکاو و پرسشی', emoji: '❓', promptDescription: 'Curious, questioning, and genuinely inquisitive with rising inflection' },
  { id: 'excited', labelFa: 'شگفت‌زده و پرهیجان', emoji: '⚡', promptDescription: 'Enthusiastic, astonished, energized, and amazed' },
  { id: 'reflective', labelFa: 'متفکرانه و عمیق', emoji: '🤔', promptDescription: 'Thoughtful, contemplative, measured, and reflective' },
  { id: 'friendly', labelFa: 'صمیمی و گرم', emoji: '☕', promptDescription: 'Warm, conversational, empathetic, and friendly' },
  { id: 'serious', labelFa: 'جدی و تحلیلی', emoji: '🎙️', promptDescription: 'Formal, authoritative, solemn, and analytical' },
  { id: 'humorous', labelFa: 'شوخ‌طبع و طنزآمیز', emoji: '😄', promptDescription: 'Playful, lighthearted, witty, with a chuckle' },
  { id: 'dramatic', labelFa: 'داستانی و پرتعلیق', emoji: '🎭', promptDescription: 'Dramatic, suspenseful, whispering, building tension' },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Puck', nameFa: 'نیما (صدای مردانه جوان و پرانرژی)', genderFa: 'مرد', descFa: 'لحن شاداب، گفتگومحور و کنجکاو' },
  { id: 'Kore', nameFa: 'سارا (صدای زنانه گرم و مسلط)', genderFa: 'زن', descFa: 'لحن هوشمند، گیرا، مهربان و تحلیلی' },
  { id: 'Fenrir', nameFa: 'آرش (صدای مردانه بم و حماسی)', genderFa: 'مرد', descFa: 'لحن استوار، عمیق و روایت‌گرانه' },
  { id: 'Zephyr', nameFa: 'رویا (صدای زنانه پرشور و رادیویی)', genderFa: 'زن', descFa: 'لحن پویا، مدرن، شفاف و پرانگیزه' },
  { id: 'Charon', nameFa: 'بهرام (صدای مردانه سنگین و مستند)', genderFa: 'مرد', descFa: 'لحن آرام، مستند، علمی و معتبر' },
];

export const TONE_OPTIONS: { id: PodcastTone; labelFa: string; descFa: string; emoji: string }[] = [
  { id: 'friendly', labelFa: 'دوستانه و صمیمی', descFa: 'مانند دو دوست نزدیک در کافه، گرم و محاوره‌ای', emoji: '☕' },
  { id: 'energetic', labelFa: 'شاد و پرانرژی', descFa: 'ریتمیک، شاداب و انگیزشی با انرژی مثبت بالا', emoji: '⚡' },
  { id: 'serious', labelFa: 'جدی و تحلیلی', descFa: 'فاخر، متین و آکادمیک، مناسب موضوعات اندیشه‌ای و کسب‌وکار', emoji: '🎙️' },
  { id: 'dramatic', labelFa: 'داستانی و پرتعلیق', descFa: 'سینمایی، با مکث‌های پرکشش و مناسب ماجراهای هیجان‌انگیز', emoji: '🎭' },
  { id: 'humorous', labelFa: 'طنزآمیز و شوخ‌طبع', descFa: 'مملو از طنازی‌های هوشمندانه و فضای شاد و مفرح', emoji: '😄' },
];

export const SPEED_OPTIONS: { id: PlaybackSpeed; labelFa: string; multiplier: number; descFa: string }[] = [
  { id: 'slow', labelFa: 'آهسته (۰.۸x)', multiplier: 0.8, descFa: 'مناسب آموزش، مباحث عمیق و زبان‌آموزی' },
  { id: 'normal', labelFa: 'استاندارد (۱.۰x)', multiplier: 1.0, descFa: 'سرعت طبیعی گفتگوی رادیویی' },
  { id: 'fast', labelFa: 'سریع (۱.۲۵x)', multiplier: 1.25, descFa: 'ریتم پرشتاب و پرانرژی برای خلاصه‌ها' },
  { id: 'veryFast', labelFa: 'برق‌آسا (۱.۵x)', multiplier: 1.5, descFa: 'مرور سریع اطلاعات فشرده' },
];

export const FORMAT_OPTIONS: { id: PodcastFormat; labelFa: string; descFa: string; icon: string }[] = [
  { id: 'dual', labelFa: 'گفتگوی دو نفره (میزبان + کارشناس)', descFa: 'مانند نوت‌بوک ال‌ام، مکالمه رفت و برگشتی جذاب و زنده', icon: 'Users' },
  { id: 'solo', labelFa: 'روایت‌گری تک‌نفره (داستان و مستند)', descFa: 'روایت متمرکز و شنیدنی شبیه به چنل‌بی و رادیو چهرازی', icon: 'User' },
  { id: 'interview', labelFa: 'مصاحبه تخصصی و چالشی', descFa: 'پرسش و پاسخ عمیق بین خبرنگار و متخصص حوزه', icon: 'MessageSquareText' },
  { id: 'briefing', labelFa: 'کپسول خلاصه صبحگاهی', descFa: 'مرور فشرده و تیتروار مهم‌ترین نکات متن در چند دقیقه', icon: 'Zap' },
];

export const BGM_PRESETS: BgmPreset[] = [
  { id: 'lofi', nameFa: 'لوفای دنج و آرام (Chill Lo-Fi)', descriptionFa: 'آکوردهای ملایم رودز، ریتم آرام‌بخش و گرمای وینیل', icon: 'Headphones', tempo: '۷۵ BPM' },
  { id: 'ambient', nameFa: 'امبینت عمیق تفکر (Deep Focus)', descriptionFa: 'پدهای فضایی شناور، آرامش‌بخش ذهن بدون حواس‌پرتی', icon: 'CloudRain', tempo: '۶۰ BPM' },
  { id: 'acoustic', nameFa: 'پادکست رادیویی انگیزشی (Acoustic)', descriptionFa: 'سازهای زهی شاداب، ریتمیک، گرم و دوستانه', icon: 'Music', tempo: '۱۰۵ BPM' },
  { id: 'cinematic', nameFa: 'سینمایی و پرتعلیق (Cinematic)', descriptionFa: 'بیس بم عمیق و آرپژ رازآلود، مناسب داستان‌های معمایی', icon: 'Film', tempo: '۸۰ BPM' },
  { id: 'iranian-fusion', nameFa: 'تلفیقی سنتی ایرانی (Persian Fusion)', descriptionFa: 'هارمونی مقام‌های اصیل ایرانی در قالبی مدرن و گوش‌نواز', icon: 'Sparkles', tempo: '۹۰ BPM' },
  { id: 'none', nameFa: 'بدون موسیقی (صرفاً صدای گویندگان)', descriptionFa: 'صدای خالص بدون افکت و موسیقی پس‌زمینه', icon: 'VolumeX', tempo: 'خاموش' },
];

export const SFX_OPTIONS: { id: string; labelFa: string; emoji: string }[] = [
  { id: 'none', labelFa: 'بدون افکت', emoji: '➖' },
  { id: 'intro', labelFa: 'جینگل آغازین (Intro)', emoji: '🔔' },
  { id: 'transition', labelFa: 'ترنزیشن فصل (Whoosh)', emoji: '💨' },
  { id: 'ding', labelFa: 'افکت دینگ / اعلام نکته', emoji: '✨' },
  { id: 'applause', labelFa: 'تشویق و دست زدن', emoji: '👏' },
  { id: 'outro', labelFa: 'جینگل پایانی (Outro)', emoji: '🎵' },
];
