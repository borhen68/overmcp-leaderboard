import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 48_000;
const duration = 10;
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
  const value = Math.sin((index + seed * 991) * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

const beat = .375;
const roots = [55, 61.74, 73.42, 82.41];
const cuts = [0, 50 / 30, 107 / 30, 156 / 30, 242 / 30];

// Tight, side-chained synth pulse.
for (let bar = 0; bar < 7; bar += 1) {
  const start = bar * beat * 4;
  const root = roots[bar % roots.length];
  for (const multiplier of [1, 1.5, 2, 3]) {
    add(start, beat * 4, (t) => {
      const phase = (t % beat) / beat;
      const duck = .16 + Math.min(1, phase * 4.6) * .84;
      const fade = Math.min(1, t / .07) * Math.min(1, (beat * 4 - t) / .12);
      const wave = Math.sin(Math.PI * 2 * root * multiplier * t + Math.sin(t * 5.2) * .35);
      return [wave * .017 * duck * fade, wave * .019 * duck * fade];
    });
  }
}

// Kick and sub lock the typography to a recognizable pulse.
for (let index = 0; index < 27; index += 1) {
  add(.02 + index * beat, .27, (t, sample) => {
    const envelope = Math.exp(-t * 17);
    const frequency = 132 * Math.exp(-t * 16) + 40;
    const body = Math.sin(Math.PI * 2 * frequency * t) * envelope;
    const click = noise(sample, 40 + index) * Math.exp(-t * 95) * .17;
    const gain = index % 4 === 0 ? .76 : .56;
    return [(body + click) * gain, (body + click) * gain];
  });
  const root = roots[Math.floor(index / 4) % roots.length];
  add(.05 + index * beat, .3, (t) => {
    const envelope = Math.min(1, t / .012) * Math.exp(-t * 8);
    const wave = Math.sin(Math.PI * 2 * root * t) + Math.sin(Math.PI * 4 * root * t) * .2;
    return [wave * envelope * .12, wave * envelope * .115];
  });
}

// Crisp hats and alternating claps keep the 10 seconds moving.
for (let index = 0; index < 54; index += 1) {
  add(.16 + index * beat / 2, .05, (t, sample) => {
    const hat = noise(sample, 170 + index) * Math.exp(-t * 78) * (index % 2 ? .065 : .1);
    return index % 2 ? [hat * .5, hat] : [hat, hat * .5];
  });
}

for (let index = 0; index < 13; index += 1) {
  add(beat + index * beat * 2, .18, (t, sample) => {
    const clap = noise(sample, 260 + index) * Math.exp(-t * 29) * .22;
    return [clap * .7, clap];
  });
}

// Each narrative turn gets a short riser and a heavy impact.
for (const [index, cut] of cuts.entries()) {
  if (cut > 0) {
    add(cut - .28, .28, (t, sample, count) => {
      const progress = sample / count;
      const envelope = progress * progress;
      const sweep = noise(sample, 350 + index) * (.03 + progress * .14);
      const tone = Math.sin(Math.PI * 2 * (330 + progress * 1250) * t) * .045;
      return [(sweep + tone) * envelope * .75, (sweep + tone) * envelope];
    });
  }
  add(cut, .48, (t, sample) => {
    const envelope = Math.exp(-t * 9);
    const boom = Math.sin(Math.PI * 2 * (82 - t * 38) * t) * .5;
    const snap = noise(sample, 440 + index) * Math.exp(-t * 52) * .18;
    return [(boom + snap) * envelope, (boom + snap) * envelope];
  });
}

// Market-step pings at the two real chart movements and the final CTA.
for (const [index, time] of [6.13, 6.7, 7.15, 8.77].entries()) {
  add(time, .5, (t) => {
    const envelope = Math.exp(-t * 7.5);
    const tone = Math.sin(Math.PI * 2 * (620 + index * 155) * t) + .35 * Math.sin(Math.PI * 4 * (620 + index * 155) * t);
    return index % 2 ? [tone * envelope * .09, tone * envelope * .14] : [tone * envelope * .14, tone * envelope * .09];
  });
}

add(8.15, 1.7, (t) => {
  const fade = Math.min(1, t / .12) * Math.min(1, (1.7 - t) / .3);
  const rise = 196 + t * 52;
  const tone = (Math.sin(Math.PI * 2 * rise * t) + .42 * Math.sin(Math.PI * 3 * rise * t)) * .04 * fade;
  return [tone * .82, tone];
});

let peak = 0;
for (let index = 0; index < sampleCount; index += 1) peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
const masterGain = peak > 0 ? .91 / peak : 1;
const channels = 2;
const bytesPerSample = 2;
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
await writeFile(new URL("../public/video/overmcp-market-story.wav", import.meta.url), wav);
console.log("Generated the 10-second OverMCP market-story audio bed.");
