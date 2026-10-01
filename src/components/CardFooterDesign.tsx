import React from 'react';

interface CardFooterDesignProps {
  type: 'default-yellow-polygon' | 'custom-image' | 'solid-accent' | 'none';
  customImageUrl?: string | null;
  heightMm?: number;
  color?: string;
  className?: string;
}

export const CardFooterDesign: React.FC<CardFooterDesignProps> = ({
  type = 'default-yellow-polygon',
  customImageUrl,
  heightMm = 18,
  color = '#F5A623',
  className = '',
}) => {
  if (type === 'none') {
    return null;
  }

  if (type === 'custom-image' && customImageUrl) {
    return (
      <div
        className={`w-full overflow-hidden select-none pointer-events-none ${className}`}
        style={{ height: `${heightMm}mm` }}
      >
        <img
          src={customImageUrl}
          alt="Custom Footer Banner"
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    );
  }

  if (type === 'solid-accent') {
    return (
      <div
        className={`w-full ${className}`}
        style={{
          height: `${heightMm}mm`,
          backgroundColor: color,
        }}
      />
    );
  }

  // Default: Faceted yellow geometric polygon banner matching image 1
  return (
    <div
      className={`w-full overflow-hidden relative select-none pointer-events-none ${className}`}
      style={{ height: `${heightMm}mm`, minHeight: '50px' }}
    >
      <svg
        viewBox="0 0 300 90"
        preserveAspectRatio="none"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle drop shadow / rear layer */}
        <polygon
          points="0,48 55,36 120,44 195,30 250,42 300,38 300,90 0,90"
          fill="#D68A00"
          opacity="0.35"
        />

        {/* Facet 1: Leftmost ramp */}
        <polygon
          points="0,45 60,32 105,48 0,60"
          fill="#F5AA00"
        />

        {/* Facet 2: Left peak facet */}
        <polygon
          points="60,32 110,48 0,90 0,60"
          fill="#FFB703"
        />

        {/* Facet 3: Valley center-left crease */}
        <polygon
          points="60,32 125,52 110,48"
          fill="#E09200"
        />

        {/* Facet 4: Center slope down to fold */}
        <polygon
          points="60,32 125,52 210,34 0,90"
          fill="#F5AA00"
        />

        {/* Facet 5: Right crest highlight */}
        <polygon
          points="125,52 210,34 260,46 300,42 300,90 0,90"
          fill="#FFB703"
        />

        {/* Facet 6: Crease shading below right peak */}
        <polygon
          points="210,34 260,46 230,58"
          fill="#D98200"
          opacity="0.4"
        />

        {/* Base polygon fill to guarantee full coverage at bottom edge */}
        <polygon
          points="0,45 60,32 125,52 210,34 260,46 300,42 300,90 0,90"
          fill={color || '#FFB703'}
        />
        
        {/* Overlay facets for realistic paper-fold shading */}
        <polygon
          points="60,32 125,52 160,44"
          fill="#000000"
          opacity="0.08"
        />
        <polygon
          points="210,34 260,46 220,54"
          fill="#000000"
          opacity="0.08"
        />
        <polygon
          points="0,45 60,32 40,56 0,55"
          fill="#FFFFFF"
          opacity="0.1"
        />
      </svg>
    </div>
  );
};
