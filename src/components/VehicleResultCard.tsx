import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Share2,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Car,
  MessageSquare
} from 'lucide-react';
import { CarAnalysisResponse, DetectedCar } from '../types/vehicle';
import { speakVehicleDetails, stopSpeaking } from '../utils/audio';

interface VehicleResultCardProps {
  analysis: CarAnalysisResponse;
  imageUrl: string;
  selectedCarIndex: number;
  onSelectCar: (index: number) => void;
  onReset: () => void;
  onSaveToGarage: () => void;
  isSaved: boolean;
  onOpenChat: () => void;
}

export const VehicleResultCard: React.FC<VehicleResultCardProps> = ({
  analysis,
  imageUrl,
  selectedCarIndex,
  onSelectCar,
  onReset,
  onSaveToGarage,
  isSaved,
  onOpenChat,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<boolean>(false);

  const { car_detected, message, cars } = analysis;

  // Case 1: No car detected
  if (!car_detected || !cars || cars.length === 0) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">No Car Detected</h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto mb-6">
            {message || 'No car detected. Please upload a clear image containing a car.'}
          </p>

          <button
            onClick={onReset}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Photo
          </button>
        </div>
      </div>
    );
  }

  // Active selected car
  const activeIndex = Math.min(Math.max(0, selectedCarIndex), cars.length - 1);
  const currentCar = cars[activeIndex];

  const makeConfPercent = Math.round((currentCar.make_confidence || 0) * 100);
  const modelConfPercent = Math.round((currentCar.model_confidence || 0) * 100);
  const colourConfPercent = Math.round((currentCar.colour_confidence || 0) * 100);

  const isModelLowConfidence = (currentCar.model_confidence || 0) < 0.60;
  const displayModel = isModelLowConfidence
    ? 'Model could not be reliably identified.'
    : currentCar.model;

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const speech = `Car Detected: ${currentCar.make} ${displayModel}, colour ${currentCar.colour}. Make confidence is ${makeConfPercent} percent, model confidence is ${modelConfPercent} percent, colour confidence is ${colourConfPercent} percent.`;
      speakVehicleDetails(speech);
      setIsSpeaking(true);
    }
  };

  const handleCopyReport = () => {
    const report = `🚘 CarVision AI Detection Result:
• Make: ${currentCar.make} (${makeConfPercent}%)
• Model: ${displayModel} (${modelConfPercent}%)
• Colour: ${currentCar.colour} (${colourConfPercent}%)
${cars.length > 1 ? `(Car ${activeIndex + 1} of ${cars.length} detected in frame)` : ''}`;

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCopyHex = () => {
    if (currentCar.colour_hex) {
      navigator.clipboard.writeText(currentCar.colour_hex);
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* 1. Analyzed Image Preview with Multi-Car Bounding Boxes */}
      <div className="relative w-full h-56 sm:h-64 bg-black overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt="Analyzed car"
          className="w-full h-full object-cover"
        />

        {/* Bounding Box Overlays */}
        {cars.map((car, idx) => {
          if (!car.bounding_box) return null;
          const { ymin, xmin, ymax, xmax } = car.bounding_box;
          const isSelected = idx === activeIndex;

          return (
            <div
              key={idx}
              onClick={() => onSelectCar(idx)}
              style={{
                top: `${ymin}%`,
                left: `${xmin}%`,
                width: `${xmax - xmin}%`,
                height: `${ymax - ymin}%`,
              }}
              className={`absolute cursor-pointer transition-all duration-300 rounded-md ${
                isSelected
                  ? 'border-2 border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/50'
                  : 'border border-white/70 bg-black/20 hover:border-blue-300'
              }`}
            >
              <div
                className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide whitespace-nowrap shadow-md flex items-center gap-1 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-black/75 text-white/90'
                }`}
              >
                <span>{car.make}</span>
                <span className="opacity-80">({Math.round((car.make_confidence || 0) * 100)}%)</span>
              </div>
            </div>
          );
        })}

        {/* Audio speech toggle button */}
        <button
          onClick={handleToggleSpeak}
          title={isSpeaking ? 'Stop Audio Readout' : 'Listen to Car Details'}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
            isSpeaking
              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
              : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'
          }`}
        >
          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Multi-car hint overlay */}
        {cars.length > 1 && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] text-blue-300 font-medium">
            🎯 Tap bounding box or tab below to switch vehicle
          </div>
        )}
      </div>

      {/* Multi-car selector tabs if more than 1 car detected */}
      {cars.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 overflow-x-auto shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Cars ({cars.length}):
          </span>
          {cars.map((c, i) => (
            <button
              key={i}
              onClick={() => onSelectCar(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                i === activeIndex
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{c.make} {c.model}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results Content Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Detection Badge: Car Detected ✓ */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-base text-white">Car Detected ✓</span>
          </div>
          {currentCar.body_type && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
              {currentCar.body_type}
            </span>
          )}
        </div>

        {/* Structured Results Comparison Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-2 px-4 py-3 bg-slate-950/70 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div>Property</div>
            <div className="text-right">Result</div>
          </div>

          <div className="divide-y divide-slate-800/60 text-sm">
            {/* Make */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Make</span>
              <span className="text-right font-bold text-blue-400 text-base">{currentCar.make}</span>
            </div>

            {/* Model (With Low Confidence Guard) */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Model</span>
              <div className="text-right">
                <span
                  className={`font-semibold ${
                    isModelLowConfidence ? 'text-amber-400 text-xs italic' : 'text-white text-base'
                  }`}
                >
                  {displayModel}
                </span>
                {isModelLowConfidence && (
                  <div className="text-[10px] text-amber-400/80 flex items-center justify-end gap-1 mt-0.5">
                    <Info className="w-3 h-3" /> Low evidence in photo
                  </div>
                )}
              </div>
            </div>

            {/* Colour */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Colour</span>
              <div className="flex items-center justify-end gap-2">
                {currentCar.colour_hex && (
                  <button
                    onClick={handleCopyHex}
                    title="Click to copy hex color code"
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 hover:border-slate-500 text-[11px] font-mono text-slate-300"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/30 shadow-sm"
                      style={{ backgroundColor: currentCar.colour_hex }}
                    />
                    <span>{currentCar.colour_hex}</span>
                    {copiedHex && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                )}
                <span className="font-semibold text-white">{currentCar.colour}</span>
              </div>
            </div>

            {/* Make Confidence */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Make Confidence</span>
              <span className="text-right font-bold text-emerald-400">{makeConfPercent}%</span>
            </div>

            {/* Model Confidence */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Model Confidence</span>
              <span
                className={`text-right font-bold ${
                  isModelLowConfidence ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {modelConfPercent}%
              </span>
            </div>

            {/* Colour Confidence */}
            <div className="grid grid-cols-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-300 font-medium">Colour Confidence</span>
              <span className="text-right font-bold text-emerald-400">{colourConfPercent}%</span>
            </div>
          </div>
        </div>

        {/* Confidence Progress Bars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Confidence Visual Meter
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Brand Make: {currentCar.make}</span>
                <span className="font-bold text-emerald-400">{makeConfPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${makeConfPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Model: {displayModel}</span>
                <span
                  className={`font-bold ${isModelLowConfidence ? 'text-amber-400' : 'text-emerald-400'}`}
                >
                  {modelConfPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isModelLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${modelConfPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Colour: {currentCar.colour}</span>
                <span className="font-bold text-emerald-400">{colourConfPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${colourConfPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual cues & notes if present */}
        {currentCar.notes && (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>{currentCar.notes}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* Save to History */}
          <button
            onClick={onSaveToGarage}
            disabled={isSaved}
            className={`py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-blue-400" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleCopyReport}
            className="py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedReport ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Ask AI Assistant */}
          <button
            onClick={onOpenChat}
            className="py-3 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 active:scale-95 text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Button: Analyze Another Image */}
        <button
          onClick={onReset}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Analyze Another Image
        </button>
      </div>
    </div>
  );
};
