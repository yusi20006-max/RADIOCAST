import { Mp3Encoder } from 'lamejs';
import { BgmStyle, SfxType } from '../types/podcast';

// Web Audio Context singleton
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Generate synthetic sound effect buffer using Web Audio API
 */
export function createSyntheticSfx(ctx: AudioContext, type: SfxType): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  let duration = 1.2;

  if (type === 'intro' || type === 'outro') duration = 2.0;
  if (type === 'transition') duration = 0.8;
  if (type === 'ding') duration = 0.6;
  if (type === 'applause' || type === 'laugh') duration = 1.8;

  const buffer = ctx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (type === 'intro') {
    // 4-note ascending bright podcast chime (C5, E5, G5, B5)
    const freqs = [523.25, 659.25, 783.99, 987.77];
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((freq, idx) => {
        const noteStart = idx * 0.35;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const decay = Math.exp(-noteT * 3.5);
          val += Math.sin(2 * Math.PI * freq * noteT) * decay * 0.25;
          // Sub-harmonic sparkle
          val += Math.sin(4 * Math.PI * freq * noteT) * decay * 0.08;
        }
      });
      left[i] = val;
      right[i] = val * 0.95;
    }
  } else if (type === 'outro') {
    // 3-note resolving chime (A5, F5, C5)
    const freqs = [880.0, 698.46, 523.25];
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((freq, idx) => {
        const noteStart = idx * 0.45;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const decay = Math.exp(-noteT * 2.8);
          val += Math.sin(2 * Math.PI * freq * noteT) * decay * 0.25;
        }
      });
      left[i] = val;
      right[i] = val * 0.95;
    }
  } else if (type === 'ding') {
    // Single crisp notification bell (1318.5 Hz - E6)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 6.0);
      const val = (Math.sin(2 * Math.PI * 1318.5 * t) + 0.3 * Math.sin(2 * Math.PI * 2637 * t)) * decay * 0.3;
      left[i] = val;
      right[i] = val;
    }
  } else if (type === 'transition') {
    // Whoosh / sweep transition
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const norm = t / duration;
      const freq = 120 + 800 * Math.sin(norm * Math.PI);
      const noise = (Math.random() * 2 - 1) * 0.15;
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.2;
      const env = Math.sin(norm * Math.PI);
      const val = (tone + noise) * env * 0.35;
      left[i] = val * (1 - norm * 0.3);
      right[i] = val * (0.7 + norm * 0.3);
    }
  } else if (type === 'applause' || type === 'laugh') {
    // Filtered rhythmic noise bursts
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const env = Math.sin((t / duration) * Math.PI);
      const pulse = 0.6 + 0.4 * Math.sin(t * 18);
      const val = (Math.random() * 2 - 1) * env * pulse * 0.18;
      left[i] = val;
      right[i] = (Math.random() * 2 - 1) * env * pulse * 0.18;
    }
  }

  return buffer;
}

/**
 * Generate continuous procedural background music loop
 */
