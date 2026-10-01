import React, { forwardRef } from 'react';
import { CardData } from '../types/card';

interface CardBackProps {
  data: CardData;
  scale?: number;
  isPrint?: boolean;
}

export const CardBack = forwardRef<HTMLDivElement, CardBackProps>(
  ({ data, scale = 1, isPrint = false }, ref) => {
    const cardWidthMm = 53.98;
    const cardHeightMm = 85.6;

    // Font family mapping for the cursive slogan
    const getSloganFontFamily = () => {
      switch (data.sloganFont) {
        case 'caveat':
          return "'Caveat', cursive";
        case 'dancing':
          return "'Dancing Script', cursive";
        case 'alex':
          return "'Alex Brush', cursive";
        case 'marck':
          return "'Caveat', cursive";
        default:
          return "'Caveat', cursive";
      }
    };

    return (
      <div
        ref={ref}
        className={`relative bg-white text-black flex flex-col justify-between items-center select-none overflow-hidden ${
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
          padding: '24px 16px 20px 16px',
        }}
      >
        {/* 1. TOP SECTION: Slogan "Futbol con historias" (matching Image 2) */}
        <div className="w-full flex items-center justify-center pt-2">
          <div
            className="text-black text-center select-none"
            style={{
              fontFamily: getSloganFontFamily(),
              fontSize: `${data.sloganFontSize}px`,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '0.01em',
              transform: 'rotate(-1deg)',
            }}
          >
            {data.sloganText || 'Futbol con historias'}
          </div>
        </div>

        {/* 2. MIDDLE SECTION: Date of Birth & DNI Number (matching Image 2) */}
        <div className="w-full flex flex-col items-center justify-center my-auto space-y-4">
          {/* Date of Birth: F. Nacimiento: DD/MM/YYYY */}
          <div
            className="text-black text-center font-bold tracking-normal"
            style={{
              fontFamily: "'Roboto Mono', Consolas, 'Courier Prime', monospace",
              fontSize: '14.5px',
              fontWeight: 700,
              letterSpacing: '0.01em',
            }}
          >
            F. Nacimiento: {data.dateOfBirth || '--/--/----'}
          </div>

          {/* DNI Number */}
          <div
            className="text-black text-center font-bold tracking-normal"
            style={{
              fontFamily: "'Roboto Mono', Consolas, 'Courier Prime', monospace",
              fontSize: '14.5px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            DNI: {data.dniNumber || '--------'}
          </div>
        </div>

        {/* 3. BOTTOM SECTION: Social Icons & Website (matching Image 2) */}
        <div className="w-full flex flex-col items-center justify-center pb-1">
          {/* Social Icons: TikTok, Facebook, Instagram, YouTube in black circular badges */}
          {data.showSocialIcons && (
            <div className="flex items-center justify-center gap-2.5 mb-2 select-none">
              {/* TikTok */}
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.6a6.34 6.34 0 0 0 10.74 4.54 6.27 6.27 0 0 0 2.05-4.54V8.91a8.28 8.28 0 0 0 4.8 1.51V7a4.82 4.82 0 0 1-1-.31z" />
                </svg>
              </div>

              {/* Facebook */}
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
              </div>

              {/* Instagram */}
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>

              {/* YouTube */}
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
            </div>
          )}

          {/* Social Handle */}
          <div
            className="text-black font-bold text-center tracking-normal select-none"
            style={{
              fontFamily: "'Inter', 'Montserrat', sans-serif",
              fontSize: '12.5px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              lineHeight: 1.3,
            }}
          >
            {data.socialHandle || '/Interclubesperu'}
          </div>

          {/* Website Address */}
          <div
            className="text-black font-extrabold text-center tracking-normal select-none mt-1"
            style={{
              fontFamily: "'Inter', 'Montserrat', sans-serif",
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.01em',
              lineHeight: 1.3,
            }}
          >
            {data.websiteUrl || 'www.interclubesperu.com'}
          </div>
        </div>
      </div>
    );
  }
);

CardBack.displayName = 'CardBack';
