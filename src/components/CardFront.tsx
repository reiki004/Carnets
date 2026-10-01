import React, { forwardRef } from 'react';
import { CardData } from '../types/card';
import { HeaderEmblem } from './HeaderEmblem';
import { CLUB_PRESETS } from './ClubLogoPresets';
import { CardFooterDesign } from './CardFooterDesign';

interface CardFrontProps {
  data: CardData;
  scale?: number; // scale multiplier for preview vs print
  isPrint?: boolean;
}

export const CardFront = forwardRef<HTMLDivElement, CardFrontProps>(
  ({ data, scale = 1, isPrint = false }, ref) => {
    // Standard CR-80 portrait dimensions: 54mm x 85.6mm (approx 204pt x 324pt or 320px x 507px at ~96 DPI display)
    // In CSS mm units:
    const cardWidthMm = 53.98;
    const cardHeightMm = 85.6;

    // Find selected club preset
    const selectedClub = CLUB_PRESETS.find((c) => c.id === data.selectedClubId);

    return (
      <div
        ref={ref}
        className={`relative bg-white text-black flex flex-col justify-between select-none overflow-hidden ${
          isPrint
            ? 'print-page'
            : 'shadow-2xl transition-all duration-200 border border-slate-200/80'
        }`}
        style={{
          width: isPrint ? `${cardWidthMm}mm` : `${cardWidthMm * 6.2 * scale}px`,
          height: isPrint ? `${cardHeightMm}mm` : `${cardHeightMm * 6.2 * scale}px`,
          borderRadius: isPrint ? '0px' : `${data.cardCornerRadius * 2.8 * scale}px`,
          filter: `brightness(${data.cardBrightness}%) contrast(${data.cardContrast}%)`,
          boxSizing: 'border-box',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* 1. TOP HEADER (Inter Clubes banner matching Image 1) */}
        <div className="w-full flex-shrink-0">
          <HeaderEmblem
            redText={data.headerTitleRed}
            whiteText={data.headerTitleWhite}
            customLogoUrl={data.customHeaderLogoUrl}
          />
        </div>

        {/* 2. BODY CONTENT (Photo, Names, Club Logo) */}
        <div className="flex-1 flex flex-col items-center justify-between px-3 pt-2.5 pb-1 z-10">
          {/* Person's Photo (matching proportions in Image 1) */}
          <div
            className="relative flex-shrink-0 overflow-hidden bg-slate-100 rounded-sm shadow-sm border border-slate-300/60"
            style={{
              width: `${29 * 6.2 * (scale * 0.16)}rem`,
              height: `${37 * 6.2 * (scale * 0.16)}rem`,
              maxWidth: '128px',
              maxHeight: '162px',
              minWidth: '95px',
              minHeight: '122px',
            }}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Cardholder Photo"
                className="w-full h-full object-cover transition-transform"
                style={{
                  transform: `scale(${data.photoScale / 100}) translate(${data.photoOffsetX}px, ${data.photoOffsetY}px)`,
                }}
              />
            ) : (
              /* Default sample photo matching the gentleman in image 1 */
              <div className="w-full h-full relative bg-gradient-to-b from-[#e5eaef] to-[#c8d4df] flex flex-col items-center justify-end">
                {/* Simulated portrait avatar matching image 1 */}
                <svg
                  viewBox="0 0 100 125"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background backdrop */}
                  <rect width="100" height="125" fill="#f0f2f5" />
                  
                  {/* Suit and Tie */}
                  {/* Dark suit jacket */}
                  <path d="M5 125 L28 85 L72 85 L95 125 Z" fill="#1e2229" />
                  {/* White collared shirt */}
                  <polygon points="38,85 50,110 62,85 50,92" fill="#ffffff" />
                  <polygon points="44,85 50,94 56,85" fill="#ffffff" />
                  {/* Black Necktie */}
                  <polygon points="48,93 52,93 54,125 46,125" fill="#111317" />
                  {/* Neck */}
                  <rect x="42" y="70" width="16" height="18" fill="#d8a88c" rx="3" />
                  
                  {/* Head / Face */}
                  <ellipse cx="50" cy="54" rx="22" ry="26" fill="#e8b99d" />
                  
                  {/* Hair */}
                  <path
                    d="M27 46 C27 26, 40 22, 50 22 C60 22, 73 26, 73 46 C73 40, 68 30, 50 30 C32 30, 27 40, 27 46 Z"
                    fill="#3b2b25"
                  />
                  {/* Hair sideburns */}
                  <path d="M28 42 L28 58 L32 54 L32 42 Z" fill="#3b2b25" />
                  <path d="M72 42 L72 58 L68 54 L68 42 Z" fill="#3b2b25" />

                  {/* Ears */}
                  <circle cx="28" cy="55" r="5" fill="#dfad91" />
                  <circle cx="72" cy="55" r="5" fill="#dfad91" />

                  {/* Eyebrows */}
                  <path d="M36 45 Q42 42 46 45" stroke="#31221b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M54 45 Q58 42 64 45" stroke="#31221b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                  {/* Eyes */}
                  <ellipse cx="41" cy="49" rx="3.5" ry="2.2" fill="#ffffff" />
                  <circle cx="41" cy="49" r="1.8" fill="#2d221e" />
                  <ellipse cx="59" cy="49" rx="3.5" ry="2.2" fill="#ffffff" />
                  <circle cx="59" cy="49" r="1.8" fill="#2d221e" />

                  {/* Nose */}
                  <path d="M50 48 L48 60 L53 60" stroke="#c08d71" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Light mustache & mouth */}
                  <path d="M44 65 Q50 63 56 65" stroke="#5c443b" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M45 68 Q50 71 55 68" stroke="#a66e57" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Surnames & First Names (exact Monospace uppercase matching Image 1) */}
          <div className="w-full flex flex-col items-center justify-center text-center mt-2 px-1">
            {/* Surnames (Top) */}
            <h1
              className="text-black font-bold uppercase tracking-wider leading-tight text-center"
              style={{
                fontFamily: "'Roboto Mono', Consolas, 'Courier Prime', monospace",
                fontSize: '14.5px',
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                fontWeight: 700,
              }}
            >
              {data.surnames || 'APELLIDOS'}
            </h1>

            {/* First Names (Below) */}
            <h2
              className="text-black font-bold uppercase tracking-wider leading-tight text-center mt-1"
              style={{
                fontFamily: "'Roboto Mono', Consolas, 'Courier Prime', monospace",
                fontSize: '14.5px',
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                fontWeight: 700,
              }}
            >
              {data.firstNames || 'NOMBRES'}
            </h2>
          </div>

          {/* Club Logo (Country Club El Bosque or custom / selected) */}
          <div className="flex flex-col items-center justify-center my-1 select-none">
            {data.customLogoUrl ? (
              <img
                src={data.customLogoUrl}
                alt="Selected Club Logo"
                className="object-contain"
                style={{
                  width: `${60 * (data.logoScale / 100)}px`,
                  maxHeight: `${64 * (data.logoScale / 100)}px`,
                }}
              />
            ) : selectedClub ? (
              selectedClub.renderLogo(data.logoScale / 100)
            ) : (
              <div className="text-xs text-slate-400 font-mono">Sin Logo</div>
            )}

            {/* Club Name Label e.g. "CC. EL BOSQUE" */}
            {data.clubNameText && (
              <div
                className="text-black font-bold uppercase tracking-widest text-center mt-1 select-none"
                style={{
                  fontFamily: "'Roboto Mono', Consolas, 'Courier Prime', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.09em',
                  fontWeight: 700,
                }}
              >
                {data.clubNameText}
              </div>
            )}
          </div>
        </div>

        {/* 3. FOOTER / BOTTOM DESIGN (Yellow faceted origami banner matching Image 1) */}
        <div className="w-full flex-shrink-0 z-0 overflow-hidden">
          <CardFooterDesign
            type={data.footerType}
            customImageUrl={data.customFooterUrl}
            heightMm={data.footerHeightMm}
            color={data.footerColor}
          />
        </div>
      </div>
    );
  }
);

CardFront.displayName = 'CardFront';
