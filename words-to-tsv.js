import { wordsToTsv } from "./lib/words-to-tsv.js";

const apiKey = process.env.OPENAI_API_KEY;
const inputPath = process.env.INPUT_PATH;
const outputPath = process.env.OUTPUT_PATH;

if (!apiKey || !inputPath || !outputPath) {
  console.error(
    "Missing required env vars: OPENAI_API_KEY, INPUT_PATH, and OUTPUT_PATH.\n" +
      "Example:\n" +
      'OPENAI_API_KEY="your_api_key" INPUT_PATH="input.txt" OUTPUT_PATH="output.tsv" node words-to-tsv.js'
  );
  process.exit(1);
}

try {
  await wordsToTsv(apiKey, inputPath, outputPath);
} catch (err) {
  console.error("Error:", err);
  process.exitCode = 1;
}
