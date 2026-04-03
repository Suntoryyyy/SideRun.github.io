# SideRun – Friends‑Shared Running Assistant

A playful, human‑centric web/mobile app that lets friends share runs in real‑time, send cheers, earn badges, and get smart weather recommendations.

## 🎯 Project Context
This is a coursework project for **CPT208 Human‑Centric Computing**. The app fulfills the requirement of being a **live, interactive Web App** with at least three must‑have playful features.

## ✨ Core Playful Features (CPT208 Must‑Haves)
1. **Real‑time run sharing** – Friends can watch a live run on a map, see speed, distance, and send emoji cheers.
2. **Playful badges & achievements** – Unlock badges based on running milestones (first 5k, early bird, social sharing).
3. **Friend leaderboards & fun comparisons** – Compare weekly distances, see who’s ahead, and celebrate together.

## 📱 Additional Features (from SideRun.txt)
- Friend management (add/remove, view profiles)
- Daily weather push notifications with smart time suggestions
- Running diary & dynamic feed
- Route recommendations &收藏
- Safety timer for overdue runs
- Dark mode, gesture interactions, haptic feedback

## 🛠 Tech Stack
- **Frontend**: React Native (Expo) – runs on Web, iOS, Android
- **Navigation**: React Navigation (to be added)
- **Maps**: Expo Location & MapView (to be integrated)
- **Weather API**: OpenWeatherMap (or mock)
- **Hosting**: Vercel / GitHub Pages (for web export)
- **Version Control**: Git

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Installation
```bash
cd SideRun_APP
npm install
```

### Running the App
```bash
# Start development server (Web)
npm run web

# Or for iOS/Android
npm run ios
npm run android
```

### Building for Web
```bash
expo export:web
# Output goes to `web‑build/` – deploy to Vercel/GitHub Pages.
```

## 📁 Project Structure
```
SideRun_APP/
├── App.js                 # Main app component with tab navigation
├── screens/               # Screen components (Home, Friends, Run, Weather, Badges)
├── components/            # Reusable UI components
├── assets/                Icons, images, fonts
├── package.json
└── README.md
```

## 📄 License
For educational use only – CPT208 coursework.

## 👥 Team
*Group A1‑1* – SideRun project.
Chengyi.Dai23
Tian.Gao23
