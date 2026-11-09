import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Twitter,
  Radio,
  FileText,
  QrCode,
  Sparkles,
  Music,
  ExternalLink,
  Palette,
  Rss,
} from 'lucide-react';
import { PodcastEpisode } from '../types/podcast';

interface ShareAndExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: PodcastEpisode;
  mp3Blob: Blob | null;
  wavBlob: Blob | null;
  duration: number;
  onOpenCoverModal?: () => void;
  onOpenRssModal?: () => void;
}

export const ShareAndExportModal: React.FC<ShareAndExportModalProps> = ({
  isOpen,
  onClose,
  episode,
  mp3Blob,
  wavBlob,
  duration,
  onOpenCoverModal,
  onOpenRssModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Download file helper
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadMp3 = () => {
    if (mp3Blob) {
      triggerDownload(mp3Blob, `${episode.title || 'podcast-episode'}.mp3`);
    }
  };

  const handleDownloadWav = () => {
    if (wavBlob) {
      triggerDownload(wavBlob, `${episode.title || 'podcast-episode'}.wav`);
    }
  };

  const handleDownloadTranscript = () => {
    let content = `عنوان پادکست: ${episode.title}\n`;
    content += `تاریخ تولید: ${new Date(episode.createdAt).toLocaleDateString('fa-IR')}\n`;
    content += `خلاصه اپیزود: ${episode.episodeSummary}\n`;
    content += `تگ‌ها: ${episode.tags.join(', ')}\n\n`;
    content += `=== متن کامل گفتگو ===\n\n`;

    episode.script.forEach((turn, idx) => {
      content += `[${turn.speakerName}]: ${turn.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, `${episode.title || 'podcast'}-transcript.txt`);
  };

  // Generate show notes
  const generateShowNotes = () => {
    let notes = `🎙️ اپیزود جدید: ${episode.title}\n\n`;
    notes += `${episode.episodeSummary}\n\n`;
    notes += `⏱️ سرفصل‌های این قسمت:\n`;
    const avgTurnDuration = duration / Math.max(1, episode.script.length);
    episode.chapters.forEach((ch) => {
      const turnSec = Math.floor(ch.startTurnIndex * avgTurnDuration);
      const m = Math.floor(turnSec / 60);
      const s = Math.floor(turnSec % 60);
      const timeStr = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
      notes += `${timeStr} - ${ch.title}\n`;
    });
    notes += `\n🏷️ تگ‌ها: ${episode.tags.map((t) => '#' + t).join(' ')}\n`;
    notes += `ساخته شده در استودیو رادیوکست فارسی`;
    return notes;
  };

  const handleCopyShowNotes = () => {
    navigator.clipboard.writeText(generateShowNotes());
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Social share intents
  const shareText = `🎙️ پادکست شنیدنی: «${episode.title}»\n${episode.episodeSummary?.slice(0, 100)}...`;

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(
      shareText
    )}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareText + '\n' + currentUrl
    )}`;
    window.open(url, '_blank');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
  };

  const mp3SizeMb = mp3Blob ? (mp3Blob.size / (1024 * 1024)).toFixed(2) : '1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl min-w-0 my-auto bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-black text-white">ذخیره و اشتراک‌گذاری پادکست</h3>
          </div>
          <p className="text-xs text-slate-400">
            فایل صوتی میکس‌شده را دانلود کنید یا لینک برنامه و توضیحات آن را در شبکه‌های اجتماعی به اشتراک بگذارید.
          </p>
        </div>

        {/* Section 1: Audio Downloads (MP3 & WAV) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>دانلود فایل صوتی پادکست:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MP3 Button */}
            <button
              onClick={handleDownloadMp3}
              disabled={!mp3Blob}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-600/30 transition-all text-right flex items-center justify-between group disabled:opacity-50 cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">دانلود با فرمت MP3</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    پیشنهادی
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  فرمت استاندارد، حجم فشرده ({mp3SizeMb} مگابایت)، کیفیت عالی ۱۹۲kbps
                </p>
              </div>
              <Download className="w-5 h-5 text-emerald-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>

            {/* WAV Button */}
            <button
              onClick={handleDownloadWav}
              disabled={!wavBlob}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/90 transition-all text-right flex items-center justify-between group disabled:opacity-50 cursor-pointer"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-white">دانلود با فرمت Lossless WAV</span>
                <p className="text-[11px] text-slate-400">
                  کیفیت مستر استودیویی خام و بدون افت کیفیت برای ادیت در DAW
                </p>
              </div>
              <Download className="w-5 h-5 text-slate-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        {/* Section 2: Show Notes & Transcript Export */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>شناسنامه، سرفصل‌ها و متن کامل:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopyShowNotes}
              className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-purple-500/40 text-right flex items-center justify-between transition-all"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200">
                  کپی Show Notes همراه با فصول زمانی
                </span>
                <p className="text-[10px] text-slate-400">مناسب چسباندن در توضیحات کست‌باکس و یوتیوب</p>
              </div>
              {copiedNotes ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-purple-400 shrink-0" />
              )}
            </button>

            <button
              onClick={handleDownloadTranscript}
              className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-purple-500/40 text-right flex items-center justify-between transition-all"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200">دانلود متن کامل دیالوگ‌ها (.txt)</span>
                <p className="text-[10px] text-slate-400">سناریوی کتبی به همراه اسامی گویندگان</p>
              </div>
              <Download className="w-4 h-4 text-purple-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Section 3: Social Sharing Buttons */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>اشتراک‌گذاری در پلتفرم‌های پرطرفدار:</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Telegram */}
            <button
              onClick={handleTelegramShare}
              className="p-3 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 hover:bg-[#229ED9]/25 text-[#229ED9] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>تلگرام</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="p-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتس‌اپ</span>
            </button>

            {/* Twitter / X */}
            <button
              onClick={handleTwitterShare}
              className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Twitter className="w-4 h-4" />
              <span>توییتر / X</span>
            </button>

            {/* Castbox / RSS Feed button */}
            <button
              onClick={() => {
                if (onOpenRssModal) {
                  onClose();
                  onOpenRssModal();
                }
              }}
              className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="مشاهده فید پادکست برای کست‌باکس و اپل پادکست"
            >
              <Rss className="w-4 h-4 text-amber-400" />
              <span>فید کست‌باکس</span>
            </button>
          </div>
        </div>

        {/* Section 4: Publishing Studio (Cover Art & RSS Feed) */}
        {(onOpenCoverModal || onOpenRssModal) && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ابزارهای حرفه‌ای انتشار و هویت بصری:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onOpenCoverModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCoverModal();
                  }}
                  className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 hover:border-purple-400 text-right flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-purple-200 group-hover:text-white flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-purple-400" />
                      طراحی کاور آرت اپیزود
                    </span>
                    <p className="text-[10px] text-slate-400">خروجی 1400x1400 مربع مطابق استاندارد اپل</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-purple-400 shrink-0" />
                </button>
              )}

              {onOpenRssModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRssModal();
                  }}
                  className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 hover:border-amber-400 text-right flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-200 group-hover:text-white flex items-center gap-1.5">
                      <Rss className="w-3.5 h-3.5 text-amber-400" />
                      فید رسمی پادکست (RSS 2.0)
                    </span>
                    <p className="text-[10px] text-slate-400">لینک اختصاصی برای ثبت در Castbox و Spotify</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Direct Link & QR Code */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'کپی شد!' : 'کپی لینک'}</span>
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition-all"
              title="نمایش QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {showQr && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                این بارکد را با دوربین تلفن همراه خود اسکن کنید تا پادکست روی موبایل باز شود:
              </p>
              <div className="flex justify-center p-2 bg-white rounded-xl w-32 h-32 mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    currentUrl
                  )}`}
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
