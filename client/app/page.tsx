"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  Terminal,
  Activity,
  Database,
  Cpu,
  Shield,
  Key,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  LogOut,
  RefreshCw,
  Sliders,
  Code2,
  GitCommit,
  Sparkles,
  Search,
  MessageSquare,
  Bot,
  Zap,
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050811] text-[#00ff9d] font-mono">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p className="animate-pulse tracking-widest">[ INITIALIZING ORBIT://CORE_SYSTEM ]</p>
      </div>
    )
  }

  if (!data?.session && !data?.user) {
    router.push("/sign-in")
    return null
  }

  const commandsList = [
    { cmd: "orbit wakeup", desc: "Launch AI interactive loop (Chat, Tool Calling, Agentic Mode)", tag: "CORE" },
    { cmd: "orbit commit -a", desc: "AI-generated Conventional Commit message from staged git diff", tag: "GIT" },
    { cmd: "orbit review server/src/lib/auth.js", desc: "Deep code review for bugs, security & performance", tag: "AUDIT" },
    { cmd: "orbit explain server/src/lib/db.js", desc: "Step-by-step logic and architecture explainer", tag: "AI" },
    { cmd: "orbit test server/src/services/chat.services.js", desc: "Generate automated Vitest/Jest unit test suites", tag: "TEST" },
    { cmd: "orbit history", desc: "Inspect and manage past conversation sessions in PostgreSQL", tag: "DB" },
    { cmd: "orbit resume", desc: "Interactive picker to resume previous AI conversations", tag: "CHAT" },
    { cmd: "orbit config --list", desc: "Configure default Gemini model, temperature & server URL", tag: "CONFIG" },
  ]

  return (
    <div className="min-h-screen bg-[#060913] text-zinc-100 font-mono selection:bg-[#00ff9d]/30 selection:text-[#00ff9d] relative overflow-x-hidden">
      {/* Background Matrix / Grid Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff9d08_1px,transparent_1px),linear-gradient(to_bottom,#00ff9d08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#00f0ff0f] blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-[#00ff9d33] bg-[#070c18]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,255,157,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00ff9d1a] border border-[#00ff9d66] flex items-center justify-center text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.3)] animate-pulse">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#00ff9d] tracking-wider">ORBIT://SYS_CONTROL</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f0ff22] text-[#00f0ff] border border-[#00f0ff44]">v1.0.0</span>
            </div>
            <p className="text-xs text-zinc-400">Terminal-First AI Engine • Better-Auth Device Flow</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-zinc-300">NODE:</span>
            <span className="text-[#00ff9d] font-bold">ONLINE :3005</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700">
            <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-zinc-300">MODEL:</span>
            <span className="text-[#00f0ff] font-bold">{stats?.model || "gemini-2.5-flash"}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-300">DB:</span>
            <span className="text-amber-400 font-bold">NEON POSTGRES</span>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-[#00ff9d44] px-3 py-1.5 rounded-lg">
            <img
              src={data?.user?.image || "/avatar.png"}
              alt="User"
              className="w-6 h-6 rounded-full border border-[#00ff9d]"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-zinc-200">{data?.user?.name || "Hacker"}</p>
              <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{data?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-400 transition-colors text-xs flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXIT</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "terminal"
                ? "bg-[#00ff9d1a] border border-[#00ff9d] text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>COMMAND_MATRIX</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "history"
                ? "bg-[#00f0ff1a] border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>LOG_INSPECTOR ({conversations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "metrics"
                ? "bg-purple-500/15 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>SYSTEM_METRICS</span>
          </button>

          <button
            onClick={() => setActiveTab("device")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "device"
                ? "bg-amber-500/15 border border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>DEVICE_KEYPAD</span>
          </button>
        </div>

        {/* TAB 1: COMMAND MATRIX */}
        {activeTab === "terminal" && (
          <div className="space-y-6">
            {/* Quick Hero Banner */}
            <div className="rounded-xl border border-[#00ff9d44] bg-[#0b1220]/80 p-5 shadow-[0_0_30px_rgba(0,255,157,0.05)] relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#00ff9d] text-xs font-bold mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>ORBIT ENGINE READY // LOCAL TERMINAL LINK ACTIVE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Orbit CLI Command Center</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Click any command to copy and execute directly in your local terminal.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-black/60 border border-zinc-700 px-4 py-2.5 rounded-lg flex items-center gap-3">
                    <span className="text-xs text-zinc-400 font-mono">$</span>
                    <span className="text-[#00ff9d] font-bold text-sm">orbit wakeup</span>
                    <button
                      onClick={() => handleCopy("orbit wakeup")}
                      className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
                    >
                      {copiedCmd === "orbit wakeup" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Commands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commandsList.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-800 bg-[#070c18]/90 hover:border-[#00ff9d88] p-4 transition-all duration-200 group flex flex-col justify-between hover:shadow-[0_0_20px_rgba(0,255,157,0.08)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                        {item.tag}
                      </span>
                      <button
                        onClick={() => handleCopy(item.cmd)}
                        className="text-xs text-zinc-400 group-hover:text-[#00ff9d] flex items-center gap-1 hover:underline"
                      >
                        {copiedCmd === item.cmd ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-sm font-bold text-[#00ff9d] bg-black/40 px-2.5 py-1.5 rounded border border-zinc-800/80 mb-2">
                      {item.cmd}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LOG INSPECTOR (CONVERSATIONS) */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversation List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                <span>CONVERSATION_STREAMS</span>
                <button onClick={fetchData} className="hover:text-[#00ff9d] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>REFRESH</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                    [ NO CONVERSATIONS FOUND IN DB ]
                  </div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversationDetail(c.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedConv?.id === c.id
                          ? "bg-[#00f0ff15] border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.1)]"
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

            {/* Message Inspector View */}
            <div className="lg:col-span-8 rounded-xl border border-zinc-800 bg-[#070c18] p-5 flex flex-col h-[600px]">
              <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#00f0ff]">{selectedConv?.title || "Select a Conversation"}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">SESSION_ID: {selectedConv?.id || "N/A"}</p>
                </div>
                {selectedConv && (
                  <button
                    onClick={() => handleCopy(`orbit resume ${selectedConv.id}`)}
                    className="text-xs px-2.5 py-1 rounded bg-[#00f0ff1a] border border-[#00f0ff66] text-[#00f0ff] hover:bg-[#00f0ff33] flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
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
                          : "bg-zinc-900/90 border-[#00ff9d44] text-zinc-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 pb-1 border-b border-zinc-800">
                        <span className={`font-bold ${msg.role === "user" ? "text-blue-400" : "text-[#00ff9d]"}`}>
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
                <p className="text-3xl font-extrabold text-[#00ff9d] mt-2">{stats?.totalConversations || 0}</p>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">Stored in Neon PostgreSQL</div>
              </div>

              <div className="p-5 rounded-xl border border-zinc-800 bg-[#070c18] relative overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Total Messages Exchanged</p>
                <p className="text-3xl font-extrabold text-[#00f0ff] mt-2">{stats?.totalMessages || 0}</p>
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

            {/* Mode Distribution Box */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#070c18] space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00ff9d]" />
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
                Enter the 8-character user code shown on your terminal after running <span className="text-[#00ff9d]">orbit login</span>.
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
