# 🪐 Orbit CLI (Orbital_CLI)

> An intelligent, terminal-based AI assistant powered by **Google Gemini AI SDK**, **Better-Auth Device Flow (OAuth)**, and **PostgreSQL**.

---

## 🚀 Features

- 🔐 **Device Flow Authentication**: Secure terminal-to-web OAuth login via GitHub.
- 💬 **Interactive AI Chat**: Fast, context-aware conversations using Gemini 1.5 Flash.
- 🛠️ **Tool Calling Capability**:
  - **Google Search**: Access real-time web information.
  - **Code Execution**: Generate and execute Python code on the fly.
  - **URL Context**: Direct web page content analysis from prompts.
- 🤖 **Agentic Mode**: Multi-step autonomous agent workflows.
- ⚡ **Modern Next.js Web UI**: Clean interface for device authorization and session management.

---

## 🏗️ Architecture

```
Orbital_CLI/
├── client/          # Next.js Frontend (Device Authorization UI)
│   ├── app/         # Next.js App Router (device verification, sign-in)
│   ├── components/  # Tailwind/Radix UI components
│   └── lib/         # Better-Auth client configuration
│
└── server/          # Express Backend + CLI
    ├── prisma/      # PostgreSQL Schema (Prisma ORM)
    └── src/
        ├── cli/     # Orbit CLI commands & interactive loops
        ├── config/  # AI SDK and tool configurations
        ├── lib/     # Better-Auth & Database handlers
        └── services/# Chat session persistence
```

---

## 📦 Prerequisites

- **Node.js** (v18+)
- **PostgreSQL Database** (Neon, Supabase, or local instance)
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/app/apikey))
- **GitHub OAuth App Credentials** ([GitHub Developer Settings](https://github.com/settings/developers))

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory:

```env
# PostgreSQL Database
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
ORBITAI_MODEL="gemini-1.5-flash"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/buddherohit/Orbital_CLI.git
   cd Orbital_CLI
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm install
   npx prisma db push
   npm link
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   ```

---

## 🚀 Running the Project

1. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:3005
   ```

2. **Start Frontend Web Client:**
   ```bash
   cd client
   npm run dev
   # Runs on http://localhost:3000
   ```

3. **Use the CLI:**
   ```bash
   # Login via device flow
   orbit login

   # Start interactive AI assistant
   orbit wakeup

   # Inspect session & logout
   orbit whoami
   orbit logout
   ```

---

## 📄 License

This project is licensed under the ISC License.
