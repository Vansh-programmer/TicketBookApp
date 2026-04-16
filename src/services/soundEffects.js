import { createAudioPlayer } from 'expo-audio';

const SOUND_EFFECT_SOURCES = {
  tap: null,
  success: null,
  error: null,
  trailer: null,
};

export const SOUND_EFFECT_KEYS = Object.freeze({
  TAP: 'tap',
  SUCCESS: 'success',
  ERROR: 'error',
  TRAILER: 'trailer',
});

const SOUND_EFFECT_DEFAULTS = Object.freeze({
  [SOUND_EFFECT_KEYS.TAP]: { volume: 0.35, releaseAfterMs: 500 },
  [SOUND_EFFECT_KEYS.SUCCESS]: { volume: 0.7, releaseAfterMs: 1800 },
  [SOUND_EFFECT_KEYS.ERROR]: { volume: 0.6, releaseAfterMs: 1600 },
  [SOUND_EFFECT_KEYS.TRAILER]: { volume: 0.8, releaseAfterMs: 7000 },
});

export const registerSoundEffect = (key, source) => {
  SOUND_EFFECT_SOURCES[key] = source;
};

export const registerSoundEffects = (entries) => {
  Object.entries(entries).forEach(([key, source]) => {
    SOUND_EFFECT_SOURCES[key] = source;
  });
};

export const playSoundEffect = async (key, options = {}) => {
  const source = SOUND_EFFECT_SOURCES[key];

  if (!source) {
    return;
  }

  const defaults = SOUND_EFFECT_DEFAULTS[key] || {};
  const volume = options.volume ?? defaults.volume ?? 0.7;
  const releaseAfterMs = options.releaseAfterMs ?? defaults.releaseAfterMs ?? 1500;

  try {
    const player = createAudioPlayer(source);
    player.volume = volume;
    player.play();

    setTimeout(() => {
      try {
        player.release();
      } catch (releaseError) {
        console.warn('Unable to release sound effect player:', releaseError);
      }
    }, releaseAfterMs);
  } catch (error) {
    console.warn(`Unable to play sound effect "${key}":`, error);
  }
};
