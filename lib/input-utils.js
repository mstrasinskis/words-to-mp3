export const parseInputEntries = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }

      if (trimmed.startsWith("#")) {
        const commentText = trimmed.replace(/^#+\s*/, "");
        return commentText ? { type: "comment", text: commentText } : null;
      }

      return { type: "word", text: trimmed };
    })
    .filter(Boolean);
