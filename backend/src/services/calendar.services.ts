import { google } from "googleapis";
import { getCalendarToken } from "./token.services.js";
import { string } from "zod";
import { randomUUID } from "node:crypto";

function calendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({
        access_token: accessToken
    })

    return google.calendar({
        version: "v3",
        auth
    })
}

async function calendarForUser(authUserId: string) {
    const accessToken = await getCalendarToken(authUserId)

    return calendarClient(accessToken)
}

function formatEvent(event: {
    id?: string | null,
    summary?: string | null,
    description?: string | null,
    location?: string | null,
    start?: { datetime?: string | null; date?: string | null } | null,
    end?: { datetime?: string | null; date?: string | null } | null,
    htmlLink?: string | null,
    hangoutLint?: string | null,
    attendees?: Array<{ email?: string | null; displayName?: string | null }> | []
}) {
    return {
        id: event.id,
        title: event.summary ?? "no title",
        description: event.description,
        location: event.location,
        start: event.start?.datetime ?? event.start?.date ?? null,
        end: event.start?.datetime ?? event.start?.date ?? null,
        htmlLink: event.htmlLink,
        meetLink: event.hangoutLint,
        attendees: (event.attendees ?? [])
            .map((person) => person.email || person.displayName)
            .filter((value): value is string => Boolean(value))
    }
}

export async function listUpcomingMeetings(input: {
    authUserId: string,
    maxResults?: number,
    todayOnly?: boolean
}) {
    const calendar = await calendarForUser(input.authUserId)

    let timeMin = new Date().toISOString()
    let timeMax

    if (input.todayOnly) {
        const start = new Date()
        start.setHours(0, 0, 0, 0)

        const end = new Date()
        end.setHours(23, 59, 59, 999)

        timeMin = start.toISOString()
        timeMax = start.toISOString()
    }

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults: input.maxResults ?? 5,
        singleEvents: true,
        orderBy: 'startTime'
    })

    return (response.data.items ?? []).map(formatEvent)
}

export async function createMeeting(input: {
    authUserId: string,
    title: string,
    startIso: string,
    endIso: string,
    attendeeEmails?: string[],
    description?: string,
    googleMeet?: boolean,
}) {
    const calendar = await calendarForUser(input.authUserId)

    // Enable Gmeet default
    const withMeet = input.googleMeet !== false

    const response = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        conferenceDataVersion: withMeet ? 1 : undefined,
        requestBody: {
            summary: input.title,
            description: input.description,
            start: {
                dateTime: input.startIso
            },
            end: {
                dateTime: input.endIso
            },
            attendees: (input.attendeeEmails ?? []).map(email => ({ email })),
            conferenceData: withMeet ? {
                createRequest: {
                    requestId: randomUUID(),
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            } : undefined,
        },
    })

    return {
        ...formatEvent(response.data),
        inviteEmailSent: (input.attendeeEmails ?? []).length > 0,
        googleMeetAdded: withMeet
    }

}

export async function cancelMeet(input: {
    authUserId: string,
    eventId: string
}) {
    const calendar = await calendarForUser(input.authUserId)

    await calendar.events.delete({
        calendarId: "primary",
        eventId: input.eventId,
        sendUpdates: "all"
    })

    return {
        deleted: true,
        eventDeleted: input.eventId
    }
}

export async function rescheduleMeeting(input: {
    authUserId: string,
    eventId: string,
    startIso: string,
    endIso: string,
}) {
    const calendar = await calendarForUser(input.authUserId)

    const { data: currentEvent } = await calendar.events.get({
        calendarId: "primary",
        eventId: input.eventId
    })

    const etag = currentEvent.etag

    const {
        id,
        etag: _,
        kind,
        htmlLink,
        creator,
        organizer,
        ...updatableFields
    } = currentEvent

    const response = await calendar.events.update({
        calendarId: "primary",
        eventId: input.eventId,
        sendUpdates: "all",
        requestBody: {
            ...updatableFields,
            start: {
                dateTime: input.startIso,
            },
            end: {
                dateTime: input.endIso
            }
        },
    },
        {
            headers: {
                "If-Match": etag
            }
        }
    )

    return formatEvent(response.data)
}

export async function checkBusyCalendar(input: {
    authUserId: string,
    startIso: string,
    endIso: string
}) {
    const calendar = await calendarForUser(input.authUserId)

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: input.startIso,
            timeMax: input.endIso,
            items: [
                { id: "primary" }
            ]
        },
    })

    const busy = response.data.calendars?.primary.busy ?? []

    return {
        busy: busy.map((item) => ({
            start: item.start ?? null,
            end: item.end ?? null
        }))
    }
}