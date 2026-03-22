import fs from "fs";
import OpenAI from "openai";
import { germanTextToFileName } from "./lib/de-file-name.js";
import { expandDeAbbreviations } from "./lib/de-abbreviations.js";
import { cleanHtml, insertTranslationMarker } from "./lib/tts-utils.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const rows = fs.readFileSync("test.tsv", "utf-8").split("\n");
const outputDir = "audio";
const startIndex = Number.parseInt(process.env.START_INDEX ?? "0", 10) || 0;
const translationPattern = /[А-Яа-яЁё]/;
const translationPrefix = "По-русски";

fs.mkdirSync(outputDir, { recursive: true });

let processedCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (const [index, row] of rows.entries()) {
  const rowNumber = index + 1;
  const filenameIndex = String(startIndex + index).padStart(3, "0");
  const [rawCol1, rawCol2] = row.split("\t");
  const col1 = expandDeAbbreviations(cleanHtml(rawCol1 || ""));
  const col2 = expandDeAbbreviations(cleanHtml(rawCol2 || ""));

  if (!col1 || !col2) {
    skippedCount += 1;
    console.log(
      `[row ${rowNumber}/${rows.length}] skipped: missing column data`,
      {
        rawCol1,
        rawCol2,
      }
    );
    continue;
  }

  const text = `${col1}. — ${insertTranslationMarker(
    col2,
    translationPattern,
    translationPrefix
  )}.`;
  const filename = `${outputDir}/${filenameIndex}. ${germanTextToFileName(
    col1
  )}.mp3`;

  console.log(`[row ${rowNumber}/${rows.length}] processing`, {
    file: filename,
    text: text,
  });

  try {
    // throw new Error("Test error"); // for testing error handling
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filename, buffer);

    processedCount += 1;
    console.log(`✅`);
  } catch (error) {
    failedCount += 1;
    console.error(`❌`, {
      term: col1,
      output: filename,
      error,
    });
  }
}

console.log("Finished processing rows", {
  totalRows: rows.length,
  processedCount,
  skippedCount,
  failedCount,
});
