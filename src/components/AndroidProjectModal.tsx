import React, { useState } from 'react';
import {
  FolderCode,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Code2,
  Terminal,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ANDROID_PROJECT_FILES, ProjectFile } from '../utils/androidProjectFiles';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const projectFolder = zip.folder('CarVisionAI');

      ANDROID_PROJECT_FILES.forEach((file) => {
        projectFolder?.file(file.path, file.content);
      });

      // Add local.properties template
      projectFolder?.file(
        'local.properties',
        '# Add your Google Gemini API Key here:\nGEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE\n'
      );

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'CarVisionAI-AndroidStudio-Project.zip');
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">CarVision AI — Android Studio Project</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
                  Kotlin + Jetpack Compose
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete source files, CameraX, Room DB, Material 3, and Gradle setup ready for Android Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating ZIP...' : 'Download Project (.ZIP)'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/60 p-3 overflow-y-auto flex flex-col gap-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Project Files
            </div>

            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.category === 'kotlin' ? (
                      <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : file.category === 'gradle' ? (
                      <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : file.category === 'manifest' ? (
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              );
            })}

            {/* Quick Setup Card */}
            <div className="mt-auto pt-4 border-t border-slate-800/80">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  API Key Setup
                </div>
                <p>
                  Place your Gemini key in <span className="font-mono text-blue-300">local.properties</span>:
                </p>
                <div className="p-1.5 bg-black/50 rounded font-mono text-[10px] text-emerald-300 select-all overflow-x-auto">
                  GEMINI_API_KEY=YOUR_KEY
                </div>
              </div>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-950/80 overflow-hidden">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300 font-semibold">{selectedFile.path}</span>
                <span className="text-[11px] text-slate-500">— {selectedFile.description}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-5 overflow-auto font-mono text-xs leading-relaxed text-slate-300 bg-slate-950 selection:bg-blue-600 selection:text-white">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
