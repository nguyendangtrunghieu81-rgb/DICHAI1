
import React, { useState } from 'react';
import { Folder, Plus, Calendar, Clock, Trash2, FileText, X, Search, ChevronRight, Hash } from 'lucide-react';
import { SessionMetadata } from '../types';

interface SessionVaultProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionMetadata[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: (name: string) => void;
}

export const SessionVault: React.FC<SessionVaultProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onNew(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Meeting Vault</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sessions.length} Folders Stored</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 border-b border-slate-100 bg-white">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search session name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Start New Meeting Session
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2 animate-in slide-in-from-top-2">
              <input 
                autoFocus
                type="text" 
                placeholder="Session Title (e.g. Daily Standup)" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-medium outline-none ring-4 ring-blue-500/5"
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Create</button>
              <button type="button" onClick={() => setIsCreating(false)} className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-60 italic">
              <Folder className="w-12 h-12 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">No matching sessions found</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div 
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeSessionId === session.id 
                  ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-600/5' 
                  : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    activeSessionId === session.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                  }`}>
                    <Hash className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 truncate">{session.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-blue-500/70 uppercase tracking-tighter">
                        <FileText className="w-3 h-3" />
                        {session.wordCount} words
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {activeSessionId === session.id && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest mr-2">Active</span>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-4 h-4 transition-all ${activeSessionId === session.id ? 'text-blue-500' : 'text-slate-300 group-hover:translate-x-1'}`} />
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
          Sessions are stored locally on this device.
        </div>
      </div>
    </div>
  );
};
