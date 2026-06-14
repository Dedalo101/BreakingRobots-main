// === AUTOGENERATIVE GLITCH AUDIO - Interactive / Mobile-Desktop / Emergent / Aggressive ===
// For breakingrobots.com - gyro/touch/zoom/mouse/key, auto-start on visibility, section clicks for sound changes
const AC = new (window.AudioContext || window.webkitAudioContext)();
let isRunning = false;
const now = () => AC.currentTime;

// Procedural melody: Pentatonic scale, random seq
const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 784.00, 880.00];
let melodySeq = [];
let melodyIndex = 0;
function generateMelody() {
  melodySeq = [];
  for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
    melodySeq.push(pentatonic[Math.floor(Math.random() * pentatonic.length)] * (1 + Math.random() * 0.5));
  }
  melodyIndex = 0;
}

const osc1 = AC.createOscillator();  // Saw base
const osc2 = AC.createOscillator();  // Sine ring/FM
const ringGain = AC.createGain();    // Ring mod
const lfo = AC.createOscillator();   // LFO
const gain1 = AC.createGain();
const bp = AC.createBiquadFilter();  // Bandpass
const crush = AC.createScriptProcessor(2048, 1, 1);
const dist = AC.createWaveShaper();
const master = AC.createGain();

osc1.type = 'sawtooth';
osc2.type = 'sine';
lfo.type = 'triangle';
lfo.frequency.value = 0.2;

osc1.connect(gain1);
osc2.connect(ringGain);
ringGain.connect(gain1.gain);
gain1.connect(bp);
lfo.connect(bp.frequency);
bp.connect(crush);
crush.connect(dist);
dist.connect(master);
master.connect(AC.destination);

bp.type = 'bandpass';
bp.frequency.value = 440;
bp.Q.value = 15;

crush.onaudioprocess = e => {
  const input = e.inputBuffer.getChannelData(0);
  const output = e.outputBuffer.getChannelData(0);
  const bits = crush.bits || 6;
  const step = Math.pow(0.5, bits - 1);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.round(input[i] / step) * step;
  }
};

const curve = new Float32Array(44100);
for (let i = 0; i < 44100; i++) {
  const x = (i * 2 / 44100) - 1;
  curve[i] = x < 0 ? -Math.pow(-x, 0.5) : Math.pow(x, 0.5);
}
dist.curve = curve;
dist.oversample = '4x';

master.gain.value = 0.7;
gain1.gain.value = 0.5;
ringGain.gain.value = 0.5;

// Aggressive evolution
function autoEvolve() {
  const t = now();
  if (melodyIndex >= melodySeq.length) generateMelody();
  osc1.frequency.setValueAtTime(melodySeq[melodyIndex], t);
  melodyIndex = (melodyIndex + 1) % melodySeq.length;

  osc2.frequency.setValueAtTime(2 + Math.sin(t * 0.4) * 10 + Math.random() * 5, t);
  lfo.frequency.setValueAtTime(0.3 + Math.random() * 1.2, t);
  bp.frequency.setValueAtTime(150 + Math.sin(t * 0.6) * 12000 + Math.random() * 2000, t);
  bp.Q.setValueAtTime(10 + Math.cos(t * 0.5) * 50 + Math.random() * 20, t);
  crush.bits = Math.floor(4 + Math.sin(t * 0.8) * 10 + Math.random() * 4);
  ringGain.gain.setValueAtTime(0.4 + Math.random() * 0.6, t);
  requestAnimationFrame(autoEvolve);
}

// Interactive controls
const onMove = (x, y) => {
  bp.frequency.setTargetAtTime(80 + x * 15000, now(), 0.03);
  bp.Q.setTargetAtTime(8 + y * 80, now(), 0.08);
  crush.bits = Math.max(3, 18 - y * 15);
  master.gain.setTargetAtTime(0.4 + x * 0.6, now(), 0.03);
  ringGain.gain.setTargetAtTime(y * 0.8, now(), 0.05);
};

// Desktop: Mouse + Wheel
document.addEventListener('mousemove', e => onMove(e.clientX / innerWidth, e.clientY / innerHeight));
document.addEventListener('wheel', e => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  master.gain.setTargetAtTime(master.gain.value + delta, now(), 0.05);
}, {passive: true});

// Mobile: Touch + Pinch/Zoom
let touchDist = 0;
document.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const t = e.touches[0];
    onMove(t.clientX / innerWidth, t.clientY / innerHeight);
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.sqrt(dx * dx + dy * dy);
    if (touchDist) {
      const scale = newDist / touchDist - 1;
      bp.Q.setTargetAtTime(bp.Q.value + scale * 50, now(), 0.05);
    }
    touchDist = newDist;
  }
}, {passive: false});
document.addEventListener('touchend', () => touchDist = 0);

// Gyro (tilt)
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', e => {
    const tiltX = (e.beta || 0) / 90;
    const tiltY = (e.gamma || 0) / 90;
    onMove(0.5 + tiltX * 0.5, 0.5 + tiltY * 0.5);
  });
}

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === ' ') punch();
});

// Punch func
function punch() {
  const t = now();
  gain1.gain.setValueAtTime(1.5, t);
  gain1.gain.exponentialRampToValueAtTime(0.5, t + 0.08);
  bp.Q.setValueAtTime(60, t);
  bp.Q.exponentialRampToValueAtTime(15, t + 0.12);
  generateMelody();
}

// Existing sections as interactives (clicks trigger sound changes; ensure IDs/classes in HTML)
document.querySelector('#music, [id*="music"], [class*="music"]')?.addEventListener('click', punch);  // Music: Punch
document.querySelector('#events, [id*="events"], [class*="events"]')?.addEventListener('click', () => {
  generateMelody();
  osc2.frequency.setTargetAtTime(Math.random() * 20 + 5, now(), 0.1);  // Events: Evolve melody/FM
});
document.querySelector('#contact, [id*="contact"], [class*="contact"]')?.addEventListener('click', () => {
  crush.bits = Math.floor(Math.random() * 6 + 3);
  setTimeout(() => crush.bits = 6, 500);  // Contact: Glitch boost
});

// Auto-start on visibility (direct audible on glitch img view)
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !isRunning) {
    AC.resume().then(() => {
      osc1.start();
      osc2.start();
      lfo.start();
      generateMelody();
      autoEvolve();
      isRunning = true;
    });
  }
}, { threshold: 0.5 });
observer.observe(document.querySelector('img.glitch') || document.body);  // Adjust selector if needed

console.log("%cAUTOGENERATIVE GLITCH ACTIVE - interact via mouse/touch/gyro/zoom/keys/sections", "color:#ff0044;font-weight:bold");
