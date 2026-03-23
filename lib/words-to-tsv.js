import fs from "fs";
import OpenAI from "openai";
import { expandDeAbbreviations } from "./de-abbreviations";

const WORDS_PER_CHUNK = 20;

const langFrom = process.env.LANG_FROM;
const langTo = process.env.LANG_TO;
const langContext = process.env.LANG_CONTEXT;
const langBeforeTranslation = process.env.LANG_BEFORE_TRANSLATION;
if (!langFrom || !langTo || !langContext || !langBeforeTranslation) {
  throw new Error(
    "Missing required env vars: LANG_FROM, LANG_TO, LANG_CONTEXT, and LANG_BEFORE_TRANSLATION"
  );
}
const PROMPT = `
I am preparing ${langFrom}-${langTo} vocabulary (${langContext}) for study.
Generate a TSV (tab-separated) file without empty lines and without any extra text, so it can be directly imported into Anki app.

FORMAT
- Ignore duplicates (including nearly identical variants) from the input.
- One line = one card.
- 2 columns only: Front<TAB>Back.
- No tags.
- Do not add empty lines between cards.
- Preserve the order of words from the input list (as much as possible).
- Return raw TSV only.
- Do not wrap the output in a code block.
- Do not add explanations before or after the TSV.

FRONT (what goes on the front side)
- Use lemmanized/base forms of words (e.g. infinitive for verbs, singular for nouns) unless the plural form is more common/well-known. For German nouns, use the form with the article (e.g. "die Katze" etc.).
- Phrases/collocations: base form.
- If entry is "A vs B": keep "A vs B" on the Front.
- If the input is a grammar topic (e.g. "Plusquamperfekt", "Temporale Nebensätze"), put the topic name on the Front.

BACK (second side) — HTML, blocks separated by <hr>
1) Translation into ${langTo}. Append the "${langBeforeTranslation}: " right before the translation.
2) ONLY in case when the translation is not straightforward (e.g. for polysemous words, or words with different meanings in different contexts), add a short explanation of the meaning in the given context using ${langFrom} language. Don't prepend it with "Explanation:" etc.
3) A sample or a couple if multiple meanings. If an example has been provided in the input, use it (but correct grammar if needed). Short samples are preferred. Don't prepend it with "Sample:" etc.

ADDITIONAL RULES:
- For "A vs B" entries, the Back should contain a comparison of A and B, their differences in meaning and usage, and examples for both A and B.
- If a word looks incorrect/questionable, carefully correct it to the most likely proper form and use that.
- Use no abbreviations in the output.

INPUT DATA (list of words/phrases):
`;

const validateTsvChunk = (text) => {
  if (!text) {
    throw new Error("Model returned empty output.");
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0 || lines.some((line) => !line.includes("\t"))) {
    throw new Error("Model output is not valid TSV.");
  }

  return lines;
};

export const wordsToTsv = async (apiKey, inputPath, outputPath) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const textModel = process.env.TEXT_MODEL;
  if (!textModel) {
    throw new Error("Missing required env var: TEXT_MODEL");
  }

  const client = new OpenAI({
    apiKey,
  });

  const raw = fs.readFileSync(inputPath, "utf-8");
  const inputLines = raw
    .split(/\r?\n/)
    .map((line) => expandDeAbbreviations(line))
    .map((line) => line.trim())
    .filter(Boolean);

  const outputLines = [];

  for (let index = 0; index < inputLines.length; index += WORDS_PER_CHUNK) {
    const chunk = inputLines.slice(index, index + WORDS_PER_CHUNK);
    const prompt = `${PROMPT}${chunk.join("\n")}`;
    const response = await client.responses.create({
      model: textModel,
      input: prompt,
      temperature: 0.3,
    });

    const text = response.output_text.trim();
    const lines = validateTsvChunk(text);
    outputLines.push(...lines);
  }

  const outputText = outputLines.join("\n");

  fs.writeFileSync(outputPath, outputText, "utf-8");

  console.log(`TSV generated: ${outputPath}`);
};
