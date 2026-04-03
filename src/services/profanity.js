const BAD_WORDS_API_URL = 'https://api.apilayer.com/bad_words?censor_character=*';
const BAD_WORDS_API_KEY = process.env.EXPO_PUBLIC_BAD_WORDS_API_KEY;
const LOCAL_FALLBACK_BAD_WORDS = ['ass', 'bastard', 'bitch', 'crap', 'damn', 'fuck', 'shit'];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const censorLocally = (text) => {
  let nextText = text;

  LOCAL_FALLBACK_BAD_WORDS.forEach((word) => {
    const expression = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    nextText = nextText.replace(expression, (match) => `${match[0]}${'*'.repeat(Math.max(match.length - 1, 1))}`);
  });

  return nextText;
};

const extractCensoredBody = (payload, originalText) => {
  if (!payload || typeof payload !== 'object') {
    return originalText;
  }

  if (typeof payload.censored_content === 'string') {
    return payload.censored_content;
  }

  if (typeof payload.censored_string === 'string') {
    return payload.censored_string;
  }

  if (typeof payload.body === 'string') {
    return payload.body;
  }

  if (typeof payload.result === 'string') {
    return payload.result;
  }

  return originalText;
};

export const censorText = async (text) => {
  const trimmedText = text?.trim() || '';

  if (!trimmedText) {
    return '';
  }

  if (!BAD_WORDS_API_KEY) {
    return censorLocally(trimmedText);
  }

  try {
    const response = await fetch(BAD_WORDS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: BAD_WORDS_API_KEY,
      },
      body: JSON.stringify({
        body: trimmedText,
      }),
    });

    if (!response.ok) {
      throw new Error(`Bad Words API returned ${response.status}`);
    }

    const payload = await response.json();
    return extractCensoredBody(payload, trimmedText);
  } catch (error) {
    console.error('Unable to censor text via Bad Words API:', error);
    return censorLocally(trimmedText);
  }
};

export const isBadWordsConfigured = Boolean(BAD_WORDS_API_KEY);

