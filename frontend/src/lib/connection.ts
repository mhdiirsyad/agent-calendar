import { getRefreshToken } from "@descope/nextjs-sdk/client";
import { apiFetch } from "./api";
import { ConnectionInfo } from "./types";

export async function fetchCalendarConnection(token: string) {
    const data = await apiFetch<{ connection: ConnectionInfo }>(
        "/api/connection",
        { token }
    )

    return data.connection
}

export async function connectCalendar(token: string) {
    const refreshToken = getRefreshToken()
    if(!refreshToken) throw new Error("Refresh Token is missing");

    const data = await apiFetch<{url: string}>(
        "/api/connection/connect",
        {
            token,
            method: "POST",
            body: {
                redirectUrl: `${window.location.origin}/dahsboard`,
                refreshToken
            }
        }
    )

    window.location.href = data.url
}

export async function refreshCalendarConnection(token: string) {
    await apiFetch("/api/connection/refresh-status", {
        method: "POST",
        token
    })
}