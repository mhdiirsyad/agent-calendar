"use client"

import { ConnectionInfo } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"
import { Button } from "../ui/button"
import { Calendar, RefreshCcw } from "lucide-react"
import { connectCalendar, fetchCalendarConnection, refreshCalendarConnection } from "@/lib/connection"

function connectionStatus(status: ConnectionInfo["status"]) {
    if(status === "connected") return "Connected"
    if(status === "pending") return "Pending"
    return "Disconected"
}

export default function ConnectionPanel({ sessionToken }: { sessionToken: string }) {
    const [connection, setConnection] = useState<ConnectionInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const handleLoadConnection = useCallback(async () => {
        setLoading(true)
        try {
            setConnection(await fetchCalendarConnection(sessionToken))
        } catch {
            console.log("Failed to load connection info")
        } finally {
            setLoading(false)
        }
    }, [sessionToken])

    useEffect(() => {
        handleLoadConnection()
    }, [handleLoadConnection])

    const connect = connection?.status === "connected"

    async function handleCalendarConnect() {
        setBusy(true)
        try {
            await connectCalendar(sessionToken)
        } catch {
            console.log("Failed to connect calendar")
        } finally {
            setBusy(false)
        }
    }

    async function handleCalendarRefresh() {
        setBusy(true)
        try {
            await refreshCalendarConnection(sessionToken)
            await handleLoadConnection()
        } catch {
            console.log("Failed to refresh calendar connection")
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="w-full">
            { loading || !connection ? (
                <Skeleton className="h-6 w-1/2 rounded-lg" />
            ) : (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 w-1/2">
                        <div className="w-9 h-9 flex items-center justify-center rounded-md bg-foreground text-primary-foreground">
                            <Calendar className="size-5" />
                        </div>
                        <div className="w-2/3">
                            <p className="text-base font-semibold truncate">{connection.label}</p>
                            <p className="text-xs text-muted-foreground">
                                {connectionStatus(connection.status)}
                            </p>    
                        </div>
                    </div>

                    <div className="flex items-center">
                        <Button
                            variant={connect ? "ghost" : "default"}
                            disabled={busy}
                            onClick={handleCalendarConnect}
                            className="flex items-center text-xs"
                        >
                            {connect ? "Reconnect": "Connect"}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={handleCalendarRefresh}
                            className="flex items-center"
                        >
                            <RefreshCcw className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}