import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  reservationCount: number;
  onOpenAuth: () => void;
  onOpenGarage: () => void;
  onLaunchVirtualTour: () => void;
}

export function Header({
  user,
  reservationCount,
  onOpenAuth,
  onOpenGarage,
  onLaunchVirtualTour,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#F7F6F3]/95 border-b border-[#141517]/10">
      <div className="mx-auto max-w-[1280px] flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single-element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#141517] whitespace-nowrap shrink-0"
        >
          Veloce Motors
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#141517]/75"
        >
          <a
            href="#inventory"
            className="hover:text-[#141517] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Inventory
          </a>
          <button
            type="button"
            onClick={onLaunchVirtualTour}
            className="hover:text-[#141517] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Virtual Tour
          </button>
          <a
            href="#configurator"
            className="hover:text-[#141517] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Configurator
          </a>
          <button
            type="button"
            onClick={onOpenGarage}
            className="hover:text-[#141517] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {reservationCount > 0 ? `My Garage (${reservationCount})` : 'My Garage'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onOpenGarage}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#141517] rounded-lg hover:bg-[#27292D] transition-colors whitespace-nowrap shrink-0 max-w-[180px] truncate"
            >
              {user.displayName ? user.displayName.split(' ')[0] : 'Account'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#141517] rounded-lg hover:bg-[#27292D] transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
