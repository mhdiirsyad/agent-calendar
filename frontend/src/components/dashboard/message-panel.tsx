"use client"

import {
    ArrowUpIcon,
    MessageCircleDashedIcon,
    Sparkles,
} from "lucide-react"

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from "@/components/ui/message-scroller"

import { Bubble, BubbleContent } from "../ui/bubble"
import { useState } from "react"
import { Message } from "@/lib/types"
import MarkdownMessage from "./markdown-message"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"

const SuggestedPrompts = [
    "What is my schedule for today?",
    "Can you summarize my upcoming meetings?",
    "What are the key points from my last meeting?",
    "Can you help me draft an email to reschedule a meeting?",
]

interface MessagePanelProps {
    messages: Message[];
    sessionToken: string;
    onSendMessage: (text: string) => void | Promise<void>;
    running: boolean;
    progress: string | null;
}

export function MessagePanel({ messages, onSendMessage, running, progress }: MessagePanelProps) {
    const [prompt, setPrompt] = useState("")
    const isEmpty = messages.length === 1 && messages[0].role === "assistant"

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSendMessage(prompt)
            setPrompt("")
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onSendMessage(prompt)
        setPrompt("")
    }
    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl p-4">
            <MessageScrollerProvider scrollPreviousItemPeek={64}>
                <div className="relative flex min-h-0 flex-1 flex-col gap-4">
                    {isEmpty ? (
                        <Empty className="h-full">
                            <EmptyHeader>
                                <EmptyMedia variant="icon" className="aspect-square size-20 rounded-xl">
                                    <Sparkles className="size-12" />
                                </EmptyMedia>
                                <EmptyTitle>Morning, CalAI!</EmptyTitle>
                                <EmptyDescription>
                                    What are we working on today? Press send to start a new
                                    conversation
                                </EmptyDescription>
                                {SuggestedPrompts.map((prompt) => (
                                    <EmptyContent key={prompt} className="mt-2">
                                        <Button variant="outline" size="sm" onClick={() => onSendMessage(prompt)}>
                                            {prompt}
                                        </Button>
                                    </EmptyContent>
                                ))}
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <MessageScroller className="h-auto min-h-0 flex-1">
                            <MessageScrollerViewport>
                                <MessageScrollerContent
                                    className="p-(--card-spacing) max-w-3xl mx-auto"
                                >
                                    {messages.map((message) => (
                                        <MessageScrollerItem
                                            key={message.id}
                                            messageId={message.id}
                                            scrollAnchor={message.role === "user"}
                                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} max-w-full`}
                                        >
                                            {message.role === "assistant" && message.content === "" && running ? (
                                                <Bubble variant="outline" align="start">
                                                    <BubbleContent className="flex items-center gap-2">
                                                        <Spinner className="size-4" />
                                                        <span className="ml-2">Thinking...</span>
                                                    </BubbleContent>
                                                </Bubble>
                                            ) : (
                                                <Bubble
                                                    variant={message.role === "user" ? "tinted" : "outline"}
                                                    align={message.role === "user" ? "end" : "start"}
                                                >
                                                    <BubbleContent>
                                                        <MarkdownMessage
                                                            content={message.content}
                                                            tone={message.role === "user" ? "user" : "assistant"}
                                                        />
                                                    </BubbleContent>
                                                </Bubble>
                                            )}
                                        </MessageScrollerItem>
                                    ))}
                                    {progress && (
                                        <MessageScrollerItem>
                                            <span className="ml-2 text-sm">🛠️ {progress}</span>
                                        </MessageScrollerItem>
                                    )}
                                </MessageScrollerContent>
                            </MessageScrollerViewport>
                            <MessageScrollerButton />
                        </MessageScroller>
                    )}
                    <form
                        onSubmit={handleSubmit}
                        className="w-full shrink-0 max-w-3xl mx-auto"
                    >
                        <InputGroup>
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
                            <InputGroupAddon align="block-end" className="pt-1">
                                <InputGroupButton
                                    type="submit"
                                    variant="default"
                                    size="icon-sm"
                                    disabled={!prompt || running}
                                    className="ml-auto"
                                >
                                    <ArrowUpIcon />
                                    <span className="sr-only">Send</span>
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </form>
                    <div className="shrink-0 px-0.5 text-center text-xs text-muted-foreground">
                        Please be responsible
                    </div>
                </div>
            </MessageScrollerProvider>
        </div>
    )
}
