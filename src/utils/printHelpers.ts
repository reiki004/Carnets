import { toPng } from 'html-to-image';
import { CardState } from '../components/CardPreview';

/**
 * Imprime directamente el carnet exacto en un iframe aislado de ultra alta resolución (300+ DPI).
 * Esto elimina cualquier marca de agua externa ("Make public", banners, encabezados del navegador)
 * y garantiza que se imprima la tarjeta exacta que el usuario está previsualizando.
 */
export const printCardDirectly = async (
  card: CardState,
  frontElement?: HTMLElement | null,
  backElement?: HTMLElement | null
): Promise<void> => {
  try {
    let frontImgUrl = '';
    let backImgUrl = '';

    // Si tenemos los elementos del DOM en pantalla, generamos snapshots a 4x (> 300 DPI)
    if (frontElement) {
      frontImgUrl = await toPng(frontElement, {
        pixelRatio: 4,
        quality: 1,
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0px',
          boxShadow: 'none',
        },
      });
    }

    if (backElement) {
      backImgUrl = await toPng(backElement, {
        pixelRatio: 4,
        quality: 1,
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0px',
          boxShadow: 'none',
        },
      });
    }

    // Crear un iframe aislado e invisible adjunto al DOM
    const iframe = document.createElement('iframe');
    iframe.id = 'zebra-direct-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carnet Zebra ZC300 - ${card.apellidos} ${card.nombres}</title>
        <style>
          @page {
            size: 55mm 86.5mm;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 55mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .card-page {
            width: 55mm !important;
            height: 86.5mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            position: relative !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          .card-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .card-img {
            width: 55mm !important;
            height: 86.5mm !important;
            object-fit: cover !important;
            display: block !important;
            border: none !important;
          }
        </style>
      </head>
      <body>
        <div class="card-page">
          <img class="card-img" src="${frontImgUrl}" alt="Frente" />
        </div>
        ${
          backImgUrl
            ? `<div class="card-page"><img class="card-img" src="${backImgUrl}" alt="Dorso" /></div>`
            : ''
        }
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Esperar a que las imágenes se carguen en el iframe y lanzar la impresión
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error al invocar iframe print:', e);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 350);
  } catch (err) {
    console.error('Error en printCardDirectly:', err);
    window.print();
  }
};

/**
 * Triggers standard browser print dialog.
 */
export const triggerBrowserPrint = () => {
  window.print();
};

/**
 * Generates a high-resolution 300 DPI PNG of the specified DOM element.
 */
export const downloadCardImage = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 4, // 4x ensures > 300 DPI ultra-sharp resolution
      quality: 1,
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        borderRadius: '0px',
        boxShadow: 'none',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export card image:', err);
    throw err;
  }
};