export function createSyntheticBgmBuffer(ctx: AudioContext, style: BgmStyle, durationSec: number = 30): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(2, Math.floor(sampleRate * durationSec), sampleRate);
  if (style === 'none') {
    return buffer;
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (style === 'lofi') {
    // Mellow warm Rhodes chords (Fmaj7 -> Em7 -> Dm7 -> Cmaj7 progression)
    // Fmaj7: F3(174.6), A3(220), C4(261.6), E4(329.6)
    // Em7:   E3(164.8), G3(196), B3(246.9), D4(293.7)
    // Dm7:   D3(146.8), F3(174.6), A3(220), C4(261.6)
    // Cmaj7: C3(130.8), E3(164.8), G3(196), B3(246.9)
    const chords = [
      [174.6, 220.0, 261.6, 329.6],
      [164.8, 196.0, 246.9, 293.7],
      [146.8, 174.6, 220.0, 261.6],
      [130.8, 164.8, 196.0, 246.9],
    ];
    const chordDuration = 3.5;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const chordIndex = Math.floor(t / chordDuration) % chords.length;
      const chordTime = t % chordDuration;
      const chord = chords[chordIndex];

      // Soft envelope
      const env = Math.min(1, chordTime * 3) * Math.exp(-chordTime * 0.4);

      let valL = 0;
      let valR = 0;
      chord.forEach((freq, idx) => {
        const pan = (idx / chord.length) * 0.4 - 0.2;
        const tone = (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t)) * env * 0.05;
        valL += tone * (1 - pan);
        valR += tone * (1 + pan);
      });

      // Gentle vinyl crackle
      const vinyl = (Math.random() > 0.998 ? (Math.random() * 2 - 1) * 0.03 : 0);

      left[i] = valL + vinyl;
      right[i] = valR + vinyl;
    }
  } else if (style === 'ambient') {
    // Deep meditation drone with slow sweeping harmonics
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const lfo = 0.5 + 0.5 * Math.sin(t * 0.2);
      const drone1 = Math.sin(2 * Math.PI * 110 * t) * 0.05; // A2
      const drone2 = Math.sin(2 * Math.PI * 164.8 * t) * 0.04 * lfo; // E3
      const drone3 = Math.sin(2 * Math.PI * 220 * t + Math.sin(t * 0.5)) * 0.03;
      const shimm = Math.sin(2 * Math.PI * 440 * t) * 0.015 * (1 - lfo);

      left[i] = drone1 + drone2 + shimm;
      right[i] = drone1 + drone3 + shimm;
    }
  } else if (style === 'acoustic') {
    // Upbeat rhythmic acoustic strumming pattern
    const patternFreqs = [261.6, 329.6, 392.0, 523.25]; // C major
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const beat = (t * 2.2) % 1; // 132 BPM eighth note feel
      const env = Math.exp(-beat * 7);
      const noteIdx = Math.floor((t * 2.2) % patternFreqs.length);
      const freq = patternFreqs[noteIdx];
      const val = (Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(4 * Math.PI * freq * t)) * env * 0.08;
      left[i] = val;
      right[i] = val * 0.9;
    }
  } else if (style === 'cinematic') {
    // Cinematic suspense with deep sub-bass and pulsing cello tone
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
      const sub = Math.sin(2 * Math.PI * 65.4 * t) * 0.08; // C2
      const mid = (Math.sin(2 * Math.PI * 130.8 * t) + 0.2 * Math.sin(2 * Math.PI * 196 * t)) * 0.05 * pulse;
      left[i] = sub + mid;
      right[i] = sub + mid * 0.85;
    }
  } else if (style === 'iranian-fusion') {
    // Persian modal feel (D, Eb, F#, G, A - inspired by Homayoun/Chahargah quarter-tone feel)
    const persianNotes = [146.8, 155.6, 185.0, 196.0, 220.0, 293.7];
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const phraseT = t % 8;
      const noteIdx = Math.floor(phraseT / 1.33) % persianNotes.length;
      const noteT = phraseT % 1.33;
      const env = Math.exp(-noteT * 2.2);
      const freq = persianNotes[noteIdx];
      // Plucked string harmonic overtone (Tar / Setar emulation)
      const tone = (
        Math.sin(2 * Math.PI * freq * t) +
        0.5 * Math.sin(4 * Math.PI * freq * t) +
        0.2 * Math.sin(6 * Math.PI * freq * t)
      ) * env * 0.07;
      // Ambient warm drone underneath
      const drone = Math.sin(2 * Math.PI * 146.8 * t) * 0.04;
      left[i] = tone + drone;
      right[i] = tone * 0.9 + drone;
    }
  }

  return buffer;
}

/**
 * Decode Base64 audio into AudioBuffer
 */
export async function decodeAudioBase64(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await ctx.decodeAudioData(bytes.buffer.slice(0));
}

/**
 * Mix voice segments, sound effects, and background music into a master AudioBuffer
 */
