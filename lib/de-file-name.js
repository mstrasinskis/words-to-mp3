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

export const germanTextToFileName = (input) => {
  if (!input || typeof input !== "string") return "";

  let s = input.trim();

  // 1) remove bracketed grammar/meta info like "(+ Akk.)", "(ugs.)", "(pl.)"
  s = s.replace(/\([^)]*\)/g, " ");

  // 2) expand a few common abbreviations before cleanup
  // const replacements = [
  //   [/\betw\.\s*\/\s*jdn\./gi, "etwas oder jemandem"],
  //   [/\bjdn\.\s*\/\s*etw\./gi, "jemandem oder etwas"],
  //   [/\betw\./gi, "etwas"],
  //   [/\bjdn\./gi, "jemandem"],
  //   [/\bjdm\./gi, "jemandem"],
  //   [/\bjmd\./gi, "jemand"],
  //   [/\bsg\./gi, "sich"],
  // ];

  // for (const [pattern, value] of replacements) {
  //   s = s.replace(pattern, value);
  // }

  // 3) remove remaining unknown abbreviations like "ugs.", "fig.", "z.B.", etc.
  //    heuristic: tokens containing letters and ending with a dot
  // s = s.replace(/\b[\p{L}]{1,10}\.(?:\/[\p{L}]{1,10}\.)?\b/gu, " ");

  // 4) German umlauts / Eszett
  s = s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");

  // 5) normalize separators and remove unsafe filename chars
  s = s
    .replace(/[\/\\|:;,.!?'"`´^~*+=<>[\]{}]/g, " ")
    .replace(/&/g, " und ")
    .replace(/@/g, " at ")
    .replace(/#/g, " ")
    .replace(/%/g, " Prozent ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 6) remove anything still risky for filenames, keep letters/numbers/space/_/-
  s = s.replace(/[^\p{L}\p{N} _-]/gu, "");

  // 7) turn spaces into underscores
  s = s.replace(/\s+/g, "_");

  // 8) collapse repeated underscores/hyphens and trim them
  s = s
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[_-]+|[_-]+$/g, "");

  // 9) avoid reserved / empty-ish results
  if (!s) return "untitled";

  return s;
};
