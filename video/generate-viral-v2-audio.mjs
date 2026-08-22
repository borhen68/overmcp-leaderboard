import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 48_000;
const duration = 9;
const sampleCount = sampleRate * duration;
const left = new Float64Array(sampleCount);
const right = new Float64Array(sampleCount);

const add = (time, length, render) => {
  const start = Math.max(0, Math.floor(time * sampleRate));
  const count = Math.min(sampleCount - start, Math.floor(length * sampleRate));
  for (let index = 0; index < count; index += 1) {
    const t = index / sampleRate;
    const [l, r = l] = render(t, index, count);
    left[start + index] += l;
    right[start + index] += r;
  }
};

const noise = (index, seed = 1) => {
  const value = Math.sin((index + seed * 977) * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

const beat = 1 / 3;
const roots = [55, 65.41, 73.42, 82.41];
const cuts = [0, 44 / 30, 104 / 30, 174 / 30, 218 / 30];

// Fast side-chained synth bed. It stays rhythmic without masking the on-screen copy.
for (let bar = 0; bar < 7; bar += 1) {
  const start = bar * beat * 4;
  const root = roots[bar % roots.length];
  for (const multiplier of [1, 1.5, 2, 3]) {
    add(start, beat * 4, (t) => {
      const phase = (t % beat) / beat;
      const duck = 0.2 + Math.min(1, phase * 4.2) * 0.8;
      const fade = Math.min(1, t / 0.08) * Math.min(1, (beat * 4 - t) / 0.14);
      const wave = Math.sin(Math.PI * 2 * root * multiplier * t + Math.sin(t * 4.8) * 0.45);
      return [wave * 0.018 * duck * fade, wave * 0.02 * duck * fade];
    });
  }
}

// A hard kick every beat makes the typography feel physical.
for (let index = 0; index < 27; index += 1) {
  add(0.025 + index * beat, 0.25, (t, sample) => {
    const envelope = Math.exp(-t * 18);
    const frequency = 124 * Math.exp(-t * 15) + 42;
    const body = Math.sin(Math.PI * 2 * frequency * t) * envelope;
    const click = noise(sample, 20 + index) * Math.exp(-t * 92) * 0.18;
    const gain = index % 4 === 0 ? 0.74 : 0.55;
    return [(body + click) * gain, (body + click) * gain];
  });
}

// Tight bass notes follow the kick without creating a long, muddy tail.
for (let index = 0; index < 27; index += 1) {
  const root = roots[Math.floor(index / 4) % roots.length];
  add(0.04 + index * beat, 0.27, (t) => {
    const envelope = Math.min(1, t / 0.012) * Math.exp(-t * 8.4);
    const wave = Math.sin(Math.PI * 2 * root * t) + Math.sin(Math.PI * 4 * root * t) * 0.23;
    return [wave * envelope * 0.13, wave * envelope * 0.12];
  });
}

// Alternating claps and hats keep motion present through silent autoplay transitions.
for (let index = 0; index < 14; index += 1) {
  add(beat + index * beat * 2, 0.17, (t, sample) => {
    const clap = noise(sample, 100 + index) * Math.exp(-t * 31) * 0.24;
    return [clap * 0.75, clap];
  });
}

for (let index = 0; index < 54; index += 1) {
  add(0.15 + index * beat / 2, 0.045, (t, sample) => {
    const hat = noise(sample, 180 + index) * Math.exp(-t * 74) * (index % 2 ? 0.07 : 0.11);
    return index % 2 ? [hat * 0.55, hat] : [hat, hat * 0.55];
  });
}

// Scene cuts get a reverse-noise pull and a short impact.
for (const [index, cut] of cuts.entries()) {
  if (cut > 0) {
    add(cut - 0.24, 0.24, (t, sample, count) => {
      const progress = sample / count;
      const envelope = progress * progress;
      const sweep = noise(sample, 280 + index) * (0.035 + progress * 0.16);
      const whistle = Math.sin(Math.PI * 2 * (360 + progress * 1150) * t) * 0.05;
      return [(sweep + whistle) * envelope * 0.7, (sweep + whistle) * envelope];
    });
  }
  add(cut, 0.4, (t, sample) => {
    const envelope = Math.exp(-t * 10);
    const boom = Math.sin(Math.PI * 2 * (78 - t * 42) * t) * 0.5;
    const snap = noise(sample, 350 + index) * Math.exp(-t * 48) * 0.2;
    return [(boom + snap) * envelope, (boom + snap) * envelope];
  });
}

// Copy, selection, and CTA clicks are placed exactly on their visual beats.
for (const [index, time] of [0.55, 0.73, 2.1, 2.32, 2.56, 4.5, 4.72, 6.08, 6.3, 6.52, 7.72].entries()) {
  add(time, 0.12, (t) => {
    const envelope = Math.exp(-t * 35);
    const tone = Math.sin(Math.PI * 2 * (680 + index * 46) * t) * envelope * 0.17;
    return index % 2 ? [tone * 0.62, tone] : [tone, tone * 0.62];
  });
}

// The final brand note rises, then resolves cleanly for a satisfying loop.
add(7.35, 1.5, (t) => {
  const fade = Math.min(1, t / 0.12) * Math.min(1, (1.5 - t) / 0.25);
  const rise = 210 + t * 46;
  const tone = (Math.sin(Math.PI * 2 * rise * t) + 0.4 * Math.sin(Math.PI * 3 * rise * t)) * 0.038 * fade;
  return [tone * 0.82, tone];
});

let peak = 0;
for (let index = 0; index < sampleCount; index += 1) {
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const masterGain = peak > 0 ? 0.91 / peak : 1;
const bytesPerSample = 2;
const channels = 2;
const dataSize = sampleCount * channels * bytesPerSample;
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

for (let index = 0; index < sampleCount; index += 1) {
  const offset = 44 + index * 4;
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[index] * masterGain * 32767))), offset);
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[index] * masterGain * 32767))), offset + 2);
}

await mkdir(new URL("../public/video/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/video/overmcp-viral-v2.wav", import.meta.url), wav);
console.log("Generated the 9-second OverMCP viral V2 audio bed at 180 BPM.");
