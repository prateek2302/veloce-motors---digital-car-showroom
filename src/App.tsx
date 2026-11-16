import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ArrowUpRight, Compass, Search, SlidersHorizontal } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import {
  ConfiguratorSection,
  type VehicleConfiguration,
} from './components/ConfiguratorSection';
import { GarageModal } from './components/GarageModal';
import { Header } from './components/Header';
import { TourBookingModal } from './components/TourBookingModal';
import { VehicleImage } from './components/VehicleImage';
import { VirtualTourModal } from './components/VirtualTourModal';
import { VEHICLES, type ColorOption, type Vehicle } from './data/vehicles';
import {
  auth,
  ensureUserProfile,
  subscribeUserReservations,
  subscribeUserTourBookings,
  type ReservationRecord,
  type TourBookingRecord,
  type UserProfileRecord,
} from './lib/firebase';
import { formatCurrency } from './lib/payment';

type CategoryFilter =
  | 'All Vehicles'
  | 'Grand Tourer'
  | 'Performance SUV'
  | 'Roadster'
  | 'Executive';

type SortOrder = 'featured' | 'price-asc' | 'price-desc';

type PendingIntent =
  | { type: 'garage' }
  | { type: 'checkout'; config: VehicleConfiguration }
  | { type: 'tour-booking'; vehicle: Vehicle }
  | null;

const CATEGORIES: CategoryFilter[] = [
  'All Vehicles',
  'Grand Tourer',
  'Performance SUV',
  'Roadster',
  'Executive',
];

