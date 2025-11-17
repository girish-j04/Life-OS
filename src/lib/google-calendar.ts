/**
 * Google Calendar Integration with Supabase Auth
 *
 * Uses the Google access token from Supabase to make Calendar API calls
 */

import { supabase } from './supabase';
import type { Event } from '@/types';
import { storage } from './storage';

interface GoogleCalendarEvent {
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
 * Get the Google access token from Supabase session
 */
async function getGoogleAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    console.log('No Google access token found in session');
    return null;
  }

  return session.provider_token;
}

/**
 * Make a request to Google Calendar API
 */
async function googleCalendarRequest(
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }

  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Sync events from Google Calendar to local storage
 */
export async function syncFromGoogleCalendar(): Promise<void> {
  try {
    const response = await googleCalendarRequest(
      'GET',
      `/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`
    );

    const events = response.items || [];
    const localEvents = await storage.events.getAll();

    for (const gcalEvent of events) {
      if (!gcalEvent.start?.dateTime || !gcalEvent.end?.dateTime) {
        continue; // Skip all-day events
      }

      const existingEvent = localEvents.find((e) => e.googleEventId === gcalEvent.id);

      if (!existingEvent) {
        // Create new local event
        const newEvent = await storage.events.create({
          title: gcalEvent.summary || 'Untitled Event',
          description: gcalEvent.description,
          startTime: new Date(gcalEvent.start.dateTime),
          endTime: new Date(gcalEvent.end.dateTime),
          location: gcalEvent.location,
          isRecurring: !!gcalEvent.recurrence,
          recurrenceRule: gcalEvent.recurrence?.[0],
        });

        // Update with Google event ID
        await storage.events.update(newEvent.id, {
          googleEventId: gcalEvent.id,
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
    const gcalEvent: GoogleCalendarEvent = {
      summary: event.title,
      description: event.description || undefined,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: event.location || undefined,
    };

    if (event.isRecurring && event.recurrenceRule) {
      gcalEvent.recurrence = [event.recurrenceRule];
    }

    if (event.googleEventId) {
      // Update existing event
      const response = await googleCalendarRequest(
        'PUT',
        `/calendars/primary/events/${event.googleEventId}`,
        gcalEvent
      );
      return response.id;
    } else {
      // Create new event
      const response = await googleCalendarRequest(
        'POST',
        '/calendars/primary/events',
        gcalEvent
      );
      return response.id;
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
    await googleCalendarRequest('DELETE', `/calendars/primary/events/${googleEventId}`);
    console.log(`Deleted event ${googleEventId} from Google Calendar`);
  } catch (error) {
    console.error('Failed to delete from Google Calendar:', error);
    throw error;
  }
}
