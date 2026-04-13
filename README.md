# 🎬 TicketBookApp

A full-featured **movie ticket booking app** built with **React Native** and **Expo**. TicketBookApp lets users browse now-playing and upcoming films, pick a date, choose a cinema & seats, and receive a digital ticket — all backed by **Firebase** for real-time data and auth. It also ships an **AI recommendation engine** (Google Gemini), a **community forum**, and a **streaming section**.

---

## ✨ Features

| Category | Details |
|---|---|
| 🔐 **Authentication** | Email / password sign-up & login via Firebase Auth with session persistence |
| 🎥 **Movie Discovery** | Browse Now Playing, Upcoming, Top Rated, Popular, and Indian Cinema sections powered by TMDB |
| 🔍 **Search** | Real-time movie search with cast, trailer, and detail pages |
| 🗺️ **Location Selection** | Choose city → state before booking |
| 📅 **Date & Showing Selection** | Pick available show dates and time slots for a specific movie |
| 💺 **Seat Selection** | Interactive seat map with real-time availability synced via Firestore transactions |
| 🎟️ **Digital Tickets** | QR-code-style digital ticket generated after a successful booking |
| 🎫 **My Tickets** | View all past and upcoming bookings in one place |
| 🤖 **AI Movie Picks** | Natural-language recommendations powered by Google Gemini — results are enriched with TMDB poster, rating, and IMDB link |
| 📺 **Stream** | Curated streaming catalogue |
| 👥 **Community** | Social feed where users can post text, images, GIFs (Tenor), and voice notes; with likes, comments, and profanity filtering |
| 🛡️ **Admin Panel** | Admins get an extra tab to manage the movie catalogue and showings |
| 🌊 **Animated UI** | Global flowing background, neon glow buttons, shimmer skeleton cards, glass surfaces, and fade-in animations |
| 🔊 **Sound Effects** | Expo Audio sound feedback throughout the app |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Native](https://reactnative.dev/) 0.83 + [Expo](https://expo.dev/) SDK 55 |
| Language | JavaScript (ES2022) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| Backend / Auth | [Firebase](https://firebase.google.com/) v12 — Auth, Firestore, Storage |
| Movie Data | [TMDB API](https://developer.themoviedb.org/) |
| AI Recommendations | [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`) |
| Profanity Filter | [Bad Words API](https://www.purgomalum.com/) with local fallback |
| GIF Support | [Tenor API](https://tenor.com/gifapi) |
| Animations | React Native Reanimated v4 + Expo Linear Gradient + Expo Blur |
| Storage Persistence | AsyncStorage |
| Build / Deploy | [EAS Build](https://docs.expo.dev/build/introduction/) |

---

## 📁 Project Structure

```
TicketBookApp/
├── App.js                        # Root component — navigation stack & error boundary
├── app.json                      # Expo config (name, icons, package IDs)
├── eas.json                      # EAS build profiles
├── package.json
├── assets/
│   └── branding/                 # App icon, splash screen, adaptive icon
├── docs/                         # Developer setup notes for each API key
│   ├── GEMINI_API_KEY.md
│   ├── BAD_WORDS_API_KEY.md
│   └── TENOR_MOVIE_TYPES.md
└── src/
    ├── components/               # Reusable UI primitives
    │   ├── AnimatedPressable.js
    │   ├── DropdownField.js
    │   ├── GlassSurface.js
    │   ├── GlobalFlowBackground.js
    │   ├── Loader.js
    │   ├── NeonGlowButton.js
    │   ├── ShimmerSkeletonCard.js
    │   └── ToastProvider.js
    ├── config/
    │   ├── firebase.js           # Firebase initialisation
    │   └── soundManifest.js      # Sound effect asset mapping
    ├── context/
    │   └── SessionProvider.js    # Auth session context (user, isAdmin)
    ├── hooks/
    │   ├── useFadeInUp.js        # Entrance animation hook
    │   └── useMovieLikes.js      # Per-movie like state
    ├── navigation/
    │   └── MainTabNavigator.js   # Bottom tab bar (Discover, Picks, Stream, Community, Tickets, Admin)
    ├── screens/
    │   ├── SplashScreen.js
    │   ├── LoginScreen.js
    │   ├── SignupScreen.js
    │   ├── HomeScreen.js         # Discover tab — carousels per category
    │   ├── MovieListScreen.js    # Full list for a given category
    │   ├── MovieDetailsScreen.js # Cast, trailer, rating, booking CTA
    │   ├── LocationSelectionScreen.js
    │   ├── DateSelectionScreen.js
    │   ├── SeatSelectionScreen.js
    │   ├── DigitalTicketScreen.js
    │   ├── MyTicketsScreen.js
    │   ├── AIRecommendationsScreen.js
    │   ├── StreamScreen.js
    │   ├── CommunityScreen.js
    │   ├── PlayerScreen.js       # In-app YouTube / WebView player
    │   └── AdminPanelScreen.js
    ├── services/                 # All API & Firestore logic
    │   ├── tmdb.js               # TMDB REST client
    │   ├── geminiRecommendations.js
    │   ├── bookings.js           # Seat reservation (Firestore transaction)
    │   ├── showings.js           # Showtime data
    │   ├── community.js          # Community posts, likes, comments
    │   ├── movieLikes.js         # Per-movie like counts
    │   ├── adminCatalog.js       # Admin movie CRUD
    │   ├── bookingCatalog.js     # Booking catalogue
    │   ├── streamCatalog.js      # Streaming catalogue
    │   ├── profanity.js          # Bad Words API + local fallback
    │   └── soundEffects.js       # Expo Audio helpers
    └── utils/
        └── firebaseAuthErrors.js # Human-readable Firebase Auth error messages
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.4
- **npm** or **yarn**
- **Expo CLI** — `npm install -g expo-cli` (or use `npx expo`)
- **Android Studio** / **Xcode** (for native builds) or the **Expo Go** app for quick testing

### 1. Clone the repository

```bash
git clone https://github.com/Vansh-programmer/TicketBookApp.git
cd TicketBookApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the following keys:

```env
# ── TMDB ──────────────────────────────────────────────────────────────────────
EXPO_PUBLIC_TMDB_API_TOKEN=your_tmdb_read_access_token

# ── Firebase ──────────────────────────────────────────────────────────────────
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# ── Google Gemini (AI Recommendations) ────────────────────────────────────────
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash   # optional, this is the default

# ── Bad Words / Profanity Filter ──────────────────────────────────────────────
EXPO_PUBLIC_BAD_WORDS_API_KEY=your_bad_words_api_key  # optional — app falls back gracefully
```

> **Tip:** Restart the Expo dev server after editing `.env` to pick up the new values.

#### Where to get each key

| Key | Source |
|---|---|
| `TMDB_API_TOKEN` | [TMDB Developer portal](https://developer.themoviedb.org/docs/getting-started) — use the **Read Access Token** |
| `FIREBASE_*` | [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `BAD_WORDS_API_KEY` | [PurgoMalum](https://www.purgomalum.com/) (free) |

### 4. Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Email / Password** authentication under *Authentication → Sign-in method*.
3. Create a **Firestore Database** (start in test mode for development).
4. Enable **Firebase Storage** for community media uploads.
5. (Optional) Set Firestore security rules for `bookings`, `showings`, and `communityPosts` collections.

### 5. Run the app

```bash
# Start Expo dev server
npm start

# Run on Android emulator / device
npm run android

# Run on iOS simulator / device
npm run ios

# Run in the browser (limited native features)
npm run web
```

---

## 📱 App Navigation Flow

```
Splash ──► Login / Signup
              │
              ▼
         Main Tabs
         ├── Discover    — movie carousels (Now Playing, Upcoming, Top Rated, Popular, Indian Cinema)
         ├── Picks       — AI-powered recommendations (Gemini)
         ├── Stream      — streaming catalogue
         ├── Community   — social feed with posts, GIFs, voice notes
         ├── Tickets     — user's booked tickets
         └── Admin*      — admin catalogue management  (* admin users only)

Booking flow (launched from MovieDetails):
  MovieDetails ──► LocationSelection ──► DateSelection ──► SeatSelection ──► DigitalTicket
```

---

## 🏗️ Building for Production

This project uses **EAS Build**.

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile production
```

Build profiles are defined in `eas.json`. Make sure your environment variables are configured in the EAS project dashboard or in `eas.json` for each profile.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m "feat: add my feature"`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Open a Pull Request.

---

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.
