"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Sparkles, MessageCirclePlus, Trash2 } from "lucide-react"
import { ReactNode } from "react"
import { ThreadSummary } from "@/lib/agent"
import { Button } from "./ui/button"


interface ChatPanelProps {
  sessionToken: string,
  connection?: ReactNode,
  footer?: ReactNode,
  threads?: ThreadSummary[],
  activeThreadId?: string,
  loadingThreads?: boolean,
  running?: boolean,
  onNewChat: () => void,
  onSelectThread: (threadId: string) => void,
  onDeleteThread: (threadId: string) => void,
}

export function AppSidebar({ chatProps, ...props }: { props?: React.ComponentProps<typeof Sidebar>, chatProps: ChatPanelProps }) {
  const visibleThreads = chatProps.threads ?? []
  const visibleThreadId = chatProps.activeThreadId
  const visibleLoading = chatProps.loadingThreads ?? false
  const visibleRunning = chatProps.running ?? false
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={
              <div className="flex w-full items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-heading">CalAI</span>
                  <span className="truncate text-xs">Meeting Assistant</span>
                </div>
              </div>
            } />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            {chatProps.connection}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={chatProps.onNewChat} render={
              <div className="flex w-full items-center gap-2 text-sm leading-tight">
                <MessageCirclePlus className="size-4 text-black" />
                <p className="text-sm text-black">New Chat</p>
              </div>
            } />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarMenu>
            {visibleThreads.map((thread) => (
              <SidebarMenuItem key={thread.id}
                className={`flex items-center justify-between gap-2`}>
                <SidebarMenuButton
                  isActive={thread.id === visibleThreadId}
                  disabled={visibleLoading || visibleRunning || thread.id === visibleThreadId}
                  onClick={() => chatProps.onSelectThread(thread.id)}
                  render={
                    <div className="grid w-full h-auto grid-cols-[1fr_auto] items-center gap-2 text-sm leading-tight">
                      <div className="grid flex-1 gap-0.5">
                        <span className="line-clamp-1">{thread.title}</span>
                        <span className="text-xs text-muted-foreground">{new Date(thread.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  } />
                <Button onClick={() => chatProps.onDeleteThread(thread.id)} size="icon" variant="destructive">
                  <Trash2 className="size-4" />
                </Button>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {chatProps.footer}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
