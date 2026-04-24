let audioCtx: AudioContext | null = null;
let sheepBuffer: AudioBuffer | null = null;
let rainBuffer: AudioBuffer | null = null;
let rainSource: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
let useSynthFallback = false;

const SHEEP_AUDIO_URLS = [
  // Local audio in public folder
  '/audio/sheep.mp3',
  // Google Actions OGG (Works on Chrome/Firefox/Edge)
  'https://actions.google.com/sounds/v1/animals/sheep_bleat.ogg',
  // Mixkit MP3 (Works on Safari)
  'https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3',
  // SoundJay MP3 (Works on Safari)
  'https://www.soundjay.com/nature/sounds/sheep-bleat-1.mp3',
  // GitHub hosted MP3
  'https://raw.githubusercontent.com/kasperkamperman/MobileDev_HTML5_PhoneGap/master/www/audio/sheep.mp3'
];

const RAIN_AUDIO_URL = '/audio/rainy.mp3';

const decodeAudio = (ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(
      arrayBuffer,
      (buffer) => resolve(buffer),
      (err) => reject(err)
    );
  });
};

export const initAudio = async () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;
      audioCtx = new AudioContextClass();
      rainGain = audioCtx.createGain();
      rainGain.connect(audioCtx.destination);
      rainGain.gain.value = 0;
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Fetch and decode the real sheep sound
    if (!sheepBuffer && !useSynthFallback) {
      let loaded = false;
      for (const url of SHEEP_AUDIO_URLS) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const arrayBuffer = await response.arrayBuffer();
          sheepBuffer = await decodeAudio(audioCtx, arrayBuffer);
          loaded = true;
          console.log(`Successfully loaded sheep audio from: ${url}`);
          break;
        } catch (err) {
          console.warn(`Failed to load sheep audio from ${url}:`, err);
        }
      }

      if (!loaded) {
        console.warn("All sheep audio files failed. Using synth fallback.");
        useSynthFallback = true;
      }
    }

    // Load rain sound
    if (!rainBuffer) {
      try {
        const response = await fetch(RAIN_AUDIO_URL);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          rainBuffer = await decodeAudio(audioCtx, arrayBuffer);
          console.log("Rain audio loaded successfully");
        }
      } catch (err) {
        console.warn("Failed to load rain audio:", err);
      }
    }

    return true;
  } catch (e) {
    console.error("Audio init failed:", e);
    return false;
  }
};

const playSynthBaa = (volume: number) => {
  if (!audioCtx) return;
  const duration = 0.6 + Math.random() * 0.3;
  const t = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';

  const baseFreq = 300 + Math.random() * 80;
  const endFreq = baseFreq - 50 - Math.random() * 30;

  osc.frequency.setValueAtTime(baseFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

  const shakeSpeed = 7 + Math.random() * 3;
  const vibrato = audioCtx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = shakeSpeed;
  const vibratoGain = audioCtx.createGain();
  vibratoGain.gain.value = 15;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);

  const filter1 = audioCtx.createBiquadFilter();
  filter1.type = 'peaking';
  filter1.frequency.value = 900;
  filter1.Q.value = 2;
  filter1.gain.value = 14;

  const filter2 = audioCtx.createBiquadFilter();
  filter2.type = 'peaking';
  filter2.frequency.value = 2200;
  filter2.Q.value = 2;
  filter2.gain.value = 10;

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(3500, t);
  lowpass.frequency.exponentialRampToValueAtTime(1200, t + duration);

  const tremoloGain = audioCtx.createGain();
  tremoloGain.gain.value = 0.6;
  const tremolo = audioCtx.createOscillator();
  tremolo.type = 'sine';
  tremolo.frequency.value = shakeSpeed;
  const tremoloMod = audioCtx.createGain();
  tremoloMod.gain.value = 0.4;
  tremolo.connect(tremoloMod);
  tremoloMod.connect(tremoloGain.gain);

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, t);
  masterGain.gain.linearRampToValueAtTime(volume, t + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

  osc.connect(filter1);
  filter1.connect(filter2);
  filter2.connect(lowpass);
  lowpass.connect(tremoloGain);
  tremoloGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  osc.start(t);
  vibrato.start(t);
  tremolo.start(t);

  osc.stop(t + duration);
  vibrato.stop(t + duration);
  tremolo.stop(t + duration);
};

export const playBaa = async (volume: number) => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch (e) { return; }
  }

  if (sheepBuffer) {
    try {
      const source = audioCtx.createBufferSource();
      source.buffer = sheepBuffer;
      source.playbackRate.value = 0.85 + Math.random() * 0.3;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.start();
    } catch (e) {
      console.error("Audio play failed:", e);
    }
  } else if (useSynthFallback) {
    playSynthBaa(volume);
  }
};

export const startRainSound = () => {
  if (!audioCtx || !rainBuffer || rainSource) return;

  rainSource = audioCtx.createBufferSource();
  rainSource.buffer = rainBuffer;
  rainSource.loop = true;
  rainSource.connect(rainGain!);
  rainSource.start();
};

export const stopRainSound = () => {
  if (rainSource) {
    rainSource.stop();
    rainSource = null;
  }
};

export const setRainVolume = (volume: number) => {
  if (rainGain) {
    rainGain.gain.setTargetAtTime(volume, audioCtx!.currentTime, 0.5);
  }
};