import fs from "fs";
import OpenAI from "openai";

const WORDS_PER_CHUNK = 20;
const MAX_VALIDATE_RETRIES = 5;

const buildPrompt = ({
  langFrom,
  langTo,
  langContext,
  langBeforeTranslation,
}) => {
  const translationPrefixRule = !langBeforeTranslation
    ? ""
    : `Insert the "${langBeforeTranslation}: " right before the translation.`;

  return `
I am preparing ${langFrom}-${langTo} vocabulary (${langContext}) for study.
Generate a TSV (tab-separated) file without empty lines and without any extra text, so it can be directly imported into Anki app.

FORMAT
- One input line = one card. Cards are separated by new lines ("\\n").
- Each card has 2 columns: Front and Back, separated by a tab character ("\\t").
- 2 columns only: Front<TAB>Back<NEW_LINE>.
- Do not add empty lines between cards.
- Return raw TSV only.
- Do not add explanations before or after the TSV.

FRONT (what goes on the front side)
- Use lemmanized/base forms of words (e.g. infinitive for verbs, singular for nouns) unless the plural form is more common/well-known. For German nouns, use the form with the article (e.g. "die Katze" etc.).
- If a German noun has no article, add the correct one to the front side.
- If the input is a grammar topic (e.g. "Plusquamperfekt", "Temporale Nebensätze"), put the topic name on the Front.
- If a word looks incorrect/questionable, carefully correct it to the most likely proper form and use that.

BACK (second side) — HTML, blocks separated by <hr>
1. ONLY in case when the translation is not straightforward (e.g. for polysemous words, or words with different meanings in different contexts), add a short explanation of the meaning in the given context using ${langFrom} language. Don't prepend it with "Explanation:" etc.
2. A sample or a couple if multiple meanings. If an example has been provided in the input, use it (but correct grammar if needed). Short samples are preferred. Don't prepend it with "Sample:" etc.
3. Translation into ${langTo}. ${translationPrefixRule}
- For "A vs B" entries, the Back should contain a comparison of A and B, their differences in meaning and usage, and examples for both A and B.

GENERAL RULES:
- Use full words instead of abbreviations for both Front and Back sides.

INPUT DATA (list of words/phrases):
`;
};

const validateTsvChunk = (text, chunk) => {
  if (!text) {
    throw new Error("Model returned empty output.");
  }
  if (text.split("\n").length < chunk.length) {
    throw new Error(
      `Model output (${text.split("\n").length} lines) has fewer lines than the input chunk (${chunk.length} lines).\n Output:\n\n${text}`
    );
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

  const langFrom = process.env.LANG_FROM;
  const langTo = process.env.LANG_TO;
  const langContext = process.env.LANG_CONTEXT;
  const textModel = process.env.TEXT_MODEL;
  const langBeforeTranslation = process.env.LANG_BEFORE_TRANSLATION;
  if (!langFrom || !langTo || !langContext || textModel === undefined) {
    throw new Error(
      "Missing required env vars: LANG_FROM, LANG_TO, LANG_CONTEXT, TEXT_MODEL"
    );
  }
  const promptPrefix = buildPrompt({
    langFrom,
    langTo,
    langContext,
    langBeforeTranslation,
  });

  const client = new OpenAI({
    apiKey,
  });

  const raw = fs.readFileSync(inputPath, "utf-8");
  const inputLines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const outputLines = [];

  for (let index = 0; index < inputLines.length; index += WORDS_PER_CHUNK) {
    const chunk = inputLines.slice(index, index + WORDS_PER_CHUNK);
    const prompt = `${promptPrefix}${chunk.join("\n")}`;
    let validatedLines;

    for (let attempt = 0; attempt <= MAX_VALIDATE_RETRIES; attempt += 1) {
      const response = await client.responses.create({
        model: textModel,
        input: prompt,
        // Keep it low to preserve the TSV format
        temperature: 0.3,
      });

      const text = response.output_text.trim();
      console.log("text response received", {
        chunkStart: index,
        chunkEnd: index + WORDS_PER_CHUNK,
        attempt: attempt + 1,
        textLength: text.length,
        text,
      });

      try {
        validatedLines = validateTsvChunk(text, chunk);
        // If validation passed, no need to retry
        break;
      } catch (error) {
        if (attempt === MAX_VALIDATE_RETRIES) throw error;

        console.warn("TSV validation failed, retrying chunk", {
          chunkStart: index,
          chunkEnd: index + WORDS_PER_CHUNK,
          attempt: attempt + 1,
          retriesRemaining: MAX_VALIDATE_RETRIES - attempt,
          error: error.message,
        });
      }
    }

    outputLines.push(...validatedLines);
  }

  const outputText = outputLines.join("\n");

  fs.writeFileSync(outputPath, outputText, "utf-8");

  console.log(`TSV generated: ${outputPath}`);
};
