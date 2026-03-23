import { ID3Writer } from "browser-id3-writer";

export const addMp3Metadata = ({
  mp3Buffer,
  itemIndex,
  title,
  album,
  artist,
}) => {
  const writer = new ID3Writer(mp3Buffer);

  writer
    .setFrame("TRCK", String(itemIndex))
    .setFrame("TIT2", title)
    .setFrame("TALB", album)
    .setFrame("TPE1", [artist]);
  writer.addTag();

  return Buffer.from(writer.arrayBuffer);
};
