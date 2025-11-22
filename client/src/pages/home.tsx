import { useState, useEffect, useRef } from 'react';
import { 
  Send, Download, Sparkles, Layout, ChevronLeft, ChevronRight, 
  Loader2, Layers, Monitor, Image as ImageIcon, BarChart3, 
  Type, Grid, CheckCircle2, ArrowRight, Copy, Hand
} from 'lucide-react';
import PptxGenJS from 'pptxgenjs';

// Expanded Theme System
const THEMES = {
  cyber: {
    label: 'Cyber',
    bg: 'bg-[#121212]',
    slideBg: 'bg-[#0f0f0f]',
    pptBg: '0f0f0f',
    text: 'text-gray-300',
    heading: 'font-space text-white',
    accent: 'text-violet-500',
    accentHex: '7c3aed', 
    accentBg: 'bg-violet-600',
    cardBg: 'bg-white/5 border border-white/10',
    chartColors: ['#a78bfa', '#22d3ee', '#fb923c', '#4ade80'],
    pptText: 'FFFFFF',
    pptSub: 'A3A3A3',
    gradient: 'from-white to-violet-300'
  },
  executive: {
    label: 'Executive',
    bg: 'bg-slate-100',
    slideBg: 'bg-white',
    pptBg: 'FFFFFF',
    text: 'text-slate-600',
    heading: 'font-space text-slate-900',
    accent: 'text-blue-700',
    accentHex: '1d4ed8', 
    accentBg: 'bg-blue-700',
    cardBg: 'bg-slate-50 border border-slate-200 shadow-sm',
    chartColors: ['#1e40af', '#3b82f6', '#93c5fd', '#cbd5e1'],
    pptText: '000000',
    pptSub: '475569',
    gradient: 'from-slate-900 via-slate-700'
  },
  electric: {
    label: 'Electric',
    bg: 'bg-black',
    slideBg: 'bg-black',
    pptBg: '000000',
    text: 'text-lime-100',
    heading: 'font-space text-lime-400',
    accent: 'text-lime-400',
    accentHex: 'a3e635', 
    accentBg: 'bg-lime-500',
    cardBg: 'bg-lime-900/20 border border-lime-500/30',
    chartColors: ['#a3e635', '#ec4899', '#06b6d4', '#facc15'],
    pptText: 'FFFFFF',
    pptSub: 'd9f99d',
    gradient: 'from-lime-400 via-lime-200'
  }
} as const;

type ThemeKey = keyof typeof THEMES;

interface TimelineItem {
  year: string;
  title: string;
  desc: string;
}

interface Block {
  title: string;
  content: string;
}

interface Chart {
  labels: string[];
  values: number[];
  label: string;
}

interface Stat {
  value: string;
  label: string;
}

interface Slide {
  layout: string;
  title: string;
  subtitle?: string;
  content?: string[];
  imagePrompt?: string;
  timeline?: TimelineItem[];
  blocks?: Block[];
  chart?: Chart;
  stat?: Stat;
}

interface Deck {
  title: string;
  slides: Slide[];
}

