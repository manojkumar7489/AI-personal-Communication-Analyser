# Vocalis AI — Authentic Communication Intelligence & Speech Improvement Platform

Vocalis AI is a full-stack, AI-powered communication coaching web application. It functions as both an authentic, friendly conversational partner and an objective communication coach. Rather than interrupting every turn with academic grammar corrections, it converses naturally, performs background structural analyses, tracks long-term weakness habits (such as overused filler words or rambling explanations), provides iterative retry evaluations, and scales across 18 real-world communication scenarios.

---

## 🛠 Technology Stack

- **Backend Runtime:** Node.js (v18+ or v20+)
- **Application Framework:** Express.js (REST API architecture)
- **Database & ODM:** MongoDB (v6.0+) & Mongoose
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **AI Engine:** Google Gemini API (`@google/genai` SDK with `gemini-2.5-flash`)
- **Frontend Architecture:** Semantic HTML5, Modular CSS3 custom properties, Vanilla JavaScript (ES6 Modules, Fetch API)
- **Voice Capabilities:** Web Speech API (`SpeechRecognition` for STT, `SpeechSynthesis` for TTS)
- **Analytics Visualization:** Chart.js (via CDN)

---

## 📁 Repository Directory Layout

```text
vocalis-app/
├── backend/
│   ├── config/          # Database (Mongoose) & Gemini SDK setups
│   ├── controllers/     # 14 business logic controllers
│   ├── middleware/      # JWT auth, validation & central error handlers
│   ├── models/          # 12 Mongoose data schemas
│   ├── routes/          # Express REST router definitions
│   ├── services/        # Gemini prompt builders, JSON diagnostic extractors
│   ├── utils/           # Safe JSON parsers, token signers, system constants
│   └── server.js        # Express application entry point
├── frontend/
│   ├── css/             # Pure modular CSS (variables, reset, layout, components)
│   ├── js/              # Vanilla ES6 services, components, and page controllers
│   ├── pages/           # HTML templates for all 10 specialized modes
│   └── index.html       # Public landing page
├── .env.example
├── package.json
└── README.md