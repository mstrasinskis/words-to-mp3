export const insertTranslationMarker = (
  input,
  translationPattern,
  translationPrefix
) => {
  if (typeof input !== "string" || !input) return input;

  const match = input.match(translationPattern);
  if (!match) return input;

  const index = match.index;

  const before = input.slice(0, index).trimEnd();
  const after = input.slice(index);

  // Use "..." to insert extra pause
  return `${before}... \n ${translationPrefix}: ${after}...`;
};
