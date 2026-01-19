
import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptionStatus, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

interface UseSpeechRecognitionReturn {
  status: TranscriptionStatus;
  text: string;
  interimText: string;
  error: string | null;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  // Support functional updates for setText (prev => ...)
  setText: (value: string | ((prev: string) => string)) => void;
  isSupported: boolean;
}

const ERROR_MAP: Record<string, { msg: string; recovery: string }> = {
  'no-speech': { msg: 'Không nghe thấy âm thanh.', recovery: 'Vui lòng kiểm tra Micro hoặc nói to hơn.' },
  'audio-capture': { msg: 'Lỗi thu âm Micro.', recovery: 'Đảm bảo Micro không bị ứng dụng khác chiếm dụng.' },
  'not-allowed': { msg: 'Quyền truy cập Micro bị từ chối.', recovery: 'Vui lòng cấp quyền Micro trong cài đặt trình duyệt.' },
  'network': { msg: 'Lỗi kết nối mạng.', recovery: 'Kiểm tra internet để Web Speech API hoạt động.' },
  'not-supported': { msg: 'Trình duyệt không hỗ trợ.', recovery: 'Vui lòng sử dụng Chrome hoặc Microsoft Edge.' },
  'aborted': { msg: 'Phiên ghi âm bị ngắt.', recovery: 'Đang tự động khởi động lại...' },
};

// Configuration for Intelligent Segmentation
const MAX_READABLE_LINE_LENGTH = 160; // Characters before forcing a break
const SOFT_BREAK_THRESHOLD = 80;      // Characters after punctuation before breaking

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [status, setStatus] = useState<TranscriptionStatus>(TranscriptionStatus.IDLE);
  const [text, setText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  
  const language = 'en-US';
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const statusRef = useRef<TranscriptionStatus>(TranscriptionStatus.IDLE);
  const restartCount = useRef(0);
  
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Helper to capitalize first letter of a string
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // EFFECT: Handle natural pauses for semantic commits
  useEffect(() => {
    if (status !== TranscriptionStatus.RECORDING || interimText) {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        return;
    }

    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    // Commit on long silence (indicates end of a thematic block or speaker turn)
    silenceTimer.current = setTimeout(() => {
        setText(prev => {
            let trimmed = prev.trimEnd();
            if (trimmed.length > 0 && !/[.!?\n]$/.test(trimmed)) {
                return trimmed + '.\n\n';
            } else if (trimmed.length > 0 && !trimmed.endsWith('\n\n')) {
                return trimmed + '\n\n';
            }
            return prev;
        });
    }, 1200);

  }, [text, interimText, status]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setIsSupported(false); return; }

    const init = () => {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            restartCount.current = 0; 
            let finalChunk = '';
            let interimChunk = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript;
                else interimChunk += event.results[i][0].transcript;
            }

            if (finalChunk) {
                setText(prev => {
                    let chunk = finalChunk.trim();
                    if (!chunk) return prev;
                    
                    // SEGMENTATION LOGIC:
                    // Split the incoming chunk into sentences while preserving punctuation
                    const sentenceRegex = /([^.!?]+[.!?]\s*|[^.!?]+$)/g;
                    const matches = chunk.match(sentenceRegex) || [chunk];
                    
                    let newText = prev.trimEnd();

                    matches.forEach(s => {
                        let sentence = capitalize(s.trim());
                        if (!sentence) return;

                        // Calculate properties of the current "tail" of our transcript
                        const lines = newText.split('\n');
                        const lastLine = lines[lines.length - 1] || '';
                        
                        // Intelligent Break Decision:
                        // 1. Hard Break: Current line is already too long (>160 chars)
                        // 2. Soft Break: Current line has punctuation AND is reasonably long (>80 chars)
                        const endsInPunctuation = /[.!?]$/.test(lastLine);
                        const shouldBreak = (endsInPunctuation && lastLine.length > SOFT_BREAK_THRESHOLD) || 
                                           (lastLine.length > MAX_READABLE_LINE_LENGTH);

                        let separator = '';
                        if (newText !== '') {
                            if (shouldBreak) {
                                separator = '\n';
                            } else {
                                // If last line ends in punctuation but is short, just add a space
                                separator = endsInPunctuation ? ' ' : ' ';
                            }
                        }

                        newText += separator + sentence;
                    });
                    
                    return newText;
                });
                setInterimText(''); 
            } else {
                setInterimText(interimChunk);
            }
        };

        recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
            const errInfo = ERROR_MAP[ev.error] || { msg: 'Lỗi ghi âm không xác định.', recovery: 'Thử tải lại trang.' };
            setError(`${errInfo.msg} ${errInfo.recovery}`);
            
            if (statusRef.current === TranscriptionStatus.RECORDING && restartCount.current < 3) {
                restartCount.current++;
                setTimeout(() => { try { recognition.start(); } catch(e) {} }, 500);
            }
        };

        recognition.onend = () => {
            if (statusRef.current === TranscriptionStatus.RECORDING) {
                try { recognition.start(); } catch (e) {}
            }
        };
        return recognition;
    };

    recognitionRef.current = init();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []); 

  const startRecording = useCallback(() => {
    setError(null);
    restartCount.current = 0;
    if (recognitionRef.current) {
        try { recognitionRef.current.start(); setStatus(TranscriptionStatus.RECORDING); }
        catch (e) { setStatus(TranscriptionStatus.RECORDING); }
    }
  }, []);

  const pauseRecording = useCallback(() => { setStatus(TranscriptionStatus.PAUSED); recognitionRef.current?.stop(); }, []);
  const stopRecording = useCallback(() => { setStatus(TranscriptionStatus.STOPPED); recognitionRef.current?.stop(); setInterimText(''); }, []);
  const clearTranscript = useCallback(() => { setText(''); setInterimText(''); setError(null); }, []);

  return { status, text, interimText, error, startRecording, pauseRecording, stopRecording, clearTranscript, setText, isSupported };
};