export default function App() {
  // Auth & Firestore State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [tourBookings, setTourBookings] = useState<TourBookingRecord[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Inventory Filter State
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>('All Vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');

  // Configurator Selection State
  const [configVehicle, setConfigVehicle] = useState<Vehicle>(VEHICLES[0]);
  const [configColor, setConfigColor] = useState<ColorOption>(
    VEHICLES[0].exteriorColors[0]
  );

  // Modal & Flow State
  const [tourModalVehicle, setTourModalVehicle] = useState<Vehicle | null>(null);
  const [checkoutConfig, setCheckoutConfig] =
    useState<VehicleConfiguration | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [garageOpen, setGarageOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        try {
          const loadedProfile = await ensureUserProfile(nextUser);
          setProfile(loadedProfile);
        } catch (err) {
          console.error(err);
        }
      } else {
        setProfile(null);
        setReservations([]);
        setTourBookings([]);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    setFirestoreError(null);

    const unsubReservations = subscribeUserReservations(
      user.uid,
      (items) => setReservations(items),
      (err) => setFirestoreError(err.message)
    );

    const unsubTours = subscribeUserTourBookings(
      user.uid,
      (items) => setTourBookings(items),
      (err) => setFirestoreError(err.message)
    );

    return () => {
      unsubReservations();
      unsubTours();
    };
  }, [authReady, user]);

  const filteredVehicles = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();
    const list = VEHICLES.filter((v) => {
      const matchesCat =
        categoryFilter === 'All Vehicles' || v.category === categoryFilter;
      const matchesSearch =
        !queryLower ||
        v.name.toLowerCase().includes(queryLower) ||
        v.powertrain.toLowerCase().includes(queryLower) ||
        v.category.toLowerCase().includes(queryLower);
      return matchesCat && matchesSearch;
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.basePrice - b.basePrice);
    }
    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.basePrice - a.basePrice);
    }
    return list;
  }, [categoryFilter, searchQuery, sortOrder]);

  const activeReservationCount = useMemo(
    () => reservations.filter((r) => r.reservationStatus === 'confirmed').length,
    [reservations]
  );

  const handleOpenGarage = () => {
    if (!user) {
      setPendingIntent({ type: 'garage' });
      setAuthModalReason(
        'Sign in with Google to access your confirmed vehicle reservations, payment receipts, and scheduled tours.'
      );
      return;
    }
    setGarageOpen(true);
  };

  const handleProceedToCheckout = (config: VehicleConfiguration) => {
    if (!user) {
      setPendingIntent({ type: 'checkout', config });
      setAuthModalReason(
        `Sign in to verify your identity before authorizing the ${formatCurrency(
          config.vehicle.depositAmount
        )} refundable reservation deposit for the ${config.vehicle.name}.`
      );
      return;
    }
    setCheckoutConfig(config);
  };

  const handleBookLiveTour = (vehicle: Vehicle) => {
    setTourModalVehicle(null);
    if (!user) {
      setPendingIntent({ type: 'tour-booking', vehicle });
      setAuthModalReason(
        `Sign in to schedule a private virtual walkaround or showroom test drive for the ${vehicle.name}.`
      );
      return;
    }
    setBookingVehicle(vehicle);
  };

  const handleAuthSuccess = () => {
    setAuthModalReason(null);
    if (!pendingIntent) return;
    if (pendingIntent.type === 'garage') {
      setGarageOpen(true);
    } else if (pendingIntent.type === 'checkout') {
      setCheckoutConfig(pendingIntent.config);
    } else if (pendingIntent.type === 'tour-booking') {
      setBookingVehicle(pendingIntent.vehicle);
    }
    setPendingIntent(null);
  };

  const handleSelectForConfig = (vehicle: Vehicle, color?: ColorOption) => {
    setConfigVehicle(vehicle);
    setConfigColor(color || vehicle.exteriorColors[0]);
    setTourModalVehicle(null);
    const el = document.getElementById('configurator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const flagship = VEHICLES[0];

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F7F6F3] text-[#141517]">
      <Header
        user={user}
        reservationCount={activeReservationCount}
        onOpenAuth={() => {
          setPendingIntent(null);
          setAuthModalReason(
            'Sign in to manage vehicle reservations, deposits, and private showroom appointments.'
          );
        }}
        onOpenGarage={handleOpenGarage}
        onLaunchVirtualTour={() => setTourModalVehicle(configVehicle)}
      />

      <main className="flex-1">
        {/* Section 1: Storefront Hero */}
        <section className="mx-auto max-w-[1280px] px-6 pt-8 pb-14 md:pt-12 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Hero Editorial Copy */}
            <div className="lg:col-span-5 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <p className="text-xs font-medium text-[#9A470A]">
                  2026 Collection · Direct Showroom Allocation
                </p>
                <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-[#141517] text-balance">
                  Architectural electric and hybrid grand tourers
                </h1>
                <p className="text-base leading-relaxed text-[#141517]/75 max-w-md">
                  Inspect studio exteriors, step inside 360° cabins or our interactive 3D stage, configure bespoke finishes, and lock your build slot online.
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#inventory"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141517] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#27292D] transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore Inventory
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setTourModalVehicle(flagship)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#141517]/20 bg-white px-5 py-3.5 text-sm font-semibold text-[#141517] hover:border-[#141517] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Compass className="h-4 w-4 text-[#9A470A]" />
                    Launch 3D Virtual Tour
                  </button>
                </div>

                <div className="pt-5 border-t border-[#141517]/10 flex items-center justify-between text-xs text-[#141517]/65">
                  <span>Featured Flagship: {flagship.name}</span>
                  <span className="font-mono font-semibold text-[#141517]">
                    From {formatCurrency(flagship.basePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero 16:9 Gallery Image */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-[#141517] aspect-[16/10] lg:aspect-auto lg:min-h-[440px] border border-[#141517]/10">
              <VehicleImage
                src={flagship.heroImageUrl || flagship.imageUrl}
                alt="Veloce Aethera GT inside minimalist architectural showroom"
                className="w-full h-full lg:h-full object-cover"
                fallbackTitle={flagship.name}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-white/80">
                    {flagship.drivetrainSummary}
                  </p>
                  <p className="font-display text-xl font-semibold text-white">
                    {flagship.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectForConfig(flagship)}
                  className="rounded-lg bg-[#B45309] hover:bg-[#9A470A] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Configure Build
                </button>
              </div>
            </div>
          </div>

          {/* 4-Column Showroom Promise & Telemetry Strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-[#141517]/10">
            <div className="p-4 rounded-xl bg-white border border-[#141517]/8">
              <p className="text-xs text-[#141517]/60">Flagship Acceleration</p>
              <p className="font-mono text-xl font-bold text-[#141517] mt-1">
                2.4s 0–60 mph
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#141517]/8">
              <p className="text-xs text-[#141517]/60">Max Certified Range</p>
              <p className="font-mono text-xl font-bold text-[#141517] mt-1">
                510 mi EPA
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#141517]/8">
              <p className="text-xs text-[#141517]/60">Escrow Deposit</p>
              <p className="font-mono text-xl font-bold text-[#141517] mt-1">
                $2,500 Refundable
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#141517]/8">
              <p className="text-xs text-[#141517]/60">Showroom Network</p>
              <p className="font-mono text-xl font-bold text-[#141517] mt-1">
                5 Global Galleries
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Vehicle Inventory & Pricing */}
        <section
          id="inventory"
          className="py-14 md:py-20 border-t border-[#141517]/10"
        >
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-xs font-medium text-[#9A470A] mb-2">
                  2026 Showroom Inventory
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141517]">
                  Select a model to tour or configure
                </h2>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="h-4 w-4 text-[#141517]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search model or powertrain..."
                    aria-label="Search vehicle inventory"
                    className="w-full rounded-xl border border-[#141517]/15 bg-white pl-10 pr-4 py-2.5 text-sm text-[#141517] placeholder:text-[#141517]/45 focus:border-[#141517] focus:outline-none"
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#141517]/15 bg-white px-3 py-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#141517]/55" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    aria-label="Sort inventory by price"
                    className="bg-transparent text-sm font-medium text-[#141517] focus:outline-none"
                  >
                    <option value="featured">Featured Order</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#ECE9E1] w-fit mb-9">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white text-[#141517] shadow-sm'
                      : 'text-[#141517]/65 hover:text-[#141517]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 3-Column Inventory Grid */}
            {filteredVehicles.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#141517]/10 p-12 text-center">
                <p className="font-display text-lg font-semibold text-[#141517]">
                  No vehicles match your current filters
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('All Vehicles');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#141517] text-xs font-semibold text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredVehicles.map((vehicle) => (
                  <article
                    key={vehicle.id}
                    className="group flex flex-col rounded-2xl bg-white border border-[#141517]/10 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* 4:3 Studio Photo (~68% visual anchor) */}
                    <div className="relative aspect-[4/3] bg-[#EFECE6] overflow-hidden">
                      <VehicleImage
                        src={vehicle.imageUrl}
                        alt={`${vehicle.year} ${vehicle.name}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        fallbackTitle={vehicle.name}
                      />
                    </div>

                    {/* Clean Unboxed Metadata & Actions */}
                    <div className="flex-1 flex flex-col justify-between p-6 space-y-5">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#141517]/60 mb-1.5">
                          <span>{vehicle.drivetrainSummary}</span>
                          <span>{vehicle.availability}</span>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-display text-lg font-bold text-[#141517]">
                            {vehicle.name}
                          </h3>
                          <span className="font-mono text-base font-semibold text-[#141517] shrink-0">
                            {formatCurrency(vehicle.basePrice)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[#141517]/70 line-clamp-2">
                          {vehicle.tagline}
                        </p>
                        <div className="mt-3 pt-3 border-t border-[#141517]/8 flex items-center gap-3 font-mono text-xs text-[#141517]/75">
                          <span>{vehicle.specs.horsepower} hp</span>
                          <span aria-hidden="true">·</span>
                          <span>{vehicle.specs.zeroToSixty} 0–60</span>
                          <span aria-hidden="true">·</span>
                          <span>{vehicle.specs.rangeValue}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setTourModalVehicle(vehicle)}
                          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#141517]/20 px-3 py-2 text-xs font-semibold text-[#141517] hover:border-[#141517] transition-colors whitespace-nowrap shrink-0"
                        >
                          <Compass className="h-3.5 w-3.5 text-[#9A470A]" />
                          Virtual Tour
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectForConfig(vehicle)}
                          className="min-h-[42px] inline-flex items-center justify-center rounded-xl bg-[#141517] px-3 py-2 text-xs font-semibold text-white hover:bg-[#27292D] transition-colors whitespace-nowrap shrink-0"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Interactive Configurator & Pricing */}
        <ConfiguratorSection
          key={configVehicle.id}
          selectedVehicle={configVehicle}
          selectedColor={configColor}
          onSelectVehicle={(v) => setConfigVehicle(v)}
          onSelectColor={(c) => setConfigColor(c)}
          onLaunchVirtualTour={(v) => setTourModalVehicle(v)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      </main>

      {firestoreError && (
        <div className="mx-auto max-w-[1280px] px-6 pb-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Account sync notice: {firestoreError}
          </div>
        </div>
      )}

      {/* Quiet Architectural Footer */}
      <footer className="bg-[#141517] text-white border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">
              Veloce Motors
            </p>
            <p className="text-xs text-[#A1A1AA] mt-1">
              San Francisco · New York · Los Angeles · Zurich · Tokyo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#D4D4D8]">
            <a href="#inventory" className="hover:text-white transition-colors">
              Inventory
            </a>
            <button
              type="button"
              onClick={() => setTourModalVehicle(configVehicle)}
              className="hover:text-white transition-colors"
            >
              3D Virtual Tour
            </button>
            <a href="#configurator" className="hover:text-white transition-colors">
              Configurator
            </a>
            <button
              type="button"
              onClick={handleOpenGarage}
              className="hover:text-white transition-colors"
            >
              My Garage
            </button>
            <span className="text-[#71717A]">
              © 2026 Veloce Motors
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {tourModalVehicle && (
        <VirtualTourModal
          vehicle={tourModalVehicle}
          onClose={() => setTourModalVehicle(null)}
          onConfigureVehicle={handleSelectForConfig}
          onBookLiveTour={handleBookLiveTour}
        />
      )}

      {authModalReason && (
        <AuthModal
          reason={authModalReason}
          onClose={() => {
            setAuthModalReason(null);
            setPendingIntent(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {checkoutConfig && user && (
        <CheckoutModal
          config={checkoutConfig}
          user={user}
          onClose={() => setCheckoutConfig(null)}
          onSuccess={() => {
            // Live Firestore onSnapshot updates reservations automatically
          }}
        />
      )}

      {bookingVehicle && user && (
        <TourBookingModal
          vehicle={bookingVehicle}
          user={user}
          onClose={() => setBookingVehicle(null)}
          onSuccess={() => {
            // Live Firestore onSnapshot updates tourBookings automatically
          }}
        />
      )}

      {garageOpen && user && (
        <GarageModal
          user={user}
          profile={profile}
          reservations={reservations}
          tourBookings={tourBookings}
          onClose={() => setGarageOpen(false)}
        />
      )}
    </div>
  );
}
