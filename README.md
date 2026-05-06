# SideRun – Process Portfolio

*Deliverable 2 for CPT208 Human‑Centric Computing*

## 1. Motivation
Our project is inspired by the needs of running community organizers (such as Bo Zhou, founder of a 1000+ member run club) and everyday runners. We identified several key pain points in the current running experience:

- **Lack of Live Tracking in Small Events:** In small-scale marathons or club activities, there is no professional live broadcasting. Audiences and club members cannot track a runner's real-time location, progress, or performance data.
- **Isolation During Runs:** Running is often a solitary experience. Runners lack real-time interaction and emotional support from their friends while on the track.
- **Desire for Social Sharing:** People love sharing their life moments, but standard running apps often lack engaging, highly visual post-run summaries that capture the joy of the run.

**Core Goal:** To make even the smallest daily run an experience worth sharing. 

SideRun solves these issues by providing a platform for **real-time interaction**. It allows friends and audiences to view the runner's live location, speed, and progress, enabling them to interact with the runner on the go. Furthermore, SideRun generates rich, visually appealing post-run summaries, making it effortless for users to share their running achievements and lifestyle with their social circles.

## 2. User Journey
To illustrate how SideRun transforms the running experience, here is a typical user journey for a runner and their friends:

**Phase 1: Before the Run (Preparation & Motivation)**
- **Smart Prompts:** The user receives a daily weather push notification with a smart suggestion for the best time to run today.
- **Goal Setting & Social Check-in:** The user sets a running goal (e.g., 5km) and notifies their friends that they are about to start.
- **Motivation Boost:** Before heading out, the user checks the weekly friend leaderboard to see where they stand, sparking friendly competition.

**Phase 2: During the Run (Live Interaction & Support)**
- **For the Runner:** While running with headphones on, the runner receives Text-to-Speech (TTS) audio messages from friends cheering them on, accompanied by haptic vibration feedback. Glancing at the phone reveals fun, animated emoji reactions popping up on the screen.
- **For the Friends (Audience):** Friends receive a notification that a run has started. They can tap into the live map to watch the runner's real-time route, pace, and distance. They can actively interact by sending emojis and text messages directly to the runner.

**Phase 3: After the Run (Celebration & Sharing)**
- **Achievement Unlocked:** Upon finishing, the user may unlock playful badges based on their performance (e.g., "Early Bird" or "First 5K").
- **Rich Visual Summaries:** SideRun generates a variety of aesthetically pleasing, data-rich post-run summary cards. 
- **Frictionless Sharing:** The user can save these summary cards directly to their phone album with one click, ready to be shared on social media.
- **Post-Run Review:** The user checks the updated friend leaderboard to see their new ranking and celebrates the shared progress.

## 3. Iterative Design Process & Wireframes

Our design process was highly iterative, evolving from a complex, management-heavy concept to a streamlined, playful, and human-centric application.

