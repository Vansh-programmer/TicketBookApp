# Bad Words API Key Setup

Add this variable to your local `.env` file or EAS environment:

```env
EXPO_PUBLIC_BAD_WORDS_API_KEY=your_bad_words_api_key_here
```

Notes:

- The community composer uses this key to censor post and comment text before saving.
- If the key is missing or the API is unavailable, the app falls back to a very small local censor list so posting still works.
- Restart Expo after changing `.env` values.
