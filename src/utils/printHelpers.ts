import { toPng } from 'html-to-image';
import { CardState } from '../components/CardPreview';
import { DEFAULTS } from '../assets/cardAssets';

/**
 * Espera a que todas las imágenes dentro de un iframe se hayan cargado completamente.
 */
const waitForImagesInIframe = (iframeDoc: Document, maxWaitMs = 1500): Promise<void> => {
  return new Promise((resolve) => {
    const images = Array.from(iframeDoc.querySelectorAll('img'));
    if (!images.length) {
      resolve();
      return;
    }

    let resolved = false;
    let pending = images.length;

    const checkDone = () => {
      pending--;
      if (pending <= 0 && !resolved) {
        resolved = true;
        resolve();
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, maxWaitMs);

    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        checkDone();
      } else {
        img.addEventListener('load', checkDone);
        img.addEventListener('error', checkDone);
      }
    });
  });
};

/**
 * Imprime directamente el carnet exacto en un iframe aislado de ultra alta resolución (300+ DPI).
 * Esto elimina cualquier marca de agua externa ("Make public", banners, barras del navegador)
 * y garantiza que la impresión coincida 1:1 con la vista previa del carnet en pantalla.
 */
export const printCardDirectly = async (
  card: CardState,
  frontElement?: HTMLElement | null,
  backElement?: HTMLElement | null
): Promise<void> => {
  try {
    // 1. Obtener elementos del DOM (del modal, de la pantalla de búsqueda o por ID)
    const frontEl = frontElement || document.getElementById('cardFront');
    const backEl = backElement || document.getElementById('cardBack');

    let frontImgUrl = '';
    let backImgUrl = '';

    // Si encontramos los elementos renderizados, generamos snapshot 4x (> 300 DPI)
    if (frontEl) {
      try {
        frontImgUrl = await toPng(frontEl, {
          pixelRatio: 4,
          quality: 1,
          cacheBust: true,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
          style: {
            borderRadius: '0px',
            boxShadow: 'none',
          },
        });
      } catch (errSnapFront) {
        console.warn('Snapshot frontal falló, se usará renderizado HTML directo en iframe:', errSnapFront);
      }
    }

    if (backEl) {
      try {
        backImgUrl = await toPng(backEl, {
          pixelRatio: 4,
          quality: 1,
          cacheBust: true,
          backgroundColor: '#ffffff',
          skipFonts: true,
          fontEmbedCSS: '',
          style: {
            borderRadius: '0px',
            boxShadow: 'none',
          },
        });
      } catch (errSnapBack) {
        console.warn('Snapshot posterior falló, se usará renderizado HTML directo en iframe:', errSnapBack);
      }
    }

    // 2. Crear un iframe aislado e invisible adjunto al DOM
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

    const isAdmin = card.tipo === 'admin';
    const footerH = card.footerHeight ?? 20;

    // Si obtuvimos las imágenes snapshots, las usamos; de lo contrario, inyectamos el HTML/CSS exacto de la tarjeta
    let htmlPages = '';
    if (frontImgUrl) {
      htmlPages += `
        <div class="card-page">
          <img class="card-img" src="${frontImgUrl}" alt="Frente" />
        </div>
      `;
    } else {
      // Fallback HTML vectorial exacto
      htmlPages += `
        <div class="card-page">
          <div class="card-container card-front ${isAdmin ? 'is-admin' : ''}">
            <img class="f-header" src="${card.headerUrl || DEFAULTS.header}" alt="" />
            <div class="f-body">
              <div class="f-photo-box" style="transform: scale(${(card.photoScale ?? 100) / 100}); transform-origin: ${isAdmin ? 'center center' : 'center top'};">
                <img class="f-photo-img" src="${card.photoUrl || DEFAULTS.photo}" style="${card.photoOffsetX || card.photoOffsetY ? `transform: translate(${card.photoOffsetX ?? 0}px, ${card.photoOffsetY ?? 0}px);` : ''}" alt="" />
              </div>
              <div class="f-names-box">
                <div class="f-apellidos">${(card.apellidos || 'APELLIDO').toUpperCase()}</div>
                <div class="f-nombres">${(card.nombres || 'NOMBRE').toUpperCase()}</div>
              </div>
              ${
                !isAdmin
                  ? `<div class="f-logo-box" style="transform: scale(${(card.logoScale ?? 100) / 100}); transform-origin: center center;"><img class="f-logo-img" src="${card.logoUrl || DEFAULTS.logo}" alt="" /></div>`
                  : ''
              }
              <div class="f-club-box">
                <div class="f-clubname">${(card.clubname || (isAdmin ? 'ÁRBITRO' : 'NOMBRE DEL CLUB')).toUpperCase()}</div>
              </div>
            </div>
            <img class="f-footer" src="${card.footerUrl || DEFAULTS.footer}" style="height: ${footerH}%;" alt="" />
          </div>
        </div>
      `;
    }

    if (backImgUrl) {
      htmlPages += `
        <div class="card-page">
          <img class="card-img" src="${backImgUrl}" alt="Dorso" />
        </div>
      `;
    } else {
      htmlPages += `
        <div class="card-page">
          <div class="card-container card-back">
            <img class="b-top" src="${card.backTopUrl || DEFAULTS.backtop}" alt="" />
            <div class="b-mid">
              <div class="b-field">F. Nacimiento: ${card.fnac || 'dd/mm/aaaa'}</div>
              <div class="b-field">DNI: ${card.dni || '00000000'}</div>
            </div>
            ${
              card.showCategoria && (card.terna || card.categoria)
                ? `<div class="b-categoria">${
                    card.tipo === 'admin'
                      ? `Terna: ${(card.terna || card.categoria || '').replace(/^terna:\s*/i, '').trim().toUpperCase()}`
                      : (card.categoria || '').toUpperCase()
                  }</div>`
                : ''
            }
            <img class="b-bottom" src="${card.backBottomUrl || DEFAULTS.backbottom}" alt="" />
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carnet Zebra ZC300 - ${card.apellidos} ${card.nombres}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;600;700&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
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
            font-family: 'Arial', Helvetica, sans-serif;
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
          .card-container {
            width: 55mm;
            height: 86.5mm;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          }
          .card-front .f-header {
            width: 100%;
            height: 18%;
            object-fit: cover;
            display: block;
            flex-shrink: 0;
          }
          .card-front .f-body {
            flex: 1;
            min-height: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 0.5mm 2mm;
            overflow: hidden;
          }
          .card-front .f-photo-box {
            width: 62%;
            height: 40%;
            max-height: 42%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            flex-shrink: 0;
          }
          .card-front.is-admin .f-body {
            justify-content: flex-start;
            padding: 1.5mm 2mm 0.8mm 2mm;
          }
          .card-front.is-admin .f-photo-box {
            width: 65%;
            height: 43%;
            max-height: 45%;
            margin-top: 1mm;
            margin-bottom: auto;
          }
          .card-front.is-admin .f-names-box {
            margin-top: 0;
            margin-bottom: auto;
          }
          .card-front.is-admin .f-club-box {
            margin-top: 0;
            margin-bottom: 0.5mm;
          }
          .card-front .f-photo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .card-front .f-names-box {
            width: 100%;
            text-align: center;
            line-height: 1.15;
            flex-shrink: 0;
            position: relative;
            z-index: 2;
          }
          .card-front .f-apellidos,
          .card-front .f-nombres {
            color: #000000 !important;
            font-family: 'Arial', Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.4mm + 0.5pt);
            letter-spacing: 0.01em;
            text-transform: uppercase;
            margin: 0;
            padding: 0;
          }
          .card-front .f-logo-box {
            width: 48%;
            height: 28%;
            max-height: 30%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            flex-shrink: 0;
          }
          .card-front .f-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .card-front .f-club-box {
            width: 100%;
            text-align: center;
            line-height: 1.15;
            flex-shrink: 0;
          }
          .card-front .f-clubname {
            color: #000000 !important;
            font-family: 'Arial', Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.2mm + 0.5pt);
            letter-spacing: 0.015em;
            text-transform: uppercase;
          }
          .card-front .f-footer {
            width: 100%;
            object-fit: fill;
            display: block;
            margin-top: auto;
            flex-shrink: 0;
          }
          .card-back {
            justify-content: space-between;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
          }
          .card-back .b-top {
            width: 100%;
            height: 22%;
            object-fit: cover;
            display: block;
            flex-shrink: 0;
          }
          .card-back .b-mid {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3mm;
          }
          .card-back .b-field {
            color: #000000 !important;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.1mm + 1pt);
            text-align: center;
          }
          .card-back .b-categoria {
            width: 100%;
            color: #000000 !important;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: 3.1mm;
            text-align: center;
            margin-top: auto;
            margin-bottom: 2mm;
            flex-shrink: 0;
            display: block;
          }
          .card-back .b-bottom {
            width: 100%;
            height: 27%;
            object-fit: contain;
            display: block;
            flex-shrink: 0;
            margin-top: auto;
          }
        </style>
      </head>
      <body>
        ${htmlPages}
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Esperar a que las imágenes se decodifiquen y carguen dentro del iframe antes de disparar print()
    await waitForImagesInIframe(doc, 1000);

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
      }, 10000);
    }, 150);
  } catch (err) {
    console.error('Error en printCardDirectly:', err);
    window.print();
  }
};

/**
 * Imprime múltiples carnets en un solo trabajo de impresión en lote para Zebra ZC300 a doble cara.
 */
export const printMultipleCardsDirectly = async (cards: CardState[]): Promise<void> => {
  if (!cards.length) return;

  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'zebra-batch-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '100mm';
    iframe.style.height = '150mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    let pagesHtml = '';
    cards.forEach((c) => {
      const isAdmin = c.tipo === 'admin';
      const footerH = c.footerHeight ?? 20;

      // Cara frontal
      pagesHtml += `
        <div class="card-page">
          <div class="card-container card-front ${isAdmin ? 'is-admin' : ''}">
            <img class="f-header" src="${c.headerUrl || DEFAULTS.header}" alt="" />
            <div class="f-body">
              <div class="f-photo-box" style="transform: scale(${(c.photoScale ?? 100) / 100}); transform-origin: ${isAdmin ? 'center center' : 'center top'};">
                <img class="f-photo-img" src="${c.photoUrl || DEFAULTS.photo}" style="${c.photoOffsetX || c.photoOffsetY ? `transform: translate(${c.photoOffsetX ?? 0}px, ${c.photoOffsetY ?? 0}px);` : ''}" alt="" />
              </div>
              <div class="f-names-box">
                <div class="f-apellidos">${(c.apellidos || 'APELLIDO').toUpperCase()}</div>
                <div class="f-nombres">${(c.nombres || 'NOMBRE').toUpperCase()}</div>
              </div>
              ${
                !isAdmin
                  ? `<div class="f-logo-box" style="transform: scale(${(c.logoScale ?? 100) / 100}); transform-origin: center center;"><img class="f-logo-img" src="${c.logoUrl || DEFAULTS.logo}" alt="" /></div>`
                  : ''
              }
              <div class="f-club-box">
                <div class="f-clubname">${(c.clubname || (isAdmin ? 'ÁRBITRO' : 'NOMBRE DEL CLUB')).toUpperCase()}</div>
              </div>
            </div>
            <img class="f-footer" src="${c.footerUrl || DEFAULTS.footer}" style="height: ${footerH}%;" alt="" />
          </div>
        </div>
      `;

      // Cara posterior (dorso)
      pagesHtml += `
        <div class="card-page">
          <div class="card-container card-back">
            <img class="b-top" src="${c.backTopUrl || DEFAULTS.backtop}" alt="" />
            <div class="b-mid">
              <div class="b-field">F. Nacimiento: ${c.fnac || 'dd/mm/aaaa'}</div>
              <div class="b-field">DNI: ${c.dni || '00000000'}</div>
            </div>
            ${
              c.showCategoria && (c.terna || c.categoria)
                ? `<div class="b-categoria">${
                    c.tipo === 'admin'
                      ? `Terna: ${(c.terna || c.categoria || '').replace(/^terna:\s*/i, '').trim().toUpperCase()}`
                      : (c.categoria || '').toUpperCase()
                  }</div>`
                : ''
            }
            <img class="b-bottom" src="${c.backBottomUrl || DEFAULTS.backbottom}" alt="" />
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Impresión por lotes Zebra ZC300 (${cards.length} carnets)</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;600;700&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
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
            font-family: 'Arial', Helvetica, sans-serif;
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
          .card-container {
            width: 55mm;
            height: 86.5mm;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          }
          .card-front .f-header {
            width: 100%;
            height: 18%;
            object-fit: cover;
            display: block;
            flex-shrink: 0;
          }
          .card-front .f-body {
            flex: 1;
            min-height: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 0.5mm 2mm;
            overflow: hidden;
          }
          .card-front .f-photo-box {
            width: 62%;
            height: 40%;
            max-height: 42%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            flex-shrink: 0;
          }
          .card-front.is-admin .f-body {
            justify-content: flex-start;
            padding: 1.5mm 2mm 0.8mm 2mm;
          }
          .card-front.is-admin .f-photo-box {
            width: 65%;
            height: 43%;
            max-height: 45%;
            margin-top: 1mm;
            margin-bottom: auto;
          }
          .card-front.is-admin .f-names-box {
            margin-top: 0;
            margin-bottom: auto;
          }
          .card-front.is-admin .f-club-box {
            margin-top: 0;
            margin-bottom: 0.5mm;
          }
          .card-front .f-photo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .card-front .f-names-box {
            width: 100%;
            text-align: center;
            line-height: 1.15;
            flex-shrink: 0;
            position: relative;
            z-index: 2;
          }
          .card-front .f-apellidos,
          .card-front .f-nombres {
            color: #000000 !important;
            font-family: 'Arial', Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.4mm + 0.5pt);
            letter-spacing: 0.01em;
            text-transform: uppercase;
            margin: 0;
            padding: 0;
          }
          .card-front .f-logo-box {
            width: 48%;
            height: 28%;
            max-height: 30%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            flex-shrink: 0;
          }
          .card-front .f-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .card-front .f-club-box {
            width: 100%;
            text-align: center;
            line-height: 1.15;
            flex-shrink: 0;
          }
          .card-front .f-clubname {
            color: #000000 !important;
            font-family: 'Arial', Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.2mm + 0.5pt);
            letter-spacing: 0.015em;
            text-transform: uppercase;
          }
          .card-front .f-footer {
            width: 100%;
            object-fit: fill;
            display: block;
            margin-top: auto;
            flex-shrink: 0;
          }
          .card-back {
            justify-content: space-between;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
          }
          .card-back .b-top {
            width: 100%;
            height: 22%;
            object-fit: cover;
            display: block;
            flex-shrink: 0;
          }
          .card-back .b-mid {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3mm;
          }
          .card-back .b-field {
            color: #000000 !important;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: calc(3.1mm + 1pt);
            text-align: center;
          }
          .card-back .b-categoria {
            width: 100%;
            color: #000000 !important;
            font-family: Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif !important;
            font-weight: 700;
            font-size: 3.1mm;
            text-align: center;
            margin-top: auto;
            margin-bottom: 2mm;
            flex-shrink: 0;
            display: block;
          }
          .card-back .b-bottom {
            width: 100%;
            height: 27%;
            object-fit: contain;
            display: block;
            flex-shrink: 0;
            margin-top: auto;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    await waitForImagesInIframe(doc, 1500);

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error al invocar iframe print batch:', e);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 15000);
    }, 200);
  } catch (err) {
    console.error('Error en printMultipleCardsDirectly:', err);
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
      skipFonts: true,
      fontEmbedCSS: '',
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
