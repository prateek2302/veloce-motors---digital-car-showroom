import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Calendar, CheckCircle2, X } from 'lucide-react';
import { SHOWROOM_LOCATIONS, type Vehicle } from '../data/vehicles';
import { createTourBooking } from '../lib/firebase';

interface TourBookingModalProps {
  vehicle: Vehicle;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function TourBookingModal({
  vehicle,
  user,
  onClose,
  onSuccess,
}: TourBookingModalProps) {
  const [tourType, setTourType] = useState<'virtual_live' | 'showroom_visit'>(
    'virtual_live'
  );
  const [showroomLocation, setShowroomLocation] = useState<string>(
    SHOWROOM_LOCATIONS[0]
  );
  const [preferredDate, setPreferredDate] = useState('2026-11-24');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createTourBooking({
        userId: user.uid,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        tourType,
        showroomLocation,
        preferredDate,
        preferredTime,
        notes,
      });
      setConfirmed(true);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to schedule tour. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Schedule Private Tour for ${vehicle.name}`}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-[#141517] shadow-2xl border border-[#141517]/10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking dialog"
          className="absolute top-5 right-5 h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#141517]/60 hover:bg-[#141517]/5"
        >
          <X className="h-5 w-5" />
        </button>

        {confirmed ? (
          <div className="py-4 space-y-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
            <h3 className="font-display text-xl font-bold text-[#141517]">
              Private Tour Scheduled
            </h3>
            <p className="text-sm text-[#141517]/75">
              A Veloce product specialist will host your{' '}
              {tourType === 'virtual_live'
                ? 'live studio walkaround'
                : 'showroom test drive'}{' '}
              for the {vehicle.name} on {preferredDate} at {preferredTime}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#141517] text-sm font-semibold text-white"
            >
              Return to Showroom
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A470A] mb-1">
                <Calendar className="h-3.5 w-3.5" />
                Concierge Appointment
              </p>
              <h2 className="font-display text-xl font-bold text-[#141517]">
                Schedule Tour — {vehicle.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTourType('virtual_live')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold border ${
                  tourType === 'virtual_live'
                    ? 'bg-[#141517] text-white border-[#141517]'
                    : 'bg-white text-[#141517]/75 border-[#141517]/15'
                }`}
              >
                Live Video Walkaround
              </button>
              <button
                type="button"
                onClick={() => setTourType('showroom_visit')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold border ${
                  tourType === 'showroom_visit'
                    ? 'bg-[#141517] text-white border-[#141517]'
                    : 'bg-white text-[#141517]/75 border-[#141517]/15'
                }`}
              >
                Showroom Test Drive
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#141517]/70 mb-1">
                Showroom Host Location
              </label>
              <select
                value={showroomLocation}
                onChange={(e) => setShowroomLocation(e.target.value)}
                className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2.5 text-sm"
              >
                {SHOWROOM_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#141517]/70 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-[#141517]/15 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#141517]/70 mb-1">
                  Preferred Time
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="4:30 PM">4:30 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#141517]/70 mb-1">
                Specific Questions or Trim Requests
              </label>
              <textarea
                rows={2}
                maxLength={350}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional requests for your specialist..."
                className="w-full rounded-lg border border-[#141517]/15 px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#B45309] hover:bg-[#9A470A] text-sm font-semibold text-white"
            >
              {submitting ? 'Confirming...' : 'Confirm Private Tour'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
