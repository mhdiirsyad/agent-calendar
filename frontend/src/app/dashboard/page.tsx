"use client";
import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionPanel from "@/components/dashboard/connection-panel";
import SideBar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useDescope, useSession, useUser } from "@descope/nextjs-sdk/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
    const descope = useDescope()
    const router = useRouter()
    const { isAuthenticated, sessionToken } = useSession()
    const { isUserLoading, user } = useUser()
    const [loggingOut, setLoggingOut] = useState(false)

    const label = user?.email || user?.name || "Signed user"

    async function handleLogout() {
        if (loggingOut) return
        setLoggingOut(true)

        try {
            await descope.logout()
            router.replace("/sign-in")
            router.refresh()
        } catch {
            setLoggingOut(false)
        } finally {
            setLoggingOut(false)
        }
    }

    if (!isAuthenticated || !sessionToken) {
        return (
            <div className="w-full min-h-svh flex items-center justify-center text-lg font-semibold">
                Checking Session...
            </div>
        )
    }

    return (
        <div className="app-shell-bg h-svh w-full overflow-hidden">
            {/* <ChatPanel
                sessionToken={sessionToken}
                connection={<ConnectionPanel sessionToken={sessionToken} />}
                footer={
                    <>
                        <div>
                            {isUserLoading ? "Loading user..." : label}
                        </div>
                        <Button
                        variant="ghost"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center gap-2"
                        >
                            <LogOut className="size-4" />
                            {loggingOut ? "looging out..." : "Logout"}
                        </Button>
                    </>
                }
            /> */}
            <SideBar
                sessionToken={sessionToken}
                connection={<SidebarMenuButton size="lg" render={
                    <ConnectionPanel sessionToken={sessionToken} />
                } />}
                footer={
                    <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 text-sm leading-tight">
                        <span className="text-sm truncate">
                            {isUserLoading ? "Loading user..." : label}
                        </span>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center justify-start gap-2 text-red-400"
                        >
                            <LogOut className="size-4" />
                            {loggingOut ? "looging out..." : "Logout"}
                        </Button>
                    </div>
                }
            />
        </div>
    )
}