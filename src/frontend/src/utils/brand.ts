export interface BrandConfig {
  name: string;
  shortName: string;
  fullName: string;
  emblem: string;
  logo: string;
  favicon: string;
  networkTitle: string;
  networkSubtitle: string;
  restaurantsSubtitle: string;
  devicesSubtitle: string;
  brandTag: string;
  port: string;
}

export const getBrand = (): BrandConfig => {
  const isMilly = 
    window.location.port === '8102' || 
    window.location.hostname.includes('milly') ||
    window.location.pathname.startsWith('/milly');

  if (isMilly) {
    return {
      name: 'Milly',
      shortName: 'Milly',
      fullName: 'Milly Fast Food',
      emblem: '/milly_emblem.png',
      logo: '/logo_milly_transparent.png',
      favicon: '/milly_favicon.svg',
      networkTitle: 'Milly',
      networkSubtitle: 'Центральное управление экранами и кассами сети Milly',
      restaurantsSubtitle: 'Управление сетью заведений Milly',
      devicesSubtitle: 'Централизованный мониторинг кассового флота Milly',
      brandTag: 'MILLY',
      port: '8102',
    };
  }

  return {
    name: 'Oqtepa Lavash',
    shortName: 'Oqtepa',
    fullName: 'Oqtepa Lavash',
    emblem: '/oqtepa_emblem.svg',
    logo: '/logo_oqtepa_white.svg',
    favicon: '/favicon.svg',
    networkTitle: 'Oqtepa Lavash',
    networkSubtitle: 'Центральное управление экранами и кассами сети Oqtepa Lavash',
    restaurantsSubtitle: 'Управление сетью заведений Oqtepa Lavash',
    devicesSubtitle: 'Централизованный мониторинг кассового флота',
    brandTag: 'OQTEPA',
    port: '8101',
  };
};
