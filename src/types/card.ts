export interface CardData {
  id: string;
  // Front Side
  surnames: string;
  firstNames: string;
  photoUrl: string | null;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  
  // Header
  headerTitleRed: string;
  headerTitleWhite: string;
  customHeaderLogoUrl?: string | null;

  // Club & Middle Logo
  selectedClubId: string;
  clubNameText: string;
  customLogoUrl: string | null;
  logoScale: number;

  // Footer / Bottom Design
  footerType: 'default-yellow-polygon' | 'custom-image' | 'solid-accent' | 'none';
  customFooterUrl: string | null;
  footerHeightMm: number;
  footerColor: string;

  // Back Side
  sloganText: string;
  sloganFont: 'caveat' | 'dancing' | 'alex' | 'marck' | 'inter';
  sloganFontSize: number;
  dateOfBirth: string; // e.g. "16/09/1964"
  dniNumber: string; // e.g. "07557840"
  
  // Back Side Bottom
  socialHandle: string; // e.g. "/Interclubesperu"
  websiteUrl: string; // e.g. "www.interclubesperu.com"
  showSocialIcons: boolean;
  
  // Card appearance settings
  cardCornerRadius: number; // for visual preview (0 for print)
  cardBrightness: number;
  cardContrast: number;
}

export interface PrinterSettings {
  printerModel: string;
  printMode: 'duplex' | 'front-only' | 'back-only';
  dpi: number;
  offsetXmm: number;
  offsetYmm: number;
  scalePercent: number;
  showBleedMarks: boolean;
  darkRibbonOptimization: boolean;
}

export const DEFAULT_CARD_DATA: CardData = {
  id: 'card-1',
  surnames: 'APELLIDO',
  firstNames: 'NOMBRE',
  photoUrl: null, // Will use default sample or user upload
  photoScale: 100,
  photoOffsetX: 0,
  photoOffsetY: 0,

  headerTitleRed: 'INTER',
  headerTitleWhite: 'CLUBES',
  customHeaderLogoUrl: null,

  selectedClubId: '',
  clubNameText: 'NOMBRE DEL CLUB',
  customLogoUrl: null,
  logoScale: 100,

  footerType: 'default-yellow-polygon',
  customFooterUrl: null,
  footerHeightMm: 18,
  footerColor: '#F5A623',

  sloganText: 'Futbol con historias',
  sloganFont: 'caveat',
  sloganFontSize: 28,
  dateOfBirth: 'dd/mm/aaaa',
  dniNumber: '00000000',

  socialHandle: '/Interclubesperu',
  websiteUrl: 'www.interclubesperu.com',
  showSocialIcons: true,

  cardCornerRadius: 3.18, // standard CR80 corner radius in mm
  cardBrightness: 100,
  cardContrast: 100,
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printerModel: 'Zebra ZC300 Series Dual-Sided Card Printer',
  printMode: 'duplex',
  dpi: 300,
  offsetXmm: 0,
  offsetYmm: 0,
  scalePercent: 100,
  showBleedMarks: false,
  darkRibbonOptimization: true,
};
