import headerImg from './images/regenerated_image_1790806191772.jpg';
import backTopImg from './images/regenerated_image_1790806192192.jpg';
import photoImg from './images/regenerated_image_1790807500509.jpg';
import logoImg from './images/regenerated_image_1790807500911.jpg';
import backBottomImg from './images/regenerated_image_1790807289905.jpg';

// Activos vectoriales e imágenes oficiales de alta fidelidad para el carnet Interclubes
export const DEFAULTS = {
  // Encabezado oficial actualizado
  header: headerImg,

  // Foto de perfil oficial actualizada
  photo: photoImg,

  // Escudo oficial actualizado
  logo: logoImg,

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

  // Dorso pie oficial actualizado con redes sociales y enlaces
  backbottom: backBottomImg,
};
