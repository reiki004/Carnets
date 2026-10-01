import { toPng } from 'html-to-image';

/**
 * Triggers standard browser print dialog.
 * The CSS in index.css / print media will format page 1 (Front) and page 2 (Back)
 * at exactly 53.98mm x 85.6mm (CR80 standard) for Zebra ZC300 drivers.
 */
export const triggerBrowserPrint = () => {
  window.print();
};

/**
 * Generates a high-resolution 300 DPI PNG of the specified DOM element.
 * Standard CR-80 card at 300 DPI is ~ 638 x 1012 px.
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
