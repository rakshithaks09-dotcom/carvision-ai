/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { CameraScanner } from './components/CameraScanner';
import { VehicleResultCard } from './components/VehicleResultCard';
import { GarageHistory } from './components/GarageHistory';
import { CarAiChat } from './components/CarAiChat';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { CarAnalysisResponse, ScanRecord } from './types/vehicle';
import { playScanRadarPulse, playSuccessTone, playErrorTone } from './utils/audio';
import {
  Camera,
  CheckCircle,
  Clock,
  FolderCode,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY = 'carvision_scan_history_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'scanner' | 'results' | 'history'>('scanner');
  const [analysisResult, setAnalysisResult] = useState<CarAnalysisResponse | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [selectedCarIndex, setSelectedCarIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [savedScanIds, setSavedScanIds] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isFramed, setIsFramed] = useState<boolean>(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ScanRecord[] = JSON.parse(stored);
        setScanHistory(parsed);
        setSavedScanIds(new Set(parsed.map((r) => r.id)));
      }
    } catch (e) {
      console.warn('Failed loading scan history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveRecordsToStorage = (records: ScanRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setScanHistory(records);
      setSavedScanIds(new Set(records.map((r) => r.id)));
    } catch (e) {
      console.warn('Failed saving scan history:', e);
    }
  };

  // Perform AI Car Analysis
  const handleAnalyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setActiveImageUrl(imageDataUrl);

    if (isSoundEnabled) {
      playScanRadarPulse();
    }

    try {
      const response = await fetch('/api/detect-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          mimeType: 'image/jpeg',
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to analyze car image. Please check API key.');
      }

      const resultData: CarAnalysisResponse = json.data;
      setAnalysisResult(resultData);
      setSelectedCarIndex(0);
      setCurrentTab('results');

      if (isSoundEnabled) {
        if (resultData.car_detected) {
          playSuccessTone();
        } else {
          playErrorTone();
        }
      }

      // Auto-save positive scans to history
      if (resultData.car_detected && resultData.cars?.length > 0) {
        const newRecord: ScanRecord = {
          id: `scan_${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: imageDataUrl,
          analysis: resultData,
          selectedCarIndex: 0,
        };
        const updated = [newRecord, ...scanHistory.slice(0, 49)];
        saveRecordsToStorage(updated);
      }
    } catch (err: any) {
      console.error('Detection error:', err);
      setErrorMessage(err.message || 'An error occurred during analysis');
      if (isSoundEnabled) {
        playErrorTone();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save current result manually
  const handleSaveCurrentToGarage = () => {
    if (!analysisResult || !activeImageUrl) return;
    const currentId = `scan_${Date.now()}`;
    const newRecord: ScanRecord = {
      id: currentId,
      timestamp: Date.now(),
      imageUrl: activeImageUrl,
      analysis: analysisResult,
      selectedCarIndex,
    };
    const updated = [newRecord, ...scanHistory.filter((r) => r.imageUrl !== activeImageUrl)];
    saveRecordsToStorage(updated);
  };

  // Select historical record
  const handleSelectRecord = (record: ScanRecord) => {
    setAnalysisResult(record.analysis);
    setActiveImageUrl(record.imageUrl);
    setSelectedCarIndex(record.selectedCarIndex || 0);
    setCurrentTab('results');
  };

  // Delete historical record
  const handleDeleteRecord = (id: string) => {
    const updated = scanHistory.filter((r) => r.id !== id);
    saveRecordsToStorage(updated);
  };

  // Clear all history
  const handleClearAllHistory = () => {
    saveRecordsToStorage([]);
  };

  // Active car swatch
  const activeCar = analysisResult?.cars?.[selectedCarIndex] || analysisResult?.cars?.[0];
  const activeColorHex = activeCar?.colour_hex || '#2563EB';

  const isCurrentSaved = activeImageUrl
    ? scanHistory.some((r) => r.imageUrl === activeImageUrl)
    : false;

  return (
    <AndroidFrame
      activeColorHex={activeColorHex}
      isFramed={isFramed}
      onToggleFrame={() => setIsFramed(!isFramed)}
      isSoundEnabled={isSoundEnabled}
      onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
      onOpenProjectModal={() => setIsProjectModalOpen(true)}
    >
      {/* Top Banner on Error */}
      {errorMessage && (
        <div className="mx-4 mt-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-400 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isChatOpen && activeCar ? (
          <CarAiChat
            carResult={activeCar}
            onBack={() => setIsChatOpen(false)}
          />
        ) : currentTab === 'scanner' ? (
          <CameraScanner
            onAnalyze={handleAnalyzeImage}
            isAnalyzing={isAnalyzing}
            isSoundEnabled={isSoundEnabled}
          />
        ) : currentTab === 'results' && analysisResult && activeImageUrl ? (
          <VehicleResultCard
            analysis={analysisResult}
            imageUrl={activeImageUrl}
            selectedCarIndex={selectedCarIndex}
            onSelectCar={(idx) => setSelectedCarIndex(idx)}
            onReset={() => {
              setCurrentTab('scanner');
              setIsChatOpen(false);
            }}
            onSaveToGarage={handleSaveCurrentToGarage}
            isSaved={isCurrentSaved}
            onOpenChat={() => setIsChatOpen(true)}
          />
        ) : (
          <GarageHistory
            records={scanHistory}
            onSelectRecord={handleSelectRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllHistory}
          />
        )}
      </div>

      {/* Android Material 3 Bottom Navigation Bar */}
      <nav className="h-16 px-6 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-around shrink-0 z-20">
        {/* Home / Scanner Tab */}
        <button
          onClick={() => {
            setCurrentTab('scanner');
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'scanner' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              currentTab === 'scanner' ? 'bg-blue-500/20' : ''
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">Home / Scan</span>
        </button>

        {/* Results Tab */}
        <button
          onClick={() => {
            if (analysisResult) {
              setCurrentTab('results');
              setIsChatOpen(false);
            }
          }}
          disabled={!analysisResult}
          className={`flex flex-col items-center gap-1 transition-all ${
            !analysisResult
              ? 'opacity-30 cursor-not-allowed text-slate-500'
              : currentTab === 'results'
              ? 'text-blue-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              currentTab === 'results' ? 'bg-blue-500/20' : ''
            }`}
          >
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">Result</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => {
            setCurrentTab('history');
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            currentTab === 'history' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              currentTab === 'history' ? 'bg-blue-500/20' : ''
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">History</span>
          {scanHistory.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
          )}
        </button>

        {/* Android Studio Code Export Tab */}
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-400 transition-all"
        >
          <div className="p-1.5 rounded-full hover:bg-slate-800 transition-colors">
            <FolderCode className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">Android Code</span>
        </button>
      </nav>

      {/* Android Studio Project Modal & ZIP Exporter */}
      <AndroidProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </AndroidFrame>
  );
}
