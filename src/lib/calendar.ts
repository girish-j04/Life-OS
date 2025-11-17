/**
 * Google Calendar Integration
 *
 * This module handles Google Calendar sync using the Google Calendar API.
 * Provides seamless bi-directional sync between LifeOS and Google Calendar.
 */

import { gapi } from 'gapi-script';
import type { Event } from '@/types';
import { storage } from './storage';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  recurrence?: string[];
}

/**
 * Sync events from Google Calendar to local storage
 */
export async function syncFromGoogleCalendar(): Promise<void> {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance || !authInstance.isSignedIn.get()) {
      console.log('User not signed in to Google');
      return;
    }

    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime',
    });

    const events = response.result.items || [];
    const localEvents = await storage.events.getAll();

    // Sync each Google Calendar event to local storage
    for (const gcalEvent of events) {
      if (!gcalEvent.start?.dateTime || !gcalEvent.end?.dateTime) {
        continue; // Skip all-day events for now
      }

      // Check if event already exists locally
      const existingEvent = localEvents.find(e => e.googleEventId === gcalEvent.id);

      if (!existingEvent) {
        // Create new local event
        await storage.events.create({
          title: gcalEvent.summary || 'Untitled Event',
          description: gcalEvent.description,
          startTime: new Date(gcalEvent.start.dateTime),
          endTime: new Date(gcalEvent.end.dateTime),
          location: gcalEvent.location,
          isRecurring: !!gcalEvent.recurrence,
          recurrenceRule: gcalEvent.recurrence?.[0],
        });
      } else {
        // Update existing event if modified
        const lastUpdated = new Date(gcalEvent.updated || '');
        if (lastUpdated > existingEvent.updatedAt) {
          await storage.events.update(existingEvent.id, {
            title: gcalEvent.summary || 'Untitled Event',
            description: gcalEvent.description,
            startTime: new Date(gcalEvent.start.dateTime),
            endTime: new Date(gcalEvent.end.dateTime),
            location: gcalEvent.location,
          });
        }
      }
    }

    console.log(`Synced ${events.length} events from Google Calendar`);
  } catch (error) {
    console.error('Failed to sync from Google Calendar:', error);
    throw error;
  }
}

/**
 * Push event to Google Calendar
 */
export async function pushToGoogleCalendar(event: Event): Promise<string | undefined> {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance || !authInstance.isSignedIn.get()) {
      console.log('User not signed in to Google');
      return undefined;
    }

    const gcalEvent = toGoogleCalendarEvent(event);

    if (event.googleEventId) {
      // Update existing event
      const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.googleEventId,
        resource: gcalEvent,
      });
      return response.result.id;
    } else {
      // Create new event
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: gcalEvent,
      });
      return response.result.id;
    }
  } catch (error) {
    console.error('Failed to push to Google Calendar:', error);
    throw error;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteFromGoogleCalendar(googleEventId: string): Promise<void> {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance || !authInstance.isSignedIn.get()) {
      console.log('User not signed in to Google');
      return;
    }

    await gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    console.log(`Deleted event ${googleEventId} from Google Calendar`);
  } catch (error) {
    console.error('Failed to delete from Google Calendar:', error);
    throw error;
  }
}

// Helper: Convert local Event to Google Calendar format
function toGoogleCalendarEvent(event: Event): CalendarEvent {
  const gcalEvent: CalendarEvent = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: event.location,
  };

  if (event.isRecurring && event.recurrenceRule) {
    gcalEvent.recurrence = [event.recurrenceRule];
  }

  return gcalEvent;
}

// Helper: Convert Google Calendar event to local Event format (not currently used but available for future bidirectional sync)
// @ts-expect-error - Unused function reserved for future bidirectional sync feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fromGoogleCalendarEvent(gcalEvent: CalendarEvent): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: gcalEvent.summary,
    description: gcalEvent.description,
    startTime: new Date(gcalEvent.start.dateTime),
    endTime: new Date(gcalEvent.end.dateTime),
    location: gcalEvent.location,
    googleEventId: gcalEvent.id,
    isRecurring: !!gcalEvent.recurrence,
    recurrenceRule: gcalEvent.recurrence?.[0],
    color: '#cba6f7',
  };
}
