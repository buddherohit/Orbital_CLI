<div align="center">

# 🪐 Orbit CLI (`Orbital_CLI`)

### *An Intelligent, Terminal-First AI Assistant Powered by Google Gemini 2.5, Better-Auth Device Flow & PostgreSQL*

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange.svg)](https://aistudio.google.com/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-Device_Flow-purple.svg)](https://www.better-auth.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_Neon-blue.svg)](https://neon.tech/)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-cli-commands-reference">Commands Reference</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-environment-variables">Environment Setup</a>
</p>

</div>

---

## 🌟 Highlights

**Orbit CLI** transforms your terminal into an AI-powered development powerhouse. It features **secure Web-to-Terminal OAuth Device Flow**, **multi-mode conversational AI**, **real-time tool calling**, and **autonomous agent application generation**, alongside a suite of developer productivity tools.

---

## 🚀 Features

- 🔐 **OAuth Device Flow**: Secure GitHub sign-in via terminal code verification in browser.
- 💬 **Interactive AI Chat**: Fast, context-preserving conversations powered by **Gemini 2.5 Flash**.
- 🛠️ **Real-Time Tool Calling**:
  - 🌐 **Google Search**: Fetch real-time web news and live documentation.
  - 🐍 **Code Execution**: Run Python code securely in sandboxes for dynamic computation.
  - 🔗 **URL Context**: Directly analyze online URLs and web pages from your prompts.
- 🤖 **Autonomous Agent Mode**: Generates full production-ready applications with file trees and setup scripts.
- 👨‍💻 **Developer Productivity Suite**:
  - 📝 **AI Git Commits**: Generates semantic Conventional Commits from `git diff`.
  - 🔍 **AI Code Reviews**: In-depth bug detection, security audits, and performance tips.
  - 📖 **Code Explainer**: Breaks down complex architectures and module logic step-by-step.
  - 🧪 **Unit Test Generator**: Creates production test suites (Vitest, Jest, PyTest, JUnit).
- 📜 **Persistent Session History**: Store, browse, and seamlessly resume previous conversations from PostgreSQL.
- ⚡ **Next.js Web Client**: Sleek dark-mode dashboard for device verification and approvals.

---

## 🏗️ Architecture

```text
Orbital_CLI/
├── client/                     # Next.js Frontend (Device Authorization UI)
│   ├── app/
│   │   ├── (auth)/sign-in/     # GitHub Social Sign-In
│   │   ├── approve/            # Device Approval Handlers
│   │   └── device/             # Verification Code Input Screen
│   ├── components/             # Tailwind CSS & Radix UI Components
│   └── lib/auth-client.ts      # Better-Auth Client Configuration
│
└── server/                     # Express Backend & Orbit CLI Engine
    ├── prisma/
    │   └── schema.prisma       # User, Session, DeviceCode & Chat Schemas
    └── src/
        ├── cli/
        │   ├── commands/
        │   │   ├── ai/         # WakeUp & interactive loops
        │   │   ├── auth/       # Login, Logout & WhoAmI
        │   │   ├── chat/       # Conversation History & Resume
        │   │   └── developer/  # Commit, Review, Explain & Test generator
        │   └── main.js         # Commander CLI Entrypoint
        ├── config/             # Gemini 2.5 & Tool Configurations
        ├── lib/                # Database & Better-Auth Providers
        └── services/           # Prisma Chat Persistence Services
```

---

## 📦 Prerequisites

* **Node.js**: `v18.0.0` or higher
* **PostgreSQL Database**: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or local PostgreSQL
* **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)
* **GitHub OAuth App**: [GitHub Developer Settings](https://github.com/settings/developers)

---

## ⚙️ Environment Variables

Create `.env` in the `server/` directory:

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# Google Gemini AI API Key
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
ORBITAI_MODEL="gemini-2.5-flash"

# GitHub OAuth Application Credentials
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/buddherohit/Orbital_CLI.git
cd Orbital_CLI

# Setup Server & Database
cd server
npm install
npx prisma db push
npm link

# Setup Client
cd ../client
npm install
```

### 2. Start Services
* **Terminal 1 (Backend Server):**
  ```bash
  cd server
  npm run dev
  # Running at http://localhost:3005
  ```
* **Terminal 2 (Frontend Client):**
  ```bash
  cd client
  npm run dev
  # Running at http://localhost:3000
  ```

---

## 📖 CLI Commands Reference

All commands are executed using the `orbit` command in your terminal:

```bash
orbit [command] [options]
```

### 1. Authentication Commands

#### 🔐 `orbit login`
Initiates OAuth Device Flow authentication.
```bash
orbit login
```
* Generates an 8-character user code and opens `http://localhost:3000/device` in your browser.
* Automatically saves session token locally upon approval.

#### 👤 `orbit whoami`
Displays details of currently authenticated user.
```bash
orbit whoami
```

#### 🚪 `orbit logout`
Clears stored credentials and terminates active session.
```bash
orbit logout
```

---

### 2. AI & Assistant Commands

#### 🚀 `orbit wakeup`
Launches the interactive AI assistant mode picker.
```bash
orbit wakeup
```
**Select from 3 powerful modes:**
1. **💬 Chat Mode**: Streamed conversation with markdown rendering.
2. **🛠️ Tool Calling Mode**: Enable tools (Google Search, Python execution, URL Context).
3. **🤖 Agentic Mode**: Autonomous multi-file project scaffolding and generation.

---

### 3. Developer Productivity Suite

#### 📝 `orbit commit`
Analyzes your git working tree/diff and generates conventional commit messages.
```bash
# Analyze staged changes and suggest commit messages
orbit commit

# Automatically stage all files first before analysis
orbit commit -a
```

#### 🔍 `orbit review <filepath>`
Performs an AI-powered code review with bug detection, security checks, and optimization tips.
```bash
orbit review server/src/lib/auth.js
orbit review client/app/page.tsx
```

#### 📖 `orbit explain <filepath>`
Generates a structured, easy-to-understand breakdown of any source file.
```bash
orbit explain server/src/lib/db.js
```

#### 🧪 `orbit test <filepath>`
Automatically crafts comprehensive unit test suites for JavaScript, TypeScript, Python, or Java files.
```bash
orbit test server/src/services/chat.services.js

# Automatically save test file next to the source file
orbit test server/src/services/chat.services.js --save
```

---

### 4. Chat & Session Persistence

#### 📜 `orbit history`
Lists past AI chat conversations stored in PostgreSQL.
```bash
# View all previous conversations
orbit history

# Interactively delete a past conversation
orbit history -d
```

#### 🔄 `orbit resume [conversationId]`
Resumes a previous conversation with full message history and context.
```bash
# Interactive selection menu
orbit resume

# Resume specific conversation directly by ID
orbit resume cmujj17yb0001wlwsw13xy3rq
```

---

## 🛠️ Tech Stack

- **CLI Engine**: [Commander.js](https://github.com/tj/commander.js), [Clack Prompts](https://github.com/natemoo-re/clack), [Chalk](https://github.com/chalk/chalk), [Boxen](https://github.com/sindresorhus/boxen)
- **AI Core**: [Vercel AI SDK](https://sdk.vercel.ai/), [Google Gemini 2.5](https://aistudio.google.com/)
- **Auth**: [Better-Auth](https://www.better-auth.com/) Device Authorization Plugin
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) with [PostgreSQL](https://neon.tech/)
- **Frontend**: [Next.js (App Router)](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/buddherohit/Orbital_CLI/issues).

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/buddherohit">Rohit Buddhe</a></sub>
</div>
