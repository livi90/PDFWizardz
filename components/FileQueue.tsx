import React from 'react';
import { FileItem, ProcessingStatus } from '../types';
import { CheckCircle, Loader2, AlertCircle, Clock, Edit2 } from 'lucide-react';

interface FileQueueProps {
  files: FileItem[];
  onRename?: (id: string, newName: string) => void;
  t: any;
}

const FileQueue: React.FC<FileQueueProps> = ({ files, onRename, t }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="hidden md:flex bg-gray-900 text-gray-400 px-3 py-1 text-sm font-bold border-b border-gray-700">
          <div className="w-1/3">{t.tableOrig}</div>
          <div className="w-1/3">{t.tableNew}</div>
          <div className="w-1/3 text-right">{t.tableStatus}</div>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2 mt-2 pr-2 custom-scrollbar">
        {files.map((item) => (
          <div 
            key={item.id} 
            className={`p-3 border-2 border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-3 text-lg transition-colors ${
              item.status === ProcessingStatus.COMPLETED ? 'bg-emerald-900/20 border-emerald-800' : 
              item.status === ProcessingStatus.ERROR ? 'bg-rose-900/20 border-rose-800' : 'bg-gray-800'
            }`}
          >
            {/* Original Name */}
            <div className="w-full md:w-1/3 flex items-center gap-2 overflow-hidden">
                <div className="shrink-0">
                  {item.status === ProcessingStatus.IDLE && <Clock className="w-5 h-5 text-gray-500" />}
                  {item.status === ProcessingStatus.PENDING && <Clock className="w-5 h-5 text-indigo-400" />}
                  {item.status === ProcessingStatus.PROCESSING && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                  {item.status === ProcessingStatus.COMPLETED && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {item.status === ProcessingStatus.ERROR && <AlertCircle className="w-5 h-5 text-rose-500" />}
                </div>
                <div className="truncate font-mono text-gray-400 text-sm">{item.file.name}</div>
            </div>
            
            {/* Editable New Name */}
            <div className="w-full md:w-1/3">
                {item.status === ProcessingStatus.COMPLETED && item.metadata ? (
                  <div className="relative group">
                     <input 
                        type="text" 
                        value={item.metadata.suggestedName}
                        onChange={(e) => onRename && onRename(item.id, e.target.value)}
                        className="w-full bg-gray-900 border-b border-emerald-600 text-emerald-400 font-bold px-1 py-0.5 focus:outline-none focus:bg-gray-800 font-vt323"
                     />
                     <Edit2 className="w-3 h-3 text-emerald-700 absolute right-1 top-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                  </div>
                ) : (
                    <span className="text-gray-600 text-sm">---</span>
                )}
                {item.status === ProcessingStatus.ERROR && (
                    <div className="text-sm text-rose-400">{item.error}</div>
                )}
            </div>
            
            {/* Status / Category */}
            <div className="w-full md:w-1/3 md:text-right">
                {item.status === ProcessingStatus.COMPLETED && item.metadata && (
                   <div className="inline-block px-2 py-0.5 bg-gray-900 text-xs text-gray-400 border border-gray-700 rounded">
                      {item.metadata.category}
                   </div>
                )}
                {item.status === ProcessingStatus.PROCESSING && <span className="text-indigo-400 animate-pulse text-sm">{t.processing}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileQueue;