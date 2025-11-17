import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, Square, Search, X, RefreshCw } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format, isToday, isPast, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import type { Task } from '@/types';
import { PhotoPreview } from '@/components/PhotoPreview';

type TaskFilter = 'today' | 'upcoming' | 'all' | 'completed';

export function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>('today');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await storage.tasks.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  async function toggleTask(task: Task) {
    await storage.tasks.update(task.id, {
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date() : undefined,
    });
    await loadTasks();
  }

  // Filter tasks based on filter type and search query
  const getFilteredTasks = () => {
    let filtered = tasks || [];

    // Apply filter
    if (filter === 'today') {
      filtered = filtered.filter((task) => {
        if (task.isCompleted) return false;
        if (!task.dueDate) return false;
        // Include tasks due today or overdue
        const taskDate = startOfDay(task.dueDate);
        const today = startOfDay(new Date());
        return taskDate <= today;
      });
    } else if (filter === 'upcoming') {
      filtered = filtered.filter((task) => {
        if (task.isCompleted) return false;
        if (!task.dueDate) return true; // Tasks without due date
        // Include tasks due in the future
        const taskDate = startOfDay(task.dueDate);
        const today = startOfDay(new Date());
        return taskDate > today;
      });
    } else if (filter === 'completed') {
      filtered = filtered.filter((task) => task.isCompleted);
    } else {
      // 'all' - show incomplete tasks
      filtered = filtered.filter((task) => !task.isCompleted);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descriptionMatch = task.description?.toLowerCase().includes(query) || false;
        const priorityMatch = task.priority?.toLowerCase().includes(query) || false;
        return titleMatch || descriptionMatch || priorityMatch;
      });
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Count tasks for each filter
  const todayCount = tasks.filter((t) => {
    if (t.isCompleted) return false;
    if (!t.dueDate) return false;
    const taskDate = startOfDay(t.dueDate);
    const today = startOfDay(new Date());
    return taskDate <= today;
  }).length;

  const upcomingCount = tasks.filter((t) => {
    if (t.isCompleted) return false;
    if (!t.dueDate) return true;
    const taskDate = startOfDay(t.dueDate);
    const today = startOfDay(new Date());
    return taskDate > today;
  }).length;

  const allCount = tasks.filter((t) => !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-8 w-8 text-primary-green" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-dark-text">Tasks</h1>
        <p className="text-neutral-600 dark:text-dark-subtext">
          {filteredTasks.length} {filter === 'completed' ? 'completed' : 'active'} tasks
          {searchQuery && ` (filtered)`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          onClick={() => setFilter('today')}
          className={filter === 'today' ? 'bg-primary-orange text-white' : ''}
        >
          Today {todayCount > 0 && `(${todayCount})`}
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
          className={filter === 'upcoming' ? 'bg-primary-blue text-white' : ''}
        >
          Upcoming {upcomingCount > 0 && `(${upcomingCount})`}
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-primary-green text-white' : ''}
        >
          All {allCount > 0 && `(${allCount})`}
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-primary-purple text-white' : ''}
        >
          Completed {completedCount > 0 && `(${completedCount})`}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-dark-subtext" />
        <Input
          type="text"
          placeholder="Search tasks by title, description, or priority..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <CheckSquare className="h-12 w-12 mx-auto text-neutral-400 dark:text-dark-subtext" />
              <p className="text-neutral-600 dark:text-dark-subtext">
                {searchQuery
                  ? `No tasks found matching "${searchQuery}"`
                  : filter === 'today'
                    ? 'No tasks due today. Great job staying on top of things!'
                    : filter === 'upcoming'
                      ? 'No upcoming tasks.'
                      : filter === 'completed'
                        ? 'No completed tasks yet.'
                        : 'No tasks yet. Use the capture box to create one!'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mx-auto"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:border-primary-blue transition-colors ${task.isCompleted ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`mt-0.5 ${task.isCompleted ? 'text-primary-green hover:text-primary-green/80' : 'text-primary-blue hover:text-primary-blue/80'}`}
                    >
                      {task.isCompleted ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <p className={`font-medium text-neutral-900 dark:text-dark-text ${task.isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-neutral-600 dark:text-dark-subtext">{task.description}</p>
                      )}
                      {task.dueDate && !task.isCompleted && (
                        <p className={`text-xs ${isPast(task.dueDate) && !isToday(task.dueDate) ? 'text-primary-red' : 'text-primary-yellow'}`}>
                          Due: {format(task.dueDate, 'MMM d, yyyy h:mm a')}
                          {isPast(task.dueDate) && !isToday(task.dueDate) && ' (Overdue)'}
                        </p>
                      )}
                      {task.completedAt && (
                        <p className="text-xs text-neutral-600 dark:text-dark-subtext">
                          Completed: {format(task.completedAt, 'MMM d, h:mm a')}
                        </p>
                      )}
                      {task.photoUrl && (
                        <div className="sm:hidden pt-2">
                          <PhotoPreview
                            src={task.photoUrl}
                            alt={`Attachment for ${task.title}`}
                            className="w-full"
                            thumbnailClassName="h-32 w-full"
                          />
                        </div>
                      )}
                    </div>
                    {task.photoUrl && (
                      <PhotoPreview
                        src={task.photoUrl}
                        alt={`Attachment for ${task.title}`}
                        className="hidden sm:block"
                        thumbnailClassName="h-16 w-20"
                        label="Task"
                      />
                    )}
                    {!task.isCompleted && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high'
                            ? 'bg-primary-red/20 text-primary-red'
                            : task.priority === 'medium'
                              ? 'bg-primary-yellow/20 text-primary-yellow'
                              : 'bg-primary-blue/20 text-primary-blue'
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
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
