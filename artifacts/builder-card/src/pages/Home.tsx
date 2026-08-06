import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { useLocation } from 'wouter';
import { Download, RefreshCw, Loader2 } from 'lucide-react';

import { useSaveCard } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoCropper } from '@/components/PhotoCropper';
import { BuilderCard } from '@/components/BuilderCard';
import hackerHouseLogo from '@/assets/hacker-house-logo.png';
import goaHindiBadge from '@/assets/goa-hindi.svg';

const BUILDER_TITLES = [
  "Code Wizard", "Frontend Ninja", "Cloud Architect",
  "Bug Hunter", "Deploy Master", "AI Builder",
  "Startup Founder", "Prompt Engineer", "Zero to One", "Ship It"
];

const SHARE_CAPTION = `One team. One mission. Endless ideas. 🚀
See you at HH Goa 2026.

#FrameInGoa #HHGoa2026 #Team #Hackathon #Innovation`;

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HHG26-${id}`;
}

export default function Home() {
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawImage, setRawImage] = useState<string | null>(null);

  // Card fields (shown on PNG)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [builderId, setBuilderId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [stack, setStack] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [linkedinHandle, setLinkedinHandle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [builderTitle, setBuilderTitle] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const saveCardMutation = useSaveCard();

  useEffect(() => {
    setBuilderId(generateId());
    setBuilderTitle(BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)]);
  }, []);

  const handleImageUploaded = (url: string) => {
    setRawImage(url);
    setStep(2);
  };

  const handleCropComplete = (croppedUrl: string) => {
    setPhotoUrl(croppedUrl);
    setStep(3);
  };

  const reRollTitle = () => {
    setBuilderTitle(BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)]);
  };

  const handleDownload = async () => {
    if (!cardRef.current || !name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });

      setGeneratedImage(dataUrl);

      const link = document.createElement('a');
      link.download = 'hh-goa-builder-card.png';
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FEE101', '#FF0080', '#0B6839']
      });

      toast({
        title: "Your card is ready!",
        description: "Successfully downloaded to your device.",
      });

    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert a base64 data URL to a Blob
  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  const handleShare = async () => {
    if (!generatedImage || !name) return;

    setIsSharing(true);
    try {
      // Try saving to backend for a share URL (optional — works without it)
      let shareUrl = '';
      try {
        const result = await saveCardMutation.mutateAsync({
          data: {
            imageBase64: generatedImage,
            name,
            role: role || null,
            stack: stack || null,
            country: country || null,
            githubUsername: githubUsername || null,
            instagramHandle: instagramHandle || null,
            linkedinHandle: linkedinHandle || null,
            email: email || null,
            builderTitle: builderTitle || null,
          }
        });
        shareUrl = result.shareUrl;
        setLocation(`/cards/${result.id}`);
      } catch {
        console.warn('Backend unavailable, sharing without share URL');
      }

      const fullCaption = shareUrl
        ? `${SHARE_CAPTION}\n${shareUrl}`
        : SHARE_CAPTION;

      // Detect mobile for Web Share API
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // On mobile: try native share sheet so user can pick X with image attached
        const imageFile = new File(
          [dataUrlToBlob(generatedImage)],
          'hh-goa-builder-card.png',
          { type: 'image/png' }
        );

        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          await navigator.share({
            title: 'HH Goa 2026 Builder Card',
            text: fullCaption,
            files: [imageFile],
          });
          toast({
            title: "Card shared! 🚀",
            description: "Pick X (Twitter) to post with image.",
          });
          return;
        }
      }

      // Desktop (or mobile fallback): download image + open X compose directly
      // Step 1: Auto-download the card image
      const link = document.createElement('a');
      link.download = 'hh-goa-builder-card.png';
      link.href = generatedImage;
      link.click();

      // Step 2: Open X compose with caption pre-filled
      // Opens x.com/intent/post — if logged in, compose window appears immediately
      const tweetText = encodeURIComponent(fullCaption);
      window.open(
        `https://x.com/intent/post?text=${tweetText}`,
        '_blank'
      );

      toast({
        title: "X is open! 📸",
        description: "Your card image has been downloaded — attach it in X's composer and hit Post!",
        duration: 8000,
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      toast({ title: "Failed to share card", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center pt-8 pb-16 px-4 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <header className="mt-6 md:mt-10 mb-8 text-center relative z-10 flex flex-col items-center">
        <div className="relative inline-block w-[92vw] max-w-3xl">
          <img
            src={hackerHouseLogo}
            alt="Hacker House Goa"
            className="w-full h-auto"
          />
          <motion.img
            src={goaHindiBadge}
            alt="Goa"
            className="absolute w-[13%] left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2 -rotate-6"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="mt-6 max-w-2xl">
          <p className="font-serif text-lg md:text-xl text-foreground/90 leading-relaxed">
            Create your unique Builder ID Card for Hacker House Goa. Upload a photo, customize your details, and generate a shareable card to post on X with #FrameInGoa.
          </p>
        </div>
      </header>

      <div className="w-full max-w-5xl relative z-10">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <PhotoUploader onImageUploaded={handleImageUploaded} />
            </motion.div>
          )}

          {step === 2 && rawImage && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <PhotoCropper
                imageSrc={rawImage}
                onCropComplete={handleCropComplete}
                onCancel={() => setStep(1)}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >

              {/* Form Section */}
              <div className="space-y-6 order-2 lg:order-1">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-serif text-white">Your Details</h2>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground hover:text-white font-mono text-xs">
                      Change Photo
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-mono text-xs text-muted-foreground uppercase">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Satoshi Nakamoto"
                        className="font-sans text-lg h-12 bg-black/20 border-border focus-visible:ring-primary"
                        maxLength={30}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role" className="font-mono text-xs text-muted-foreground uppercase">Role</Label>
                        <Input
                          id="role"
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          placeholder="e.g. Developer"
                          className="bg-black/20 border-border focus-visible:ring-primary"
                          maxLength={20}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="font-mono text-xs text-muted-foreground uppercase">Location</Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          placeholder="e.g. India"
                          className="bg-black/20 border-border focus-visible:ring-primary"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stack" className="font-mono text-xs text-muted-foreground uppercase">Tech Stack (comma separated)</Label>
                      <Input
                        id="stack"
                        value={stack}
                        onChange={e => setStack(e.target.value)}
                        placeholder="React, Node.js, AI, Next.js"
                        className="bg-black/20 border-border focus-visible:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="github" className="font-mono text-xs text-muted-foreground uppercase">GitHub Handle</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
                          <Input
                            id="github"
                            value={githubUsername}
                            onChange={e => setGithubUsername(e.target.value.replace('@', ''))}
                            placeholder="username"
                            className="pl-8 bg-black/20 border-border focus-visible:ring-primary font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="font-mono text-xs text-muted-foreground uppercase">Instagram Handle</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
                          <Input
                            id="instagram"
                            value={instagramHandle}
                            onChange={e => setInstagramHandle(e.target.value.replace('@', ''))}
                            placeholder="username"
                            className="pl-8 bg-black/20 border-border focus-visible:ring-primary font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="font-mono text-xs text-muted-foreground uppercase">LinkedIn Handle</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">in/</span>
                          <Input
                            id="linkedin"
                            value={linkedinHandle}
                            onChange={e => setLinkedinHandle(e.target.value.replace(/^@/, '').replace(/^in\//, ''))}
                            placeholder="username"
                            className="pl-9 bg-black/20 border-border focus-visible:ring-primary font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-mono text-xs text-muted-foreground uppercase">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="bg-black/20 border-border focus-visible:ring-primary font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Builder Title</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/20 border border-border rounded-md px-3 py-2 font-mono text-sm text-primary uppercase">
                          {builderTitle}
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={reRollTitle} title="Reroll Title">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-4">
                  {!generatedImage ? (
                    <Button
                      className="w-full h-14 text-lg font-bold font-mono bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleDownload}
                      disabled={!name || isGenerating}
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> GENERATING...</>
                      ) : (
                        <><Download className="w-5 h-5 mr-2" /> GENERATE & DOWNLOAD</>
                      )}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-14 font-bold font-mono border-border hover:bg-white/5"
                        onClick={handleDownload}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        SAVE AGAIN
                      </Button>
                      <Button
                        className="h-14 font-bold font-mono bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        onClick={handleShare}
                        disabled={isSharing}
                      >
                        {isSharing ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> SHARING...</>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            POST ON X
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Section */}
              <div className="order-1 lg:order-2 flex flex-col items-center sticky top-8">
                <div className="mb-4 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">Live Preview</span>
                </div>

                <div className="scale-[0.85] sm:scale-100 origin-top">
                  <BuilderCard
                    ref={cardRef}
                    name={name}
                    role={role}
                    stack={stack}
                    country={country}
                    githubUsername={githubUsername}
                    instagramHandle={instagramHandle}
                    linkedinHandle={linkedinHandle}
                    email={email}
                    builderTitle={builderTitle}
                    photoUrl={photoUrl || undefined}
                    builderId={builderId}
                  />
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
