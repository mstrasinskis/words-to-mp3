import fs from "fs";
import audioDecode from "audio-decode";
import { createRequire } from "module";
import vm from "vm";

const MP3_BITRATE_KBPS = 128;
const MP3_FRAME_SIZE = 1152;
const require = createRequire(import.meta.url);

let cachedLamejs;

const getLamejs = () => {
  if (cachedLamejs) {
    return cachedLamejs;
  }

  const bundledLamejs = fs.readFileSync(require.resolve("lamejs/lame.all.js"), {
    encoding: "utf8",
  });
  const context = vm.createContext({});
  vm.runInContext(bundledLamejs, context);
  cachedLamejs = context.lamejs;

  return cachedLamejs;
};

const float32ToInt16 = (samples) => {
  const pcm = new Int16Array(samples.length);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm;
};

export const appendSilenceToMp3 = async (mp3Buffer) => {
  const silenceDurationSeconds = Number.parseFloat(
    process.env.TTS_AFTER_SILENCE_SECONDS
  );

  if (Number.isNaN(silenceDurationSeconds)) {
    throw new Error("Missing required env var: TTS_AFTER_SILENCE_SECONDS");
  }

  const audioBuffer = await audioDecode(mp3Buffer);
  const { sampleRate, numberOfChannels, length } = audioBuffer;
  const silenceSamples = Math.round(sampleRate * silenceDurationSeconds);
  const totalSamples = length + silenceSamples;
  const channels = Math.min(numberOfChannels, 2);
  const pcmChannels = [];

  for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
    const channelData = audioBuffer.getChannelData(channelIndex);
    const extendedChannelData = new Float32Array(totalSamples);
    extendedChannelData.set(channelData);
    pcmChannels.push(float32ToInt16(extendedChannelData));
  }

  const { Mp3Encoder } = getLamejs();
  const encoder = new Mp3Encoder(channels, sampleRate, MP3_BITRATE_KBPS);
  const chunks = [];

  for (let offset = 0; offset < totalSamples; offset += MP3_FRAME_SIZE) {
    const leftChunk = pcmChannels[0].subarray(offset, offset + MP3_FRAME_SIZE);
    const mp3Chunk =
      channels === 2
        ? encoder.encodeBuffer(
            leftChunk,
            pcmChannels[1].subarray(offset, offset + MP3_FRAME_SIZE)
          )
        : encoder.encodeBuffer(leftChunk);

    if (mp3Chunk.length > 0) {
      chunks.push(Buffer.from(mp3Chunk));
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    chunks.push(Buffer.from(flushChunk));
  }

  return Buffer.concat(chunks);
};
