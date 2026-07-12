export interface CountryOption {
  code: string;
  label: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: '', label: '不區分' },
  { code: 'us', label: '美國' },
  { code: 'tw', label: '台灣' },
  { code: 'cn', label: '中國大陸' },
  { code: 'jp', label: '日本' },
  { code: 'kr', label: '韓國' },
];

export function getCountryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
