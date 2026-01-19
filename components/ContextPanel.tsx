
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, X, ChevronDown, ChevronUp, Info, FileUp, Save, CheckCircle, Loader2, FileType } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Handle ESM default export interop for pdfjs-dist
const pdfJs = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF Worker
if (pdfJs.GlobalWorkerOptions) {
  pdfJs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface ContextPanelProps {
  initialDescription?: string;
  initialFileName?: string;
  initialFileContent?: string;
  onContextChange: (description: string, fileContent: string, fileName: string) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ 
    initialDescription = '', 
    initialFileName = '', 
    initialFileContent = '', 
    onContextChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for editing
  const [description, setDescription] = useState(initialDescription);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [fileContent, setFileContent] = useState(initialFileContent);
  const [fileType, setFileType] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with props when session changes
  useEffect(() => {
    setDescription(initialDescription);
    setFileName(initialFileName || null);
    setFileContent(initialFileContent);
    // Infer file type from name
    if (initialFileName) {
        const ext = initialFileName.split('.').pop()?.toLowerCase() || '';
        setFileType(ext);
    } else {
        setFileType('');
    }
  }, [initialDescription, initialFileName, initialFileContent]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setSaveStatus('idle');
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfJs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 10); // Reference up to 10 pages
        
        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    } catch (e) {
        console.error("PDF Parse Error", e);
        throw new Error("Failed to parse PDF");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { 
        alert("File is too large. Please upload a file under 10MB.");
        return;
    }

    setIsProcessing(true);
    setSaveStatus('idle');

    try {
        let text = '';
        const name = file.name.toLowerCase();

        if (name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
            setFileType('docx');
        } else if (name.endsWith('.pdf')) {
            text = await extractTextFromPdf(file);
            setFileType('pdf');
        } else {
            text = await file.text();
            setFileType('txt');
        }

        setFileName(file.name);
        setFileContent(text);
    } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to read file.");
        setFileName(null);
        setFileContent('');
    } finally {
        setIsProcessing(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFileName(null);
      setFileContent('');
      setFileType('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSaveStatus('idle');
  };

  const handleSave = () => {
      onContextChange(description, fileContent, fileName || '');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const getFileIcon = () => {
      if (fileType === 'pdf') return <FileType className="w-4 h-4 text-red-500 shrink-0" />;
      if (fileType === 'docx') return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="bg-white border-b border-slate-200 transition-all duration-300 shadow-sm relative z-20 shrink-0">
      <div 
        className="px-4 md:px-6 py-2 md:py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-600">
            <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
            <span className="truncate">Context & Reference Materials</span>
            {fileName && (
                 <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] border border-blue-100 hidden sm:inline">
                    Active: {fileName}
                </span>
            )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {isOpen && (
        <div className="px-4 md:px-8 pb-6 pt-2 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Description Input */}
            <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">
                    Meeting Objectives
                </label>
                <textarea
                    className="w-full h-24 md:h-32 p-3 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-300"
                    placeholder="E.g., discussing technical requirements for the next export sprint..."
                    value={description}
                    onChange={handleDescriptionChange}
                />
            </div>

            {/* File Upload */}
            <div className="space-y-1.5 md:space-y-2 flex flex-col">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">
                    Reference File (PDF/Word)
                </label>
                <div className="flex-1 min-h-[96px] md:min-h-[128px] w-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/50 transition-all relative group">
                    {isProcessing ? (
                         <div className="flex flex-col items-center gap-2 text-blue-600">
                            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Parsing...</span>
                         </div>
                    ) : !fileName ? (
                        <>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".txt,.md,.csv,.docx,.pdf,.doc"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                                <Upload className="w-6 h-6 md:w-8 md:h-8 mb-0.5" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Select File</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center w-full px-4 text-center">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-100 rounded-xl shadow-sm w-full max-w-[240px]">
                                {getFileIcon()}
                                <div className="flex flex-col min-w-0 text-left">
                                    <span className="text-[11px] font-bold text-slate-700 truncate">{fileName}</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{fileContent.length} chars referenced</span>
                                </div>
                                <button onClick={clearFile} className="p-1.5 ml-auto hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="mt-1.5 text-[9px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Active Reference
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-4">
             <p className="text-[9px] md:text-[10px] text-slate-400 max-w-sm text-center sm:text-left font-medium leading-relaxed uppercase tracking-wider">
                This context helps the AI correctly translate technical jargon and specific project names during the session.
             </p>
             <button
                onClick={handleSave}
                disabled={saveStatus === 'saved'}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg uppercase tracking-widest ${
                    saveStatus === 'saved' 
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/20 active:scale-95'
                }`}
             >
                {saveStatus === 'saved' ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Context Applied
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Apply Context
                    </>
                )}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
