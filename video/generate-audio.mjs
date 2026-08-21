import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 48_000;
const duration = 11;
const samples = sampleRate * duration;
const left = new Float64Array(samples);
const right = new Float64Array(samples);

const add = (time, length, render) => {
  const start = Math.max(0, Math.floor(time * sampleRate));
  const count = Math.min(samples - start, Math.floor(length * sampleRate));
  for (let index = 0; index < count; index += 1) {
    const t = index / sampleRate;
    const [l, r = l] = render(t, index, count);
    left[start + index] += l;
    right[start + index] += r;
  }
};

const seededNoise = (index, seed = 1) => {
  const value = Math.sin((index + seed * 991) * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

for (const frequency of [55, 82.41, 110, 164.81]) {
  add(0, duration, (t) => {
    const fadeIn = Math.min(1, t / 1.4);
    const fadeOut = Math.min(1, (duration - t) / 1.2);
    const pulse = 0.64 + Math.sin(t * Math.PI * 4) * 0.11;
    const value = Math.sin(Math.PI * 2 * frequency * t + Math.sin(t * 0.6) * 0.3)
      * 0.026 * fadeIn * fadeOut * pulse;
    return [value * 0.94, value];
  });
}

const beats = Array.from({ length: 22 }, (_, index) => 0.18 + index * 0.5);
for (const [beatIndex, time] of beats.entries()) {
  add(time, 0.34, (t) => {
    const envelope = Math.exp(-t * 15);
    const phase = Math.PI * 2 * (72 * t - 39 * t * t);
    const click = seededNoise(Math.floor(t * sampleRate), beatIndex + 4) * Math.exp(-t * 65) * 0.08;
    const value = Math.sin(phase) * envelope * 0.42 + click;
    return [value, value];
  });

  if (beatIndex % 2 === 1) {
    add(time, 0.11, (t, index) => {
      const noise = seededNoise(index, beatIndex + 40) * Math.exp(-t * 34) * 0.11;
      return [noise * 0.75, noise];
    });
  }
}

const bassNotes = [55, 65.41, 73.42, 49];
for (let index = 0; index < 11; index += 1) {
  const frequency = bassNotes[index % bassNotes.length];
  add(index + 0.18, 0.72, (t) => {
    const attack = Math.min(1, t / 0.025);
    const envelope = attack * Math.exp(-t * 3.2);
    const value = (Math.sin(Math.PI * 2 * frequency * t) + 0.22 * Math.sin(Math.PI * 4 * frequency * t)) * envelope * 0.075;
    return [value, value * 0.92];
  });
}

for (const [accentIndex, time] of [0.05, 2.05, 5.05, 7.55, 9.05, 10.42].entries()) {
  add(time, 0.7, (t, index) => {
    const envelope = Math.sin(Math.min(1, t / 0.08) * Math.PI / 2) * Math.exp(-t * 5.2);
    const tone = Math.sin(Math.PI * 2 * (330 + t * 520) * t) * 0.09;
    const air = seededNoise(index, accentIndex + 100) * 0.035;
    const pan = accentIndex % 2 === 0 ? 0.72 : 1;
    return [(tone + air) * envelope * pan, (tone + air) * envelope * (1.72 - pan)];
  });
}

for (const start of [1.55, 4.45, 7.0, 8.55]) {
  add(start, 0.65, (t, index, count) => {
    const progress = index / count;
    const envelope = Math.sin(progress * Math.PI) * progress;
    const noise = seededNoise(index, Math.floor(start * 100)) * 0.055 * envelope;
    return [noise * (1 - progress * 0.35), noise * (0.65 + progress * 0.35)];
  });
}

let peak = 0;
for (let index = 0; index < samples; index += 1) {
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const gain = peak > 0 ? 0.86 / peak : 1;

const bytesPerSample = 2;
const channels = 2;
const dataSize = samples * channels * bytesPerSample;
const wav = Buffer.alloc(44 + dataSize);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(channels, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
wav.writeUInt16LE(channels * bytesPerSample, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataSize, 40);

for (let index = 0; index < samples; index += 1) {
  const offset = 44 + index * 4;
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[index] * gain * 32767))), offset);
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[index] * gain * 32767))), offset + 2);
}

await mkdir(new URL("../public/video/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/video/overmcp-bed.wav", import.meta.url), wav);
console.log("Generated 11-second OverMCP audio bed.");
