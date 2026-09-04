import { createTool } from "@mastra/core/tools";
import z from "zod";
import { cancelMeet, checkBusyCalendar, createMeeting, listUpcomingMeetings, rescheduleMeeting } from "./calendar.services.js";

export function createCalendarTool(authUserId: string) {
    return {
        listUpcomingMeetings: createTool({
            id: "listUpcomingMeetings",
            description: "List Google Calendar events. Set todayOnly=true if given's today",
            inputSchema: z.object({
                maxResults: z.number().int().min(1).max(20).optional(),
                todayOnly: z.boolean().optional().describe("If true return events for today")
            }),
            execute: async ({ maxResults, todayOnly }) => {
                return await listUpcomingMeetings({ authUserId, maxResults, todayOnly })
            }
        }),

        checkBusyCalendar: createTool({
            id: "checkBusyCalendar",
            description: "check the user is busy between ISO datetimes using Google Freebusy",
            inputSchema: z.object({
                startIso: z.string().describe("Start time as ISO-8601 datetime"),
                endIso: z.string().describe("End time as ISO-8601 datetime"),
            }),
            execute: async ({ startIso, endIso }) => {
                return await checkBusyCalendar({ authUserId, startIso, endIso })
            }
        }),

        createMeeting: createTool({
            id: "createMeeting",
            description: "Create a Google Calendar event, Add Google Meet link by default. Emails invitees when attendeeEmails are set",
            inputSchema: z.object({
                title: z.string().min(1).describe("The title of event"),
                startIso: z.string().describe("Start time as ISO-8601 datetime"),
                endIso: z.string().describe("End time as ISO-8601 datetime"),
                description: z.string().optional().describe("Description of the event"),
                attendeeEmails: z.array(z.string()).optional().describe("Invite these email, send google calendar event"),
                googleMeet: z.boolean().optional().describe("Default true, set false to skip google meet link")
            }),
            execute: async (input) => {
                return await createMeeting({
                    authUserId,
                    ...input
                })
            }
        }),

        rescheduleMeeting: createTool({
            id: "rescheduleMeeting",
            description: "Move the existing event to new start/end date and email attendees about this reschedule",
            inputSchema: z.object({
                eventId: z.string().min(1).describe("Id of event that should be edit"),
                startIso: z.string().describe("Start time as ISO-8601 datetime"),
                endIso: z.string().describe("End time as ISO-8601 datetime"),
            }),
            execute: async (input) => {
                return await rescheduleMeeting({
                    authUserId,
                    ...input
                })
            }
        }),

        cancelMeet: createTool({
            id: "cancelMeet",
            description: "Cancel a google calendar event by id and email attendees about this cancellation",
            inputSchema: z.object({
                eventId: z.string().min(1).describe("Id of event that should be cancel"),
            }),
            execute: async ({ eventId }) => {
                return await cancelMeet({ authUserId, eventId })
            }
        })
    }
}