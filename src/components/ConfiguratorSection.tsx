import { useMemo, useState } from 'react';
import { Check, Compass, ShieldCheck } from 'lucide-react';
import {
  VEHICLES,
  type ColorOption,
  type InteriorOption,
  type Vehicle,
  type VehicleTrim,
  type WheelOption,
} from '../data/vehicles';
import { calculateMonthlyPayment, formatCurrency } from '../lib/payment';
import { VehicleImage } from './VehicleImage';

export interface VehicleConfiguration {
  vehicle: Vehicle;
  trim: VehicleTrim;
  exteriorColor: ColorOption;
  interiorFinish: InteriorOption;
  wheelPackage: WheelOption;
  totalPrice: number;
}

interface ConfiguratorSectionProps {
  selectedVehicle: Vehicle;
  selectedColor: ColorOption;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectColor: (color: ColorOption) => void;
  onLaunchVirtualTour: (vehicle: Vehicle) => void;
  onProceedToCheckout: (config: VehicleConfiguration) => void;
}

export function ConfiguratorSection({
  selectedVehicle,
  selectedColor,
  onSelectVehicle,
  onSelectColor,
  onLaunchVirtualTour,
  onProceedToCheckout,
}: ConfiguratorSectionProps) {
  const [selectedTrimId, setSelectedTrimId] = useState<string>(
    selectedVehicle.trims[0].id
  );
  const [selectedInteriorId, setSelectedInteriorId] = useState<string>(
    selectedVehicle.interiorFinishes[0].id
  );
  const [selectedWheelId, setSelectedWheelId] = useState<string>(
    selectedVehicle.wheelPackages[0].id
  );
  const [paymentPlan, setPaymentPlan] = useState<'lease' | 'finance' | 'cash'>(
    'finance'
  );
  const [downPayment, setDownPayment] = useState<number>(15000);
  const [termMonths, setTermMonths] = useState<number>(60);

  const activeTrim = useMemo(
    () =>
      selectedVehicle.trims.find((t) => t.id === selectedTrimId) ||
      selectedVehicle.trims[0],
    [selectedVehicle, selectedTrimId]
  );

  const activeColor = useMemo(
    () =>
      selectedVehicle.exteriorColors.find((c) => c.id === selectedColor.id) ||
      selectedVehicle.exteriorColors[0],
    [selectedVehicle, selectedColor]
  );

  const activeInterior = useMemo(
    () =>
      selectedVehicle.interiorFinishes.find((i) => i.id === selectedInteriorId) ||
      selectedVehicle.interiorFinishes[0],
    [selectedVehicle, selectedInteriorId]
  );

  const activeWheel = useMemo(
    () =>
      selectedVehicle.wheelPackages.find((w) => w.id === selectedWheelId) ||
      selectedVehicle.wheelPackages[0],
    [selectedVehicle, selectedWheelId]
  );

  const totalPrice =
    selectedVehicle.basePrice +
    activeTrim.priceDelta +
    activeColor.priceDelta +
    activeInterior.priceDelta +
    activeWheel.priceDelta;

  const monthlyEstimate = useMemo(() => {
    if (paymentPlan === 'cash') return 0;
    const effectiveTerm = paymentPlan === 'lease' ? Math.min(termMonths, 48) : termMonths;
    const apr = paymentPlan === 'lease' ? 5.2 : 5.49;
    return calculateMonthlyPayment(
      totalPrice,
      downPayment,
      effectiveTerm,
      apr,
      paymentPlan
    );
  }, [totalPrice, downPayment, termMonths, paymentPlan]);

  const handleVehicleSwitch = (v: Vehicle) => {
    onSelectVehicle(v);
    setSelectedTrimId(v.trims[0].id);
    onSelectColor(v.exteriorColors[0]);
    setSelectedInteriorId(v.interiorFinishes[0].id);
    setSelectedWheelId(v.wheelPackages[0].id);
  };

  return (
    <section
      id="configurator"
      className="py-16 md:py-24 border-t border-[#141517]/10 bg-white"
    >
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9A470A] mb-2">
              Bespoke Build & Pricing
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#141517] text-balance">
              Configure your vehicle and lock a build slot
            </h2>
          </div>

          {/* Model Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F3F1EC] border border-[#141517]/10">
            {VEHICLES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVehicleSwitch(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedVehicle.id === v.id
                    ? 'bg-[#141517] text-white'
                    : 'text-[#141517]/70 hover:text-[#141517]'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contiguous 2-Column PDP Configurator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Studio Preview */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-[#EFECE6] border border-[#141517]/10 aspect-[4/3]">
              <VehicleImage
                src={selectedVehicle.imageUrl}
                alt={`${selectedVehicle.name} configured in ${activeColor.name}`}
                className="w-full h-full object-cover"
                fallbackTitle={selectedVehicle.name}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-white/80">
                    {activeColor.name} · {activeTrim.drivetrain}
                  </p>
                  <p className="font-display text-xl font-semibold text-white">
                    {activeTrim.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchVirtualTour(selectedVehicle)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#141517] hover:bg-[#EFECE6] transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  <Compass className="h-4 w-4 text-[#9A470A]" />
                  Open 3D & Cabin Tour
                </button>
              </div>
            </div>

            {/* Live Performance Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#F7F6F3] border border-[#141517]/8">
              <div>
                <p className="text-xs text-[#141517]/60">Peak Output</p>
                <p className="font-mono text-lg font-semibold text-[#141517] mt-0.5">
                  {activeTrim.horsepower} hp
                </p>
              </div>
              <div>
                <p className="text-xs text-[#141517]/60">0–60 mph</p>
                <p className="font-mono text-lg font-semibold text-[#141517] mt-0.5">
                  {activeTrim.zeroToSixty}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#141517]/60">
                  {selectedVehicle.specs.rangeLabel}
                </p>
                <p className="font-mono text-lg font-semibold text-[#141517] mt-0.5">
                  {activeTrim.rangeOrTopSpeed}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#141517]/60">Est. Delivery</p>
                <p className="font-mono text-lg font-semibold text-[#141517] mt-0.5">
                  {selectedVehicle.deliveryEstimate}
                </p>
              </div>
            </div>
          </div>

          {/* Right Configuration & Pricing Purchase Module */}
          <div className="lg:col-span-5 space-y-7">
            {/* Step 1: Trim */}
            <div>
              <h3 className="text-sm font-semibold text-[#141517] mb-3">
                01. Select Powertrain Trim
              </h3>
              <div className="space-y-2.5">
                {selectedVehicle.trims.map((trim) => {
                  const selected = trim.id === activeTrim.id;
                  return (
                    <button
                      key={trim.id}
                      type="button"
                      onClick={() => setSelectedTrimId(trim.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                        selected
                          ? 'border-[#141517] bg-[#F7F6F3]'
                          : 'border-[#141517]/12 bg-white hover:border-[#141517]/35'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#141517]">
                          {trim.name}
                        </p>
                        <p className="text-xs text-[#141517]/60 mt-0.5">
                          {trim.horsepower} hp · {trim.zeroToSixty} 0–60 ·{' '}
                          {trim.rangeOrTopSpeed}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#141517] shrink-0">
                        {trim.priceDelta === 0
                          ? 'Included'
                          : `+${formatCurrency(trim.priceDelta)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Exterior Paint */}
            <div className="pt-5 border-t border-[#141517]/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#141517]">
                  02. Exterior Paint
                </h3>
                <span className="text-xs text-[#141517]/65 font-mono">
                  {activeColor.name} ·{' '}
                  {activeColor.priceDelta === 0
                    ? 'Included'
                    : `+${formatCurrency(activeColor.priceDelta)}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedVehicle.exteriorColors.map((color) => {
                  const selected = color.id === activeColor.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onSelectColor(color)}
                      aria-label={`Select ${color.name}`}
                      className={`group relative h-11 w-11 rounded-full border-2 transition-transform flex items-center justify-center ${
                        selected
                          ? 'border-[#141517] scale-105'
                          : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-black/15"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Interior & Wheels */}
            <div className="pt-5 border-t border-[#141517]/10 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[#141517] mb-3">
                  03. Cabin Upholstery
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedVehicle.interiorFinishes.map((interior) => {
                    const selected = interior.id === activeInterior.id;
                    return (
                      <button
                        key={interior.id}
                        type="button"
                        onClick={() => setSelectedInteriorId(interior.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          selected
                            ? 'border-[#141517] bg-[#F7F6F3]'
                            : 'border-[#141517]/12 hover:border-[#141517]/35'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-5 w-5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: interior.swatchHex }}
                          />
                          <span className="text-sm font-medium text-[#141517] truncate">
                            {interior.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#141517] shrink-0">
                          {interior.priceDelta === 0
                            ? 'Included'
                            : `+${formatCurrency(interior.priceDelta)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#141517] mb-3">
                  04. Wheel Architecture
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedVehicle.wheelPackages.map((wheel) => {
                    const selected = wheel.id === activeWheel.id;
                    return (
                      <button
                        key={wheel.id}
                        type="button"
                        onClick={() => setSelectedWheelId(wheel.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          selected
                            ? 'border-[#141517] bg-[#F7F6F3]'
                            : 'border-[#141517]/12 hover:border-[#141517]/35'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {selected && <Check className="h-4 w-4 text-[#9A470A] shrink-0" />}
                          <span className="text-sm font-medium text-[#141517] truncate">
                            {wheel.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#141517] shrink-0">
                          {wheel.priceDelta === 0
                            ? 'Included'
                            : `+${formatCurrency(wheel.priceDelta)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 4: Financing & Purchase Summary */}
            <div className="p-5 rounded-2xl bg-[#F7F6F3] border border-[#141517]/10 space-y-5">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-[#141517]/10">
                {(['finance', 'lease', 'cash'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setPaymentPlan(plan)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                      paymentPlan === plan
                        ? 'bg-[#141517] text-white'
                        : 'text-[#141517]/65 hover:text-[#141517]'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>

              {paymentPlan !== 'cash' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#141517]/70">Down Payment</span>
                      <span className="font-mono font-semibold text-[#141517]">
                        {formatCurrency(downPayment)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={50000}
                      step={2500}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      aria-label="Down payment amount"
                      className="w-full accent-[#B45309]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#141517]/70">Term</span>
                    <div className="flex items-center gap-1.5">
                      {(paymentPlan === 'lease' ? [24, 36, 48] : [48, 60, 72]).map(
                        (m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setTermMonths(m)}
                            className={`px-2.5 py-1 text-xs font-mono rounded-md border ${
                              (paymentPlan === 'lease'
                                ? Math.min(termMonths, 48)
                                : termMonths) === m
                                ? 'border-[#141517] bg-[#141517] text-white'
                                : 'border-[#141517]/15 bg-white text-[#141517]/70'
                            }`}
                          >
                            {m} mo
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#141517]/10 flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs text-[#141517]/60">Configured Total MSRP</p>
                  <p className="font-mono text-2xl font-bold text-[#141517] mt-0.5">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
                {paymentPlan !== 'cash' && (
                  <div className="text-right">
                    <p className="text-xs text-[#141517]/60">
                      Est. {paymentPlan === 'lease' ? 'Lease' : 'Finance'}
                    </p>
                    <p className="font-mono text-lg font-semibold text-[#9A470A] mt-0.5">
                      {formatCurrency(monthlyEstimate)}/mo
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  onProceedToCheckout({
                    vehicle: selectedVehicle,
                    trim: activeTrim,
                    exteriorColor: activeColor,
                    interiorFinish: activeInterior,
                    wheelPackage: activeWheel,
                    totalPrice,
                  })
                }
                className="w-full min-h-[48px] rounded-xl bg-[#B45309] hover:bg-[#9A470A] px-6 py-3.5 text-sm font-semibold text-white transition-colors"
              >
                Reserve Vehicle · {formatCurrency(selectedVehicle.depositAmount)} Deposit
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-[#141517]/60">
                <ShieldCheck className="h-4 w-4 text-[#9A470A]" />
                100% refundable reservation deposit held in escrow
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
