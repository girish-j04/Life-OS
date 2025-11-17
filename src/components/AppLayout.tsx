import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg pb-16 transition-colors">
      {/* Main content area */}
      <main className="max-w-screen-xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
