const ABBREVIATIONS = [
  [/\bvs\.?/gi, "oder"],
  [/\bjdm\.\b/gi, "jemandem"],
  [/\bjdn\.\b/gi, "jemanden"],
  [/\betw\.\b/gi, "etwas"],
  [/\bSg\.\b/gi, "Singular"],
  [/\bPl\.\b/gi, "Plural"],
  [/\bAdj\.-Suffix\b/gi, "Adjektivsuffix"],
  [/\bAdj\.\b/gi, "Adjektiv"],
  [/\bAdv\.\b/gi, "Adverb"],
  [/\bfem\.\b/gi, "feminin"],
  [/\bmask\.\b/gi, "maskulin"],
  [/\bneut\.\b/gi, "neutrum"],
  [/\btyp\.\b/gi, "typischerweise"],
  [/\bggf\.\b/gi, "gegebenenfalls"],
  [/\bz\.\s*B\.\b/gi, "zum Beispiel"],
  [/\bbzw\.\b/gi, "beziehungsweise"],
  [/\bca\.\b/gi, "circa"],
  [/\bu\.\s*a\.\b/gi, "unter anderem"],

  [/\+ ?D\b/gi, "plus Dativ"],
  [/\+ ?Dat\b/gi, "plus Dativ"],
  [/\+ ?Akk\b/gi, "plus Akkusativ"],
  [/\+ ?A\b/gi, "plus Akkusativ"],
  [/\+ ?G\b/gi, "plus Genitiv"],

  [/\bim\b/gi, "in dem"],
  [/\bins\b/gi, "in das"],
  [/\bvom\b/gi, "von dem"],
  [/\bam\b/gi, "an dem"],
];

export const expandDeAbbreviations = (input = "") =>
  ABBREVIATIONS.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, replacement);
  }, input);