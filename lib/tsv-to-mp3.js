import fs from "fs";
import filenamify from "filenamify";
import OpenAI from "openai";
import { expandDeAbbreviations } from "./de-abbreviations.js";
import { cleanHtml } from "./tts-utils.js";

export const tsvToMp3 = async (apiKey, tsvPath, startIndexValue) => {
  const ttsModel = process.env.TTS_MODEL;
  const ttsVoice = process.env.TTS_VOICE;

  if (!ttsModel || !ttsVoice) {
    throw new Error("Missing required env vars: TTS_MODEL and TTS_VOICE");
  }

  const openai = new OpenAI({ apiKey });
  const rows = fs.readFileSync(tsvPath, "utf-8").split("\n");
  const outputDir = "output";
  const startIndex =
    startIndexValue === undefined || startIndexValue.trim() === ""
      ? null
      : Number.parseInt(startIndexValue, 10);

  fs.mkdirSync(outputDir, { recursive: true });

  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;
    const filenamePrefix =
      Number.isNaN(startIndex) || startIndex === null
        ? ""
        : `${String(startIndex + index).padStart(3, "0")} `;
    const [rawCol1, rawCol2] = row.split("\t");
    const col1 = cleanHtml(rawCol1 || "");
    const col2 = cleanHtml(rawCol2 || "");

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

    const text = `${col1}... ${col2}...`;
    const fileName = filenamify(col1, { replacement: " " }) || `${rowNumber}`;
    const filePath = `${outputDir}/${filenamePrefix}${fileName}.mp3`;

    console.log(`[row ${rowNumber}/${rows.length}] processing`, {
      file: filePath,
      text: text,
    });

    try {
      const response = await openai.audio.speech.create({
        model: ttsModel,
        voice: ttsVoice,
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      processedCount += 1;
      console.log(`✅`);
    } catch (error) {
      failedCount += 1;
      console.error(`❌`, {
        term: col1,
        output: filePath,
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
};
