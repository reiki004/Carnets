import React from 'react';

export interface ClubPreset {
  id: string;
  name: string;
  shortName: string;
  defaultLabel: string;
  renderLogo: (scale?: number) => React.ReactNode;
}

export const CLUB_PRESETS: ClubPreset[] = [
  {
    id: 'cc-el-bosque',
    name: 'Country Club El Bosque',
    shortName: 'El Bosque',
    defaultLabel: 'CC. EL BOSQUE',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg
          viewBox="0 0 120 125"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Arched path for top text "COUNTRY CLUB" */}
            <path
              id="topArc"
              d="M 12 56 A 48 48 0 0 1 108 56"
              fill="none"
            />
            {/* Arched path for bottom text "EL BOSQUE" */}
            <path
              id="bottomArc"
              d="M 18 84 A 48 48 0 0 0 102 84"
              fill="none"
            />
          </defs>

          {/* Arched Text: COUNTRY CLUB */}
          <text
            fill="#8B2500"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="'Roboto Mono', 'Montserrat', Arial, sans-serif"
            letterSpacing="0.08em"
          >
            <textPath
              href="#topArc"
              startOffset="50%"
              textAnchor="middle"
            >
              COUNTRY CLUB
            </textPath>
          </text>

          {/* Tree Canopy & Trunk matching El Bosque's emblem */}
          <g transform="translate(18, 28) scale(0.7)">
            {/* Tree Trunk */}
            <path
              d="M52 50 C50 65, 45 78, 38 88 L68 88 C62 76, 58 65, 58 50 Z"
              fill="#7A3E26"
            />
            {/* Branches */}
            <path
              d="M48 62 C40 58, 32 60, 24 66 L30 70 C36 66, 42 66, 49 68 Z"
              fill="#7A3E26"
            />
            <path
              d="M58 58 C68 54, 78 58, 86 64 L82 68 C76 63, 68 62, 58 64 Z"
              fill="#7A3E26"
            />
            {/* Lower foliage green hill */}
            <ellipse cx="53" cy="88" rx="42" ry="10" fill="#0F5B2F" />

            {/* Tree Leaf Clouds (Light olive green and dark forest green) */}
            {/* Background canopy */}
            <path
              d="M55 20 C42 10, 24 16, 20 32 C12 34, 6 44, 10 54 C12 60, 20 64, 28 64 C35 70, 50 68, 56 62 Z"
              fill="#86B32D"
            />
            {/* Foreground lush canopy */}
            <path
              d="M46 22 C55 10, 78 12, 86 24 C98 26, 105 38, 100 50 C96 60, 85 64, 76 62 C70 68, 56 68, 50 60 C40 60, 36 50, 40 40 C42 32, 44 26, 46 22 Z"
              fill="#0F5B2F"
            />
            <circle cx="48" cy="36" r="16" fill="#86B32D" opacity="0.9" />
            <circle cx="70" cy="40" r="14" fill="#0F5B2F" />
          </g>

          {/* Arched Text: EL BOSQUE */}
          <text
            fill="#0F5B2F"
            fontSize="13"
            fontWeight="800"
            fontFamily="'Roboto Mono', 'Montserrat', Arial, sans-serif"
            letterSpacing="0.08em"
          >
            <textPath
              href="#bottomArc"
              startOffset="50%"
              textAnchor="middle"
            >
              EL BOSQUE
            </textPath>
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'club-regatas',
    name: 'Club de Regatas Lima',
    shortName: 'Regatas Lima',
    defaultLabel: 'CRL - REGATAS',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="#0A3161" stroke="#D4AF37" strokeWidth="3" />
          <path d="M22 66 L50 20 L78 66 Z" fill="#FFFFFF" />
          <path d="M30 63 L50 30 L70 63 Z" fill="#B31942" />
          <circle cx="50" cy="52" r="8" fill="#D4AF37" />
          <text x="50" y="86" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
            REGATAS
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'cc-rinconada',
    name: 'Country Club de Rinconada',
    shortName: 'Rinconada',
    defaultLabel: 'CC. RINCONADA',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="12" fill="#004D25" stroke="#F1C40F" strokeWidth="3" />
          <circle cx="50" cy="46" r="22" fill="#FFFFFF" />
          <path d="M38 56 L50 34 L62 56 Z" fill="#004D25" />
          <text x="50" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            RINCONADA
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'cc-la-planicie',
    name: 'Country Club La Planicie',
    shortName: 'La Planicie',
    defaultLabel: 'CC. LA PLANICIE',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="#0B2B47" stroke="#C59B27" strokeWidth="3" />
          <path d="M26 62 Q50 30 74 62" stroke="#FFFFFF" strokeWidth="5" fill="none" />
          <circle cx="50" cy="38" r="8" fill="#C59B27" />
          <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            LA PLANICIE
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'jockey-club',
    name: 'Jockey Club del Perú',
    shortName: 'Jockey Club',
    defaultLabel: 'JOCKEY CLUB',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="#8B0000" stroke="#FFD700" strokeWidth="3" />
          <path d="M35 32 H65 L60 52 Q50 68 40 68 Z" fill="#FFFFFF" />
          <text x="50" y="84" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            JOCKEY CLUB
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'cc-villa',
    name: 'Country Club de Villa',
    shortName: 'Villa',
    defaultLabel: 'CC. DE VILLA',
    renderLogo: (scale = 1) => (
      <div
        className="relative flex flex-col items-center justify-center select-none"
        style={{
          width: `${68 * scale}px`,
          height: `${72 * scale}px`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="#003865" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M30 40 L50 25 L70 40 L60 70 L40 70 Z" fill="#EF3340" />
          <text x="50" y="84" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
            CC VILLA
          </text>
        </svg>
      </div>
    ),
  },
];
