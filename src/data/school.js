// Shared lists for school, class and lesson screens.
export const LEVELS = [
  { key: 'preschool', label: 'Preschool' },
  { key: 'nursery', label: 'Nursery' },
  { key: 'prep', label: 'Prep' },
  { key: 'kg1', label: 'KG1' },
];

export const levelLabel = (key) => LEVELS.find((l) => l.key === key)?.label || key || '';

export const LESSONS = [
  { key: 'abc', label: 'ABC' },
  { key: 'numbers', label: 'Numbers' },
  { key: 'shapes', label: 'Shapes' },
  { key: 'colors', label: 'Colors' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'drawing', label: 'Drawing' },
  { key: 'poems', label: 'Poems' },
  { key: 'flags', label: 'Flags' },
  { key: 'urdu', label: 'Urdu Alphabet' },
  { key: 'arabic', label: 'Arabic Qaida' },
  { key: 'quiz', label: 'Quiz' },
];
