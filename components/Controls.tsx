
import React, { memo } from 'react';
import { Play, Pause, Square, Trash2, Sparkles, Loader2, ArrowRightCircle } from 'lucide-react';
import { TranscriptionStatus } from '../types';

interface ControlsProps {
  status: TranscriptionStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onClear: () => void;
  onSave: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  hasText: boolean;
  isBatchMode?: boolean;
}

export const Controls: React.FC<ControlsProps> = memo(({ 
  status, 
  onStart, 
  onPause, 
  onStop, 
  onClear, 
  onSave, 
  onOptimize,
  isOptimizing,
  hasText,
  isBatchMode = false
}) => {
  const isRecording = status === TranscriptionStatus.RECORDING;
  const isPaused = status === TranscriptionStatus.PAUSED;

  return (
    <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 flex-wrap">
      {/* Primary Actions Group */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {!isRecording ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 hover:shadow-lg"
            title="Start Recording"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span>{isPaused ? 'Resume' : 'Start'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 hover:shadow-lg"
            title="Pause Recording"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onStop}
          disabled={status === TranscriptionStatus.IDLE || status === TranscriptionStatus.STOPPED}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
              status === TranscriptionStatus.IDLE || status === TranscriptionStatus.STOPPED
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg'
          }`}
          title="Stop Session"
        >
          <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          <span>Stop</span>
        </button>
      </div>

      <div className="hidden md:block w-px h-8 bg-slate-200 mx-1" />

      {/* Secondary Actions Group */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOptimize}
          disabled={!hasText || isOptimizing}
          className={`flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-full font-bold transition-all ${
             !hasText || isOptimizing
               ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
               : isBatchMode 
                 ? 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95 shadow-md'
                 : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95'
          }`}
          title={isBatchMode ? "Perform Batch Translation" : "Force Real-time Sync"}
        >
          {isOptimizing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : isBatchMode ? (
              <ArrowRightCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span className="hidden sm:inline text-xs sm:text-sm">
            {isOptimizing ? 'Working...' : isBatchMode ? 'Batch Process' : 'Sync Now'}
          </span>
        </button>

        <button
          onClick={onClear}
          className="p-2.5 sm:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-full transition-all active:scale-90"
          title="Clear Transcript"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
});

Controls.displayName = 'Controls';
