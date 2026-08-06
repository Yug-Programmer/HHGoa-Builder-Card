import React, { forwardRef } from 'react';
import hhgoaGraphic from '@/assets/hhgoa-graphic.png';

export interface BuilderCardProps {
  name: string;
  role?: string;
  stack?: string;
  country?: string;
  githubUsername?: string;
  instagramHandle?: string;
  linkedinHandle?: string;
  email?: string;
  builderTitle?: string;
  photoUrl?: string;
  builderId: string;
}

const GithubMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const PinMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0a5.5 5.5 0 0 0-5.5 5.5C2.5 9.9 8 16 8 16s5.5-6.1 5.5-10.5A5.5 5.5 0 0 0 8 0Zm0 7.75a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
  </svg>
);

const InstagramMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MailMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline gap-2">
    <span className="font-poppins font-medium text-[8px] tracking-[0.16em] text-white/50 uppercase w-[56px] shrink-0">
      {label}
    </span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export const BuilderCard = forwardRef<HTMLDivElement, BuilderCardProps>(
  ({ name, role, stack, country, githubUsername, instagramHandle, linkedinHandle, email, builderTitle, photoUrl, builderId }, ref) => {
    const stackItems = stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [];
    const handle = githubUsername ? githubUsername.replace(/^@/, '') : '';
    const insta = instagramHandle ? instagramHandle.replace(/^@/, '') : '';
    const linkedin = linkedinHandle ? linkedinHandle.replace(/^@/, '').replace(/^in\//, '') : '';

    return (
      <div
        ref={ref}
        className="w-[450px] h-[319px] shrink-0 relative overflow-hidden flex flex-col rounded-[12px] bg-[#074D29] shadow-2xl"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Full Unstretched Graphic Background (1748x1240 aspect ratio) */}
        <img
          src={hhgoaGraphic}
          alt="Hacker House Goa Graphic"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
          crossOrigin="anonymous"
        />

        {/* Content Layer inside graphic bounds */}
        <div className="relative z-10 flex flex-col h-full pl-[28px] pr-[28px] pt-[78px] pb-[12px]">
          {/* Identity Header */}
          <div className="flex items-center gap-3.5">
            <div className="shrink-0 w-[72px] h-[72px] rounded-full bg-[#064C29] border-2 border-[#FEE101] overflow-hidden shadow-lg">
              {photoUrl ? (
                <img src={photoUrl} alt="Builder" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-poppins text-white/35 text-[8px] tracking-widest">PHOTO</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-poppins font-medium text-[9px] tracking-[0.2em] text-white/55 uppercase">
                  BUILDER
                </span>
                {builderTitle && (
                  <span className="bg-[#FEE101] text-[#0B6839] font-bold text-[9px] tracking-wider uppercase px-2 py-[1px] rounded shadow-xs">
                    {builderTitle}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-white uppercase leading-[1.05] text-[28px] mt-[2px] truncate drop-shadow">
                {name || 'YOUR NAME'}
              </h3>
            </div>
          </div>

          {/* Details list in 2 columns */}
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-[5px]">
            {role && (
              <Field label="Role">
                <span className="font-poppins font-medium text-white text-[10px] block truncate">{role}</span>
              </Field>
            )}

            {country && (
              <Field label="Location">
                <span className="flex items-center gap-[4px] min-w-0">
                  <PinMark className="w-[10px] h-[10px] text-[#FEE101] shrink-0" />
                  <span className="font-poppins font-medium text-white text-[10px] truncate">{country}</span>
                </span>
              </Field>
            )}

            {stackItems.length > 0 && (
              <Field label="Stack">
                <span className="font-poppins font-medium text-white text-[10px] block truncate">
                  {stackItems.slice(0, 3).join(' · ')}
                </span>
              </Field>
            )}

            {handle && (
              <Field label="GitHub">
                <span className="flex items-center gap-[4px] min-w-0">
                  <GithubMark className="w-[11px] h-[11px] text-[#FEE101] shrink-0" />
                  <span className="font-poppins font-medium text-white text-[10px] truncate">@{handle}</span>
                </span>
              </Field>
            )}

            {insta && (
              <Field label="Insta">
                <span className="flex items-center gap-[4px] min-w-0">
                  <InstagramMark className="w-[10px] h-[10px] text-[#FEE101] shrink-0" />
                  <span className="font-poppins font-medium text-white text-[10px] truncate">@{insta}</span>
                </span>
              </Field>
            )}

            {linkedin && (
              <Field label="LinkedIn">
                <span className="flex items-center gap-[4px] min-w-0">
                  <LinkedinMark className="w-[10px] h-[10px] text-[#FEE101] shrink-0" />
                  <span className="font-poppins font-medium text-white text-[10px] truncate">{linkedin}</span>
                </span>
              </Field>
            )}

            {email && (
              <div className="col-span-2">
                <Field label="Email">
                  <span className="flex items-center gap-[4px] min-w-0">
                    <MailMark className="w-[10px] h-[10px] text-[#FEE101] shrink-0" />
                    <span className="font-poppins font-medium text-white text-[10px] block truncate max-w-[310px]">
                      {email}
                    </span>
                  </span>
                </Field>
              </div>
            )}
          </div>

          {/* Footer ID Badge */}
          <div className="mt-auto flex justify-center">
            <div className="bg-[#053d20]/85 backdrop-blur-xs px-3 py-[2px] rounded border border-[#FEE101]/40 shadow-sm flex items-center gap-2">
              <span className="font-mono text-[#FEE101] text-[9px] tracking-[0.1em]">ID: {builderId}</span>
              <span className="font-poppins font-bold text-white text-[8px] tracking-wider">#FrameInGoa</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BuilderCard.displayName = 'BuilderCard';
