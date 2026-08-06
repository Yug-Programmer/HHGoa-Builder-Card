import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Camera, X, Circle } from 'lucide-react';
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
      <div className="w-full max-w-md mx-auto flex flex-col space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-serif text-white">Upload Your Photo</h2>
          <p className="text-muted-foreground font-mono text-sm mt-1">Accepts JPG, PNG, WEBP, HEIC</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}`}
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

          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isProcessing ? "Processing..." : "Click to upload or drag and drop"}
              </p>
              {!isProcessing && <p className="text-xs text-muted-foreground font-mono">Max 10MB</p>}
            </div>
          </div>
        </div>

        {!isProcessing && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 font-mono font-bold"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              BROWSE FILES
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-mono font-bold border-[#FEE101] text-[#FEE101] hover:bg-[#FEE101]/10"
              onClick={startCamera}
            >
              <Camera className="w-4 h-4 mr-2" />
              TAKE PHOTO
            </Button>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Modal */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) stopCamera(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-[#0B6839] border border-[#FEE101]/30 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#FEE101]" />
                  <span className="font-mono font-bold text-white text-sm tracking-wider">CAMERA</span>
                </div>
                <button
                  onClick={stopCamera}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video / Error area */}
              <div className="relative bg-black aspect-video flex items-center justify-center">
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
                        <Loader2 className="w-8 h-8 text-[#FEE101] animate-spin" />
                        <p className="font-mono text-xs text-white/60">Starting camera...</p>
                      </div>
                    )}
                    {/* Circular guide overlay */}
                    {cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 rounded-full border-2 border-[#FEE101]/60 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <Camera className="w-10 h-10 text-white/30" />
                    <p className="font-mono text-sm text-white/70">{cameraError}</p>
                  </div>
                )}
              </div>

              {/* Footer controls */}
              <div className="px-5 py-5 flex items-center justify-center gap-4">
                {!cameraError ? (
                  <button
                    disabled={!cameraReady || isCapturing}
                    onClick={capturePhoto}
                    aria-label="Capture photo"
                    className="relative w-16 h-16 rounded-full bg-[#FEE101] hover:bg-[#FEE101]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 flex items-center justify-center shadow-[0_0_24px_rgba(254,225,1,0.4)] focus:outline-none focus:ring-2 focus:ring-[#FEE101] focus:ring-offset-2 focus:ring-offset-[#0B6839]"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-7 h-7 text-[#0B6839] animate-spin" />
                    ) : (
                      <Circle className="w-7 h-7 text-[#0B6839] fill-[#0B6839]" />
                    )}
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    className="font-mono font-bold border-[#FEE101] text-[#FEE101] hover:bg-[#FEE101]/10"
                    onClick={stopCamera}
                  >
                    Close
                  </Button>
                )}
              </div>

              {cameraReady && !cameraError && (
                <p className="text-center font-mono text-xs text-white/40 pb-3 -mt-1">
                  Position your face in the circle, then tap the button
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
