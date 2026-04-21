import fs from "fs";
import path from "path";
import "./lib/env.js";
import { formatTimestamp } from "./lib/date-utils.js";
import { wordsToTsv } from "./lib/words-to-tsv.js";
import { tsvToHtml } from "./lib/tsv-to-html.js";
import { tsvToMp3 } from "./lib/tsv-to-mp3.js";

const parseBooleanEnv = (value) =>
  ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase());
const hasCliFlag = (flag) => process.argv.includes(flag);

const apiKey = process.env.OPENAI_API_KEY;
const inputPath = process.env.INPUT_PATH;
const startIndexValue = process.env.START_INDEX;
const skipMp3 =
  hasCliFlag("--skip-mp3") || parseBooleanEnv(process.env.SKIP_MP3);
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
const htmlPath = path.join(outputDir, `${timestamp}.html`);

fs.mkdirSync(outputDir, { recursive: true });

try {
  await wordsToTsv(apiKey, inputPath, tsvPath);
  tsvToHtml(tsvPath, htmlPath);

  if (skipMp3) {
    console.log(
      "Skipping MP3 generation because --skip-mp3 or SKIP_MP3 is enabled."
    );
  } else {
    await tsvToMp3(apiKey, tsvPath, startIndexValue);
  }
} catch (err) {
  console.error("Error:", err);
  process.exitCode = 1;
}
