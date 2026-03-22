import fs from "fs";
import OpenAI from "openai";

const PROMPT = `
I am preparing German vocabulary (Erfolgreich in Beruf B2) for study.
Generate a TSV (tab-separated) file without empty lines and without any extra text, so I can directly import it into Anki.

FORMAT
- One line = one card.
- 2 columns: Front<TAB>Back
- No tags/third column.
- Do not add empty lines between cards.
- Remove duplicates (including nearly identical variants).
- Preserve the order of words from the input list (as much as possible).
- Return raw TSV only.
- Do not wrap the output in a code block.
- Do not add explanations before or after the TSV.

FRONT (what goes on the front side)
- Noun: "der/die/das Wort, die Pluralform" (if plural is rare/none — indicate "kein Plural").
- Verb: infinitive + valency/government (cases/prepositions) in a short form.
  Example: "sich (Dat.) etwas (Akk.) zutrauen" / "erstatten (Akk.: Kosten/Auslagen)".
- Preposition/conjunction/connector: form + government (Akk/Dativ/Genitiv or "mit Nebensatz").
- Phrases/collocations: base form (as used in business language).
- If entry is "A vs B": keep "A vs B" on the Front.

BACK (second side) — HTML, blocks separated by <hr>
1) Beispiele (2–4):
  - Only work/official/business contexts (email, meeting, HR, project, contract, processes, deadlines, clients).
  - From input (if an example is provided), use at least 1 example, but correct grammar if needed.
  - Highlight the target word/phrase in bold: <b>...</b>.
2) Grammatik (optional):
  - Brief: part of speech + key valency/features (separability, reflexivity, typical construction).
3) Bedeutung (DE):
  - Definition in German (focus on professional/business meaning).
4) RU:
  - Translation into Russian (in business meaning) + explanation (if non-trivial) + 1–2 close synonyms (if helpful).
  - It is crucial to place the Russian translation (if provided) at the end of the back side.

ADDITIONAL RULES:
- Register: neutral-polite (Sie) when referring to emails/clients; otherwise neutral.
- Prefer typical business phrases (e.g. "Könnten wir…", "Bitte…", "im Zuge dessen…", "kurzfristig…").
- If a term has multiple meanings: focus on the most common office-related meaning.
- If a word looks incorrect/questionable, carefully correct it to the most likely proper form and use that.
- If it is a “... form” (e.g. "fahren form"):
  - Back contains only: "er/sie/es …, Präteritum, Perfekt" (without the blocks).
- If the input is a grammar topic (e.g. "Plusquamperfekt", "Temporale Nebensätze"):
  - Back: short explanation + 2–4 examples (also with <b>...</b> for key element), without the block structure.

ONLY A VALID TSV WITHOUT ANY EXTRA TEXT OR EXPLANATIONS! I will import it directly into Anki.

INPUT DATA (list of words/phrases):
`;

export const wordsToTsv = async (apiKey, inputPath, outputPath) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const client = new OpenAI({
    apiKey,
  });

  const raw = fs.readFileSync(inputPath, "utf-8");
  const inputData = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const prompt = `${PROMPT}${inputData}`;
  const response = await client.responses.create({
    // model: "gpt-5.4",
    model: "gpt-5.4-mini",
    input: prompt,
    temperature: 0.3,
  });

  const text = response.output_text.trim();

  if (!text) {
    throw new Error("Model returned empty output.");
  }

  // Basic validation
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0 || lines.some((line) => !line.includes("\t"))) {
    throw new Error("Model output is not valid TSV.");
  }

  fs.writeFileSync(outputPath, text, "utf-8");

  console.log(`TSV generated: ${outputPath}`);
};
