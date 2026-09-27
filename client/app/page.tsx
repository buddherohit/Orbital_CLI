"use client"

import { useState, useEffect, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  Terminal,
  Activity,
  Database,
  Cpu,
  Key,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Play,
  Trash2,
  CornerDownLeft,
  Search,
  Command as CommandIcon,
  GitBranch,
  Clock,
  ShieldCheck,
  ChevronRight,
  Plus,
  X,
  Code,
  Sliders,
} from "lucide-react"

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  mode: string
  updatedAt: string
  _count?: { messages: number }
  messages?: Message[]
}

interface SystemStats {
  totalConversations: number
  totalMessages: number
  breakdown: { chat: number; tool: number; agent: number }
  status: string
  model: string
  database: string
}

interface CommandBlock {
  id: string
  command: string
  output: string
  type: "command" | "system" | "error"
  timestamp: string
  duration?: string
  status?: "success" | "error" | "running"
}

export default function WarpTerminalDashboard() {
  const { data, isPending } = authClient.useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"terminal" | "history" | "metrics" | "device">("terminal")
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [selectedConvMessages, setSelectedConvMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deviceCodeInput, setDeviceCodeInput] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [approveMsg, setApproveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Warp-style Command Blocks
  const [commandBlocks, setCommandBlocks] = useState<CommandBlock[]>([
    {
      id: "init-banner",
      command: "orbit --version",
      output: `   ___       _     _ _      ____ _     ___ 
  / _ \\ _ __| |__ (_) |_   / ___| |   |_ _|
 | | | | '__| '_ \\| | __| | |   | |    | | 
 | |_| | |  | |_) | | |_  | |___| |___ | | 
  \\___/|_|  |_.__/|_|\\__|  \\____|_____|___|
                                           
Orbit CLI Engine v0.0.1 • Connected to Gemini 2.5 Flash • Neon PostgreSQL
Type 'help' or click any command below to execute.`,
      type: "system",
      timestamp: new Date().toLocaleTimeString(),
      status: "success",
    },
  ])

  const [inputVal, setInputVal] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")

  const blocksEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clock for Tmux statusbar
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString())
    updateTime()
    const t = setInterval(updateTime, 1000)
    return () => clearInterval(t)
  }, [])

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, convsRes] = await Promise.all([
        fetch("http://localhost:3005/api/stats", { credentials: "include" }),
        fetch("http://localhost:3005/api/conversations", { credentials: "include" }),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (convsRes.ok) {
        const convList = await convsRes.json()
        setConversations(convList)
        if (convList.length > 0 && !selectedConv) {
          loadConversationDetail(convList[0].id)
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    blocksEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [commandBlocks])

  const loadConversationDetail = async (id: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`http://localhost:3005/api/conversations/${id}`, { credentials: "include" })
      if (res.ok) {
        const detail = await res.json()
        setSelectedConv(detail)
        setSelectedConvMessages(detail.messages || [])
      }
    } catch (err) {
      console.error("Failed to load conversation:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Execute Command
  const runCommand = async (cmdToRun?: string) => {
    const rawCmd = cmdToRun || inputVal
    if (!rawCmd.trim() || isExecuting) return

    const cmd = rawCmd.trim()
    const blockId = Math.random().toString(36).substring(2, 9)
    const startTime = Date.now()
    const timestamp = new Date().toLocaleTimeString()

    setCmdHistory((prev) => [...prev, cmd])
    setHistoryIdx(-1)
    setInputVal("")
    setIsCommandPaletteOpen(false)

    if (cmd.toLowerCase() === "clear" || cmd.toLowerCase() === "cls") {
      setCommandBlocks([])
      return
    }

    // Add running block
    const newBlock: CommandBlock = {
      id: blockId,
      command: cmd,
      output: "",
      type: "command",
      timestamp,
      status: "running",
    }

    setCommandBlocks((prev) => [...prev, newBlock])
    setIsExecuting(true)

    try {
      const res = await fetch("http://localhost:3005/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ command: cmd }),
      })

      const data = await res.json()
      const duration = `${Date.now() - startTime}ms`

      setCommandBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? { ...b, output: data.output || "Command completed with no output.", status: "success", duration }
            : b
        )
      )
      fetchData()
    } catch (err: any) {
      setCommandBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? { ...b, output: `[EXECUTION FAILED]: ${err.message}`, status: "error", duration: "0ms" }
            : b
        )
      )
    } finally {
      setIsExecuting(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(nextIdx)
        setInputVal(cmdHistory[nextIdx])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (cmdHistory.length > 0 && historyIdx !== -1) {
        const nextIdx = historyIdx + 1
        if (nextIdx >= cmdHistory.length) {
          setHistoryIdx(-1)
          setInputVal("")
        } else {
          setHistoryIdx(nextIdx)
          setInputVal(cmdHistory[nextIdx])
        }
      }
    }
  }

  const handleQuickApprove = async () => {
    if (!deviceCodeInput.trim()) return
    setIsApproving(true)
    setApproveMsg(null)
    try {
      const res = await authClient.device.approve({ userCode: deviceCodeInput.trim() })
      if (res.error) {
        setApproveMsg({ type: "error", text: res.error.message || "Failed to authorize code" })
      } else {
        setApproveMsg({ type: "success", text: "✓ Device Authorized Successfully!" })
        setDeviceCodeInput("")
      }
    } catch (e: any) {
      setApproveMsg({ type: "error", text: e.message || "Approval error" })
    } finally {
      setIsApproving(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080b13] text-[#00ff88]">
        <div className="flex items-center gap-3 text-sm tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
          <span>INITIALIZING WARP ENGINE...</span>
        </div>
      </div>
    )
  }

  if (!data?.session && !data?.user) {
    router.push("/sign-in")
    return null
  }

  const allAvailableCommands = [
    { cmd: "orbit wakeup Write a hello world program in Rust", desc: "Interact with Gemini 2.5 Flash assistant", group: "AI Core" },
    { cmd: "orbit commit", desc: "Analyze git diff and generate Conventional Commit messages", group: "Git Suite" },
    { cmd: "orbit review server/src/lib/auth.js", desc: "Security and bug code audit on file", group: "Developer" },
    { cmd: "orbit explain server/src/lib/db.js", desc: "Step-by-step logic breakdown", group: "Developer" },
    { cmd: "orbit test server/src/services/chat.services.js", desc: "Generate automated unit test suites", group: "Developer" },
    { cmd: "orbit history", desc: "List recent conversation streams from Neon DB", group: "History" },
    { cmd: "orbit config", desc: "View active model and server configuration", group: "Config" },
    { cmd: "whoami", desc: "Display current user credentials and session details", group: "Auth" },
    { cmd: "system", desc: "Inspect live database, server port and AI latency", group: "Diagnostics" },
    { cmd: "clear", desc: "Clear terminal execution block history", group: "Terminal" },
  ]

  return (
    <div className="min-h-screen bg-[#080b13] text-zinc-100 flex flex-col justify-between font-mono relative selection:bg-[#00ff88]/20 selection:text-[#00ff88]">
      {/* Subtle Laser Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-80" />

      {/* Warp Window Chrome / Header */}
      <header className="border-b border-[#1e293b] bg-[#0c101c] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none">
        {/* Left: macOS Traffic Lights & Ghostty Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer" />
          </div>

          <div className="flex items-center gap-1 bg-[#080b13] p-1 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "terminal"
                  ? "bg-[#162033] text-[#00ff88] border border-[#00ff8844] shadow-[0_0_10px_rgba(0,255,136,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>terminal:main</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-[#162033] text-[#00e5ff] border border-[#00e5ff44] shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>vault:db ({conversations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("metrics")}
              className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "metrics"
                  ? "bg-[#162033] text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>system:metrics</span>
            </button>

            <button
              onClick={() => setActiveTab("device")}
              className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === "device"
                  ? "bg-[#162033] text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>device:keypad</span>
            </button>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#080b13] border border-[#1e293b] hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span>Type a command or query...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">⌘K</kbd>
        </button>

        {/* Right: User & Exit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#080b13] border border-[#1e293b] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-zinc-300 font-bold">{data?.user?.name || "developer"}</span>
          </div>

          <button
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}
            className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-red-400 transition-colors text-xs"
            title="Disconnect Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Terminal Window Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-hidden flex flex-col">
        {/* TAB 1: WARP TERMINAL WORKSPACE */}
        {activeTab === "terminal" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Quick Actions Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-500 font-semibold text-[11px] shrink-0">RECOMMENDED:</span>
              {[
                "orbit wakeup What are the key features of Orbital CLI?",
                "orbit commit",
                "orbit review server/src/lib/auth.js",
                "orbit explain server/src/lib/db.js",
                "orbit history",
                "system",
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => runCommand(cmd)}
                  className="px-2.5 py-1 rounded-md bg-[#0e1424] border border-[#1e293b] hover:border-[#00ff88] text-zinc-300 hover:text-[#00ff88] shrink-0 transition-all text-xs"
                >
                  $ {cmd.slice(0, 32)}
                  {cmd.length > 32 ? "..." : ""}
                </button>
              ))}
            </div>

            {/* Warp Command Blocks Stream */}
            <div className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-280px)] space-y-4">
              {commandBlocks.map((block) => (
                <div
                  key={block.id}
                  className="group rounded-lg border border-[#1e293b] bg-[#0e1424]/90 overflow-hidden hover:border-[#00ff8844] transition-all shadow-sm"
                >
                  {/* Block Header / Command Line */}
                  <div className="bg-[#121a2d] px-4 py-2 flex items-center justify-between gap-2 text-xs border-b border-[#1e293b]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[#00ff88] font-bold">❯</span>
                      <span className="text-white font-bold truncate">{block.command}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
                      {block.duration && (
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                          {block.duration}
                        </span>
                      )}
                      <span className="text-zinc-500">{block.timestamp}</span>
                      <button
                        onClick={() => handleCopyText(block.output, block.id)}
                        className="p-1 rounded hover:bg-zinc-800 hover:text-[#00ff88] transition-colors"
                        title="Copy Output"
                      >
                        {copiedId === block.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Block Content / Output */}
                  <div className="p-4 text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {block.status === "running" ? (
                      <div className="flex items-center gap-2 text-amber-300 animate-pulse">
                        <span className="animate-spin">⚙️</span>
                        <span>Orbit AI is streaming response...</span>
                      </div>
                    ) : (
                      block.output
                    )}
                  </div>
                </div>
              ))}
              <div ref={blocksEndRef} />
            </div>

            {/* Warp Sticky Bottom Command Prompt Input Bar */}
            <div className="bg-[#0b0f19] border border-[#1e293b] focus-within:border-[#00ff88] rounded-xl p-3 shadow-lg transition-all">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5 px-1 font-mono">
                <span className="text-[#00e5ff] flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> main
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">~/Orbital_CLI</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[#00ff88]">node:v22</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[#00ff88] font-bold text-base pl-1 shrink-0">❯</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type any orbit command or question (e.g. 'orbit commit', 'help', 'orbit wakeup <query>')..."
                  disabled={isExecuting}
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-zinc-600 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => runCommand()}
                  disabled={isExecuting || !inputVal.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00ff88] hover:bg-[#00e5ff] text-black font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>RUN</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONVERSATION VAULT */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
            <div className="lg:col-span-4 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-[#1e293b] mb-3">
                <span className="font-bold text-zinc-200">CONVERSATION STREAMS</span>
                <button onClick={fetchData} className="hover:text-[#00ff88] flex items-center gap-1 text-xs">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">No conversations found in Neon DB</div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversationDetail(c.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedConv?.id === c.id
                          ? "bg-[#162033] border-[#00e5ff] text-white"
                          : "bg-[#0e1424] border-[#1e293b] hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-black/50 text-[#00ff88] border border-[#00ff8844] uppercase font-bold">
                          {c.mode}
                        </span>
                        <span className="text-zinc-500">{new Date(c.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold truncate text-zinc-200">{c.title || "Untitled"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-8 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-5 flex flex-col">
              <div className="border-b border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#00e5ff]">{selectedConv?.title || "Select Conversation"}</h3>
                  <p className="text-[10px] text-zinc-500">ID: {selectedConv?.id || "N/A"}</p>
                </div>
                {selectedConv && (
                  <button
                    onClick={() => {
                      setActiveTab("terminal")
                      runCommand(`orbit resume ${selectedConv.id}`)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#00e5ff22] border border-[#00e5ff55] text-[#00e5ff] hover:bg-[#00e5ff44]"
                  >
                    Resume in Terminal
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                {loadingMessages ? (
                  <div className="text-center py-12 text-zinc-500 animate-pulse">Loading message records...</div>
                ) : selectedConvMessages.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600">No message history in this session</div>
                ) : (
                  selectedConvMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-lg border leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#101726] border-blue-900/60 text-blue-100 ml-6"
                          : "bg-[#0e1424] border-[#00ff8844] text-zinc-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 border-b border-zinc-800/60 pb-1">
                        <span className={`font-bold ${msg.role === "user" ? "text-blue-400" : "text-[#00ff88]"}`}>
                          {msg.role === "user" ? "USER PROMPT" : "ORBIT ASSISTANT"}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM METRICS */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b0f19]">
                <p className="text-xs text-zinc-400 uppercase font-bold">Total Conversations</p>
                <p className="text-3xl font-extrabold text-[#00ff88] mt-2">{stats?.totalConversations || 0}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">Neon PostgreSQL Storage</p>
              </div>

              <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b0f19]">
                <p className="text-xs text-zinc-400 uppercase font-bold">Message Cycles</p>
                <p className="text-3xl font-extrabold text-[#00e5ff] mt-2">{stats?.totalMessages || 0}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">Prompt / Completion pairs</p>
              </div>

              <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b0f19]">
                <p className="text-xs text-zinc-400 uppercase font-bold">Active Engine</p>
                <p className="text-lg font-extrabold text-amber-400 mt-2 truncate">{stats?.model || "gemini-2.5-flash"}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">Google GenAI SDK v2</p>
              </div>

              <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b0f19]">
                <p className="text-xs text-zinc-400 uppercase font-bold">Server Port</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">:3005</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">Express.js API Engine</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVICE KEYPAD */}
        {activeTab === "device" && (
          <div className="max-w-md mx-auto p-6 rounded-2xl border border-amber-500/40 bg-[#0b0f19] space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">Authorize CLI Session</h2>
              <p className="text-xs text-zinc-400">
                Enter user code shown on terminal after running <span className="text-[#00ff88]">orbit login</span>.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                maxLength={8}
                value={deviceCodeInput}
                onChange={(e) => setDeviceCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER USER CODE"
                className="w-full text-center tracking-[0.3em] font-mono text-lg font-bold bg-black border border-zinc-700 focus:border-amber-400 rounded-lg px-4 py-3 text-amber-300 outline-none uppercase transition-all"
              />

              {approveMsg && (
                <div
                  className={`text-xs p-2.5 rounded-lg border text-center font-bold ${
                    approveMsg.type === "success"
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                      : "bg-red-950/60 border-red-500 text-red-300"
                  }`}
                >
                  {approveMsg.text}
                </div>
              )}

              <button
                onClick={handleQuickApprove}
                disabled={isApproving || deviceCodeInput.length < 4}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? "AUTHORIZING..." : "GRANT ACCESS"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tmux / Powerline Bottom Status Bar */}
      <footer className="border-t border-[#1e293b] bg-[#080b13] px-4 py-1.5 flex flex-wrap items-center justify-between gap-4 text-[11px] select-none">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#00ff88] text-black font-extrabold uppercase text-[10px]">
            NORMAL
          </span>
          <span className="text-[#00e5ff] font-bold flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> main*
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">node:v22.20</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-zinc-400 text-[11px]">
          <span>orbit-engine: <strong className="text-zinc-200">gemini-2.5-flash</strong></span>
          <span className="text-zinc-600">•</span>
          <span>database: <strong className="text-emerald-400">neon-pg:healthy</strong></span>
          <span className="text-zinc-600">•</span>
          <span>server: <strong className="text-purple-400">:3005</strong></span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
          <span>utf-8</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-zinc-500" /> {currentTime}
          </span>
        </div>
      </footer>

      {/* Command Palette Modal (Cmd+K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-[#0b0f19] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3 border-b border-[#1e293b] flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search commands (e.g. commit, review, explain, test, history)..."
                className="flex-1 bg-transparent text-sm text-white outline-none font-mono"
                autoFocus
              />
              <button onClick={() => setIsCommandPaletteOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {allAvailableCommands.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveTab("terminal")
                    runCommand(item.cmd)
                  }}
                  className="p-2.5 rounded-lg hover:bg-[#162033] hover:text-white text-zinc-300 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-[#00ff88]">{item.cmd}</span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{item.group}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
