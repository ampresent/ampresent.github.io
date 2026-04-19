/**
 * music.js — Adaptive background music system
 */
const Music = (() => {
  let ctx, masterGain;
  let currentTrack = null;
  let isPlaying = false;
  let layers = {};
  let currentZone = 'overworld';

  const SCALES = {
    overworld: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
    combat: [261.63, 293.66, 311.13, 349.23, 369.99, 415.30],
    night: [261.63, 293.66, 311.13, 349.23, 369.99, 415.30, 466.16],
    boss: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23],
    shop: [329.63, 369.99, 392.00, 440.00, 493.88, 523.25],
    dungeon: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63],
  };

  function init(_ctx) {
    ctx = _ctx || new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(ctx.destination);
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setZone(zone) {
    if (zone === currentZone) return;
    currentZone = zone;
    if (isPlaying) {
      stop();
      play();
    }
  }

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    playAmbientPad();
    playArpeggio();
  }

  function stop() {
    isPlaying = false;
    Object.values(layers).forEach(l => {
      try { l.stop(); } catch (e) {}
    });
    layers = {};
  }

  function playAmbientPad() {
    const scale = SCALES[currentZone] || SCALES.overworld;

    // Drone pad
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = scale[0] / 2;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = scale[2] / 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc1.start();
    osc2.start();

    // Slow LFO on filter
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    layers.pad = { stop: () => { osc1.stop(); osc2.stop(); lfo.stop(); } };
  }

  function playArpeggio() {
    const scale = SCALES[currentZone] || SCALES.overworld;
    let noteIdx = 0;
    let interval;

    function playNextNote() {
      if (!isPlaying) { clearInterval(interval); return; }

      const freq = scale[noteIdx % scale.length] * (noteIdx >= scale.length ? 2 : 1);
      noteIdx = (noteIdx + 1) % scale.length;

      const osc = ctx.createOscillator();
      osc.type = currentZone === 'combat' ? 'sawtooth' : currentZone === 'boss' ? 'square' : 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = currentZone === 'combat' ? 1200 : 800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.9);
    }

    const speed = currentZone === 'combat' ? 300 : currentZone === 'boss' ? 250 : 600;
    interval = setInterval(playNextNote, speed);
    layers.arp = { stop: () => clearInterval(interval) };
  }

  function getZone() { return currentZone; }

  return { init, resume, play, stop, setZone, getZone };
})();
