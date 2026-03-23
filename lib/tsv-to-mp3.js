import fs from "fs";
import filenamify from "filenamify";
import OpenAI from "openai";
import { addMp3Metadata } from "./add-mp3-meta-data.js";
import { appendSilenceToMp3 } from "./append-silence-to-mp3.js";
import { cleanHtml } from "./tts-utils.js";

export const tsvToMp3 = async (apiKey, tsvPath, startIndexValue = "") => {
  const ttsModel = process.env.TTS_MODEL;
  const ttsVoice = process.env.TTS_VOICE;
  const langContext = process.env.LANG_CONTEXT;

  if (!ttsModel || !ttsVoice || !langContext) {
    throw new Error(
      "Missing required env vars: TTS_MODEL, TTS_VOICE, and LANG_CONTEXT"
    );
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
    const itemIndex =
      Number.isNaN(startIndex) || startIndex === null
        ? rowNumber
        : startIndex + index;
    const filenamePrefix =
      Number.isNaN(startIndex) || startIndex === null
        ? ""
        : `${String(itemIndex).padStart(3, "0")} `;
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
      const mp3WithSilence = await appendSilenceToMp3(buffer);
      const taggedMp3 = addMp3Metadata({
        mp3Buffer: mp3WithSilence,
        itemIndex,
        title: col1,
        album: langContext,
        artist: `${ttsModel} / ${ttsVoice}`,
      });
      fs.writeFileSync(filePath, taggedMp3);

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
