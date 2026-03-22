import fs from "fs";
import path from "path";
import { formatTimestamp } from "./lib/date-utils.js";
import { wordsToTsv } from "./lib/words-to-tsv.js";
import { tsvToMp3 } from "./lib/tsv-to-mp3.js";

const apiKey = process.env.OPENAI_API_KEY;
const inputPath = process.env.INPUT_PATH;
const startIndexValue = process.env.START_INDEX;
const outputDir = "output";

if (!apiKey || !inputPath) {
  console.error(
    "Missing required env vars: OPENAI_API_KEY and INPUT_PATH.\n" +
      "Example:\n" +
      'OPENAI_API_KEY="your_api_key" INPUT_PATH="input.txt" START_INDEX=1 node words-to-mp3.js'
  );
  process.exit(1);
}

const timestamp = formatTimestamp(new Date());
const tsvPath = path.join(outputDir, `${timestamp}.tsv`);

fs.mkdirSync(outputDir, { recursive: true });

try {
  await wordsToTsv(apiKey, inputPath, tsvPath);
  await tsvToMp3(apiKey, tsvPath, startIndexValue);
} catch (err) {
  console.error("Error:", err);
  process.exitCode = 1;
}
