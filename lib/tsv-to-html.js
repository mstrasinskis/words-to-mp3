import fs from "fs";
import { parseInputEntries } from "./input-utils.js";
import { htmlToPlainText } from "./tts-utils.js";

const trimCellText = (text) => text.trim();

const splitHtmlBlocks = (text) =>
  text
    .split(/<hr\s*\/?>/i)
    .map((block) => block.trim())
    .filter(Boolean);

const parseTsvRow = (row) => {
  const tabIndex = row.indexOf("\t");
  if (tabIndex === -1) {
    return null;
  }

  return {
    front: row.slice(0, tabIndex),
    back: row.slice(tabIndex + 1),
  };
};

const buildCommentRow = (text) => {
  const comment = trimCellText(text);
  if (!comment) {
    return null;
  }

  return `<tr class="comment-row">
  <td colspan="3">${comment}</td>
</tr>`;
};

const buildTableRow = (row) => {
  const parsedRow = parseTsvRow(row);
  if (!parsedRow) {
    return null;
  }

  const blocks = splitHtmlBlocks(parsedRow.back);
  const word = trimCellText(htmlToPlainText(parsedRow.front));
  const translation = trimCellText(htmlToPlainText(blocks[0] || ""));
  const samples = blocks
    .slice(1)
    .map((block) => trimCellText(htmlToPlainText(block)))
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (!word && !translation && !samples) {
    return null;
  }

  return `<tr>
  <td>${word}</td>
  <td>${samples}</td>
  <td>${translation}</td>
</tr>`;
};

const buildHtmlDocument = (rows) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vocabulary Export</title>
  <style>
    :root {
      --table-font-size: 16px;
    }

    body {
      margin: 24px;
      font-family: Arial, sans-serif;
      font-size: var(--table-font-size);
      color: #111827;
      background: #ffffff;
    }

    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }

    .controls button {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      color: #111827;
      cursor: pointer;
      font: inherit;
    }

    .controls__label {
      color: #4b5563;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 10px 12px;
      border-top: 1px solid #d1d5db;
      text-align: left;
      vertical-align: top;
      line-height: 1.5em;
      white-space: pre-line;
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
    }

    tbody td:first-child {
      font-size: 1.15em;
      word-break: break-word;
    }

    .comment-row td {
      font-size: 1em;
      font-weight: 600;
      background: #f9fafb;
    }

    @media print {
      body {
        margin: 0;
        font-size: var(--table-font-size);
      }

      .controls {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <span class="controls__label">Text size</span>
    <button type="button" data-font-size-step="-1">A-</button>
    <button type="button" data-font-size-reset>Reset</button>
    <button type="button" data-font-size-step="1">A+</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>Original Word</th>
        <th>Samples</th>
        <th>Translation</th>
      </tr>
    </thead>
    <tbody>
${rows.map((row) => `      ${row}`).join("\n")}
    </tbody>
  </table>
  <script>
    (() => {
      const root = document.documentElement;
      const minFontSize = 6;
      const maxFontSize = 100;
      const stepSize = 2;
      const defaultFontSize = 16;

      const setFontSize = (value) => {
        const nextValue = Math.min(maxFontSize, Math.max(minFontSize, value));
        root.style.setProperty("--table-font-size", nextValue + "px");
      };

      document.querySelectorAll("[data-font-size-step]").forEach((button) => {
        button.addEventListener("click", () => {
          const currentValue =
            Number.parseInt(
              getComputedStyle(root).getPropertyValue("--table-font-size"),
              10
            ) || defaultFontSize;
          const direction = Number.parseInt(button.dataset.fontSizeStep, 10);

          setFontSize(currentValue + direction * stepSize);
        });
      });

      document
        .querySelector("[data-font-size-reset]")
        ?.addEventListener("click", () => {
          setFontSize(defaultFontSize);
        });
    })();
  </script>
</body>
</html>
`;

const buildRowsWithComments = (tsvRows, inputEntries) => {
  if (!inputEntries) {
    return tsvRows.map(buildTableRow).filter(Boolean);
  }

  const rows = [];
  let tsvRowIndex = 0;

  for (const entry of inputEntries) {
    if (entry.type === "comment") {
      rows.push(buildCommentRow(entry.text));
      continue;
    }

    rows.push(buildTableRow(tsvRows[tsvRowIndex]));
    tsvRowIndex += 1;
  }

  while (tsvRowIndex < tsvRows.length) {
    rows.push(buildTableRow(tsvRows[tsvRowIndex]));
    tsvRowIndex += 1;
  }

  return rows.filter(Boolean);
};

export const tsvToHtml = (tsvPath, htmlPath, inputPath = "") => {
  const tsvRows = fs
    .readFileSync(tsvPath, "utf-8")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  const inputEntries = !inputPath
    ? null
    : parseInputEntries(fs.readFileSync(inputPath, "utf-8"));
  const rows = buildRowsWithComments(tsvRows, inputEntries);

  const html = buildHtmlDocument(rows);
  fs.writeFileSync(htmlPath, html, "utf-8");

  console.log(`HTML generated: ${htmlPath}`);
};
