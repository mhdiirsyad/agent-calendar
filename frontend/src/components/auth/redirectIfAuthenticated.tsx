"use client"

import { useSession } from "@descope/nextjs-sdk/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "../ui/skeleton"

export default function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isSessionLoading } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isSessionLoading && isAuthenticated) {
            router.replace("/dashboard")
        }
    }, [isSessionLoading, isAuthenticated, router])

    if (isSessionLoading || isAuthenticated) {
        return (
            <div className="flex flex-col gap-2 justify-center px-6">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        )
    }

    return children
}