let ctx: AudioContext | undefined;
let master: GainNode | undefined;
export async function startAmbience() {
  ctx = new AudioContext();
  await ctx.resume();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + Math.random() * 0.04 - 0.02) / 1.02;
    data[i] = last * 5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 650;
  noise.connect(filter);
  filter.connect(master);
  noise.start();
  [174.61, 261.63, 349.23].forEach((f, i) => {
    const o = ctx!.createOscillator();
    o.frequency.value = f;
    const gain = ctx!.createGain();
    gain.gain.value = 0.045 / (i + 1);
    o.connect(gain);
    gain.connect(master!);
    o.start();
  });
}
export function stopAmbience() {
  const old = ctx;
  if (old && master) {
    master.gain.linearRampToValueAtTime(0, old.currentTime + 0.5);
    setTimeout(() => void old.close(), 600);
  }
  ctx = undefined;
  master = undefined;
}
