import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Zap,
  ZapOff,
  Sparkles,
  UploadCloud,
  AlertCircle,
  Car,
  CheckCircle2,
  X,
  FlipHorizontal
} from 'lucide-react';
import { SAMPLE_CARS } from '../utils/sampleCars';
import { SampleCar } from '../types/vehicle';
import { fileToBase64, urlToBase64 } from '../utils/imageUtils';
import { playShutterSound } from '../utils/audio';

interface CameraScannerProps {
  onAnalyze: (imageDataUrl: string, carHint?: string) => void;
  isAnalyzing: boolean;
  isSoundEnabled: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onAnalyze,
  isAnalyzing,
  isSoundEnabled,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live camera
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access device camera. Please check camera permissions.');
      setCameraActive(false);
    }
  }, [stopCamera]);

  // Flip camera
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track.getCapabilities && (track.getCapabilities() as any)) || {};
        if (capabilities.torch) {
          const next = !torchOn;
          await (track as any).applyConstraints({ advanced: [{ torch: next }] });
          setTorchOn(next);
        } else {
          setTorchOn(!torchOn);
        }
      } catch {
        setTorchOn(!torchOn);
      }
    }
  };

  // Snap photo from live camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (isSoundEnabled) {
      playShutterSound();
    }
    setPreviewImage(dataUrl);
    setSelectedSampleId(null);
    stopCamera();
  };

  // Gallery File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPreviewImage(base64);
      setSelectedSampleId(null);
      stopCamera();
    } catch (err) {
      console.error('Failed reading file:', err);
    }
  };

  // Drag and Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      setPreviewImage(base64);
      setSelectedSampleId(null);
      stopCamera();
    }
  };

  // Select Sample Car
  const handleSelectSample = async (sample: SampleCar) => {
    setSelectedSampleId(sample.id);
    stopCamera();
    try {
      const base64 = await urlToBase64(sample.imageUrl);
      setPreviewImage(base64);
    } catch {
      setPreviewImage(sample.imageUrl);
    }
  };

  // Retake photo / Clear preview
  const handleRetake = () => {
    setPreviewImage(null);
    setSelectedSampleId(null);
  };

  // Analyze Car Trigger
  const handleAnalyzeClick = () => {
    if (!previewImage) return;
    onAnalyze(previewImage);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* App Header (As required by Prompt) */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Vision Engine Active</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">CarVision AI</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Detect car make, model &amp; colour using AI
        </p>
      </div>

      {/* Large Image Preview Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center bg-slate-900/80 shadow-2xl ${
          dragOver
            ? 'border-blue-500 bg-blue-950/30'
            : previewImage
            ? 'border-slate-700/80'
            : cameraActive
            ? 'border-emerald-500'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* State A: Live Camera Active */}
        {cameraActive ? (
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Viewfinder Target Guide */}
            <div className="absolute inset-8 border border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-5 h-5 border-t-2 border-l-2 border-blue-400" />
                <div className="w-5 h-5 border-t-2 border-r-2 border-blue-400" />
              </div>
              <div className="flex justify-between">
                <div className="w-5 h-5 border-b-2 border-l-2 border-blue-400" />
                <div className="w-5 h-5 border-b-2 border-r-2 border-blue-400" />
              </div>
            </div>

            {/* Top Camera Controls */}
            <div className="absolute top-3 inset-x-3 flex justify-between items-center pointer-events-auto">
              <button
                onClick={stopCamera}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                    torchOn ? 'bg-amber-500 text-black' : 'bg-black/60 text-white'
                  }`}
                >
                  {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleFacing}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Shutter Capture Trigger */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center">
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white/90 bg-blue-600 hover:bg-blue-500 active:scale-90 transition-all flex items-center justify-center shadow-xl shadow-blue-600/40"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
              </button>
            </div>
          </div>
        ) : previewImage ? (
          /* State B: Photo Captured or Chosen from Gallery */
          <div className="relative w-full h-full bg-black">
            <img
              src={previewImage}
              alt="Car Preview"
              className="w-full h-full object-cover"
            />
            {/* Retake Button */}
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs text-white font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake
            </button>

            {/* Ready Tag */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Image Ready for Analysis
            </div>
          </div>
        ) : (
          /* State C: Empty Placeholder */
          <div className="p-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No Car Image Selected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              Tap <span className="text-blue-400 font-medium">Take Photo</span> or{' '}
              <span className="text-blue-400 font-medium">Choose from Gallery</span> below.
            </p>
          </div>
        )}

        {/* Loading Indicator while AI analysis is running */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <h4 className="text-base font-bold text-white">Analyzing Car Image...</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Detecting car presence, identifying brand make, model name, and exterior paint colour...
            </p>
          </div>
        )}
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Buttons (As explicitly named in prompt) */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Button: 📷 Take Photo */}
        <button
          onClick={() => startCamera(facingMode)}
          disabled={isAnalyzing}
          className="py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>📷 Take Photo</span>
        </button>

        {/* Button: 🖼️ Choose from Gallery */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span>🖼️ Choose from Gallery</span>
        </button>
      </div>

      {/* Primary Action Button: 🔍 Analyze Car */}
      <button
        onClick={handleAnalyzeClick}
        disabled={!previewImage || isAnalyzing}
        className={`w-full mt-3 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
          previewImage && !isAnalyzing
            ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-600/30'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>🔍 Analyze Car</span>
      </button>

      {/* Quick Test Vehicle Presets */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Test Vehicles (From Prompt)
          </span>
          <span className="text-[10px] text-blue-400">1-Tap Load</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_CARS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2.5 ${
                selectedSampleId === sample.id
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <img
                src={sample.imageUrl}
                alt={sample.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700"
              />
              <div className="truncate min-w-0">
                <div className="text-xs font-semibold text-white truncate">{sample.title}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: sample.colorHex }}
                  />
                  <span>{sample.colour}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
