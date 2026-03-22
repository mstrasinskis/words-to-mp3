export const germanTextToFileName = (input) => {
  if (!input || typeof input !== "string") return "";

  let s = input.trim();

  // 1) German umlauts / Eszett
  s = s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");

  // 2) normalize separators and remove unsafe filename chars
  s = s
    .replace(/[\/\\|:;,.!?'"`´^~*+=<>[\]{}]/g, " ")
    .replace(/&/g, " und ")
    .replace(/@/g, " at ")
    .replace(/#/g, " ")
    .replace(/%/g, " Prozent ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 3) remove anything still risky for filenames, keep letters/numbers/space/_/-
  s = s.replace(/[^\p{L}\p{N} _-]/gu, "");

  // 4) turn spaces into underscores
  s = s.replace(/\s+/g, "_");

  // 5) collapse repeated underscores/hyphens and trim them
  s = s
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[_-]+|[_-]+$/g, "");

  // 6) avoid reserved / empty-ish results
  if (!s) return "untitled";

  return s;
};
