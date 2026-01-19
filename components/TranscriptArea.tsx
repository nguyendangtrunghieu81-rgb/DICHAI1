
import React, { useEffect, useRef, useState, memo, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Copy, Check, ArrowDown, Pencil, Save, Languages, MessageSquareText, Volume2, VolumeX } from 'lucide-react';

interface TranscriptAreaProps {
  title: string;
  text: string;
  interimText?: string;
  onChange: (text: string) => void;
  accentColor?: 'blue' | 'indigo' | 'emerald';
  enableTTS?: boolean;
  isTTSActive?: boolean;
  onToggleTTS?: () => void;
  onSyncScroll?: (percentage: number) => void;
  badge?: React.ReactNode;
}

export const TranscriptArea = memo(forwardRef<HTMLDivElement, TranscriptAreaProps>(({ 
  title, 
  text, 
  interimText = '', 
  onChange,
  accentColor = 'blue',
  enableTTS = false,
  isTTSActive = false,
  onToggleTTS,
  onSyncScroll,
  badge
}, ref) => {
  const localScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // We use this ref to track the last known state without triggering re-renders 
  // during the scroll event itself, improving performance.
  const isUserScrollingRef = useRef(false);

  useImperativeHandle(ref, () => localScrollRef.current as HTMLDivElement);

  const paragraphs = useMemo(() => {
    return text.split('\n').filter(p => p.trim() !== '');
  }, [text]);

  const handleScroll = () => {
    if (!localScrollRef.current || isEditing) return;
    
    const { scrollTop, scrollHeight, clientHeight } = localScrollRef.current;
    
    // Threshold of 30px is usually enough to account for sub-pixel rendering and padding
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    
    // If user is at bottom, they are no longer "user scrolling" (they are following the live feed)
    if (isAtBottom && isUserScrollingRef.current) {
        setIsUserScrolling(false);
        isUserScrollingRef.current = false;
        setShowScrollButton(false);
    } 
    // If user moves up, they have entered manual scrolling mode
    else if (!isAtBottom && !isUserScrollingRef.current) {
        setIsUserScrolling(true);
        isUserScrollingRef.current = true;
        setShowScrollButton(true);
    }

    if (onSyncScroll && scrollHeight > clientHeight) {
        const percentage = scrollTop / (scrollHeight - clientHeight);
        onSyncScroll(percentage);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    // Only auto-scroll if the user isn't browsing history and isn't currently editing
    if (!isUserScrolling && !isEditing && bottomRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated before scrolling
      requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [text, interimText, isUserScrolling, isEditing]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setIsUserScrolling(false);
      isUserScrollingRef.current = false;
      setShowScrollButton(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  const headerStyles = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
  }[accentColor];

  const cursorStyles = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
  }[accentColor];

  return (
    <div className="flex-1 w-full flex flex-col bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-300 hover:shadow-md">
      
      <div className={`px-4 md:px-5 py-2.5 md:py-3.5 border-b flex items-center justify-between ${headerStyles} shrink-0`}>
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
            {accentColor === 'blue' ? <MessageSquareText className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> : <Languages className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />}
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest truncate">{title}</h2>
            {badge}
            {isTTSActive && (
                 <span className="flex h-1.5 md:h-2 w-1.5 md:w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 md:h-2 w-1.5 md:w-2 bg-emerald-500"></span>
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {enableTTS && onToggleTTS && (
                 <button
                 onClick={onToggleTTS}
                 className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-all ${isTTSActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/80 text-slate-500 hover:bg-white hover:text-emerald-600'}`}
                 title="Toggle Vietnamese Reader"
                >
                 {isTTSActive ? <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                 <span className="text-[9px] md:text-[10px] font-black uppercase hidden xs:inline">{isTTSActive ? 'Speaker On' : 'Silent'}</span>
               </button>
            )}

             <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 md:p-2 rounded-lg transition-all ${isEditing ? 'bg-blue-600 text-white' : 'hover:bg-white/80 text-slate-400 hover:text-slate-600'}`}
                title={isEditing ? 'Save Edits' : 'Edit Text'}
            >
                {isEditing ? <Save className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
            <button
                onClick={handleCopy}
                className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-all"
                title="Copy Transcript"
            >
                {copied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {isEditing ? (
           <textarea 
              value={text}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 w-full h-full p-4 md:p-6 resize-none outline-none border-none text-sm md:text-lg leading-relaxed text-slate-800 bg-slate-50/30 custom-scrollbar font-sans"
              spellCheck={false}
           />
        ) : (
          <div 
              ref={localScrollRef}
              onScroll={handleScroll}
              className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-white scroll-smooth relative"
          >
              {paragraphs.length === 0 && !interimText && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 select-none animate-pulse">
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center">Ready to interpret...</p>
                  </div>
              )}

              <div className="flex flex-col gap-3 md:gap-4 text-sm md:text-lg leading-relaxed text-slate-800 font-medium">
                  {paragraphs.map((para, index) => (
                      <p key={index} className="break-words animate-in fade-in duration-500 slide-in-from-bottom-1">
                          {para}
                      </p>
                  ))}
                  
                  {(interimText || paragraphs.length > 0) && (
                      <div className="min-h-[1.2em] md:min-h-[1.5em] relative">
                          {interimText && (
                              <span className="text-slate-400 italic break-words transition-all">
                                  {interimText}
                              </span>
                          )}
                          <span className={`inline-block w-2 md:w-2.5 h-4 md:h-5 ${cursorStyles} ml-1 align-middle animate-cursor-blink rounded-full shadow-sm`}></span>
                      </div>
                  )}
                  
                  <div ref={bottomRef} className="h-2 md:h-4" />
              </div>
          </div>
        )}

        {showScrollButton && !isEditing && (
          <button
            onClick={scrollToBottom}
            className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 text-white p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 z-20 ${accentColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <ArrowDown className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
      </div>
    </div>
  );
}));

TranscriptArea.displayName = 'TranscriptArea';
