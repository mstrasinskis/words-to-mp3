import { tsvToMp3 } from "./lib/tsv-to-mp3.js";

const apiKey = process.env.OPENAI_API_KEY;
const tsvPath = process.env.TSV_PATH;
const startIndexValue = process.env.START_INDEX;

if (!apiKey || !tsvPath) {
  console.error(
    "Missing required env vars: OPENAI_API_KEY and TSV_PATH.\n" +
      "Example:\n" +
      'OPENAI_API_KEY="your_api_key" TSV_PATH="test.tsv" START_INDEX=1 npm start'
  );
  process.exit(1);
}

await tsvToMp3(apiKey, tsvPath, startIndexValue);
