import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Palette,
  Download,
  Check,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Mic,
  Radio,
  Cpu,
  Coffee,
  BookOpen,
  Layers,
} from 'lucide-react';
import { PodcastEpisode } from '../types/podcast';

interface CoverArtGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: PodcastEpisode;
  onApplyCoverToEpisode: (coverUrl: string) => void;
  onToast: (msg: string) => void;
}

export type CoverTemplate =
  | 'cyber-neon'
  | 'minimal-editorial'
  | 'vintage-cassette'
  | 'cosmic-ai'
  | 'persian-modern'
  | 'spotlight-noir';

interface TemplateOption {
  id: CoverTemplate;
  nameFa: string;
  descFa: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: 'cyber-neon', nameFa: 'استودیو نئونی مدرن', descFa: 'حلقه نورانی بنفش و فیروزه‌ای با امواج صدا' },
  { id: 'minimal-editorial', nameFa: 'مینیمال ژورنالی شیک', descFa: 'طراحی سوئیسی با تایپوگرافی بولد و فاخر' },
  { id: 'persian-modern', nameFa: 'فیروزه‌ای و طلایی اصیل', descFa: 'نقوش اسلیمی مدرن با رنگ‌های سنتی ایرانی' },
  { id: 'cosmic-ai', nameFa: 'کهکشانی و هوش مصنوعی', descFa: 'سحابی نوری فضایی با تم رازآلود و علمی' },
  { id: 'vintage-cassette', nameFa: 'نوار کاست نوستالژیک', descFa: 'حس گرم رادیوهای کلاسیک و نوارهای کاست' },
  { id: 'spotlight-noir', nameFa: 'اسپات‌لایت سینمایی', descFa: 'نورپردازی دراماتیک استودیویی تیره' },
];

const ICONS = [
  { id: 'mic', label: 'میکروفون', icon: Mic },
  { id: 'radio', label: 'رادیو / امواج', icon: Radio },
  { id: 'cpu', label: 'هوش مصنوعی', icon: Cpu },
  { id: 'coffee', label: 'قهوه / گفتگو', icon: Coffee },
  { id: 'book', label: 'کتاب و روایت', icon: BookOpen },
];

const COLOR_SCHEMES = [
  { id: 'purple-pink', name: 'بنفش نئونی', primary: '#a855f7', secondary: '#ec4899', bg1: '#090514', bg2: '#1e0b36' },
  { id: 'turquoise-gold', name: 'فیروزه‌ای و طلایی', primary: '#06b6d4', secondary: '#f59e0b', bg1: '#04171a', bg2: '#0b292e' },
  { id: 'emerald-dark', name: 'سبز زمردی استودیویی', primary: '#10b981', secondary: '#059669', bg1: '#021a12', bg2: '#063826' },
  { id: 'blue-cyan', name: 'آبی اقیانوسی مدرن', primary: '#3b82f6', secondary: '#06b6d4', bg1: '#050f24', bg2: '#0c234a' },
  { id: 'amber-fire', name: 'کهربایی و گرم', primary: '#f97316', secondary: '#ef4444', bg1: '#1a0804', bg2: '#331206' },
];

