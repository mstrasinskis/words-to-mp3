import { htmlToText } from "html-to-text";

export const cleanHtml = (text) =>
  htmlToText(text, {
    wordwrap: false,
  })
    .replace(/\n*-{3,}\n*/g, " ... ")
    .replace(/\n+/g, " ... ")
    .replace(/\s+/g, " ")
    .trim();
