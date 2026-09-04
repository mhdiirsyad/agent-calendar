"use client";

import { ArrowUp, LoaderCircle, MessageCirclePlus, Sparkles } from "lucide-react";
import { FormEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "../ui/input-group";
import { agentStreamChat, listThreads, loadThread, ThreadSummary } from "@/lib/agent";
import MarkdownMessage from "./markdown-message";

interface ChatPanelProps {
    sessionToken: string,
    connection?: ReactNode,
    footer?: ReactNode,
}

type Message = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}

const SuggestedPrompts = [
    "What is my schedule for today?",
    "Can you summarize my upcoming meetings?",
    "What are the key points from my last meeting?",
    "Can you help me draft an email to reschedule a meeting?",
]

function welcomeMessage(): Message {
    return {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI Calendar Assistant. I can help you manage your schedule, summarize meetings, and draft emails. How can I assist you today?"
    }
}


export default function ChatPanel({ sessionToken, connection, footer }: ChatPanelProps) {
    const [threadId, setThreadId] = useState(() => crypto.randomUUID())
    const [messages, setMessages] = useState<Message[]>([welcomeMessage()])
    const [threads, setThreads] = useState<ThreadSummary[]>([])
    const [prompt, setPrompt] = useState("")
    const [running, setRunning] = useState(false)
    const [loadingThreads, setLoadingThreads] = useState(false)
    const [progress, setProgress] = useState<string | null>(null)

    const emptyMessages = messages.length === 1 && messages[0].id === "welcome" && !running

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
        if (running) return;
        setThreadId(crypto.randomUUID())
        setMessages([welcomeMessage()])
        setPrompt("")
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim()
        console.log(trimmed)
        if (!trimmed || running || !sessionToken) return;
        setRunning(true)
        const assistantId = crypto.randomUUID()
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", content: trimmed },
            { id: assistantId, role: "assistant", content: "" }
        ])
        setPrompt("")

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

            refreshThreads()
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
            setRunning(false)
            setProgress(null)
        }
    }

    async function resumeMessage(nextThreadId: string) {
        if (running || loadingThreads || nextThreadId === threadId) return;
        setLoadingThreads(true)
        setProgress(null)

        try {
            const data = await loadThread(sessionToken, nextThreadId)
            setThreadId(data.threadId)
            setMessages(data.messages.length > 0 ? data.messages : [welcomeMessage()])
            setPrompt("")
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "system",
                    content: "Could not load chat"
                }
            ])
        } finally {
            setLoadingThreads(false)
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        sendMessage(prompt)
    }

    function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage(prompt)
        }
    }
    return (
        <div className="app-shell-bg flex min-h-svh w-full">
            <aside className="fixed inset-y-0 left-0 z-40 flex min-h-screen w-74 flex-col gap-4 border-r border-sidebar-border bg-sidebar pt-4 shadow-none ring-1 ring-sidebar-ring">
                <div className="flex items-center gap-2 px-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Sparkles className="size-4" />
                    </div>
                    <p className="text-xl font-bold">Calendar Assistant</p>
                </div>
                <Separator />
                {connection}
                <Button
                    variant="ghost"
                    className="flex gap-2 px-4 items-center justify-start"
                    onClick={startNewChat}
                >
                    <MessageCirclePlus className="size-4 text-black" />
                    <p className="text-base text-black">New Chat</p>
                </Button>
                <Separator />
                <div className="flex-1 px-4">
                    <p className="text-sm font-semibold text-foreground">Chats</p>
                    {threads.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No chats yet. Start a new chat to see your conversations here.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {threads.map((thread) => {
                                const isActive = thread.id === threadId
                                return (
                                    <Button
                                        key={thread.id}
                                        variant={isActive ? "secondary" : "ghost"}
                                        type="button"
                                        disabled={loadingThreads || isActive || running}
                                        className="flex h-auto w-full min-w-0 flex-col items-stretch gap-1 bg-accent py-2 text-left"
                                        onClick={() => resumeMessage(thread.id)}
                                    >
                                        <span className="block w-full min-w-0 truncate font-semibold">{thread.title}</span>
                                        <span className="block w-full min-w-0 truncate text-right text-xs text-muted-foreground">
                                            {new Date(thread.updatedAt).toLocaleDateString()}
                                        </span>
                                    </Button>
                                )
                            })}
                        </div>
                    )}
                </div>
                <Separator />
                <div className="px-4">
                    {footer}
                </div>
            </aside>
            <section className="ml-74 relative flex min-h-0 min-w-0 flex-1 flex-col">
                <header className="fixed top-0 right-0 left-74 z-30 flex flex-col border-b border-border shrink-0 bg-sidebar">
                    <div className="min-w-0 px-4 py-2">
                        <p className="truncate text-lg font-semibold">AI Assistant</p>
                        <p className="text-sm text-muted-foreground">Ask me anything about your calendar and meetings.</p>
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col mt-16 mb-32">
                    <ScrollArea className="min-h-0 flex-1">
                        <div className="">
                            {emptyMessages ? (
                                <Empty className="w-full flex items-center justify-center">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Sparkles className="size-6" />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            Welcome to your AI Calendar Assistant!
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Connect your Google Calendar to get started. You can ask me about your schedule, meetings, and more!
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent className="flex max-w-4xl flex-row flex-wrap gap-2">
                                        {SuggestedPrompts.map((prompt) => (
                                            <Button
                                                key={prompt}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPrompt(prompt)}
                                            >
                                                {prompt}
                                            </Button>
                                        ))}
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
                                    {messages.map((msg) => (
                                        <div key={msg.id}
                                            className={`flex flex-col gap-2 ${msg.role === "user" ? "self-end" : "self-start"}`}>
                                            <div className={`rounded-lg p-2 ${msg.role === "user" ? "bg-primary text-primary-foreground max-w-sm"
                                                : "bg-secondary text-secondary-foreground"}`}>
                                                {!msg.content && running ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        <LoaderCircle className="size-4 animate-spin" />
                                                        Thinking...
                                                    </div>
                                                ) : (
                                                    <MarkdownMessage
                                                        content={msg.content}
                                                        tone={msg.role === "system" ? "system" : "assistant"}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {progress && (
                                        <div className="text-sm text-muted-foreground">
                                            {progress}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="shrink-0 border-t border-border bg-sidebar p-4 fixed bottom-0 right-0 left-74 z-30">
                    <form onSubmit={handleSubmit} className="w-full px-4 py-2 flex flex-col gap-2 items-center justify-center">
                        <InputGroup className="max-w-2xl">
                            <InputGroupTextarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={onKeyDown}
                                rows={1}
                                autoFocus
                                placeholder="Type your message here..."
                                disabled={running}
                                className="text-foreground"
                            />
                            <InputGroupAddon align={"inline-end"} className="px-4">
                                <InputGroupButton
                                    type="submit"
                                    disabled={running || prompt.trim() === ""}
                                    size="icon-sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {running ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                        <ArrowUp className="size-4" />
                                    )}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                        <p className="text-sm text-muted-foreground">
                            AI may produce inaccurate information.
                        </p>
                    </form>
                </div>
            </section>
        </div>
    )
}