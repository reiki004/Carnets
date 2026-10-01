import headerImg from './images/regenerated_image_1790806191772.jpg';
import backTopImg from './images/regenerated_image_1790806192192.jpg';

// Activos vectoriales de alta fidelidad para el carnet Interclubes
export const DEFAULTS = {
  // Encabezado oficial actualizado
  header: headerImg,

  // Avatar predeterminado exacto de la Imagen 2: silueta con polo negro, rostro liso y cabello rubio/castaño
  photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280">
    <!-- Fondo blanco -->
    <rect width="240" height="280" fill="%23ffffff"/>
    
    <!-- Torso y Polo Negro -->
    <path d="M22 280 C24 235, 50 205, 82 195 L100 208 C113 216, 127 216, 140 208 L158 195 C190 205, 216 235, 218 280 Z" fill="%231a1a1a"/>
    <path d="M100 208 C113 216, 127 216, 140 208 C135 214, 128 218, 120 218 C112 218, 105 214, 100 208 Z" fill="%23111111"/>

    <!-- Cuello tono piel -->
    <path d="M100 160 L100 208 C113 216, 127 216, 140 208 L140 160 Z" fill="%23e8ba8c"/>
    <ellipse cx="120" cy="182" rx="14" ry="10" fill="%23d6a477" opacity="0.6"/>

    <!-- Cabeza y Orejas (rostro liso sin rasgos como en la imagen 2) -->
    <ellipse cx="94" cy="120" rx="9" ry="12" fill="%23e8ba8c"/>
    <ellipse cx="146" cy="120" rx="9" ry="12" fill="%23e8ba8c"/>
    <path d="M96 95 C96 65, 144 65, 144 95 C144 140, 138 165, 120 165 C102 165, 96 140, 96 95 Z" fill="%23f6cb9f"/>

    <!-- Cabello Castaño/Rubio peinado hacia el lado como en la imagen 2 -->
    <path d="M96 92 C94 65, 110 52, 125 52 C146 52, 148 65, 146 88 C144 80, 140 74, 134 74 C120 74, 112 84, 104 88 C99 90, 97 92, 96 92 Z" fill="%23a47326"/>
    <path d="M96 90 C96 74, 104 60, 120 56 C110 60, 104 70, 102 82 Z" fill="%238a5d1b"/>
    <path d="M125 52 C134 52, 142 56, 146 64 C142 60, 135 57, 127 57 Z" fill="%23b8852d"/>
  </svg>`,

  // Escudo heráldico dorado/amarillo predeterminado exacto de la Imagen 2 con división vertical bicolor
  logo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <g transform="translate(10, 10)">
      <!-- Borde exterior dorado -->
      <path d="M10 20 C10 100, 30 180, 90 220 C150 180, 170 100, 170 20 C116 26, 64 26, 10 20 Z" fill="none" stroke="%23c59313" stroke-width="7" stroke-linejoin="round"/>
      
      <!-- Mitad izquierda (amarillo vivo) -->
      <path d="M18 25 C18 98, 36 172, 90 210 L90 25 C64 27, 40 26, 18 25 Z" fill="%23f5cc0c"/>
      
      <!-- Mitad derecha (amarillo dorado más sombreado) -->
      <path d="M90 25 L90 210 C144 172, 162 98, 162 25 C140 26, 116 27, 90 25 Z" fill="%23e8b704"/>

      <!-- Línea sutil de división central -->
      <line x1="90" y1="25" x2="90" y2="210" stroke="%23b38407" stroke-width="1.5"/>
    </g>
  </svg>`,

  // Pie frontal facetado amarillo origami exacto de la Imagen 2
  footer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525 120" width="525" height="120" preserveAspectRatio="none">
    <!-- Polígono base con facetado en amarillo cálido / ámbar -->
    <polygon points="0,42 95,20 195,48 330,22 420,42 525,34 525,120 0,120" fill="%23d98200" opacity="0.38"/>
    <!-- Triángulo facetado izquierdo -->
    <polygon points="0,38 105,18 180,44 0,66" fill="%23f5aa00"/>
    <!-- Facetado central principal brillante -->
    <polygon points="105,18 190,44 340,18 425,38 525,30 525,120 0,120" fill="%23ffb703"/>
    <!-- Sombra facetada intermedia izquierda -->
    <polygon points="105,18 190,44 250,32" fill="%23e09200" opacity="0.45"/>
    <!-- Sombra facetada intermedia derecha -->
    <polygon points="340,18 425,38 375,50" fill="%23e09200" opacity="0.45"/>
  </svg>`,

  // Dorso lema caligráfico oficial actualizado
  backtop: backTopImg,

  // Dorso pie con iconos y enlaces (fuente Arial Narrow)
  backbottom: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 527 232" width="527" height="232">
    <rect width="527" height="232" fill="%23ffffff"/>
    <g transform="translate(133, 18)">
      <!-- TikTok -->
      <circle cx="28" cy="28" r="24" fill="%23000000"/>
      <path d="M33 21 a6 6 0 0 1-5-5 v-2 h-4 v16 a3.5 3.5 0 1 1-3.5-3.5 c.4 0 .7.1 1 .2 v-4.5 a8 8 0 1 0 7.5 8 v-7 a10 10 0 0 0 5 1.5 z" fill="%23ffffff"/>
      <!-- Facebook -->
      <circle cx="92" cy="28" r="24" fill="%23000000"/>
      <path d="M96 28 h4 v-4 h-4 v-2 c0-.8.4-1.2 1.2-1.2 h2.8 v-3.8 h-3.6 c-3.2 0-4.4 1.8-4.4 4.2 v2.8 h-3 v4 h3 v11 h4 z" fill="%23ffffff"/>
      <!-- Instagram -->
      <circle cx="156" cy="28" r="24" fill="%23000000"/>
      <rect x="144" y="16" width="24" height="24" rx="6" fill="none" stroke="%23ffffff" stroke-width="2.5"/>
      <circle cx="156" cy="28" r="5.5" fill="none" stroke="%23ffffff" stroke-width="2.5"/>
      <circle cx="163" cy="21" r="1.5" fill="%23ffffff"/>
      <!-- YouTube -->
      <circle cx="220" cy="28" r="24" fill="%23000000"/>
      <path d="M232 24 c-.2-1.2-1-2-2.2-2.2 -2-.5-9.8-.5-9.8-.5 s-7.8 0-9.8.5 c-1.2.2-2 1-2.2 2.2 -.5 1.5-.5 4-.5 4 s0 2.5.5 4 c.2 1.2 1 2 2.2 2.2 2 .5 9.8.5 9.8.5 s7.8 0 9.8-.5 c1.2-.2 2-1 2.2-2.2 .5-1.5.5-4 .5-4 s0-2.5-.5-4 z" fill="%23ffffff"/>
      <polygon points="218,25 225,28 218,31" fill="%23000000"/>
    </g>
    <text x="263" y="128" text-anchor="middle" font-family="'Arial Narrow', 'Archivo Narrow', 'Roboto Condensed', Arial, sans-serif" font-size="28" font-weight="700" fill="%23000000">/Interclubesperu</text>
    <text x="263" y="174" text-anchor="middle" font-family="'Arial Narrow', 'Archivo Narrow', 'Roboto Condensed', Arial, sans-serif" font-size="30" font-weight="900" fill="%23000000">www.interclubesperu.com</text>
  </svg>`,
};
