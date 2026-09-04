import { AppSidebar } from "@/components/app-sidebar"
import { NavActions } from "@/components/nav-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react"
import { MessagePanel } from "./message-panel"
import { Message } from "@/lib/types"
import { agentStreamChat, deleteThread, listThreads, loadThread, ThreadSummary } from "@/lib/agent"

interface ChatPanelProps {
  sessionToken: string,
  connection?: ReactNode,
  footer?: ReactNode,
}

function welcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm your AI Calendar Assistant. I can help you manage your schedule, summarize meetings, and draft emails. How can I assist you today?"
  }
}

export default function SideBar({ sessionToken, connection, footer }: ChatPanelProps) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<Message[]>([welcomeMessage()])
  const [running, setRunning] = useState(false)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const refreshThreads = useCallback(async () => {
    setLoadingThreads(true)
    try {
      const data = await listThreads(sessionToken)
      setThreads(data.threads)
    } catch (error) {
      console.error("Error fetching threads:", error)
    } finally {
      setLoadingThreads(false)
    }
  }, [sessionToken])

  useEffect(() => {
    refreshThreads()
  }, [refreshThreads])

  function startNewChat() {
    if (running) return
    setThreadId(crypto.randomUUID())
    setMessages([welcomeMessage()])
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || running || !sessionToken) return;
    setRunning(true)
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "" }
    ])
    try {
      await agentStreamChat(sessionToken, { message: trimmed, threadId }, (event) => {
        if (event.type === "progress" && event.message) {
          setProgress(event.message)
        }
        if (event.type === "token" && event.token) {
          setProgress(null)
          setMessages((prev) => prev.map(
            (msg) => msg.id === assistantId ? { ...msg, content: msg.content + event.token } : msg
          ))
        }

        if (event.type === "error") {
          setProgress(null)
          setMessages((prev) => prev.map(
            (msg) => msg.id === assistantId ? { ...msg, content: event.message ?? "\n\n[Error generating response]" } : msg
          ))
        }
      })

      await refreshThreads()
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not connect to the AI assistant."
        }
      ])
    } finally {
      setProgress(null)
      setRunning(false)
    }
  }

  async function resumeMessage(nextThreadId: string) {
    if (running || loadingThreads || nextThreadId === threadId) return
    setLoadingThreads(true)
    try {
      const data = await loadThread(sessionToken, nextThreadId)
      setThreadId(data.threadId)
      setMessages(data.messages.length > 0 ? data.messages : [welcomeMessage()])
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "system",
        content: "Could not load chat",
      }])
    } finally {
      setLoadingThreads(false)
    }
  }

  async function deleteThreadById(threadIdToDelete: string) {
    console.log("delete")
    if (running || loadingThreads) return
    setLoadingThreads(true)
    try {
      await deleteThread(sessionToken, threadIdToDelete)
      refreshThreads()
      if (threadIdToDelete === threadId) {
        startNewChat()
      }
    } catch {
      console.error("Failed to delete thread")
    } finally {
      setLoadingThreads(false)
    }
  }

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar
        chatProps={{
          sessionToken,
          connection,
          footer,
          threads,
          activeThreadId: threadId,
          loadingThreads,
          running,
          onNewChat: startNewChat,
          onSelectThread: resumeMessage,
          onDeleteThread: deleteThreadById
        }}
      />
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    CalAI - Meeting Assistant
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex w-full min-h-0 flex-1 justify-center">
            <MessagePanel
              messages={messages}
              sessionToken={sessionToken}
              onSendMessage={sendMessage}
              running={running}
              progress={progress}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
