import {
  registerSoundEffects,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';

export const initializeSoundEffects = () => {
  registerSoundEffects({
    [SOUND_EFFECT_KEYS.TAP]: null,
    [SOUND_EFFECT_KEYS.SUCCESS]: null,
    [SOUND_EFFECT_KEYS.ERROR]: null,
    [SOUND_EFFECT_KEYS.TRAILER]: null,
  });
};

/*
Replace the null values above after you add your sound files, for example:

registerSoundEffects({
  [SOUND_EFFECT_KEYS.TAP]: require('../../assets/sounds/tap.mp3'),
  [SOUND_EFFECT_KEYS.SUCCESS]: require('../../assets/sounds/success.mp3'),
  [SOUND_EFFECT_KEYS.ERROR]: require('../../assets/sounds/error.mp3'),
  [SOUND_EFFECT_KEYS.TRAILER]: require('../../assets/sounds/trailer.mp3'),
});
*/
