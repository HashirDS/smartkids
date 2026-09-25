// Arabic letters for the Qaida lesson (Noorani Qaida, lessons 1 and 3: letters, then zabar/zer/pesh).
// Progress is saved with the letter itself as the item.
export const ARABIC_LETTERS = [
  { letter: 'ا', name: 'أَلِف', latin: 'Alif' },
  { letter: 'ب', name: 'بَاء', latin: 'Baa' },
  { letter: 'ت', name: 'تَاء', latin: 'Taa' },
  { letter: 'ث', name: 'ثَاء', latin: 'Thaa' },
  { letter: 'ج', name: 'جِيم', latin: 'Jeem' },
  { letter: 'ح', name: 'حَاء', latin: 'Haa' },
  { letter: 'خ', name: 'خَاء', latin: 'Khaa' },
  { letter: 'د', name: 'دَال', latin: 'Daal' },
  { letter: 'ذ', name: 'ذَال', latin: 'Dhaal' },
  { letter: 'ر', name: 'رَاء', latin: 'Raa' },
  { letter: 'ز', name: 'زَاي', latin: 'Zaay' },
  { letter: 'س', name: 'سِين', latin: 'Seen' },
  { letter: 'ش', name: 'شِين', latin: 'Sheen' },
  { letter: 'ص', name: 'صَاد', latin: 'Saad' },
  { letter: 'ض', name: 'ضَاد', latin: 'Daad' },
  { letter: 'ط', name: 'طَاء', latin: 'Taa' },
  { letter: 'ظ', name: 'ظَاء', latin: 'Dhaa' },
  { letter: 'ع', name: 'عَين', latin: 'Ayn' },
  { letter: 'غ', name: 'غَين', latin: 'Ghayn' },
  { letter: 'ف', name: 'فَاء', latin: 'Faa' },
  { letter: 'ق', name: 'قَاف', latin: 'Qaaf' },
  { letter: 'ك', name: 'كَاف', latin: 'Kaaf' },
  { letter: 'ل', name: 'لَام', latin: 'Laam' },
  { letter: 'م', name: 'مِيم', latin: 'Meem' },
  { letter: 'ن', name: 'نُون', latin: 'Noon' },
  { letter: 'و', name: 'وَاو', latin: 'Waaw' },
  { letter: 'ه', name: 'هَاء', latin: 'Haa' },
  { letter: 'ء', name: 'هَمْزَة', latin: 'Hamzah' },
  { letter: 'ي', name: 'يَاء', latin: 'Yaa' },
];

const FATHA = 'َ';
const KASRA = 'ِ';
const DAMMA = 'ُ';

// Zabar, zer and pesh on a letter (alif carries hamzah for these sounds: أَ إِ أُ).
export const harakatFor = (letter) => {
  if (letter === 'ا') return [`أ${FATHA}`, `إ${KASRA}`, `أ${DAMMA}`];
  return [letter + FATHA, letter + KASRA, letter + DAMMA];
};
