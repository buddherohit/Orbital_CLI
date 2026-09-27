# 🪐 Orbit CLI (Orbital_CLI)

> An intelligent, terminal-based AI assistant powered by **Google Gemini AI SDK**, **Better-Auth Device Flow (OAuth)**, and **PostgreSQL**.

---

## 🚀 Features

- 🔐 **Device Flow Authentication**: Secure terminal-to-web OAuth login via GitHub.
- 💬 **Interactive AI Chat**: Fast, context-aware conversations using Gemini 2.5 Flash.
- 🛠️ **Tool Calling Capability**:
  - **Google Search**: Access real-time web information.
  - **Code Execution**: Generate and execute Python code on the fly.
  - **URL Context**: Direct web page content analysis from prompts.
- 🤖 **Agentic Mode**: Multi-step autonomous application generation.
- 👨‍💻 **Developer Productivity Suite**:
  - `orbit commit`: AI-powered Conventional Git Commit Generator based on staged diffs.
  - `orbit review <file>`: Deep AI Code Review for bugs, security risks, and optimization.
  - `orbit explain <file>`: Step-by-step code and architectural module explainer.
  - `orbit test <file>`: Automated Unit Test Generator (Vitest, Jest, PyTest, JUnit).
- 📜 **Chat & Session Persistence**:
  - `orbit history`: Browse, manage, and inspect past AI conversations.
  - `orbit resume [id]`: Seamlessly resume previous chat sessions.
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
        │   └── commands/
        │       ├── ai/         # WakeUp router & AI interactive modes
        │       ├── auth/       # Login, Logout & WhoAmI
        │       ├── chat/       # Conversation history & resume
        │       └── developer/  # Commit, Review, Explain & Test generator
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
ORBITAI_MODEL="gemini-2.5-flash"

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

## 🚀 CLI Commands Reference

| Command | Description |
| :--- | :--- |
| `orbit login` | Authenticate using GitHub OAuth via browser device flow |
| `orbit wakeup` | Start interactive assistant (Chat, Tools, or Agent mode) |
| `orbit commit` | Auto-generate conventional commit messages from git diff |
| `orbit review <file>` | AI code review for bugs, vulnerabilities, and clean code tips |
| `orbit explain <file>` | Clear, step-by-step code explainer for any source file |
| `orbit test <file>` | Generate comprehensive unit tests and save them to disk |
| `orbit history` | List and manage past conversations stored in PostgreSQL |
| `orbit resume [id]` | Pick and resume any previous chat conversation |
| `orbit whoami` | Display currently authenticated user details |
| `orbit logout` | Clear active token and session |

---

## 📄 License

This project is licensed under the ISC License.
