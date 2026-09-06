import { useLostFoundBackend } from './index';

const CANNED_GUESSES = [
  {
    suggestedTitle: 'Black backpack with a front pocket',
    suggestedCategory: 'accessories',
    suggestedDescription: 'Photographed on campus — looks worn at the corners, no visible tags.',
  },
  {
    suggestedTitle: 'Silver wired earphones',
    suggestedCategory: 'electronics',
    suggestedDescription: 'Photographed on campus — a pair of earphones, cable slightly tangled.',
  },
  {
    suggestedTitle: 'Blue spiral notebook',
    suggestedCategory: 'books',
    suggestedDescription: 'Photographed on campus — a notebook with a few pages dog-eared.',
  },
  {
    suggestedTitle: 'Bunch of keys on a ring',
    suggestedCategory: 'keys',
    suggestedDescription: 'Photographed on campus — a small set of keys, one looks like a padlock key.',
  },
  {
    suggestedTitle: 'Grey hooded sweatshirt',
    suggestedCategory: 'clothing',
    suggestedDescription: 'Photographed on campus — a hoodie, looks like a medium.',
  },
];

let nextGuessIndex = 0;

async function mockAnalyzePhoto(_imageUri) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const guess = CANNED_GUESSES[nextGuessIndex % CANNED_GUESSES.length];
  nextGuessIndex += 1;
  return { ...guess };
}

async function realAnalyzePhoto(_imageUri) {
  // TODO: upload the image (Cloud Storage) and call a real vision/captioning API,
  // TODO: then map its output to { suggestedTitle, suggestedCategory, suggestedDescription }.
  throw new Error(
    'photoAnalyzer: real analysis not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.'
  );
}

export async function analyzePhoto(imageUri) {
  return useLostFoundBackend() === 'firestore'
    ? realAnalyzePhoto(imageUri)
    : mockAnalyzePhoto(imageUri);
}
