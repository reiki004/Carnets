import React from 'react';

interface HeaderEmblemProps {
  redText?: string;
  whiteText?: string;
  customLogoUrl?: string | null;
  className?: string;
}

export const HeaderEmblem: React.FC<HeaderEmblemProps> = ({
  redText = 'INTER',
  whiteText = 'CLUBES',
  customLogoUrl,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-black text-white flex items-center justify-between px-3 py-2.5 overflow-hidden select-none ${className}`}
      style={{ minHeight: '62px' }}
    >
      <div className="flex items-center gap-3">
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt="Header Emblem"
            className="w-12 h-12 object-contain"
          />
        ) : (
          /* Soccer ball formed by interlocking clasped hands - vector recreation */
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer boundary circle hint */}
              <circle cx="50" cy="50" r="47" stroke="white" strokeWidth="2.5" strokeOpacity="0.4" />
              
              {/* Central pentagon representing soccer ball center */}
              <polygon
                points="50,38 61,46 57,59 43,59 39,46"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="2.5"
              />

              {/* Hand 1 (Top) */}
              <g transform="rotate(0, 50, 50)">
                <path
                  d="M44 26 C44 20, 56 20, 56 26 L56 37 C54 36, 46 36, 44 37 Z"
                  fill="white"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* Fingers */}
                <line x1="48" y1="24" x2="48" y2="34" stroke="#000000" strokeWidth="1.5" />
                <line x1="52" y1="24" x2="52" y2="34" stroke="#000000" strokeWidth="1.5" />
                {/* Wrist cuffs / arm contour */}
                <path
                  d="M37 12 C43 7, 57 7, 63 12 C59 18, 41 18, 37 12 Z"
                  fill="white"
                />
                <path
                  d="M40 14 L44 25 M60 14 L56 25"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Hand 2 (Top-Right ~ 72 deg) */}
              <g transform="rotate(72, 50, 50)">
                <path
                  d="M44 26 C44 20, 56 20, 56 26 L56 37 C54 36, 46 36, 44 37 Z"
                  fill="white"
                  stroke="#000000"
                  strokeWidth="2"
                />
                <line x1="48" y1="24" x2="48" y2="34" stroke="#000000" strokeWidth="1.5" />
                <line x1="52" y1="24" x2="52" y2="34" stroke="#000000" strokeWidth="1.5" />
                <path
                  d="M37 12 C43 7, 57 7, 63 12 C59 18, 41 18, 37 12 Z"
                  fill="white"
                />
                <path
                  d="M40 14 L44 25 M60 14 L56 25"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Hand 3 (Bottom-Right ~ 144 deg) */}
              <g transform="rotate(144, 50, 50)">
                <path
                  d="M44 26 C44 20, 56 20, 56 26 L56 37 C54 36, 46 36, 44 37 Z"
                  fill="white"
                  stroke="#000000"
                  strokeWidth="2"
                />
                <line x1="48" y1="24" x2="48" y2="34" stroke="#000000" strokeWidth="1.5" />
                <line x1="52" y1="24" x2="52" y2="34" stroke="#000000" strokeWidth="1.5" />
                <path
                  d="M37 12 C43 7, 57 7, 63 12 C59 18, 41 18, 37 12 Z"
                  fill="white"
                />
                <path
                  d="M40 14 L44 25 M60 14 L56 25"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Hand 4 (Bottom-Left ~ 216 deg) */}
              <g transform="rotate(216, 50, 50)">
                <path
                  d="M44 26 C44 20, 56 20, 56 26 L56 37 C54 36, 46 36, 44 37 Z"
                  fill="white"
                  stroke="#000000"
                  strokeWidth="2"
                />
                <line x1="48" y1="24" x2="48" y2="34" stroke="#000000" strokeWidth="1.5" />
                <line x1="52" y1="24" x2="52" y2="34" stroke="#000000" strokeWidth="1.5" />
                <path
                  d="M37 12 C43 7, 57 7, 63 12 C59 18, 41 18, 37 12 Z"
                  fill="white"
                />
                <path
                  d="M40 14 L44 25 M60 14 L56 25"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Hand 5 (Top-Left ~ 288 deg) */}
              <g transform="rotate(288, 50, 50)">
                <path
                  d="M44 26 C44 20, 56 20, 56 26 L56 37 C54 36, 46 36, 44 37 Z"
                  fill="white"
                  stroke="#000000"
                  strokeWidth="2"
                />
                <line x1="48" y1="24" x2="48" y2="34" stroke="#000000" strokeWidth="1.5" />
                <line x1="52" y1="24" x2="52" y2="34" stroke="#000000" strokeWidth="1.5" />
                <path
                  d="M37 12 C43 7, 57 7, 63 12 C59 18, 41 18, 37 12 Z"
                  fill="white"
                />
                <path
                  d="M40 14 L44 25 M60 14 L56 25"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Interlocking hand grips */}
              <circle cx="50" cy="50" r="5" fill="#000000" />
            </svg>
          </div>
        )}

        {/* Text INTER CLUBES */}
        <div className="flex flex-col justify-center leading-none tracking-tight">
          <span
            className="text-[#E52320] font-black text-2xl tracking-normal uppercase"
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              letterSpacing: '-0.02em',
              lineHeight: '0.88',
            }}
          >
            {redText}
          </span>
          <span
            className="text-white font-black text-xl tracking-normal uppercase"
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              letterSpacing: '0.04em',
              lineHeight: '0.92',
            }}
          >
            {whiteText}
          </span>
        </div>
      </div>
    </div>
  );
};
