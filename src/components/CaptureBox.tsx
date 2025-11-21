import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Send, Sparkles, CheckCircle2, Zap, Mic, MicOff, ImagePlus, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseCapture } from '@/lib/gemini';
import { storage } from '@/lib/storage';
import { pushToGoogleCalendar } from '@/lib/google-calendar';
import type { ParsedCapture, ParsedTask, ParsedEvent, ParsedTransaction, ParsedNote, CaptureType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadCapturePhoto } from '@/lib/file-storage';

interface CaptureBoxProps {
  onSuccess?: () => void;
}

export function CaptureBox({ onSuccess }: CaptureBoxProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [parsed, setParsed] = useState<ParsedCapture | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTO_SIZE_MB = 8;
  const [notice, setNotice] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const showNotice = (text: string, type: 'error' | 'info' = 'info') => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    setNotice({ text, type });
    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 4000);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showNotice('Speech recognition is not supported in your browser. Please try Chrome or Edge.', 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearPhotoSelection = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotice('Please select an image file (PNG, JPG, or HEIC).', 'error');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      showNotice(`Please choose an image smaller than ${MAX_PHOTO_SIZE_MB}MB.`, 'error');
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  async function handleSubmit() {
    if (!input.trim() || loading) return;

    setLoading(true);
    setSuccess(false);
    try {
      const result = await parseCapture(input);
      setParsed(result);
      await handleConfirm(result);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (error) {
      console.error('Failed to process input:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(captureData: ParsedCapture) {
    try {
      const supportsPhoto = ['task', 'note', 'expense', 'income'].includes(captureData.type);
      let photoUrl: string | null = null;

      if (photoFile && supportsPhoto) {
        setPhotoUploading(true);
        try {
          photoUrl = await uploadCapturePhoto(
            photoFile,
            captureData.type as 'task' | 'note' | 'expense' | 'income'
          );
        } catch (error) {
          console.error('Failed to upload photo:', error);
          showNotice('Failed to upload photo. The entry was saved without the image.', 'error');
        } finally {
          setPhotoUploading(false);
        }
      } else if (photoFile && !supportsPhoto) {
        showNotice('Photos are currently only supported for tasks, notes, and finance entries.', 'info');
      }

      switch (captureData.type) {
        case 'task':
          await storage.tasks.create({
            ...(captureData.data as ParsedTask),
            photoUrl: photoUrl || undefined,
          });
          break;
        case 'event':
          // Create event locally
          const createdEvent = await storage.events.create(captureData.data as ParsedEvent);

          // Automatically push to Google Calendar if user is signed in
          try {
            const googleEventId = await pushToGoogleCalendar(createdEvent);
            if (googleEventId) {
              // Update local event with Google Calendar ID
              await storage.events.update(createdEvent.id, { googleEventId });
              console.log('Event synced to Google Calendar:', googleEventId);
            }
          } catch (error) {
            console.error('Failed to sync to Google Calendar:', error);
            // Don't throw - event is still saved locally
          }
          break;
        case 'expense':
        case 'income':
          // Include the type field in the transaction data
          await storage.transactions.create({
            ...(captureData.data as ParsedTransaction),
            type: captureData.type,
            photoUrl: photoUrl || undefined,
          });
          break;
        case 'note':
          await storage.notes.create({
            ...(captureData.data as ParsedNote),
            photoUrl: photoUrl || undefined,
          });
          break;
      }

      setInput('');
      setParsed(null);
      clearPhotoSelection();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }

  const getTypeConfig = (type: CaptureType) => {
    const configs: Record<CaptureType, { color: string; icon: typeof CheckCircle2; label: string }> = {
      task: { color: 'bg-primary-green', icon: CheckCircle2, label: 'Task Created!' },
      event: { color: 'bg-primary-blue', icon: Zap, label: 'Event Added!' },
      expense: { color: 'bg-primary-red', icon: CheckCircle2, label: 'Expense Logged!' },
      income: { color: 'bg-primary-green', icon: CheckCircle2, label: 'Income Added!' },
      note: { color: 'bg-primary-purple', icon: CheckCircle2, label: 'Note Saved!' },
    };
    return configs[type];
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Input - Teenage Engineering Brutalist Style */}
      <div className="relative">
        <div className="bg-white dark:bg-dark-surface border-4 border-neutral-900 dark:border-dark-border rounded-2xl shadow-te-brutal dark:shadow-none overflow-hidden transition-all hover:shadow-te-brutal-lg p-4 md:p-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type anything..."
            className="h-16 px-4 md:px-6 md:pr-60 pr-4 text-lg font-medium border-0 bg-transparent dark:text-dark-text focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-400 dark:placeholder:text-dark-subtext"
            disabled={loading || isListening}
          />
          <div className="flex gap-2 justify-end mt-3 md:mt-0 md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || photoUploading}
              className="btn-te h-12 px-4 bg-primary-blue text-white flex items-center gap-2"
              type="button"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="hidden lg:inline">Add Photo</span>
            </Button>
            <Button
              onClick={toggleVoiceInput}
              disabled={loading || photoUploading}
              className={`btn-te h-12 px-4 ${isListening ? 'bg-primary-red text-white animate-pulse' : 'bg-primary-purple text-white'}`}
              type="button"
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="listening"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <MicOff className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim() || photoUploading}
              className="btn-te bg-primary-orange text-white h-12 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                ) : success ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Send className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        {photoPreview && (
          <div className="relative mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-3 dark:border-dark-border dark:bg-dark-surface">
            <img
              src={photoPreview}
              alt="Selected attachment"
              className="h-16 w-16 rounded-xl border border-neutral-200 object-cover dark:border-dark-border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700 dark:text-dark-text">Photo attached</p>
              <p className="text-xs text-neutral-500 dark:text-dark-subtext">
                Saved with tasks, notes, or finance entries.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              onClick={clearPhotoSelection}
              disabled={photoUploading}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-black/60">
                <Loader2 className="h-5 w-5 animate-spin text-primary-blue" />
              </div>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div
          className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-medium ${
            notice.type === 'error'
              ? 'border-primary-red bg-primary-red/10 text-primary-red'
              : 'border-primary-blue bg-primary-blue/10 text-primary-blue'
          }`}
        >
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-full p-1 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading State - Duolingo style */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-3 p-4 bg-primary-purple/10 dark:bg-primary-purple/20 rounded-2xl border-2 border-primary-purple"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mic className="h-5 w-5 text-primary-purple" />
            </motion.div>
            <span className="font-mono text-sm font-medium text-primary-purple uppercase">
              Listening... Speak now
            </span>
          </motion.div>
        )}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-3 p-4 bg-primary-blue/10 dark:bg-primary-blue/20 rounded-2xl border-2 border-primary-blue"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-primary-blue" />
            </motion.div>
            <span className="font-mono text-sm font-medium text-primary-blue uppercase">
              AI Processing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Feedback - Teenage Engineering + Duolingo fusion */}
      <AnimatePresence>
        {parsed && success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className={`${getTypeConfig(parsed.type).color} border-4 border-neutral-900 dark:border-dark-border rounded-2xl p-6 shadow-te-brutal dark:shadow-none`}
          >
            <div className="flex items-center gap-4 text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                transition={{ delay: 0.1 }}
                className="p-3 bg-white/20 rounded-xl backdrop-blur"
              >
                {(() => {
                  const Icon = getTypeConfig(parsed.type).icon;
                  return <Icon className="h-6 w-6" />;
                })()}
              </motion.div>
              <div className="flex-1">
                <p className="text-lg font-display font-bold mb-1">
                  {getTypeConfig(parsed.type).label}
                </p>
                <p className="text-white/90 font-medium text-sm">
                  {parsed.type === 'task' && (parsed.data as ParsedTask).title}
                  {parsed.type === 'event' && (parsed.data as ParsedEvent).title}
                  {(parsed.type === 'expense' || parsed.type === 'income') &&
                    `$${(parsed.data as ParsedTransaction).amount} - ${(parsed.data as ParsedTransaction).category}`}
                  {parsed.type === 'note' && ((parsed.data as ParsedNote).title || (parsed.data as ParsedNote).content.substring(0, 50))}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2 }}
                className="text-3xl"
              >
                ✨
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
