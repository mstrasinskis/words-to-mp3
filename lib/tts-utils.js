import { htmlToText } from "html-to-text";

export const htmlToPlainText = (text) =>
  htmlToText(text, {
    wordwrap: false,
  })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

export const cleanHtml = (text) =>
  htmlToPlainText(text)
    .replace(/\n*-{3,}\n*/g, " ... ")
    .replace(/\n+/g, " ... ")
    .replace(/\s+/g, " ")
    .trim();