### 3.1 Concept Evolution (Brainstorming)
- **Initial Concept (The "Management" Approach):** Originally, we envisioned an app tailored for running clubs with distinct "Admin" and "User" roles. The core features included geofencing (alerting admins if a runner left a designated area) and health monitoring (notifying admins if a runner's data reached dangerous thresholds to adjust schedules).
- **The Pivot to "Playful":** We realized the initial concept felt too strict and surveillance-oriented, lacking the "playful" element required by the CPT208 brief. Furthermore, implementing complex background tracking and admin dashboards as a WebApp presented significant technical friction. We pivoted our focus from "managing runners" to "connecting friends," making the experience lighthearted, social, and genuinely fun.

### 3.2 UI/UX Iteration
- **V1: Barebones Functionality:** The earliest prototype was strictly functional—black text on a white background. It worked, but it lacked emotional engagement.
- **V2: The Map Background Experiment:** To make it more dynamic, we tried using a live map of the user's current location as the app's background. However, this introduced two major usability issues: 
  1. Loading the map upon every login caused a noticeable blank screen delay, ruining the first impression.
  2. The map background was too visually noisy, making the foreground text and controls difficult to read.
- **V3: Final High-Fidelity Design:** We moved to Figma to systematically design the UI. After several rounds of adjustments—focusing on clean layouts, clear typography, and playful visual elements (like badges and emoji interactions)—we arrived at our final design. The current UI balances aesthetics with performance, ensuring a smooth and engaging user experience without unnecessary visual clutter.

**[Interactive Figma Prototype](https://www.figma.com/design/NYsE2fd7JVOe06is2upqUw/%E6%88%B4%E6%89%BF%E4%B8%80%E9%A1%B9%E7%9B%AE%E4%B8%80?node-id=4-1389&t=t8zLYw56F8PBG7mG-1)**

## 4. Evaluation

To ensure SideRun meets the needs of its target audience and provides a seamless user experience, we conducted usability testing with real users.

### 4.1 Testing Methodology
We adopted a mixed-participant testing approach:
- **Target Audience Testing:** We invited several experienced runners (recruited through our parents' networks) to test the app's core tracking and social features in real-world scenarios.
- **Peer Testing:** We asked our roommates to test the app to gather feedback from younger, tech-savvy users.
- **Internal Walkthroughs:** The development team continuously tested the app during the build process to catch obvious bugs.

### 4.2 User Feedback
Overall, users loved the core concept. They specifically praised the ability to view a runner's real-time data, noting that it made the experience feel highly connected. However, they also pointed out several areas for improvement:
- **UI/UX Issues:** The interaction design felt a bit rough in places, and some UI elements appeared cluttered.
- **Profile Picture Bug:** The avatar upload feature on the user profile page occasionally became unresponsive. Furthermore, users were frustrated that they couldn't crop or resize their chosen image.
- **Map Integration:** Users noticed slight inaccuracies in the GPS tracking. More importantly, they felt the default map style clashed with the app's overall playful and modern aesthetic.

### 4.3 Improvements Implemented
Based on this valuable feedback, we made the following adjustments:
- **Interaction Refinement:** We overhauled the interaction flows that felt unnatural or unresponsive, aligning them more closely with standard mobile usability conventions (e.g., intuitive gestures, clearer button states).
- **UI Reorganization:** We adjusted the placement of various UI elements to reduce visual clutter and improve the overall aesthetic balance.
- **Map Enhancements:** We explored alternative map providers to improve accuracy and applied custom map styling (e.g., adjusting colors and hiding unnecessary POIs) to ensure the map visually matches SideRun's playful theme.

## 5. Final Reflection

### 5.1 The Biggest Challenge: The Art of Trade-offs
The most significant challenge we faced during this project was feature prioritization—knowing what to keep and what to discard. We constantly walked a tightrope between making the app attractive and feature-rich to solve real user problems, while avoiding feature bloat that could jeopardize technical stability. Learning to say "no" to good ideas in order to deliver a polished, core experience was a difficult but necessary lesson.

### 5.2 Key Takeaways in Human-Centric Design
Through building SideRun and applying the principles of Human-Centric Computing, we learned that good design is not just about writing clean code or making things look pretty; it's about empathy. We realized that technology should adapt to how people naturally behave, not the other way around. By shifting our focus from a rigid "management" tool to a "playful" social connector, we saw firsthand how prioritizing emotional needs—like the desire for companionship and recognition during a run—can fundamentally transform a product's value.

### 5.3 Future Outlook
If we had more time to develop SideRun further, we would love to introduce a "Micro-Racing" feature. This would allow friends to set up spontaneous, small-scale virtual races against each other (e.g., "Who can run 3km the fastest today?"). This would add a new layer of gamification and make the social interaction even more dynamic and engaging.

## 6. Technical Reflection (AI Usage)

In accordance with the course guidelines, this section documents the use of Artificial Intelligence tools during the development of SideRun.

- **Prompts used:** 
  - *Role-playing prompts:* We asked the AI to act as a senior app developer to evaluate the technical feasibility and practicality of our initial feature ideas.
  - *Summarization & Analysis prompts:* We used AI to analyze and summarize UX/UI patterns from successful running apps, helping us adapt those concepts for SideRun.
  - *Code Generation & Design prompts:* We utilized AI to assist with adjusting UI layouts, generating foundational design drafts via Figma integrations, and writing boilerplate code for specific functional implementations.
  - *Documentation prompts:* We used AI to structure this Process Portfolio, translate our Chinese thoughts into professional English, and refine the phrasing.

- **Verification methods:** 
  - *Code Review:* We actively reviewed the comments and logic of the AI-generated code to ensure the implementation flow was correct and secure.
  - *Live Testing:* We immediately ran the generated code in our local web/mobile development environment to visually verify the UI effects and functionally test the features.
  - *Content Review:* For documentation, we thoroughly read through the AI-translated text to ensure it accurately reflected our team's original ideas and actual development process.

- **Ethical considerations:** 
  - *Originality & Ownership:* We ensured that AI was used strictly as an assistant (a "co-pilot") rather than a replacement for our own work. The core concepts, user pain point analysis, target audience definition, and final design decisions were entirely original to our team.
  - *Academic Integrity:* We are transparently declaring our use of AI in this section to maintain academic honesty. We did not use AI to bypass the learning objectives of the course, but rather to enhance our productivity and the quality of our final deliverable.

---

<details>
<summary><b>Technical Documentation (App Features & Setup)</b></summary>

A playful, human‑centric web/mobile app that lets friends share runs in real‑time, send cheers, earn badges, and get smart weather recommendations.

### 🎯 Project Context
This is a coursework project for **CPT208 Human‑Centric Computing**. The app fulfills the requirement of being a **live, interactive Web App** with at least three must‑have playful features.

### ✨ Core Playful Features (CPT208 Must‑Haves)
1. **Real‑time run sharing** – Friends can watch a live run on a map, see speed, distance, and send emoji cheers.
2. **Playful badges & achievements** – Unlock badges based on running milestones (first 5k, early bird, social sharing).
3. **Friend leaderboards & fun comparisons** – Compare weekly distances, see who’s ahead, and celebrate together.

### 📱 Additional Features
- Friend management (add/remove, view profiles)
- Daily weather push notifications with smart time suggestions
- Running diary & dynamic feed
- Route recommendations & collections
- Safety timer for overdue runs
- Dark mode, gesture interactions, haptic feedback

### 🛠 Tech Stack
- **Frontend**: React Native (Expo) – runs on Web, iOS, Android
- **Navigation**: React Navigation
- **Maps**: Expo Location & MapView
- **Weather API**: OpenWeatherMap (or mock)
- **Hosting**: Vercel / GitHub Pages (for web export)
- **Version Control**: Git

### 🚀 Getting Started

#### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

#### Installation
```bash
cd SideRun_APP
npm install
```

#### Running the App
```bash
# Start development server (Web)
npm run web

# Or for iOS/Android
npm run ios
npm run android
```

### 👥 Team
*Group A1‑1* – SideRun project.
Chengyi.Dai23
Tian.Gao23

</details>
