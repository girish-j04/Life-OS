import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { deleteFromGoogleCalendar, syncFromGoogleCalendar } from '@/lib/google-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Trash2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { Event } from '@/types';

export function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const data = await storage.events.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFromGoogleCalendar();
      await loadEvents();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const event = await storage.events.getById(id);

      // Delete from Google Calendar if synced
      if (event?.googleEventId) {
        try {
          await deleteFromGoogleCalendar(event.googleEventId);
          console.log('Deleted from Google Calendar:', event.googleEventId);
        } catch (error) {
          console.error('Failed to delete from Google Calendar:', error);
          // Continue with local deletion even if Google deletion fails
        }
      }

      // Delete from local storage
      await storage.events.delete(id);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-8 w-8 text-primary-blue" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-dark-text">Calendar</h1>
          <p className="text-neutral-600 dark:text-dark-subtext">{events?.length || 0} events</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="btn-te bg-primary-blue text-white"
        >
          <AnimatePresence mode="wait">
            {syncing ? (
              <motion.div
                key="syncing"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
              </motion.div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
          </AnimatePresence>
          {syncing ? 'Syncing...' : 'Sync Google Calendar'}
        </Button>
      </div>

      <div className="space-y-3">
        {!events || events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <CalendarIcon className="h-12 w-12 mx-auto text-neutral-400 dark:text-dark-subtext" />
              <p className="text-neutral-600 dark:text-dark-subtext">
                No events yet. Use the capture box to create one!
              </p>
              <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                Try: "Meeting with John next Friday at 2pm"
              </p>
            </CardContent>
          </Card>
        ) : (
          events
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="hover:border-primary-purple transition-colors"
                  style={{ borderLeftWidth: '4px', borderLeftColor: event.color }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 dark:text-dark-text">{event.title}</h3>
                          {event.googleEventId ? (
                            <span title="Synced with Google Calendar">
                              <Cloud className="h-4 w-4 text-primary-blue" />
                            </span>
                          ) : (
                            <span title="Not synced">
                              <CloudOff className="h-4 w-4 text-neutral-400" />
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-neutral-600 dark:text-dark-subtext">{event.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-dark-subtext">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {format(event.startTime, 'MMM d, yyyy h:mm a')} -{' '}
                            {format(event.endTime, 'h:mm a')}
                          </span>
                        </div>
                        {event.location && (
                          <p className="text-sm text-primary-blue">📍 {event.location}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                        className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-red hover:bg-primary-red/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
