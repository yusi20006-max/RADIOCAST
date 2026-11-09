import React, { useState, useEffect } from 'react';
import {
  X,
  Rss,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  Globe,
  Radio,
  FileCode,
  CheckCircle2,
  Share2,
  Info,
} from 'lucide-react';
import { PodcastEpisode, PodcastChannelInfo } from '../types/podcast';

interface RssFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedEpisodes: PodcastEpisode[];
  onToast: (msg: string) => void;
}

const DEFAULT_CHANNEL: PodcastChannelInfo = {
  title: 'رادیو کست | پادکست‌های هوش مصنوعی',
  description: 'پادکست‌های جذاب و شنیدنی فارسی با تحلیل‌ها، داستان‌ها و گفتگوهای عمیق پیرامون تکنولوژی و فرهنگ.',
  author: 'تیم پادکست رادیو کست',
  email: 'podcast@radiocast.studio',
  category: 'Technology',
  website: typeof window !== 'undefined' ? window.location.origin : 'https://radiocast.studio',
  language: 'fa',
  coverImageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1400&auto=format&fit=crop&q=80',
};

export const RssFeedModal: React.FC<RssFeedModalProps> = ({
  isOpen,
  onClose,
  savedEpisodes,
  onToast,
}) => {
  const [channel, setChannel] = useState<PodcastChannelInfo>(DEFAULT_CHANNEL);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'castbox' | 'apple' | 'spotify' | 'shenoto'>('castbox');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const feedUrl = `${origin}/api/podcast/rss.xml`;

  // Fetch or generate XML on mount or changes
  useEffect(() => {
    if (!isOpen) return;
    loadGeneratedXml();
  }, [isOpen, channel, savedEpisodes]);

  const loadGeneratedXml = async () => {
    try {
      const res = await fetch('/api/podcast/generate-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          episodes: savedEpisodes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setXmlContent(data.xml || '');
      }
    } catch (e) {
      console.error('Failed to generate RSS:', e);
    }
  };

  const handleSyncFeed = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/podcast/update-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          episodes: savedEpisodes,
        }),
      });
      if (res.ok) {
        onToast(`فید RSS زنده با ${savedEpisodes.length} اپیزود به‌روزرسانی شد.`);
        loadGeneratedXml();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopiedUrl(true);
    onToast('آدرس معتبر فید RSS در کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    onToast('کد XML فید کپی شد.');
    setTimeout(() => setCopiedXml(false), 2500);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podcast-feed.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast('فایل podcast-feed.xml دانلود شد.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Rss className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-black text-white">
              تولید خودکار فید RSS و انتشار در پادگیرها
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            فید استاندارد Podcast RSS 2.0 (سازگار با Apple Podcasts، Castbox، Spotify و شنوتو) برای اشتراک عمومی اپیزودهای شما.
          </p>
        </div>

        {/* Live RSS Feed URL Banner */}
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-950 to-purple-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs sm:text-sm font-bold text-white">آدرس فید زنده پادکست شما (RSS Feed URL):</h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
              RSS 2.0 + iTunes Tags
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={feedUrl}
              className="flex-1 bg-slate-950/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 font-mono outline-none"
              dir="ltr"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'کپی شد!' : 'کپی آدرس فید'}</span>
            </button>
            <a
              href={feedUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 transition-all"
              title="مشاهده مستقیم خروجی XML"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
            <span>تعداد اپیزودهای حاضر در فید: {savedEpisodes.length} قسمت</span>
            <button
              onClick={handleSyncFeed}
              disabled={isSyncing}
              className="text-amber-400 hover:underline flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>همگام‌سازی مجدد اپیزودها با فید زنده</span>
            </button>
          </div>
        </div>

        {/* Channel Metadata Editor */}
        <div className="space-y-4 bg-slate-950/50 rounded-2xl border border-slate-800 p-5">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>مشخصات شناسنامه پادکست در پادگیرها (Channel Metadata):</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">نام کلی کانال پادکست:</label>
              <input
                type="text"
                value={channel.title}
                onChange={(e) => setChannel({ ...channel, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">نام سازنده / صاحب اثر (Author):</label>
              <input
                type="text"
                value={channel.author}
                onChange={(e) => setChannel({ ...channel, author: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">ایمیل ارتباطی (جهت تأییدیه اپل پادکست):</label>
              <input
                type="email"
                value={channel.email}
                onChange={(e) => setChannel({ ...channel, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">دسته‌بندی موضوعی (iTunes Category):</label>
              <select
                value={channel.category}
                onChange={(e) => setChannel({ ...channel, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              >
                <option value="Technology">تکنولوژی و فناوری (Technology)</option>
                <option value="Education">آموزش و یادگیری (Education)</option>
                <option value="Business">کسب‌وکار و کارآفرینی (Business)</option>
                <option value="Science">علوم و دانستنی‌ها (Science)</option>
                <option value="Arts">هنر، ادبیات و فرهنگ (Arts)</option>
                <option value="Society & Culture">جامعه و فرهنگ (Society & Culture)</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] text-slate-400">معرفی و شرح پادکست (Show Description):</label>
              <textarea
                value={channel.description}
                onChange={(e) => setChannel({ ...channel, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Submission Guides for Popular Podcatchers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>راهنمای گام‌به‌گام ثبت پادکست در پلتفرم‌ها:</span>
          </h4>

          {/* Podcatcher Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'castbox', label: 'کست‌باکس (Castbox)' },
              { id: 'apple', label: 'اپل پادکست (Apple Podcasts)' },
              { id: 'spotify', label: 'اسپاتیفای (Spotify for Podcasters)' },
              { id: 'shenoto', label: 'شنوتو (Shenoto)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGuideTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGuideTab === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            {activeGuideTab === 'castbox' && (
              <>
                <p className="font-bold text-amber-300">نحوه ثبت پادکست در کست‌باکس (محبوب‌ترین پادگیر ایران):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>وارد سایت <a href="https://castbox.fm" target="_blank" rel="noreferrer" className="text-amber-400 underline">Castbox Creator Studio</a> شوید.</li>
                  <li>روی دکمه «Claim Ownership» یا «Add Show» کلیک کنید.</li>
                  <li>آدرس فید بالا را در کادر «RSS Feed URL» چسبانده و Submit کنید.</li>
                  <li>پادکست شما بلافاصله در اپلیکیشن کست‌باکس برای همه قابل جستجو و شنیدن خواهد بود!</li>
                </ol>
              </>
            )}

            {activeGuideTab === 'apple' && (
              <>
                <p className="font-bold text-amber-300">ثبت در Apple Podcasts Connect:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>با اپل آی‌دی خود وارد پنل <a href="https://podcastsconnect.apple.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Podcasts Connect</a> شوید.</li>
                  <li>علامت «+» و سپس گزینه «Add Show with an RSS Feed» را بزنید.</li>
                  <li>لینک فید بالا را وارد کرده و پس از اعتبارسنجی خودکار، روی «Submit» بزنید.</li>
                </ol>
              </>
            )}

            {activeGuideTab === 'spotify' && (
              <>
                <p className="font-bold text-amber-300">ثبت در Spotify for Podcasters:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>وارد <a href="https://podcasters.spotify.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Spotify for Podcasters</a> شوید.</li>
                  <li>گزینه «I already have a podcast» را انتخاب و آدرس RSS فید بالا را وارد کنید.</li>
                  <li>کد تایید ارسال‌شده به ایمیل خود را وارد نمایید.</li>
                </ol>
              </>
            )}

            {activeGuideTab === 'shenoto' && (
              <>
                <p className="font-bold text-amber-300">ثبت در شنوتو (سرویس پادکست ایرانی):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>وارد پنل راوی یا تولیدکننده در سایت شنوتو شوید.</li>
                  <li>از بخش افزودن پادکست، گزینه «همگام‌سازی از طریق فید RSS» را انتخاب کرده و لینک بالا را الصاق کنید.</li>
                </ol>
              </>
            )}
          </div>
        </div>

        {/* XML Preview & Download */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-purple-400" />
              پیش‌نمایش کد فید RSS استاندارد:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyXml}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-all"
              >
                {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کپی کد XML</span>
              </button>
              <button
                onClick={handleDownloadXml}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>دانلود فایل XML</span>
              </button>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono overflow-x-auto max-h-36 leading-normal" dir="ltr">
            {xmlContent.slice(0, 800)}...
          </pre>
        </div>
      </div>
    </div>
  );
};
