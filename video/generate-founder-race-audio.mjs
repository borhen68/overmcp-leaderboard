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
  const value = Math.sin((index + seed * 977) * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

const beat = .375;
const roots = [55, 55, 65.41, 73.42, 55, 82.41, 73.42];

// A fast, side-chained low synth gives the whole race forward motion.
for (let bar = 0; bar < 7; bar += 1) {
  const start = bar * beat * 4;
  const root = roots[bar];
  add(start, Math.min(beat * 4, duration - start), (t) => {
    const phase = (t % beat) / beat;
    const duck = .12 + Math.min(1, phase * 5) * .88;
    const envelope = Math.min(1, t / .06) * Math.min(1, (beat * 4 - t) / .1);
    const bass = Math.sin(Math.PI * 2 * root * t + Math.sin(t * 5) * .28);
    const edge = Math.sin(Math.PI * 4 * root * t) * .25;
    return [(bass + edge) * .032 * duck * envelope, (bass + edge) * .035 * duck * envelope];
  });
}

// Punchy 160 BPM drums. Extra doubles accelerate the head-to-head section.
for (let index = 0; index < 27; index += 1) {
  const at = index * beat;
  add(at, .28, (t, sample) => {
    const envelope = Math.exp(-t * 18);
    const frequency = 150 * Math.exp(-t * 19) + 39;
    const body = Math.sin(Math.PI * 2 * frequency * t) * envelope;
    const click = noise(sample, 30 + index) * Math.exp(-t * 105) * .2;
    const gain = index % 4 === 0 ? .78 : .57;
    return [(body + click) * gain, (body + click) * gain];
  });
  if (at > 1.35 && at < 7.3 && index % 2 === 1) {
    add(at + beat * .5, .16, (t, sample) => {
      const body = Math.sin(Math.PI * 2 * (112 * Math.exp(-t * 16) + 45) * t) * Math.exp(-t * 23);
      const grit = noise(sample, 110 + index) * Math.exp(-t * 70) * .08;
      return [(body + grit) * .34, (body + grit) * .32];
    });
  }
}

for (let index = 0; index < 80; index += 1) {
  const at = .095 + index * beat / 3;
  add(at, .045, (t, sample) => {
    const hat = noise(sample, 220 + index) * Math.exp(-t * 92) * (index % 3 === 0 ? .11 : .055);
    return index % 2 ? [hat * .48, hat] : [hat, hat * .48];
  });
}

for (let index = 0; index < 13; index += 1) {
  add(beat + index * beat * 2, .2, (t, sample) => {
    const clap = noise(sample, 350 + index) * Math.exp(-t * 29) * .22;
    const tone = Math.sin(Math.PI * 2 * 185 * t) * Math.exp(-t * 24) * .08;
    return [clap * .72 + tone, clap + tone];
  });
}

// Fast UI ticks follow the racers as they close in on the finish line.
for (let index = 0; index < 20; index += 1) {
  const at = 1.55 + index * .285;
  add(at, .17, (t) => {
    const envelope = Math.exp(-t * 20);
    const frequency = 630 + index * 38;
    const ping = Math.sin(Math.PI * 2 * frequency * t) + .35 * Math.sin(Math.PI * 4 * frequency * t);
    return index % 2 ? [ping * envelope * .055, ping * envelope * .1] : [ping * envelope * .1, ping * envelope * .055];
  });
}

const cuts = [0, 38 / 30, 120 / 30, 214 / 30, 250 / 30];
for (const [index, cut] of cuts.entries()) {
  if (cut > 0) {
    add(cut - .32, .32, (t, sample, count) => {
      const progress = sample / count;
      const sweep = noise(sample, 460 + index) * (.02 + progress * .19);
      const tone = Math.sin(Math.PI * 2 * (240 + progress * 1500) * t) * .055;
      return [(sweep + tone) * progress * .7, (sweep + tone) * progress];
    });
  }
  add(cut, .55, (t, sample) => {
    const envelope = Math.exp(-t * 8.5);
    const boom = Math.sin(Math.PI * 2 * (92 - t * 42) * t) * .58;
    const crack = noise(sample, 540 + index) * Math.exp(-t * 57) * .22;
    return [(boom + crack) * envelope, (boom + crack) * envelope];
  });
}

// The #1 reveal gets a compact three-note victory stab instead of a slow swell.
for (const [index, note] of [261.63, 329.63, 392].entries()) {
  add(7.18 + index * .085, .85, (t) => {
    const envelope = Math.min(1, t / .018) * Math.exp(-t * 4.8);
    const tone = Math.sin(Math.PI * 2 * note * t) + .32 * Math.sin(Math.PI * 4 * note * t);
    return index % 2 ? [tone * envelope * .09, tone * envelope * .13] : [tone * envelope * .13, tone * envelope * .09];
  });
}

// Rising CTA tone resolves on the final URL beat.
add(8.36, 1.42, (t, sample, count) => {
  const progress = sample / count;
  const fade = Math.min(1, t / .08) * Math.min(1, (1.42 - t) / .18);
  const frequency = 155 + progress * 165;
  const tone = (Math.sin(Math.PI * 2 * frequency * t) + .3 * Math.sin(Math.PI * 6 * frequency * t)) * .055;
  return [tone * fade * .8, tone * fade];
});

add(9.42, .5, (t, sample) => {
  const envelope = Math.exp(-t * 8);
  const boom = Math.sin(Math.PI * 2 * (78 - t * 25) * t) * .55;
  const snap = noise(sample, 777) * Math.exp(-t * 70) * .16;
  return [(boom + snap) * envelope, (boom + snap) * envelope];
});

let peak = 0;
for (let index = 0; index < sampleCount; index += 1) {
  left[index] = Math.tanh(left[index] * 1.08);
  right[index] = Math.tanh(right[index] * 1.08);
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}

const masterGain = peak > 0 ? .92 / peak : 1;
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
await writeFile(new URL("../public/video/overmcp-founder-race.wav", import.meta.url), wav);
console.log("Generated the 10-second OverMCP founder-race audio bed.");
