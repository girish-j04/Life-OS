import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StickyNote, Trash2, Search, X, RefreshCw, Pin, PinOff, Edit3, Save } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Note } from '@/types';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResearchDossierPanel } from '@/components/ResearchDossierPanel';
import { PhotoPreview } from '@/components/PhotoPreview';

export function Notes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await storage.notes.getAll();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await storage.notes.delete(id);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await storage.notes.update(note.id, { isPinned: !note.isPinned });
      await loadNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditContent(typeof note.content === 'string' ? note.content : '');
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    try {
      await storage.notes.update(editingNote.id, { content: editContent });
      setEditingNote(null);
      setEditContent('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes?.filter((note) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title.toLowerCase().includes(query);
    const contentMatch = typeof note.content === 'string'
      ? note.content.toLowerCase().includes(query)
      : JSON.stringify(note.content).toLowerCase().includes(query);
    const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(query));
    return titleMatch || contentMatch || tagMatch;
  }) || [];

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-8 w-8 text-primary-purple" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-dark-text">Notes</h1>
        <p className="text-neutral-600 dark:text-dark-subtext">
          {searchQuery ? `${filteredNotes.length} of ${notes?.length || 0}` : `${notes?.length || 0}`} notes
        </p>
      </div>

      <ResearchDossierPanel />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-dark-subtext" />
        <Input
          type="text"
          placeholder="Search notes by title, content, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <StickyNote className="h-12 w-12 mx-auto text-neutral-400 dark:text-dark-subtext" />
              <p className="text-neutral-600 dark:text-dark-subtext">
                {searchQuery ? 'No notes match your search' : 'No notes yet. Use the capture box to create one!'}
              </p>
              {!searchQuery && (
                <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                  Try: "Remember to buy groceries"
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-primary-orange" />
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-dark-text">Pinned</h2>
                </div>
                {pinnedNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary-purple transition-colors border-l-4 border-l-primary-orange">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-dark-text">{note.title}</h3>
                            <div
                              className="text-sm text-neutral-600 dark:text-dark-subtext line-clamp-2 prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: typeof note.content === 'string' ? note.content : JSON.stringify(note.content)
                              }}
                            />
                            {note.photoUrl && (
                              <div className="pt-2">
                                <PhotoPreview
                                  src={note.photoUrl}
                                  alt={`Attachment for ${note.title}`}
                                  className="w-full sm:w-48"
                                  thumbnailClassName="h-32 w-full sm:w-48"
                                  label="Note"
                                />
                              </div>
                            )}
                            {note.photoUrl && (
                              <div className="pt-2">
                                <PhotoPreview
                                  src={note.photoUrl}
                                  alt={`Attachment for ${note.title}`}
                                  className="w-full sm:w-48"
                                  thumbnailClassName="h-32 w-full sm:w-48"
                                  label="Note"
                                />
                              </div>
                            )}
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {note.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 text-xs rounded-lg bg-primary-purple/10 text-primary-purple font-mono"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-dark-subtext">
                              {format(note.updatedAt, 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditNote(note)}
                              className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-blue hover:bg-primary-blue/10 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePin(note)}
                              className="h-8 w-8 flex-shrink-0 text-primary-orange hover:text-primary-orange/80 hover:bg-primary-orange/10"
                            >
                              <Pin className="h-4 w-4 fill-current" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(note.id)}
                              className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-red hover:bg-primary-red/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Unpinned Notes */}
            {unpinnedNotes.length > 0 && (
              <div className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <h2 className="text-lg font-semibold text-neutral-600 dark:text-dark-subtext">Notes</h2>
                )}
                {unpinnedNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary-purple transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-dark-text">{note.title}</h3>
                            <div
                              className="text-sm text-neutral-600 dark:text-dark-subtext line-clamp-2 prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: typeof note.content === 'string' ? note.content : JSON.stringify(note.content)
                              }}
                            />
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {note.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 text-xs rounded-lg bg-primary-purple/10 text-primary-purple font-mono"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-dark-subtext">
                              {format(note.updatedAt, 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditNote(note)}
                              className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-blue hover:bg-primary-blue/10 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePin(note)}
                              className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-orange hover:bg-primary-orange/10"
                            >
                              <PinOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(note.id)}
                              className="h-8 w-8 flex-shrink-0 text-neutral-400 hover:text-primary-red hover:bg-primary-red/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open: boolean) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              Edit Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-dark-subtext mb-2 block">
                Title
              </label>
              <Input
                value={editingNote?.title || ''}
                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, title: e.target.value } : null)}
                className="font-semibold text-lg"
                placeholder="Note title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-dark-subtext mb-2 block">
                Content
              </label>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Write your note here..."
              />
            </div>
            {editingNote?.photoUrl && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-dark-subtext mb-2 block">
                  Attached photo
                </label>
                <PhotoPreview
                  src={editingNote.photoUrl}
                  alt={`Attachment for ${editingNote.title}`}
                  className="w-full sm:w-64"
                  thumbnailClassName="h-40 w-full sm:w-64"
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingNote(null)}
                className="btn-te"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="btn-te bg-primary-green text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
