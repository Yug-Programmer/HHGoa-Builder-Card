import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import heic2any from 'heic2any';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploaderProps {
  onImageUploaded: (url: string) => void;
}

export function PhotoUploader({ onImageUploaded }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      let processedFile = file;

      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        processedFile = new File(
          [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
          file.name.replace(/\.heic$/i, '.jpg'),
          { type: 'image/jpeg' }
        );
      }

      const compressedFile = await imageCompression(processedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUploaded(reader.result as string);
        setIsProcessing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error processing image",
        description: "Something went wrong. Please try a different image.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setCameraError(null);
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraOpen(true);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? "Camera permission denied. Please allow camera access and try again."
          : err instanceof Error && err.name === 'NotFoundError'
          ? "No camera found on this device."
          : "Could not access camera. Please try uploading a file instead.";
      setCameraError(message);
    }
  }, []);

  const handleVideoReady = () => {
    setCameraReady(true);
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the capture to match the mirrored preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false);
        return;
      }
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      stopCamera();
      await processFile(file);
      setIsCapturing(false);
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      <div className="w-full max-w-md mx-auto flex flex-col space-y-6">
        <div className="text-center mb-1">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 tracking-tight">Upload Your Photo</h2>
          <p className="text-sm text-white/70 font-light tracking-widest uppercase">JPG • PNG • WEBP • HEIC</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragging ? 'border-[#FEE101] bg-[#FEE101]/5 scale-102' : 'border-white/20 bg-white/5 hover:bg-white/[0.08]'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/heic,.heic"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-5 pointer-events-none">
            {isProcessing ? (
              <Loader2 className="w-14 h-14 text-[#FEE101] animate-spin" />
            ) : (
              <UploadCloud className="w-14 h-14 text-white/60" />
            )}
            <div className="space-y-2">
              <p className="text-base font-medium text-white">
                {isProcessing ? "Processing..." : "Click to upload or drag and drop"}
              </p>
              {!isProcessing && <p className="text-sm text-white/50 font-light">Max 10 MB</p>}
            </div>
          </div>
        </div>

        {!isProcessing && (
          <button
            type="button"
            onClick={startCamera}
            className="w-full active:scale-[0.98] transition-transform duration-150 shadow-lg rounded-full overflow-hidden"
          >
            <div className="bg-[#FEE101] rounded-full py-3.5 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-[#0B6839]" strokeWidth={2.5} />
              <span className="font-serif font-black text-xl text-[#0B6839] tracking-wide">
                TAKE PHOTO
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Modal — iOS-style full-bleed camera UI */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 1.02, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.02, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative w-full h-full sm:max-w-md sm:h-[90vh] sm:my-auto sm:rounded-[2.5rem] overflow-hidden bg-black shadow-2xl sm:border sm:border-white/10"
            >
              {/* Video / Error area — fills the whole frame */}
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                {!cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={handleVideoReady}
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                        <Loader2 className="w-7 h-7 text-white/70 animate-spin" />
                        <p className="text-xs text-white/40 tracking-wide">Starting camera…</p>
                      </div>
                    )}
                    {/* Face guide — thin, minimal, iOS-like */}
                    {cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="w-52 h-52 rounded-full border border-white/50"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <Camera className="w-10 h-10 text-white/30" />
                    <p className="text-sm text-white/60 font-light">{cameraError}</p>
                  </div>
                )}
              </div>

              {/* Capture flash */}
              <AnimatePresence>
                {flash && (
                  <motion.div
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 bg-white pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Top gradient + close button */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
              <button
                onClick={stopCamera}
                aria-label="Close camera"
                className="absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/60 active:scale-90 transition-all"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>

              {/* Bottom gradient + controls */}
              <div className="absolute bottom-0 inset-x-0 pt-16 pb-[calc(env(safe-area-inset-bottom)+28px)] bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center gap-3">
                {cameraReady && !cameraError && (
                  <p className="text-[11px] text-white/50 font-light tracking-wide mb-1">
                    Position your face in the circle
                  </p>
                )}

                {!cameraError ? (
                  <button
                    disabled={!cameraReady || isCapturing}
                    onClick={capturePhoto}
                    aria-label="Capture photo"
                    className="relative w-[72px] h-[72px] rounded-full disabled:opacity-40 transition-transform duration-150 active:scale-90 flex items-center justify-center focus:outline-none"
                  >
                    <span className="absolute inset-0 rounded-full border-[3.5px] border-white" />
                    <span className="absolute inset-[5px] rounded-full bg-white transition-transform duration-150 group-active:scale-90" />
                    {isCapturing && (
                      <Loader2 className="relative w-6 h-6 text-black/70 animate-spin" />
                    )}
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    className="font-medium border-white/30 text-white hover:bg-white/10"
                    onClick={stopCamera}
                  >
                    Close
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
