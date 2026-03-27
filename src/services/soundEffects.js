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

export const registerSoundEffect = (key, source) => {
  SOUND_EFFECT_SOURCES[key] = source;
};

export const registerSoundEffects = (entries) => {
  Object.entries(entries).forEach(([key, source]) => {
    SOUND_EFFECT_SOURCES[key] = source;
  });
};

export const playSoundEffect = async (key, { volume = 0.7 } = {}) => {
  const source = SOUND_EFFECT_SOURCES[key];

  if (!source) {
    return;
  }

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
    }, 1500);
  } catch (error) {
    console.warn(`Unable to play sound effect "${key}":`, error);
  }
};
