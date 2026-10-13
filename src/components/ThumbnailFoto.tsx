import React, { useState, useEffect } from 'react';
import { DEFAULTS } from '../assets/cardAssets';

interface ThumbnailFotoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * Componente robusto de miniatura de foto de jugador o árbitro.
 * - Elimina parámetros de timestamp corruptos o viejos
 * - Usa referrerPolicy="no-referrer" para evitar bloqueos cross-origin en iframes
 * - Si la URL falla, intenta reintentar una vez con timestamp limpio
 * - Si sigue fallando o no existe foto, muestra la silueta limpia por defecto (DEFAULTS.photo)
 * - NUNCA muestra un icono de enlace roto al usuario
 */
export const ThumbnailFoto: React.FC<ThumbnailFotoProps> = ({
  src,
  alt = '',
  className = 'thumb w-6 h-6 rounded-md object-cover',
  title,
  onClick,
}) => {
  const cleanInitial = src ? src.split('?')[0] : DEFAULTS.photo;
  const [currentSrc, setCurrentSrc] = useState<string>(cleanInitial);
  const [hasTriedClean, setHasTriedClean] = useState(false);
  const [hasTriedRetry, setHasTriedRetry] = useState(false);
  const [hasTriedAltFormat, setHasTriedAltFormat] = useState(false);

  useEffect(() => {
    setCurrentSrc(src ? src.split('?')[0] : DEFAULTS.photo);
    setHasTriedClean(false);
    setHasTriedRetry(false);
    setHasTriedAltFormat(false);
  }, [src]);

  const handleError = () => {
    if (!src || currentSrc === DEFAULTS.photo) {
      return;
    }

    // 1. Si la URL actual contenía query params y falló, probar sin query params
    if (!hasTriedClean && currentSrc.includes('?')) {
      setHasTriedClean(true);
      setCurrentSrc(currentSrc.split('?')[0]);
      return;
    }

    // 2. Si tenía formato _admin.jpg y falló, probar con el formato unificado .jpg
    if (!hasTriedAltFormat && currentSrc.includes('_admin.jpg')) {
      setHasTriedAltFormat(true);
      setCurrentSrc(currentSrc.replace('_admin.jpg', '.jpg'));
      return;
    }

    // 3. Si tenía formato .jpg y falló, probar con _admin.jpg por compatibilidad histórica
    if (!hasTriedAltFormat && currentSrc.includes('.jpg') && !currentSrc.includes('_admin.jpg')) {
      setHasTriedAltFormat(true);
      setCurrentSrc(currentSrc.replace('.jpg', '_admin.jpg'));
      return;
    }

    // 4. Si la URL falló, probar un reintento con timestamp nuevo para invalidar caché
    if (!hasTriedRetry) {
      setHasTriedRetry(true);
      setCurrentSrc(`${currentSrc.split('?')[0]}?retry=${Date.now()}`);
      return;
    }

    // 5. Fallback seguro a la silueta por defecto de la aplicación
    setCurrentSrc(DEFAULTS.photo);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      title={title}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={handleError}
      onClick={onClick}
    />
  );
};
