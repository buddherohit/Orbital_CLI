"use client"

import { useState, useEffect, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  Terminal as TerminalIcon,
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
  Maximize2,
  Radio,
  CornerDownLeft,
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

interface TerminalLog {
  id: string
  type: "input" | "output" | "system" | "error"
  text: string
  timestamp: string
}

export default function HackerDashboard() {
  const { data, isPending } = authClient.useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"terminal" | "history" | "metrics" | "device">("terminal")
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [selectedConvMessages, setSelectedConvMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const [deviceCodeInput, setDeviceCodeInput] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [approveMsg, setApproveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Interactive Web Terminal State
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: "init-1",
      type: "system",
      text: "🪐 ORBIT://CORE_KERNEL v1.0.0 [NEON MATRIX INITIALIZED]\nType 'help' or 'orbit wakeup <query>' to start AI execution.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Fetch stats and conversation history
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
      console.error("Dashboard data fetch error:", err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [terminalLogs])

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

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  // Web Terminal Command Execution
  const executeTerminalCmd = async (commandToRun?: string) => {
    const cmd = commandToRun || terminalInput
    if (!cmd.trim() || isExecuting) return

    const trimmed = cmd.trim()
    const time = new Date().toLocaleTimeString()

    // Add to logs & history
    setTerminalLogs((prev) => [...prev, { id: Math.random().toString(), type: "input", text: trimmed, timestamp: time }])
    setCmdHistory((prev) => [...prev, trimmed])
    setHistoryIndex(-1)
    setTerminalInput("")

    if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "cls") {
      setTerminalLogs([])
      return
    }

    setIsExecuting(true)

    try {
      const res = await fetch("http://localhost:3005/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ command: trimmed }),
      })

      const data = await res.json()
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "output",
          text: data.output || "Command executed.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      fetchData()
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: "error",
          text: `[NETWORK ERROR] Failed to reach server :3005: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeTerminalCmd()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(nextIdx)
        setTerminalInput(cmdHistory[nextIdx])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (cmdHistory.length > 0 && historyIndex !== -1) {
        const nextIdx = historyIndex + 1
        if (nextIdx >= cmdHistory.length) {
          setHistoryIndex(-1)
          setTerminalInput("")
        } else {
          setHistoryIndex(nextIdx)
          setTerminalInput(cmdHistory[nextIdx])
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-[#00ff88] font-mono">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#00ff88] animate-ping opacity-30"></div>
          <div className="w-full h-full rounded-full border-2 border-t-[#00e5ff] border-r-transparent border-b-[#00ff88] border-l-transparent animate-spin"></div>
        </div>
        <p className="animate-pulse tracking-[0.3em] text-sm text-[#00ff88]">
          [ INITIALIZING ORBIT://CYBER_CORE ]
        </p>
      </div>
    )
  }

  if (!data?.session && !data?.user) {
    router.push("/sign-in")
    return null
  }

  const quickPresets = [
    "orbit wakeup What is Orbital CLI and how to use it?",
    "orbit commit",
    "orbit review server/src/lib/auth.js",
    "orbit explain server/src/lib/db.js",
    "system",
    "orbit config",
    "orbit history",
  ]

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 font-mono selection:bg-[#00ff88]/30 selection:text-[#00ff88] relative overflow-x-hidden">
      {/* Laser Sweep & Glowing Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff880a_1px,transparent_1px),linear-gradient(to_bottom,#00ff880a_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent animate-laser pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-44 bg-gradient-to-b from-[#00e5ff12] to-transparent blur-3xl pointer-events-none" />

      {/* Cyber Header Navigation */}
      <header className="relative z-20 border-b border-[#00ff8833] bg-[#070d1d]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_30px_rgba(0,255,136,0.08)]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-black border border-[#00ff88] flex items-center justify-center text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.4)] animate-pulse">
            <TerminalIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00e5ff] tracking-widest">
                ORBIT://CORE_HACKER_HUB
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff8820] text-[#00ff88] border border-[#00ff8855] font-bold">
                LIVE TERMINAL
              </span>
            </div>
            <p className="text-xs text-zinc-400">Terminal-First AI Engine • Better-Auth OAuth • Gemini 2.5</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-[#00ff8844] shadow-[0_0_10px_rgba(0,255,136,0.15)]">
            <Radio className="w-3.5 h-3.5 text-[#00ff88] animate-pulse" />
            <span className="text-zinc-400">STATUS:</span>
            <span className="text-[#00ff88] font-bold">ONLINE :3005</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-[#00e5ff44] shadow-[0_0_10px_rgba(0,229,255,0.15)]">
            <Cpu className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="text-zinc-400">MODEL:</span>
            <span className="text-[#00e5ff] font-bold">{stats?.model || "gemini-2.5-flash"}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">DB:</span>
            <span className="text-amber-400 font-bold">NEON POSTGRES</span>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-black/90 border border-[#00ff8855] px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(0,255,136,0.1)]">
            <img
              src={data?.user?.image || "/avatar.png"}
              alt="User"
              className="w-6 h-6 rounded-full border border-[#00ff88]"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-zinc-100">{data?.user?.name || "Hacker"}</p>
              <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{data?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}
            className="px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-700/80 hover:bg-red-900/80 text-red-300 transition-all text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DISCONNECT</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "terminal"
                ? "bg-[#00ff8822] border border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            <span>INTERACTIVE_TERMINAL</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-[#00e5ff22] border border-[#00e5ff] text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>CONVERSATION_VAULT ({conversations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "metrics"
                ? "bg-purple-500/20 border border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>SYSTEM_METRICS</span>
          </button>

          <button
            onClick={() => setActiveTab("device")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "device"
                ? "bg-amber-500/20 border border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>DEVICE_KEYPAD</span>
          </button>
        </div>

        {/* TAB 1: INTERACTIVE WEB TERMINAL & COMMAND CENTER */}
        {activeTab === "terminal" && (
          <div className="space-y-6">
            {/* Quick Command Launcher Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Play className="w-3 h-3 text-[#00ff88]" /> QUICK RUN:
              </span>
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => executeTerminalCmd(preset)}
                  className="px-2.5 py-1 rounded bg-[#071324] border border-zinc-800 hover:border-[#00e5ff] text-zinc-300 hover:text-[#00e5ff] shrink-0 transition-all font-mono text-[11px]"
                >
                  $ {preset.slice(0, 30)}
                  {preset.length > 30 ? "..." : ""}
                </button>
              ))}
            </div>

            {/* Live Interactive Hacker Terminal Box */}
            <div className="rounded-xl border border-[#00ff8866] bg-[#050914] shadow-[0_0_40px_rgba(0,255,136,0.12)] overflow-hidden flex flex-col h-[520px]">
              {/* Terminal Window Header */}
              <div className="border-b border-[#00ff8833] bg-[#081020] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-[#00ff88]/80"></div>
                  <span className="ml-2 text-xs font-bold text-[#00ff88] tracking-wider">
                    bash - orbit@terminal-hub:~ (gemini-2.5)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <button
                    onClick={() => setTerminalLogs([])}
                    className="p-1 rounded hover:bg-zinc-800 hover:text-white"
                    title="Clear Terminal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Logs Output */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 leading-relaxed">
                {terminalLogs.map((log) => (
                  <div key={log.id}>
                    {log.type === "input" && (
                      <div className="flex items-center gap-2 text-[#00e5ff] font-bold">
                        <span>orbit@root:~$</span>
                        <span className="text-white">{log.text}</span>
                        <span className="text-[10px] text-zinc-600 ml-auto">{log.timestamp}</span>
                      </div>
                    )}

                    {log.type === "output" && (
                      <div className="mt-1 pl-4 border-l-2 border-[#00ff88] text-zinc-200 whitespace-pre-wrap bg-black/40 p-2.5 rounded">
                        {log.text}
                      </div>
                    )}

                    {log.type === "system" && (
                      <div className="text-[#00ff88] font-bold whitespace-pre-wrap bg-[#00ff8810] p-2.5 rounded border border-[#00ff8833]">
                        {log.text}
                      </div>
                    )}

                    {log.type === "error" && (
                      <div className="text-red-400 whitespace-pre-wrap bg-red-950/40 p-2.5 rounded border border-red-800">
                        {log.text}
                      </div>
                    )}
                  </div>
                ))}

                {isExecuting && (
                  <div className="flex items-center gap-2 text-amber-300 animate-pulse pl-4 border-l-2 border-amber-400">
                    <span className="animate-spin">⚙️</span>
                    <span>ORBIT AI IS COMPUTING / STREAMING RESPONSE...</span>
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Interactive Command Input Line */}
              <div className="border-t border-[#00ff8833] bg-[#070e1c] p-3 flex items-center gap-2">
                <span className="text-[#00ff88] font-bold text-sm shrink-0">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder="Type 'orbit wakeup <query>', 'orbit commit', 'help', or prompt..."
                  disabled={isExecuting}
                  className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-[#00ff88] placeholder:text-zinc-600 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => executeTerminalCmd()}
                  disabled={isExecuting || !terminalInput.trim()}
                  className="px-3 py-1.5 rounded bg-[#00ff88] hover:bg-[#00e5ff] text-black font-extrabold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>EXEC</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Cheat Sheet Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { cmd: "orbit wakeup", desc: "Launch AI interactive loop (Chat, Tools, Agent)", tag: "AI CORE" },
                { cmd: "orbit commit -a", desc: "Auto-generate conventional commit from git diff", tag: "GIT SUITE" },
                { cmd: "orbit review server/src/lib/auth.js", desc: "Perform deep security & bug code review", tag: "AUDIT" },
                { cmd: "orbit explain server/src/lib/db.js", desc: "Step-by-step logic and architecture explainer", tag: "EXPLAIN" },
              ].map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-[#070c18] hover:border-[#00ff88] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                      {c.tag}
                    </span>
                    <button
                      onClick={() => handleCopy(c.cmd)}
                      className="text-xs text-zinc-500 group-hover:text-[#00ff88] flex items-center gap-1"
                    >
                      {copiedCmd === c.cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#00ff88] truncate">{c.cmd}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CONVERSATION VAULT */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                <span>CONVERSATION_DATABASE</span>
                <button onClick={fetchData} className="hover:text-[#00ff88] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>REFRESH</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                    [ NO CONVERSATIONS IN DB ]
                  </div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversationDetail(c.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedConv?.id === c.id
                          ? "bg-[#00e5ff15] border-[#00e5ff] text-white shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            c.mode === "agent"
                              ? "bg-purple-950/80 text-purple-300 border border-purple-800"
                              : c.mode === "tool"
                              ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                              : "bg-blue-950/80 text-blue-300 border border-blue-800"
                          }`}
                        >
                          {c.mode}
                        </span>
                        <span className="text-[10px] text-zinc-500">{new Date(c.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold truncate text-zinc-200">{c.title || "Untitled Chat"}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">ID: {c.id.slice(0, 16)}...</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-xl border border-zinc-800 bg-[#070c18] p-5 flex flex-col h-[560px]">
              <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#00e5ff]">{selectedConv?.title || "Select a Conversation"}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">SESSION_ID: {selectedConv?.id || "N/A"}</p>
                </div>
                {selectedConv && (
                  <button
                    onClick={() => handleCopy(`orbit resume ${selectedConv.id}`)}
                    className="text-xs px-2.5 py-1 rounded bg-[#00e5ff1a] border border-[#00e5ff66] text-[#00e5ff] hover:bg-[#00e5ff33] flex items-center gap-1.5"
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>RESUME IN CLI</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-xs">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    <span className="animate-pulse">[ DECRYPTING MESSAGE PACKETS... ]</span>
                  </div>
                ) : selectedConvMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    [ NO MESSAGES IN THIS SESSION ]
                  </div>
                ) : (
                  selectedConvMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-lg border leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-950/30 border-blue-800/60 text-blue-100 ml-6"
                          : "bg-zinc-900/90 border-[#00ff8844] text-zinc-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 pb-1 border-b border-zinc-800">
                        <span className={`font-bold ${msg.role === "user" ? "text-blue-400" : "text-[#00ff88]"}`}>
                          {msg.role === "user" ? "👤 USER_PROMPT" : "🤖 ORBIT_ASSISTANT"}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
                        {typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content, null, 2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: METRICS */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-zinc-800 bg-[#070c18] relative overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Total Conversations</p>
                <p className="text-3xl font-extrabold text-[#00ff88] mt-2">{stats?.totalConversations || 0}</p>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">Stored in Neon PostgreSQL</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-800 bg-[#070c18] relative overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Total Messages Exchanged</p>
                <p className="text-3xl font-extrabold text-[#00e5ff] mt-2">{stats?.totalMessages || 0}</p>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">Prompt & response cycles</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-800 bg-[#070c18] relative overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Active AI Model</p>
                <p className="text-lg font-extrabold text-amber-400 mt-2 truncate">{stats?.model || "gemini-2.5-flash"}</p>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">Google GenAI SDK v2</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-800 bg-[#070c18] relative overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Core Node Port</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">:3005</p>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">Express & Better-Auth Server</div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-zinc-800 bg-[#070c18] space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00ff88]" />
                <span>Session Modes Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-800/40">
                  <div className="text-xs text-blue-400 font-bold">💬 CHAT MODE</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.breakdown?.chat || 0}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Direct Gemini conversation</div>
                </div>

                <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/40">
                  <div className="text-xs text-amber-400 font-bold">🛠️ TOOL CALLING MODE</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.breakdown?.tool || 0}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Google Search + Code sandbox</div>
                </div>

                <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-800/40">
                  <div className="text-xs text-purple-400 font-bold">🤖 AGENTIC MODE</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.breakdown?.agent || 0}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Multi-file application generation</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVICE KEYPAD */}
        {activeTab === "device" && (
          <div className="max-w-md mx-auto p-6 rounded-2xl border border-amber-500/40 bg-[#070c18] shadow-[0_0_30px_rgba(245,158,11,0.08)] space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">Authorize CLI Session</h2>
              <p className="text-xs text-zinc-400">
                Enter the 8-character user code shown on your terminal after running <span className="text-[#00ff88]">orbit login</span>.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                maxLength={8}
                value={deviceCodeInput}
                onChange={(e) => setDeviceCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (E.G. KDAGM6DD)"
                className="w-full text-center tracking-[0.3em] font-mono text-lg font-bold bg-black/70 border border-zinc-700 focus:border-amber-400 rounded-lg px-4 py-3 text-amber-300 outline-none uppercase transition-all"
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
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                {isApproving ? "AUTHORIZING KEY..." : "GRANT TERMINAL ACCESS"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
