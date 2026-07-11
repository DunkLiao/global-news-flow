export interface CategoryOption {
  /** Empty string means "all" (omit category param for top-headlines) */
  id: string;
  label: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: '', label: '全部' },
  { id: 'business', label: '商業' },
  { id: 'technology', label: '科技' },
  { id: 'science', label: '科學' },
  { id: 'health', label: '健康' },
  { id: 'entertainment', label: '娛樂' },
  { id: 'sports', label: '體育' },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? '全部';
}