export async function mixPodcastAudioBuffer(params: {
  ctx: AudioContext;
  voiceBuffers: { buffer: AudioBuffer; sfxCue?: SfxType }[];
  bgmStyle: BgmStyle;
  bgmVolume: number;
  speedMultiplier: number;
}): Promise<AudioBuffer> {
  const { ctx, voiceBuffers, bgmStyle, bgmVolume } = params;
  const sampleRate = ctx.sampleRate;

  // Calculate timeline with sound effects & pause intervals
  const pauseBetweenTurns = 0.5; // seconds
  let totalDuration = 1.0; // initial lead-in for intro

  interface ScheduledItem {
    buffer: AudioBuffer;
    startTime: number;
    volume: number;
    isVoice: boolean;
  }

  const schedule: ScheduledItem[] = [];

  // Add intro SFX if desired
  const introSfx = createSyntheticSfx(ctx, 'intro');
  schedule.push({ buffer: introSfx, startTime: 0.1, volume: 0.7, isVoice: false });
  totalDuration += 1.8;

  // Schedule each speech turn and accompanying SFX
  voiceBuffers.forEach((turn, idx) => {
    // Check if turn has SFX cue
    if (turn.sfxCue && turn.sfxCue !== 'none' && turn.sfxCue !== 'intro' && turn.sfxCue !== 'outro') {
      const sfx = createSyntheticSfx(ctx, turn.sfxCue);
      schedule.push({ buffer: sfx, startTime: totalDuration, volume: 0.5, isVoice: false });
      totalDuration += 0.4;
    }

    schedule.push({
      buffer: turn.buffer,
      startTime: totalDuration,
      volume: 1.0,
      isVoice: true,
    });

    totalDuration += turn.buffer.duration + pauseBetweenTurns;
  });

  // Outro SFX
  const outroSfx = createSyntheticSfx(ctx, 'outro');
  schedule.push({ buffer: outroSfx, startTime: totalDuration, volume: 0.7, isVoice: false });
  totalDuration += 2.5;

  // Create Master AudioBuffer
  const masterBuffer = ctx.createBuffer(2, Math.floor(sampleRate * totalDuration), sampleRate);
  const masterLeft = masterBuffer.getChannelData(0);
  const masterRight = masterBuffer.getChannelData(1);

  // Generate continuous background music for entire duration
  if (bgmStyle !== 'none' && bgmVolume > 0) {
    const bgmBuffer = createSyntheticBgmBuffer(ctx, bgmStyle, totalDuration + 2);
    const bgmLeft = bgmBuffer.getChannelData(0);
    const bgmRight = bgmBuffer.getChannelData(1);

    // Apply auto-ducking when voice is active
    for (let i = 0; i < masterBuffer.length; i++) {
      const t = i / sampleRate;

      // Determine ducking multiplier: lower volume if voice is currently playing
      let isVoiceActive = false;
      for (const item of schedule) {
        if (item.isVoice && t >= item.startTime && t <= item.startTime + item.buffer.duration) {
          isVoiceActive = true;
          break;
        }
      }

      // Voice active: duck to 25% of BGM volume; Voice quiet: 100% of BGM volume
      const duckingFactor = isVoiceActive ? 0.25 : 0.85;
      const vol = bgmVolume * duckingFactor;

      const bgmIdx = i % bgmLeft.length;
      masterLeft[i] += (bgmLeft[bgmIdx] || 0) * vol;
      masterRight[i] += (bgmRight[bgmIdx] || 0) * vol;
    }
  }

  // Render scheduled voice and SFX tracks into master buffer
  schedule.forEach((item) => {
    const startSample = Math.floor(item.startTime * sampleRate);
    const itemLeft = item.buffer.getChannelData(0);
    const itemRight = item.buffer.numberOfChannels > 1 ? item.buffer.getChannelData(1) : itemLeft;

    for (let i = 0; i < item.buffer.length; i++) {
      const targetIdx = startSample + i;
      if (targetIdx < masterBuffer.length) {
        masterLeft[targetIdx] += itemLeft[i] * item.volume;
        masterRight[targetIdx] += itemRight[i] * item.volume;
      }
    }
  });

  // Soft master limiter to prevent clipping
  for (let i = 0; i < masterBuffer.length; i++) {
    masterLeft[i] = Math.tanh(masterLeft[i]);
    masterRight[i] = Math.tanh(masterRight[i]);
  }

  return masterBuffer;
}

/**
 * Encode AudioBuffer to MP3 file blob using lamejs
 */
export function encodeAudioBufferToMp3(audioBuffer: AudioBuffer, kbps: number = 192): Blob {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  // Convert float32 [-1.0, 1.0] to int16 [-32768, 32767]
  const sampleBlockSize = 1152;
  const leftInt16 = new Int16Array(sampleBlockSize);
  const rightInt16 = new Int16Array(sampleBlockSize);

  for (let i = 0; i < audioBuffer.length; i += sampleBlockSize) {
    const blockSize = Math.min(sampleBlockSize, audioBuffer.length - i);

    for (let j = 0; j < blockSize; j++) {
      const l = leftChannel[i + j];
      const r = rightChannel[i + j];
      // Clamp values
      leftInt16[j] = l < -1 ? -32768 : l > 1 ? 32767 : Math.floor(l * 32767);
      rightInt16[j] = r < -1 ? -32768 : r > 1 ? 32767 : Math.floor(r * 32767);
    }

    let mp3buf: Int8Array;
    if (channels === 2) {
      mp3buf = mp3encoder.encodeBuffer(
        leftInt16.subarray(0, blockSize),
        rightInt16.subarray(0, blockSize)
      );
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftInt16.subarray(0, blockSize));
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf));
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Lossless WAV file export as fallback or alternative
 */
export function encodeAudioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
