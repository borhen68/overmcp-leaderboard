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

const noise = (index, seed = 1) => {
  const value = Math.sin((index + seed * 997) * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

const beat = 0.4;
const sceneCuts = [0, 1.67, 4.33, 6.4, 7.8, 9.2];

// Bright, side-chained synth bed at 150 BPM.
const chordRoots = [55, 65.41, 73.42, 82.41];
for (let bar = 0; bar < 7; bar += 1) {
  const start = bar * beat * 4;
  const root = chordRoots[bar % chordRoots.length];
  for (const multiplier of [1, 1.5, 2, 3]) {
    add(start, beat * 4, (t) => {
      const phaseInBeat = (t % beat) / beat;
      const duck = 0.28 + Math.min(1, phaseInBeat * 3.6) * 0.72;
      const fade = Math.min(1, t / 0.12) * Math.min(1, (beat * 4 - t) / 0.18);
      const shimmer = Math.sin(Math.PI * 2 * root * multiplier * t + Math.sin(t * 3.2) * 0.4);
      return [shimmer * 0.018 * fade * duck, shimmer * 0.02 * fade * duck];
    });
  }
}

// Punchy kick on every beat, with a heavier first beat per bar.
for (let index = 0; index < 28; index += 1) {
  const time = 0.04 + index * beat;
  add(time, 0.28, (t, sample) => {
    const envelope = Math.exp(-t * 17);
    const frequency = 112 * Math.exp(-t * 13) + 43;
    const body = Math.sin(Math.PI * 2 * frequency * t) * envelope;
    const transient = noise(sample, index + 11) * Math.exp(-t * 80) * 0.17;
    const weight = index % 4 === 0 ? 0.68 : 0.5;
    return [(body + transient) * weight, (body + transient) * weight];
  });
}

// Claps and fast hats keep every cut moving.
for (let index = 0; index < 14; index += 1) {
  add(0.44 + index * beat * 2, 0.18, (t, sample) => {
    const value = noise(sample, index + 80) * Math.exp(-t * 28) * 0.22;
    return [value * 0.78, value];
  });
}

for (let index = 0; index < 55; index += 1) {
  add(0.22 + index * beat / 2, 0.055, (t, sample) => {
    const value = noise(sample, index + 150) * Math.exp(-t * 62) * (index % 2 ? 0.075 : 0.11);
    return index % 2 ? [value * 0.58, value] : [value, value * 0.58];
  });
}

// Short bass notes make the rank takeover feel physical.
for (let index = 0; index < 27; index += 1) {
  const root = chordRoots[Math.floor(index / 4) % chordRoots.length];
  add(0.06 + index * beat, 0.32, (t) => {
    const envelope = Math.min(1, t / 0.018) * Math.exp(-t * 7.5);
    const wave = Math.sin(Math.PI * 2 * root * t) + 0.28 * Math.sin(Math.PI * 4 * root * t);
    return [wave * envelope * 0.12, wave * envelope * 0.11];
  });
}

// Transition risers and impacts are aligned to every scene cut.
for (const [index, cut] of sceneCuts.entries()) {
  if (cut > 0) {
    add(cut - 0.32, 0.32, (t, sample, count) => {
      const progress = sample / count;
      const envelope = Math.sin(progress * Math.PI / 2) * progress;
      const sweep = noise(sample, index + 250) * (0.03 + progress * 0.14);
      const tone = Math.sin(Math.PI * 2 * (240 + progress * 920) * t) * 0.055;
      return [(sweep + tone) * envelope * 0.75, (sweep + tone) * envelope];
    });
  }
  add(cut, 0.46, (t, sample) => {
    const envelope = Math.exp(-t * 9.2);
    const boom = Math.sin(Math.PI * 2 * (72 - t * 38) * t) * 0.48;
    const snap = noise(sample, index + 330) * Math.exp(-t * 42) * 0.16;
    return [(boom + snap) * envelope, (boom + snap) * envelope];
  });
}

// UI ticks for the $3 → $8 change and final CTA.
for (const [index, time] of [2.46, 2.58, 2.7, 2.82, 2.94, 9.76, 10.16].entries()) {
  add(time, 0.14, (t) => {
    const envelope = Math.exp(-t * 31);
    const value = Math.sin(Math.PI * 2 * (720 + index * 55) * t) * envelope * 0.16;
    return index % 2 ? [value * 0.62, value] : [value, value * 0.62];
  });
}

// A final rising tone leaves the URL feeling resolved rather than abruptly cut.
add(9.25, 1.55, (t) => {
  const fade = Math.min(1, t / 0.18) * Math.min(1, (1.55 - t) / 0.32);
  const value = (Math.sin(Math.PI * 2 * 220 * t) + 0.45 * Math.sin(Math.PI * 2 * 330 * t)) * 0.035 * fade;
  return [value * 0.85, value];
});

let peak = 0;
for (let index = 0; index < samples; index += 1) {
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const gain = peak > 0 ? 0.91 / peak : 1;

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
console.log("Generated energetic 11-second OverMCP audio bed at 150 BPM.");
