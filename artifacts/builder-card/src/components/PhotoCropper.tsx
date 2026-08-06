import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Check, RotateCcw } from 'lucide-react';

interface PhotoCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function PhotoCropper({ imageSrc, onCropComplete, onCancel }: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number, y: number }) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);
  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Desired output size
      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - croppedAreaPixels.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - croppedAreaPixels.y)
      );

      // Make circular
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = croppedAreaPixels.width;
      finalCanvas.height = croppedAreaPixels.height;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      finalCtx.beginPath();
      finalCtx.arc(
        croppedAreaPixels.width / 2,
        croppedAreaPixels.height / 2,
        croppedAreaPixels.width / 2,
        0,
        Math.PI * 2
      );
      finalCtx.closePath();
      finalCtx.clip();
      finalCtx.drawImage(canvas, 0, 0);

      const base64Image = finalCanvas.toDataURL('image/png');
      onCropComplete(base64Image);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-serif text-white">Adjust Photo</h2>
        <p className="text-muted-foreground font-mono text-sm mt-1">Make sure your face is visible</p>
      </div>

      <div className="relative w-full h-[300px] bg-black/50 rounded-2xl overflow-hidden border border-border">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
          onRotationChange={setRotation}
        />
      </div>

      <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>ZOOM</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(vals) => setZoom(vals[0])}
            className="my-4"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button onClick={createCroppedImage} className="bg-primary text-primary-foreground font-bold font-mono">
              <Check className="w-4 h-4 mr-2" />
              LOOKS GOOD
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
