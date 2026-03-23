import { htmlToText } from "html-to-text";

export const cleanHtml = (text) =>
  htmlToText(text, {
    wordwrap: false,
    selectors: [
      {
        selector: "hr",
        format: "inline",
        options: {
          prefix: " ... ",
          suffix: " ",
        },
      },
      {
        selector: "br",
        format: "inline",
        options: {
          prefix: " ... ",
          suffix: " ",
        },
      },
    ],
  }).trim();
