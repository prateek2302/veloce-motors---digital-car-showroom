import { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthModalProps {
  reason?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ reason, onClose, onSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to complete sign-in. Please allow popups and try again.';
      setError(
        message.includes('popup-closed-by-user')
          ? 'Sign-in window was closed before completion.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Client Sign In"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 text-[#141517] shadow-2xl border border-[#141517]/10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-5 right-5 h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#141517]/60 hover:bg-[#141517]/5 hover:text-[#141517] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#9A470A] mb-2">
            <ShieldCheck className="h-4 w-4" />
            Verified Client Portal
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#141517]">
            Sign in to Veloce Motors
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#141517]/70">
            {reason ||
              'Access your private garage, process refundable vehicle reservations, and schedule live virtual or showroom tours.'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 rounded-xl bg-[#141517] px-5 py-3 text-sm font-semibold text-white hover:bg-[#27292D] disabled:opacity-60 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
              />
            </svg>
            {loading ? 'Verifying Credentials...' : 'Continue with Google'}
          </button>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
            >
              {error}
            </div>
          )}

          <div className="flex items-start gap-2.5 pt-2 text-xs text-[#141517]/60">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Protected by Firebase Authentication. Reservation records and payment authorizations are isolated to your verified account.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
