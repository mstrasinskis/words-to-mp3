# words-to-mp3

Generate study materials from a plain text word list (each line contains one word):

- a timestamped `.tsv` file ready to import into Anki app
- a timestamped `.html` table with plain-text cells
- one `.mp3` file per TSV row (word) for listening practice (includes meta data)

The entry point is `index.js`.

**Note:** requires [OpenAi API key](https://platform.openai.com/api-keys)

## Install dependencies:

```bash
npm install
```

## Run

```bash
INPUT_PATH="file_with_words.txt" npm start
```

## What It Does

This project takes an input file where each line contains one word, phrase, or grammar topic. It then:

1. sends the list to an OpenAI text model to generate a 2-column TSV (`Front<TAB>Back`)
2. converts that TSV into a 3-column HTML table (`Original Word | Samples | Translation`)
3. saves the TSV and HTML files into the `output/` directory
4. converts each TSV row into an MP3 file using OpenAI text-to-speech
5. appends silence at the end of each MP3
6. writes MP3 metadata such as title, track number, album, and voice/model info

The TSV is designed for Anki import. The MP3 files are meant for learning vocabulary by listening.

## Input Format

Prepare a text file with one item per line, for example:

```txt
die Bewerbung
überzeugen
zuverlässig
Plusquamperfekt
```

Set `INPUT_PATH` to that file.

## Setup

Create/update a `.env` or `.env.local` file:

```env
OPENAI_API_KEY=your_api_key_here

INPUT_PATH=_words.txt
START_INDEX=1

LANG_FROM=de
LANG_TO=en, ru
LANG_CONTEXT=Erfolgreich in Beruf, Business, B2 Niveau
LANG_BEFORE_TRANSLATION=English, Russian

TEXT_MODEL=gpt-4.1-mini
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=marin
TTS_AFTER_SILENCE_SECONDS=1.75
```

## Important Environment Variables

- `OPENAI_API_KEY`: OpenAI API key
- `INPUT_PATH`: path to the source word list file

- `LANG_FROM`: source language, for example `de`
- `LANG_TO`: one or more target languages as a comma-separated list, for example `en` or `en, ru`
- `LANG_CONTEXT`: study context used to shape translations and examples

- `TTS_VOICE`: TTS voice, for example `marin`
  - For available TTS voices, see the OpenAI docs:
    [Text-to-speech voice options](https://developers.openai.com/api/docs/guides/text-to-speech#voice-options)
- `TTS_AFTER_SILENCE_SECONDS`: number of seconds of silence appended to each MP3
- `LANG_BEFORE_TRANSLATION`: optional label prefix for the translation block; for multiple targets you can provide a comma-separated list aligned with `LANG_TO`, for example `English, Russian`
- `TTS_AFTER_SILENCE_SECONDS=1.75`
- `START_INDEX`: if set, MP3 filenames get a zero-padded numeric prefix such as `001`, `002`, `003`

## Output

Files are created in the `output/` directory:

- `YYYY-MM-DD_HH-MM-SS.tsv`: generated TSV for Anki import
- `YYYY-MM-DD_HH-MM-SS.html`: generated HTML table with `Original Word`, `Samples`, and `Translation` columns
- `die Bewerbung.mp3`, `überzeugen.mp3`, etc.

## TSV Structure

Each TSV row contains:

- `Front`: the normalized vocabulary item or topic
- `Back`: HTML content that may include
  - one or more translations
  - a short explanation when needed
  - one or more short examples

The MP3 generation step converts the TSV HTML into plain speech-friendly text before calling TTS.

## HTML Structure

The generated HTML file contains one table with three plain-text columns:

- `Original Word`: the normalized front-side term
- `Samples`: examples and any extra context from the TSV back side
- `Translation`: the translation block from the TSV back side

The table cells contain text only. Any TSV HTML fragments such as `<hr>` and `<br>` are converted into plain text before being written into the HTML table.
