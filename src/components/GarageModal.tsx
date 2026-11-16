import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Calendar, CarFront, LogOut, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { SHOWROOM_LOCATIONS, VEHICLES } from '../data/vehicles';
import {
  cancelReservation,
  cancelTourBooking,
  createTourBooking,
  signOutUser,
  updateReservationShowroom,
  updateUserProfile,
  type ReservationRecord,
  type TourBookingRecord,
  type UserProfileRecord,
} from '../lib/firebase';
import { formatCurrency } from '../lib/payment';

interface GarageModalProps {
  user: User;
  profile: UserProfileRecord | null;
  reservations: ReservationRecord[];
  tourBookings: TourBookingRecord[];
  onClose: () => void;
}

type GarageTab = 'reservations' | 'tours' | 'account';

export function GarageModal({
  user,
  profile,
  reservations,
  tourBookings,
  onClose,
}: GarageModalProps) {
  const [tab, setTab] = useState<GarageTab>('reservations');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Account edit state
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user.displayName || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [preferredShowroom, setPreferredShowroom] = useState(
    profile?.preferredShowroom || SHOWROOM_LOCATIONS[0]
  );

  // Quick tour booking state
  const [tourVehicleId, setTourVehicleId] = useState(VEHICLES[0].id);
  const [tourType, setTourType] = useState<'virtual_live' | 'showroom_visit'>(
    'virtual_live'
  );
  const [tourShowroom, setTourShowroom] = useState<string>(SHOWROOM_LOCATIONS[0]);
  const [tourDate, setTourDate] = useState('2026-11-24');
  const [tourTime, setTourTime] = useState('11:00 AM');
  const [tourNotes, setTourNotes] = useState('');

  const handleCancelReservation = async (id: string) => {
    setBusyId(id);
    setFeedback(null);
    try {
      await cancelReservation(id);
      setFeedback('Reservation cancelled and deposit refund initiated.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Could not cancel reservation.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeShowroom = async (res: ReservationRecord, showroom: string) => {
    setBusyId(res.id);
    setFeedback(null);
    try {
      await updateReservationShowroom(res.id, showroom, res.deliveryWindow);
      setFeedback(`Delivery showroom updated to ${showroom}.`);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Unable to update showroom.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('new-tour');
    setFeedback(null);
    try {
      const v = VEHICLES.find((item) => item.id === tourVehicleId) || VEHICLES[0];
      await createTourBooking({
        userId: user.uid,
        vehicleId: v.id,
        vehicleName: v.name,
        tourType,
        showroomLocation: tourShowroom,
        preferredDate: tourDate,
        preferredTime: tourTime,
        notes: tourNotes,
      });
      setTourNotes('');
      setFeedback(`Private ${tourType === 'virtual_live' ? 'live virtual' : 'showroom'} tour scheduled for ${v.name}.`);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Unable to schedule tour.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelTour = async (id: string) => {
    setBusyId(id);
    setFeedback(null);
    try {
      await cancelTourBooking(id);
      setFeedback('Tour appointment cancelled.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Unable to cancel appointment.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('profile');
    setFeedback(null);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        phone,
        preferredShowroom,
      });
      setFeedback('Client profile preferences saved.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Unable to save profile.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="My Garage and Account"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white text-[#141517] shadow-2xl border border-[#141517]/10 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#141517]/10">
          <div>
            <p className="text-xs text-[#9A470A] font-medium">
              Authenticated Client Portal · {user.email}
            </p>
            <h2 className="font-display text-xl font-bold text-[#141517]">
              My Garage & Concierge
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F3F1EC]">
            <button
              type="button"
              onClick={() => setTab('reservations')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                tab === 'reservations'
                  ? 'bg-[#141517] text-white'
                  : 'text-[#141517]/70 hover:text-[#141517]'
              }`}
            >
              <CarFront className="h-3.5 w-3.5" />
              Reservations ({reservations.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('tours')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                tab === 'tours'
                  ? 'bg-[#141517] text-white'
                  : 'text-[#141517]/70 hover:text-[#141517]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Tours ({tourBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('account')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                tab === 'account'
                  ? 'bg-[#141517] text-white'
                  : 'text-[#141517]/70 hover:text-[#141517]'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              Account
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close garage"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#141517]/60 hover:bg-[#141517]/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {feedback && (
            <div className="rounded-xl bg-[#F7F6F3] border border-[#141517]/15 px-4 py-3 text-xs font-medium text-[#141517]">
              {feedback}
            </div>
          )}

          {tab === 'reservations' && (
            <div className="space-y-4">
              {reservations.length === 0 ? (
                <div className="p-10 text-center rounded-xl bg-[#F7F6F3] border border-[#141517]/10">
                  <p className="font-display text-base font-semibold text-[#141517]">
                    No vehicle reservations yet
                  </p>
                  <p className="text-sm text-[#141517]/65 mt-1">
                    Configure any vehicle in the showroom to lock a build slot with a refundable deposit.
                  </p>
                </div>
              ) : (
                reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-xl bg-[#F7F6F3] border border-[#141517]/10 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-[#141517]/60">
                          Ref #{res.transactionRef} ·{' '}
                          {res.reservationStatus === 'confirmed'
                            ? 'Confirmed Build Slot'
                            : 'Cancelled & Refunded'}
                        </p>
                        <h3 className="font-display text-lg font-bold text-[#141517] mt-0.5">
                          {res.trimName}
                        </h3>
                        <p className="text-sm text-[#141517]/75">
                          {res.exteriorColor} · {res.interiorFinish} ·{' '}
                          {res.wheelPackage}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-base font-bold text-[#141517]">
                          {formatCurrency(res.vehiclePrice)}
                        </p>
                        <p className="font-mono text-xs text-[#9A470A]">
                          Deposit {formatCurrency(res.depositAmount)} ·{' '}
                          {res.paymentStatus === 'paid' ? 'Paid' : 'Refunded'} (••••{' '}
                          {res.cardLast4})
                        </p>
                      </div>
                    </div>

                    {res.reservationStatus === 'confirmed' && (
                      <div className="pt-4 border-t border-[#141517]/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#141517]/65">Showroom:</span>
                          <select
                            value={res.showroomLocation}
                            disabled={busyId === res.id}
                            onChange={(e) =>
                              handleChangeShowroom(res, e.target.value)
                            }
                            aria-label="Update delivery showroom"
                            className="rounded-md border border-[#141517]/15 bg-white px-2.5 py-1.5 text-xs font-medium"
                          >
                            {SHOWROOM_LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={busyId === res.id}
                          onClick={() => handleCancelReservation(res.id)}
                          className="px-3.5 py-1.5 rounded-lg border border-red-300 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {busyId === res.id
                            ? 'Processing...'
                            : 'Cancel & Refund Deposit'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'tours' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateTour}
                className="lg:col-span-5 p-5 rounded-xl bg-[#F7F6F3] border border-[#141517]/10 space-y-3.5"
              >
                <h3 className="font-display text-base font-bold text-[#141517]">
                  Book Private Virtual or Showroom Tour
                </h3>
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Vehicle
                  </label>
                  <select
                    value={tourVehicleId}
                    onChange={(e) => setTourVehicleId(e.target.value)}
                    className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2 text-sm"
                  >
                    {VEHICLES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Tour Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTourType('virtual_live')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                        tourType === 'virtual_live'
                          ? 'bg-[#141517] text-white border-[#141517]'
                          : 'bg-white text-[#141517]/75 border-[#141517]/15'
                      }`}
                    >
                      Live Video Tour
                    </button>
                    <button
                      type="button"
                      onClick={() => setTourType('showroom_visit')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                        tourType === 'showroom_visit'
                          ? 'bg-[#141517] text-white border-[#141517]'
                          : 'bg-white text-[#141517]/75 border-[#141517]/15'
                      }`}
                    >
                      Showroom Drive
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Showroom Location
                  </label>
                  <select
                    value={tourShowroom}
                    onChange={(e) => setTourShowroom(e.target.value)}
                    className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2 text-sm"
                  >
                    {SHOWROOM_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={tourDate}
                      onChange={(e) => setTourDate(e.target.value)}
                      className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Time
                    </label>
                    <select
                      value={tourTime}
                      onChange={(e) => setTourTime(e.target.value)}
                      className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2 text-sm"
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
                    Concierge Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={350}
                    value={tourNotes}
                    onChange={(e) => setTourNotes(e.target.value)}
                    placeholder="Areas to focus on during walkaround..."
                    className="w-full rounded-lg border border-[#141517]/15 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busyId === 'new-tour'}
                  className="w-full py-2.5 rounded-xl bg-[#B45309] hover:bg-[#9A470A] text-xs font-semibold text-white"
                >
                  {busyId === 'new-tour' ? 'Scheduling...' : 'Confirm Tour Slot'}
                </button>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {tourBookings.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#F7F6F3] border border-[#141517]/10">
                    <p className="text-sm font-semibold text-[#141517]">
                      No tour appointments scheduled
                    </p>
                    <p className="text-xs text-[#141517]/65 mt-1">
                      Use the form to book a private 1-on-1 live video walkaround or in-person test drive.
                    </p>
                  </div>
                ) : (
                  tourBookings.map((tb) => (
                    <div
                      key={tb.id}
                      className="p-4 rounded-xl bg-[#F7F6F3] border border-[#141517]/10 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs text-[#141517]/60">
                          {tb.tourType === 'virtual_live'
                            ? 'Live Video Walkaround'
                            : 'Showroom Test Drive'}{' '}
                          · {tb.status === 'scheduled' ? 'Scheduled' : 'Cancelled'}
                        </p>
                        <p className="font-display text-base font-semibold text-[#141517]">
                          {tb.vehicleName}
                        </p>
                        <p className="text-xs text-[#141517]/75 mt-0.5">
                          {tb.preferredDate} at {tb.preferredTime} ·{' '}
                          {tb.showroomLocation}
                        </p>
                      </div>
                      {tb.status === 'scheduled' && (
                        <button
                          type="button"
                          disabled={busyId === tb.id}
                          onClick={() => handleCancelTour(tb.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#141517]/20 text-xs font-medium hover:bg-white"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'account' && (
            <div className="max-w-lg space-y-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Client Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (415) 555-0192"
                    className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#141517]/70 mb-1">
                    Preferred Showroom
                  </label>
                  <select
                    value={preferredShowroom}
                    onChange={(e) => setPreferredShowroom(e.target.value)}
                    className="w-full rounded-lg border border-[#141517]/15 bg-white px-3.5 py-2.5 text-sm"
                  >
                    {SHOWROOM_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busyId === 'profile'}
                  className="px-5 py-2.5 rounded-xl bg-[#141517] text-xs font-semibold text-white hover:bg-[#27292D]"
                >
                  {busyId === 'profile' ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>

              <div className="pt-5 border-t border-[#141517]/10 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#141517]/65">
                  <ShieldCheck className="h-4 w-4 text-[#9A470A]" />
                  Verified Google Session
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#141517]/20 text-xs font-semibold text-[#141517] hover:bg-[#F7F6F3]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
