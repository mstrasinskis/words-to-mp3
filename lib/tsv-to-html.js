import fs from "fs";
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
    body {
      margin: 24px;
      font-family: Arial, sans-serif;
      color: #111827;
      background: #ffffff;
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
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
    }
  </style>
</head>
<body>
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
</body>
</html>
`;

export const tsvToHtml = (tsvPath, htmlPath) => {
  const rows = fs
    .readFileSync(tsvPath, "utf-8")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map(buildTableRow)
    .filter(Boolean);

  const html = buildHtmlDocument(rows);
  fs.writeFileSync(htmlPath, html, "utf-8");

  console.log(`HTML generated: ${htmlPath}`);
};
