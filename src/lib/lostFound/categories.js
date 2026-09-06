export const LOST_FOUND_CATEGORIES = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'documents', label: 'Documents' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'books', label: 'Books' },
  { id: 'keys', label: 'Keys' },
  { id: 'other', label: 'Other' },
];

export function categoryLabel(categoryId) {
  return LOST_FOUND_CATEGORIES.find((c) => c.id === categoryId)?.label ?? 'Other';
}
