import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  if (['/login', '/signup'].includes(location.pathname)) return null; // Auth pages are full-bleed

  return (
    <footer className="bg-beige dark:bg-plum border-t border-mauve/15 dark:border-mauve/30 py-6 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">

        <div className="text-mauve dark:text-coral/70 text-sm">
          &copy; 2026 PortfoliAI. All rights reserved.
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          {/* NEW: The link to our Feedback Page! */}
          <Link to="/feedback" className="text-mauve dark:text-coral/70 hover:text-plum dark:hover:text-coral flex items-center gap-1 transition-colors">
            <Heart className="h-4 w-4 text-rose/80" />
            Leave Feedback
          </Link>
        </div>

      </div>
    </footer>
  );
}