export const CoverArtGeneratorModal: React.FC<CoverArtGeneratorModalProps> = ({
  isOpen,
  onClose,
  episode,
  onApplyCoverToEpisode,
  onToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<CoverTemplate>('cyber-neon');
  const [selectedColor, setSelectedColor] = useState(COLOR_SCHEMES[0]);
  const [selectedIcon, setSelectedIcon] = useState('mic');

  const [coverTitle, setCoverTitle] = useState(episode.title || 'رادیو کست');
  const [coverSubtitle, setCoverSubtitle] = useState(
    episode.format === 'dual'
      ? `با اجرای ${episode.host1Name} و ${episode.host2Name}`
      : `با روایت ${episode.host1Name}`
  );
  const [episodeBadge, setEpisodeBadge] = useState('اپیزود اختصاصی');
  const [genreBadge, setGenreBadge] = useState(episode.genre || 'پادکست فارسی');

  // Redraw canvas whenever parameters change
  useEffect(() => {
    if (!isOpen) return;
    drawCoverArt();
  }, [isOpen, selectedTemplate, selectedColor, selectedIcon, coverTitle, coverSubtitle, episodeBadge, genreBadge]);

  const drawCoverArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1400;
    const height = 1400;
    canvas.width = width;
    canvas.height = height;

    const { primary, secondary, bg1, bg2 } = selectedColor;

    // 1. Draw Background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.75);
    bgGrad.addColorStop(0, bg2);
    bgGrad.addColorStop(1, bg1);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Template Specific Background Artwork
    if (selectedTemplate === 'cyber-neon') {
      // Glowing neon ring & digital audio bars
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 40, 360, 0, Math.PI * 2);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 14;
      ctx.shadowColor = primary;
      ctx.shadowBlur = 45;
      ctx.stroke();

      // Inner faint ring
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 40, 390, 0, Math.PI * 2);
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 4;
      ctx.shadowColor = secondary;
      ctx.shadowBlur = 25;
      ctx.stroke();
      ctx.restore();

      // Soundwave bars in lower area
      const barCount = 36;
      const barWidth = 14;
      const spacing = 18;
      const startX = (width - (barCount * (barWidth + spacing))) / 2;
      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + spacing);
        const barH = 50 + Math.sin(i * 0.3) * 120 + Math.cos(i * 0.7) * 80;
        const y = 840 - barH / 2;
        ctx.fillStyle = i % 2 === 0 ? primary : secondary;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.abs(barH), 6);
        ctx.fill();
      }
    } else if (selectedTemplate === 'minimal-editorial') {
      // Clean modern framing borders
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, 80, width - 160, height - 160);

      ctx.strokeStyle = primary;
      ctx.lineWidth = 6;
      ctx.strokeRect(100, 100, width - 200, height - 200);

      // Accent square
      ctx.fillStyle = secondary;
      ctx.fillRect(120, 120, 36, 36);
    } else if (selectedTemplate === 'persian-modern') {
      // Concentric circles with traditional harmonic geometry
      ctx.save();
      for (let r = 160; r <= 480; r += 80) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 60, r, 0, Math.PI * 2);
        ctx.strokeStyle = r % 160 === 0 ? primary : 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 12]);
        ctx.stroke();
      }
      ctx.restore();
    } else if (selectedTemplate === 'cosmic-ai') {
      // Scattered starlight & nebula glow
      ctx.save();
      for (let s = 0; s < 120; s++) {
        const sx = (Math.sin(s * 93) * 0.5 + 0.5) * width;
        const sy = (Math.cos(s * 47) * 0.5 + 0.5) * height;
        const sz = (Math.sin(s) * 0.5 + 0.5) * 4 + 1;
        ctx.fillStyle = s % 3 === 0 ? primary : 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (selectedTemplate === 'vintage-cassette') {
      // Retro tape header band
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(100, 320, width - 200, 520);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 5;
      ctx.strokeRect(100, 320, width - 200, 520);

      // Cassette spools
      [420, width - 420].forEach((cx) => {
        ctx.beginPath();
        ctx.arc(cx, 580, 80, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 580, 24, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
      });
    } else if (selectedTemplate === 'spotlight-noir') {
      // Overhead theatrical spotlight cone
      const spotGrad = ctx.createRadialGradient(width / 2, 200, 40, width / 2, 700, 600);
      spotGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
      spotGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Central Icon Art
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.shadowColor = primary;
    ctx.shadowBlur = 30;

    const iconY = selectedTemplate === 'vintage-cassette' ? 220 : height / 2 - 100;
    ctx.beginPath();
    ctx.arc(width / 2, iconY, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw stylized micro-graphic icon inside circle
    ctx.fillStyle = primary;
    if (selectedIcon === 'mic') {
      // Microphone silhouette
      ctx.beginPath();
      ctx.roundRect(width / 2 - 20, iconY - 40, 40, 60, 20);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width / 2, iconY + 5, 36, 0, Math.PI, false);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillRect(width / 2 - 4, iconY + 41, 8, 24);
      ctx.fillRect(width / 2 - 24, iconY + 65, 48, 8);
    } else if (selectedIcon === 'radio') {
      // Radio antenna waves
      ctx.beginPath();
      ctx.arc(width / 2, iconY + 15, 14, 0, Math.PI * 2);
      ctx.fill();
      for (let w = 28; w <= 56; w += 14) {
        ctx.beginPath();
        ctx.arc(width / 2, iconY + 15, w, Math.PI * 1.25, Math.PI * 1.75);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    } else {
      // Sparkle star
      ctx.fillStyle = 'white';
      ctx.font = '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', width / 2, iconY);
    }
    ctx.restore();

    // 4. Badges (Top & Genre)
    ctx.save();
    ctx.font = 'bold 36px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';

    // Top Episode Badge
    const badgeW = ctx.measureText(episodeBadge).width + 60;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect((width - badgeW) / 2, 140, badgeW, 64, 32);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.fillText(episodeBadge, width / 2, 185);

    // Genre pill
    ctx.font = 'bold 32px Vazirmatn, sans-serif';
    ctx.fillStyle = secondary;
    ctx.fillText(`• ${genreBadge} •`, width / 2, height - 160);
    ctx.restore();

    // 5. Typography: Title & Subtitle (Persian text with shadow)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    // Title wrapping
    ctx.font = '900 78px Vazirmatn, sans-serif';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 8;

    const words = coverTitle.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? currentLine + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 260 && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Limit to 2 lines max
    if (lines.length > 2) {
      lines = [lines[0], lines.slice(1).join(' ')];
    }

    const startY = 1000 - (lines.length - 1) * 45;
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, startY + idx * 95);
    });

    // Subtitle
    ctx.font = '500 42px Vazirmatn, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 10;
    ctx.fillText(coverSubtitle, width / 2, startY + lines.length * 95 + 10);

    // 6. Watermark Footer
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('RADIOCAST STUDIO • 1400x1400px PODCAST ART', width / 2, height - 70);

    ctx.restore();
  };

  const handleDownloadCoverPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export full resolution blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${coverTitle || 'podcast'}-cover-art.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onToast('کاور PNG با ابعاد ۱۴۰۰×۱۴۰۰ پیکسل دانلود شد.');
    }, 'image/png');
  };

  const handleApplyToEpisode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.92);
    onApplyCoverToEpisode(dataUrl);
    onToast('کاور با موفقیت به عنوان تصویر جلد این اپیزود ثبت شد.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl min-w-0 my-auto bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6">
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
            <Palette className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-black text-white">
              طراحی و تولید خودکار کاور آرت پادکست (Cover Art Studio)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            تولید کاورهای مربعی با کیفیت فوق‌العاده برای کست‌باکس، اسپاتیفای و اپل پادکست با تایپوگرافی اختصاصی فارسی.
          </p>
        </div>

        {/* Two-Column Layout: Left Canvas Preview, Right Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Canvas Live Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3">
            <div className="relative w-full max-w-[360px] aspect-square rounded-3xl overflow-hidden shadow-2xl ring-4 ring-purple-500/30 group">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-purple-200 font-bold border border-white/10">
                خروجی PNG با ابعاد ۱۴۰۰×۱۴۰۰
              </div>
            </div>

            <div className="flex items-center gap-2 w-full max-w-[360px]">
              <button
                type="button"
                onClick={handleApplyToEpisode}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعمال روی اپیزود</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCoverPng}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>دانلود PNG</span>
              </button>
            </div>
          </div>

          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Template Chooser */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>قالب و سبک گرافیکی کاور:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-purple-600/25 border-purple-500 ring-1 ring-purple-500 shadow'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">{tmpl.nameFa}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{tmpl.descFa}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>پالت رنگی استودیو:</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SCHEMES.map((scheme) => {
                  const isSelected = selectedColor.id === scheme.id;
                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setSelectedColor(scheme)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-white text-white ring-1 ring-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40"
                        style={{ background: scheme.primary }}
                      />
                      <span>{scheme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">نماد و آیکون مرکزی:</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = selectedIcon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setSelectedIcon(ic.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{ic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300">عنوان بزرگ پادکست روی کاور:</label>
                <input
                  type="text"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">زیرعنوان / گویندگان:</label>
                <input
                  type="text"
                  value={coverSubtitle}
                  onChange={(e) => setCoverSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">برچسب شماره اپیزود:</label>
                <input
                  type="text"
                  value={episodeBadge}
                  onChange={(e) => setEpisodeBadge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