// Helper for instant image URLs
const getImageUrl = (prompt?: string) => {
  if (!prompt) return null;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " 4k cinematic abstract minimal wallpaper")}?width=1280&height=720&nologo=true&seed=${Math.random()}`;
};

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('cyber');
  const [viewMode, setViewMode] = useState<'canvas' | 'stack'>('canvas');
  const [exporting, setExporting] = useState(false);
  
  // Swipe/Drag State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const dragStartX = useRef(0);

  // --- DECK GENERATION ---
  const generateDeck = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setDeck(null);

    try {
      const response = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to generate deck');
      }

      const deck = await response.json();
      setDeck(deck);
      setCurrentSlideIdx(0);

    } catch (e) {
      console.error(e);
      alert("Error generating deck. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- DRAG HANDLERS ---
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!deck) return;
    setIsDragging(true);
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragOffset(clientX - dragStartX.current);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (!deck) return;
    
    // Threshold to swipe
    if (Math.abs(dragOffset) > 150) {
      if (dragOffset < 0 && currentSlideIdx < deck.slides.length - 1) {
        // Swipe left - next slide
        setCurrentSlideIdx(prev => prev + 1);
      } else if (dragOffset > 0 && currentSlideIdx > 0) {
        // Swipe right - previous slide
        setCurrentSlideIdx(prev => prev - 1);
      }
    }
    setDragOffset(0);
  };

  // --- PUSH TO GITHUB ---
  const pushToGitHub = async () => {
    setIsPushing(true);
    try {
      const response = await fetch('/api/push-to-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: 'https://github.com/suryauthkarsha/canvas.git' })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Success! Pushed to ${data.repoUrl}`);
      } else {
        alert('Error: ' + (data.error || 'Failed to push'));
      }
    } catch (e) {
      console.error(e);
      alert('Error pushing to GitHub');
    } finally {
      setIsPushing(false);
    }
  };

  // --- EXPORT LOGIC ---
  const exportToPPT = () => {
    if (!deck) return;
    setExporting(true);
    
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    
    const t = THEMES[activeTheme];
    const bgHex = t.pptBg;
    const textHex = t.pptText;
    const subTextHex = t.pptSub;
    const accentHex = t.accentHex;

    deck.slides.forEach(slide => {
      const s = pres.addSlide();
      s.background = { color: bgHex };
      const imgUrl = getImageUrl(slide.imagePrompt);

      if (slide.layout === 'title-cyber') {
        if (imgUrl) s.addImage({ path: imgUrl, x: 0, y: 0, w: '100%', h: '100%', transparency: 60 });
        s.addShape(pres.ShapeType.rect, { x: 1, y: 2.3, w: 2, h: 0.05, fill: { color: accentHex } });
        s.addText(slide.title, { x: 1, y: 2.5, w: 8, h: 1.5, fontSize: 48, bold: true, color: textHex, valign: 'top' });
        s.addText(slide.subtitle || '', { x: 1, y: 4, w: 8, h: 1, fontSize: 18, color: subTextHex, valign: 'top' });
      }
      else if (slide.layout === 'split-bleed') {
        s.addText(slide.title, { x: 0.5, y: 0.5, w: 4, h: 1, fontSize: 28, bold: true, color: textHex });
        s.addText(slide.content?.map(c => ({ text: c, options: { breakLine: true } })) || [], { x: 0.5, y: 1.8, w: 4, h: 3.5, fontSize: 14, color: subTextHex, bullet: { code: '2022' }, valign: 'top' });
        if (imgUrl) s.addImage({ path: imgUrl, x: 5, y: 0, w: 5, h: 5.625 });
        else s.addShape(pres.ShapeType.rect, { x: 5, y: 0, w: 5, h: 5.625, fill: { color: '333333' } });
      }
      else if (slide.layout === 'timeline-horizontal') {
        s.addText(slide.title, { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 28, bold: true, color: textHex });
        s.addShape(pres.ShapeType.line, { x: 1, y: 3, w: 8, h: 0, line: { color: subTextHex, width: 2 } });
        slide.timeline?.forEach((item, i) => {
          const xPos = 1.5 + (i * 2.2);
          s.addShape(pres.ShapeType.ellipse, { x: xPos, y: 2.85, w: 0.3, h: 0.3, fill: { color: bgHex }, line: { color: accentHex, width: 3 } });
          s.addText(item.year, { x: xPos - 0.5, y: 2.3, w: 1.3, h: 0.4, align: 'center', fontSize: 16, bold: true, color: accentHex });
          s.addText(item.title, { x: xPos - 0.8, y: 3.3, w: 1.9, h: 0.5, align: 'center', fontSize: 12, bold: true, color: textHex });
          s.addText(item.desc, { x: xPos - 0.8, y: 3.8, w: 1.9, h: 0.8, align: 'center', fontSize: 10, color: subTextHex });
        });
      }
      else if (slide.layout === 'bento-grid') {
        s.addText(slide.title, { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 28, bold: true, color: textHex });
        slide.blocks?.forEach((block, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 0.5 : 5.25;
          const y = row === 0 ? 1.5 : 3.6;
          const cardFill = activeTheme === 'executive' ? 'F1F5F9' : '151515';
          const cardLine = activeTheme === 'executive' ? 'CBD5E1' : '333333';
          s.addShape(pres.ShapeType.roundRect, { x: x, y: y, w: 4.25, h: 1.8, fill: { color: cardFill }, line: { color: cardLine } });
          s.addShape(pres.ShapeType.ellipse, { x: x+0.2, y: y+0.2, w: 0.5, h: 0.5, fill: { color: accentHex } });
          s.addText(block.title, { x: x+0.2, y: y+0.8, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: textHex });
          s.addText(block.content, { x: x+0.2, y: y+1.1, w: 3.8, h: 0.6, fontSize: 11, color: subTextHex, valign: 'top' });
        });
      }
      else if (slide.layout === 'big-stat') {
        s.addText(slide.stat?.value || '', { x: 0.5, y: 1.5, w: 5, h: 2.5, fontSize: 120, color: accentHex, bold: true, align: 'center' });
        s.addShape(pres.ShapeType.line, { x: 5.5, y: 2, w: 0, h: 2, line: { color: accentHex, width: 3 } });
        s.addText(slide.title, { x: 6, y: 2, w: 3.5, h: 1, fontSize: 24, bold: true, color: textHex, valign: 'bottom' });
        s.addText(slide.subtitle || slide.content?.[0] || '', { x: 6, y: 3, w: 3.5, h: 1.5, fontSize: 14, color: subTextHex, valign: 'top' });
      }
      else if (slide.layout === 'chart-bar') {
        s.addText(slide.title, { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 28, bold: true, color: textHex });
        if (slide.chart) {
          const chartData = [{ name: slide.chart.label || "Series 1", labels: slide.chart.labels, values: slide.chart.values }];
          s.addChart('bar' as any, chartData, { x: 0.5, y: 1.5, w: 9, h: 3.5, chartColors: [...t.chartColors] as any, barDir: 'bar', barGrouping: 'standard', dataLabelPosition: 'outEnd', showValue: true });
        }
      }
      else {
        s.addText(slide.title, { x: 0.5, y: 0.5, w: 9, fontSize: 24, bold: true, color: textHex });
        s.addText(slide.content?.join('\n') || '', { x: 0.5, y: 1.5, w: 9, fontSize: 14, color: subTextHex });
      }
    });
    
    pres.writeFile({ fileName: `CanvasDeck_${t.label}.pptx` });
    setExporting(false);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${THEMES[activeTheme].bg} transition-colors duration-500`}>
      <style>{`
        .font-space { font-family: 'Space Grotesk', sans-serif; }
        .font-urbanist { font-family: 'Urbanist', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes grow {
          from { width: 0; }
          to { width: var(--final-width); }
        }
      `}</style>

      {/* --- TOP BAR --- */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center shadow-lg ${THEMES[activeTheme].accentBg}`}>
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className={`font-space font-bold text-xl tracking-tight ${THEMES[activeTheme].heading.split(' ')[1]}`}>
            CanvasDeck <span className="opacity-50">Pro</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <button 
            onClick={() => setViewMode(viewMode === 'canvas' ? 'stack' : 'canvas')} 
            className={`p-2 rounded transition-colors ${THEMES[activeTheme].text} hover:bg-white/10`}
            data-testid="button-view-mode-toggle"
          >
            {viewMode === 'canvas' ? <Copy className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
          
          {/* Push to GitHub */}
          <button 
            onClick={pushToGitHub}
            disabled={isPushing}
            className={`flex items-center gap-2 bg-white text-black px-4 py-2 rounded font-bold font-space hover:bg-gray-200 disabled:opacity-50 transition-all`}
            data-testid="button-push-github"
            title="Push code to GitHub"
          >
            {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Push</span>
          </button>

          {/* Export */}
          <button 
            onClick={exportToPPT}
            disabled={!deck || exporting}
            className={`flex items-center gap-2 bg-white text-black px-4 py-2 rounded font-bold font-space hover:bg-gray-200 disabled:opacity-50 transition-all`}
            data-testid="button-export-ppt"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export PPT</span>
          </button>
        </div>
      </div>

      {/* --- CANVAS AREA --- */}
      <div className={`flex-1 overflow-hidden relative flex items-center justify-center ${THEMES[activeTheme].slideBg} p-8 transition-colors duration-500 select-none`}>
        
        {activeTheme !== 'executive' && (
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_60%)] pointer-events-none`} />
        )}

        {!deck && !isGenerating && (
          <div className="text-center opacity-40 space-y-4 max-w-md animate-in fade-in zoom-in">
            <div className={`w-20 h-20 mx-auto rounded-full border border-white/10 bg-white/5 flex items-center justify-center ${THEMES[activeTheme].text}`}>
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className={`font-space text-2xl font-bold ${THEMES[activeTheme].heading.split(' ')[1]}`}>Ready to Design</h2>
            <p className={`text-lg ${THEMES[activeTheme].text}`}>Enter a topic and slide count (e.g. "8 slides on AI")</p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center gap-6 animate-pulse z-50" data-testid="status-generating">
            <Loader2 className={`w-12 h-12 animate-spin ${THEMES[activeTheme].accent}`} />
            <p className={`font-space text-sm tracking-widest uppercase ${THEMES[activeTheme].accent}`}>Generating Layouts...</p>
          </div>
        )}

        {/* SINGLE CANVAS MODE */}
        {deck && viewMode === 'canvas' && (
          <div className={`w-full max-w-6xl aspect-video shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 relative group ${THEMES[activeTheme].slideBg}`} data-testid="canvas-view">
            <SlideRenderer slide={deck.slides[currentSlideIdx]} theme={activeTheme} />
            
            <button 
              onClick={() => setCurrentSlideIdx(Math.max(0, currentSlideIdx-1))} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm"
              data-testid="button-prev-slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentSlideIdx(Math.min(deck.slides.length-1, currentSlideIdx+1))} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm"
              data-testid="button-next-slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-mono text-gray-200 border border-white/10" data-testid="text-slide-counter">
              SLIDE {currentSlideIdx + 1} / {deck.slides.length}
            </div>
          </div>
        )}
        
        {/* TINDER / STACK MODE (INTERACTIVE) */}
        {deck && viewMode === 'stack' && (
          <div 
            className="w-full max-w-4xl h-[600px] relative flex items-center justify-center"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            data-testid="stack-view"
          >
            {deck.slides.map((s, i) => {
              const offset = i - currentSlideIdx;
              if (offset < 0 || offset > 2) return null;

              const isTop = offset === 0;
              const xPos = isTop ? dragOffset : 0;
              const rotation = isTop ? dragOffset * 0.05 : 0;
              const scale = 1 - offset * 0.05;
              const translateY = offset * 30;
              const opacity = 1 - offset * 0.2;
              
              return (
                <div 
                  key={i}
                  style={{ 
                    zIndex: 50 - offset,
                    transform: `translateX(${xPos}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                    opacity,
                    cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                  className={`absolute w-full aspect-video shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 transition-transform ${isDragging && isTop ? 'duration-0' : 'duration-500'} ease-out ${THEMES[activeTheme].slideBg}`}
                >
                  {Math.abs(offset) <= 1 ? <SlideRenderer slide={s} theme={activeTheme} /> : <div className="w-full h-full flex items-center justify-center font-space text-2xl font-bold opacity-50">{s.title}</div>}
                </div>
              )
            })}
            
            {/* Instructions */}
            <div className="absolute -bottom-16 flex flex-col items-center gap-2 opacity-50">
              <div className="flex gap-2 text-sm font-space">
                <Hand className="w-4 h-4" /> <span>Swipe to navigate</span>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-white/50" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className={`border-t border-white/10 p-6 flex flex-col gap-4 shadow-2xl z-40 ${activeTheme === 'executive' ? 'bg-white/90' : 'bg-black/80'} backdrop-blur`}>
        <div className="flex gap-4 max-w-4xl mx-auto w-full relative items-center">
          <div className="flex gap-2 mr-4">
            {(Object.keys(THEMES) as ThemeKey[]).map(key => (
              <button
                key={key}
                onClick={() => setActiveTheme(key)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${activeTheme === key ? 'border-violet-500 scale-110 ring-2 ring-violet-500/30' : 'border-transparent opacity-50'} ${key === 'cyber' ? 'bg-slate-900' : key === 'executive' ? 'bg-slate-100' : 'bg-lime-900'}`}
                title={THEMES[key].label}
                data-testid={`button-theme-${key}`}
              />
            ))}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateDeck()}
              placeholder="Describe your deck..."
              className={`w-full border rounded-xl pl-6 pr-14 py-4 outline-none transition-all shadow-inner font-urbanist ${activeTheme === 'executive' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-gray-600'}`}
              data-testid="input-prompt"
            />
            <button 
              onClick={generateDeck}
              disabled={isGenerating || !prompt}
              className={`absolute right-2 top-2 bottom-2 aspect-square rounded-lg text-white flex items-center justify-center disabled:opacity-50 transition-all shadow-lg ${THEMES[activeTheme].accentBg}`}
              data-testid="button-generate"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SlideRendererProps {
  slide: Slide;
  theme: ThemeKey;
}

const SlideRenderer = ({ slide, theme }: SlideRendererProps) => {
  const t = THEMES[theme];
  const Heading = ({ children, className="" }: { children: React.ReactNode; className?: string }) => (
    <h2 className={`font-space font-bold text-4xl mb-6 ${t.heading.split(' ').slice(1).join(' ')} ${className}`}>{children}</h2>
  );
  
  const imgUrl = getImageUrl(slide.imagePrompt);

  if (slide.layout === 'title-cyber') {
    return (
      <div className={`w-full h-full p-16 flex flex-col justify-center relative overflow-hidden ${t.slideBg}`}>
        {imgUrl && (
          <div className="absolute inset-0 z-0 opacity-40">
            <img src={imgUrl} className="w-full h-full object-cover" alt="bg" />
            <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'executive' ? 'from-white via-white/80' : 'from-[#0f0f0f] via-[#0f0f0f]/80'} to-transparent`} />
          </div>
        )}
        <div className="relative z-10 max-w-4xl">
          <div className={`h-1 w-24 bg-gradient-to-r ${t.gradient} mb-8`} />
          <h1 className={`font-space font-bold text-7xl mb-6 leading-tight ${t.heading.split(' ').slice(1).join(' ')}`}>{slide.title}</h1>
          <p className={`font-urbanist text-2xl max-w-2xl leading-relaxed ${t.text}`}>{slide.subtitle}</p>
        </div>
      </div>
    );
  }
  if (slide.layout === 'timeline-horizontal') {
    return (
      <div className={`w-full h-full p-16 flex flex-col relative ${t.slideBg}`}>
        <Heading className={`border-l-4 ${theme === 'electric' ? 'border-lime-400' : theme === 'executive' ? 'border-blue-700' : 'border-violet-500'} pl-6`}>{slide.title}</Heading>
        <div className="flex-1 flex items-center justify-between relative px-12 mt-8">
          <div className={`absolute left-12 right-12 h-[2px] top-[40%] -z-0 ${theme === 'executive' ? 'bg-slate-300' : 'bg-[#333]'}`} />
          {slide.timeline?.map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center w-48 group cursor-pointer">
              <div className={`w-6 h-6 rounded-full ${t.slideBg} border-4 ${theme === 'electric' ? 'border-lime-400' : theme === 'executive' ? 'border-blue-700' : 'border-violet-500'} mb-8 group-hover:scale-125 transition-all shadow-lg`} />
              <div className={`font-space font-bold text-2xl mb-3 ${t.accent}`}>{item.year}</div>
              <div className={`font-bold text-lg mb-2 ${t.heading.split(' ').slice(1).join(' ')}`}>{item.title}</div>
              <div className={`text-sm leading-snug ${t.text}`}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.layout === 'split-bleed') {
    return (
      <div className={`w-full h-full flex ${t.slideBg}`}>
        <div className="w-1/2 p-16 flex flex-col justify-center">
          <Heading>{slide.title}</Heading>
          <div className="space-y-8 pr-8">
            {slide.content?.map((c, i) => (
              <div key={i} className="flex gap-5 items-start group">
                <CheckCircle2 className={`w-6 h-6 shrink-0 mt-1 ${t.accent}`} />
                <p className={`text-xl leading-relaxed font-urbanist ${t.text}`}>{c}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2 relative overflow-hidden">
          {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" alt="visual" /> : <div className="w-full h-full flex items-center justify-center bg-black/10"><ImageIcon className="w-10 h-10 opacity-50" /></div>}
        </div>
      </div>
    );
  }
  if (slide.layout === 'chart-bar') {
    return (
      <div className={`w-full h-full p-16 flex flex-col ${t.slideBg}`}>
        <Heading className={`mb-16 border-l-4 ${theme === 'electric' ? 'border-lime-400' : 'border-blue-500'} pl-6`}>{slide.title}</Heading>
        <div className="flex-1 flex flex-col justify-center gap-10 max-w-4xl mx-auto w-full">
          {slide.chart?.values.map((val, i) => (
            <div key={i} className="flex items-center gap-8 group">
              <div className={`w-40 text-right font-space font-bold text-xl ${t.text}`}>{slide.chart!.labels[i]}</div>
              <div className={`flex-1 h-14 rounded-xl overflow-hidden relative ${t.cardBg} shadow-inner`}>
                <div 
                  style={{ 
                    width: `${val}%`, 
                    backgroundColor: t.chartColors[i % t.chartColors.length],
                    ['--final-width' as any]: `${val}%`
                  }} 
                  className="h-full relative flex items-center justify-end px-6 font-bold text-black transition-all duration-1000 w-0 animate-[grow_1s_ease-out_forwards]"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-lg font-space">{val}{slide.chart!.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.layout === 'big-stat') {
    return (
      <div className={`w-full h-full p-16 flex items-center justify-center relative overflow-hidden ${t.slideBg}`}>
        <div className="flex items-center gap-20 relative z-10 max-w-5xl">
          <div className={`font-space font-bold text-[200px] leading-none tracking-tighter flex-shrink-0 ${t.accent}`}>{slide.stat?.value}</div>
          <div className="flex flex-col justify-center h-full pt-10">
            <h3 className={`font-space text-5xl font-bold mb-6 leading-tight ${t.heading.split(' ').slice(1).join(' ')}`}>{slide.title}</h3>
            <p className={`text-2xl font-urbanist leading-relaxed border-l-4 pl-8 py-2 ${t.text} ${theme === 'electric' ? 'border-lime-400' : 'border-blue-500'}`}>{slide.content?.[0] || slide.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }
  if (slide.layout === 'bento-grid') {
    return (
      <div className={`w-full h-full p-16 flex flex-col ${t.slideBg}`}>
        <Heading className="mb-10">{slide.title}</Heading>
        <div className="grid grid-cols-2 gap-8 flex-1">
          {slide.blocks?.map((block, i) => (
            <div key={i} className={`${t.cardBg} rounded-3xl p-10 hover:bg-opacity-100 transition-all group flex flex-col justify-center`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all shadow-lg ${t.accent} bg-current bg-opacity-10`}>
                {i === 0 ? <Layout className="w-7 h-7" /> : i === 1 ? <BarChart3 className="w-7 h-7" /> : i === 2 ? <Type className="w-7 h-7" /> : <Grid className="w-7 h-7" />}
              </div>
              <h3 className={`font-space font-bold text-2xl mb-3 ${t.heading.split(' ').slice(1).join(' ')}`}>{block.title}</h3>
              <p className={`font-urbanist text-lg leading-relaxed ${t.text}`}>{block.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return <div className={`p-16 ${t.text}`}>Layout Error</div>;
};
