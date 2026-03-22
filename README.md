# tsv-to-mp3

Converts TSV vocabulary rows formatted for Anki import into MP3 audio files using OpenAI TTS.

Set both `OPENAI_API_KEY` and `TSV_PATH` before running. `START_INDEX` is optional; when provided, it prefixes output files with a zero-padded sequence such as `001.`, `099.`, or `240.`. When omitted, filenames are written without any numeric prefix.

Example:

```bash
OPENAI_API_KEY="your_api_key" TSV_PATH="test.tsv" START_INDEX=1 npm start
```
