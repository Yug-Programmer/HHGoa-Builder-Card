import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BuilderCardProps {
  name: string;
  role?: string;
  stack?: string;
  country?: string;
  githubUsername?: string;
  builderTitle?: string;
  photoUrl?: string;
  builderId: string;
}

export const BuilderCard = forwardRef<HTMLDivElement, BuilderCardProps>(
  ({ name, role, stack, country, githubUsername, builderTitle, photoUrl, builderId }, ref) => {
    
    // Parse stack comma separated
    const stackItems = stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [];

    return (
      <div 
        ref={ref}
        className="w-[360px] h-[450px] shrink-0 bg-[#0B6839] relative overflow-hidden flex flex-col items-center shadow-2xl rounded-2xl border-[3px] border-[#FEE101]/20"
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-[#FF0080] rounded-full blur-[60px]" />
          <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-[#FEE101] rounded-full blur-[60px]" />
          
          {/* Noise overlay */}
          <div className="absolute inset-0 mix-blend-overlay opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Top Header */}
        <div className="w-full text-center mt-6 z-10">
          <h2 className="font-mono text-[#FEE101] text-xs tracking-widest uppercase font-bold">Hacker House Goa</h2>
          <h1 className="font-serif text-[#FFFFFF] text-5xl leading-none mt-1 uppercase tracking-wider">2026</h1>
          <p className="font-mono text-[#FFFFFF]/70 text-[10px] tracking-[0.2em] mt-1">Goa, India</p>
        </div>

        {/* Decorative divider */}
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#FF0080] to-transparent my-4 z-10" />

        {/* Profile Photo */}
        <div className="relative z-10 mt-1">
          <div className="w-[120px] h-[120px] rounded-full p-1 bg-gradient-to-tr from-[#FEE101] to-[#FF0080]">
            <div className="w-full h-full rounded-full bg-[#0B6839] overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Builder" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-[#0B6839] flex items-center justify-center border-2 border-dashed border-[#FFFFFF]/20 rounded-full">
                  <span className="font-mono text-[#FFFFFF]/30 text-xs">NO PHOTO</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Builder ID overlay */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#000000] border border-[#FEE101]/30 px-3 py-1 rounded-sm shadow-md">
            <span className="font-mono text-[#FEE101] text-[10px] tracking-wider whitespace-nowrap">{builderId}</span>
          </div>
        </div>

        {/* Details area */}
        <div className="w-full flex-1 flex flex-col items-center justify-center px-6 mt-4 z-10 space-y-3">
          
          <div className="text-center w-full">
            <h3 className="font-serif text-[32px] text-white leading-tight truncate uppercase w-full">
              {name || "YOUR NAME"}
            </h3>
            
            {builderTitle && (
              <div className="inline-flex mt-1 bg-[#FEE101] px-2 py-[2px] rounded uppercase">
                <span className="font-mono text-[#0B6839] font-bold text-[10px] tracking-wider">{builderTitle}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2 w-full">
            {role && (
              <span className="font-mono text-[#FFFFFF]/90 text-[11px] uppercase tracking-wide px-2 py-1 border border-[#FFFFFF]/20 rounded-md bg-black/20">
                {role}
              </span>
            )}

            {stackItems.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 w-full">
                {stackItems.slice(0, 3).map((s, i) => (
                  <span key={i} className="font-mono text-[#FF0080] text-[9px] uppercase px-1.5 py-0.5 border border-[#FF0080]/30 bg-[#FF0080]/10 rounded">
                    {s}
                  </span>
                ))}
                {stackItems.length > 3 && (
                  <span className="font-mono text-[#FF0080] text-[9px] uppercase px-1.5 py-0.5 border border-[#FF0080]/30 bg-[#FF0080]/10 rounded">
                    +{stackItems.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats/info */}
        <div className="w-full px-6 flex justify-between items-center mb-4 z-10">
          {country ? (
            <div className="flex items-center space-x-1">
              <span className="font-mono text-[#FFFFFF]/50 text-[10px]">LOC:</span>
              <span className="font-mono text-[#FEE101] text-[10px] uppercase truncate max-w-[80px]">{country}</span>
            </div>
          ) : <div/>}

          {githubUsername ? (
            <div className="flex items-center space-x-1">
              <span className="font-mono text-[#FFFFFF]/50 text-[10px]">GIT:</span>
              <span className="font-mono text-[#FF0080] text-[10px] uppercase truncate max-w-[80px]">@{githubUsername.replace('@', '')}</span>
            </div>
          ) : <div/>}
        </div>

        {/* Footer */}
        <div className="w-full bg-[#000000]/40 py-2 flex justify-between items-center px-4 z-10 border-t border-[#FFFFFF]/10">
          <span className="font-mono text-[#FFFFFF]/40 text-[8px] tracking-widest">ACCESS GRANTED</span>
          <span className="font-mono text-[#FEE101] text-[10px] font-bold tracking-wider">#FrameInGoa</span>
        </div>
      </div>
    );
  }
);

BuilderCard.displayName = 'BuilderCard';
