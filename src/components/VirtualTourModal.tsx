import { useRef, useState } from 'react';
import { Calendar, Eye, Layers, MoveHorizontal, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { ColorOption, TourHotspot, Vehicle } from '../data/vehicles';
import { formatCurrency } from '../lib/payment';
import { Showroom3DStage } from './Showroom3DStage';
import { VehicleImage } from './VehicleImage';

interface VirtualTourModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onConfigureVehicle: (vehicle: Vehicle, selectedColor?: ColorOption) => void;
  onBookLiveTour: (vehicle: Vehicle) => void;
}

type TourMode = 'exterior' | 'cockpit' | 'stage3d';

export function VirtualTourModal({
  vehicle,
  onClose,
  onConfigureVehicle,
  onBookLiveTour,
}: VirtualTourModalProps) {
  const [mode, setMode] = useState<TourMode>('exterior');
  const [selectedColor, setSelectedColor] = useState<ColorOption>(
    vehicle.exteriorColors[0]
  );
  const [activeHotspot, setActiveHotspot] = useState<TourHotspot>(
    vehicle.exteriorHotspots[0]
  );

  // Interactive pan & zoom state for Cockpit 360 mode
  const [panX, setPanX] = useState(0);
  const [zoom, setZoom] = useState(1.12);
  const isDraggingRef = useRef(false);
  const lastClientXRef = useRef(0);

  const handleModeChange = (nextMode: TourMode) => {
    setMode(nextMode);
    if (nextMode === 'exterior') {
      setActiveHotspot(vehicle.exteriorHotspots[0]);
    } else if (nextMode === 'cockpit') {
      setActiveHotspot(vehicle.interiorHotspots[0]);
      setPanX(0);
      setZoom(1.12);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'cockpit') return;
    isDraggingRef.current = true;
    lastClientXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || mode !== 'cockpit') return;
    const dx = e.clientX - lastClientXRef.current;
    lastClientXRef.current = e.clientX;
    setPanX((prev) => Math.max(-160, Math.min(160, prev + dx * 0.65)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const activeHotspots =
    mode === 'cockpit' ? vehicle.interiorHotspots : vehicle.exteriorHotspots;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${vehicle.name} Virtual Tour`}
    >
      <div className="relative w-full max-w-6xl rounded-2xl bg-[#141517] text-white border border-white/10 shadow-2xl overflow-hidden my-auto">
        {/* Top Tour Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-xs text-[#A1A1AA]">
              {vehicle.year} · {vehicle.category} · {vehicle.powertrain}
            </p>
            <h2 className="font-display text-xl font-semibold text-white">
              {vehicle.name} — Virtual Tour
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1E2025] border border-white/10">
            <button
              type="button"
              onClick={() => handleModeChange('exterior')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'exterior'
                  ? 'bg-white text-[#141517]'
                  : 'text-[#D4D4D8] hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Exterior Walkaround
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('cockpit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'cockpit'
                  ? 'bg-white text-[#141517]'
                  : 'text-[#D4D4D8] hover:text-white'
              }`}
            >
              <MoveHorizontal className="h-3.5 w-3.5" />
              Cabin Cockpit 360°
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('stage3d')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'stage3d'
                  ? 'bg-white text-[#141517]'
                  : 'text-[#D4D4D8] hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              3D Studio Stage
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close virtual tour"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Interactive Tour Viewport */}
        {mode === 'stage3d' ? (
          <Showroom3DStage
            vehicle={vehicle}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Visual Canvas */}
            <div
              className={`relative lg:col-span-8 h-[360px] md:h-[500px] overflow-hidden bg-[#1A1B1E] ${
                mode === 'cockpit' ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div
                className="w-full h-full transition-transform duration-150 ease-out"
                style={{
                  transform:
                    mode === 'cockpit'
                      ? `translateX(${panX}px) scale(${zoom})`
                      : 'scale(1)',
                }}
              >
                <VehicleImage
                  src={
                    mode === 'cockpit' ? vehicle.interiorImageUrl : vehicle.imageUrl
                  }
                  alt={
                    mode === 'cockpit'
                      ? `${vehicle.name} interior cockpit view`
                      : `${vehicle.name} studio exterior view`
                  }
                  className="w-full h-full object-cover"
                  fallbackTitle={vehicle.name}
                />

                {/* Interactive Hotspots */}
                {activeHotspots.map((spot, index) => {
                  const isActive = activeHotspot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHotspot(spot);
                      }}
                      style={{
                        left: `${spot.xPercent}%`,
                        top: `${spot.yPercent}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full font-mono text-xs font-semibold flex items-center justify-center border-2 transition-transform ${
                        isActive
                          ? 'bg-[#B45309] border-white text-white scale-110 shadow-lg'
                          : 'bg-[#141517]/85 border-white/75 text-white hover:scale-105'
                      }`}
                      aria-label={`Inspect ${spot.title}`}
                    >
                      0{index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Scrim & Helper Controls */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-4">
                <span className="text-xs text-[#E4E4E7]">
                  {mode === 'cockpit'
                    ? 'Drag horizontally to pan across cabin · Select numbered markers to inspect'
                    : 'Select numbered engineering markers on vehicle to inspect details'}
                </span>
                {mode === 'cockpit' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(1, Number((z - 0.12).toFixed(2))))}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-[#141517]/90 border border-white/15 text-white hover:bg-[#141517]"
                      aria-label="Zoom out cockpit"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.12).toFixed(2))))}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-[#141517]/90 border border-white/15 text-white hover:bg-[#141517]"
                      aria-label="Zoom in cockpit"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Engineering Inspection Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between p-6 bg-[#191B1F] border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-[#D97706] font-medium mb-1">
                    {activeHotspot.metric}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {activeHotspot.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#D4D4D8]">
                    {activeHotspot.description}
                  </p>
                </div>

                {/* Hotspot List */}
                <div className="space-y-2 border-t border-white/10 pt-5">
                  <p className="text-xs font-medium text-[#A1A1AA] mb-2">
                    Tour Inspection Points
                  </p>
                  {activeHotspots.map((spot, idx) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setActiveHotspot(spot)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                        activeHotspot.id === spot.id
                          ? 'bg-white/10 border-white/25 text-white'
                          : 'bg-transparent border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium truncate">
                        0{idx + 1}. {spot.title}
                      </span>
                      <span className="font-mono text-xs text-[#D4D4D8] shrink-0">
                        {spot.metric.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Telemetry Summary */}
              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-[#A1A1AA]">Output</p>
                  <p className="font-mono text-sm font-semibold text-white">
                    {vehicle.specs.horsepower} hp
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A1A1AA]">0–60 mph</p>
                  <p className="font-mono text-sm font-semibold text-white">
                    {vehicle.specs.zeroToSixty}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A1A1AA]">{vehicle.specs.rangeLabel}</p>
                  <p className="font-mono text-sm font-semibold text-white">
                    {vehicle.specs.rangeValue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#111214] border-t border-white/10">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-[#A1A1AA]">Starting MSRP</p>
              <p className="font-mono text-lg font-semibold text-white">
                {formatCurrency(vehicle.basePrice)}
              </p>
            </div>
            <div className="hidden sm:block pl-6 border-l border-white/10">
              <p className="text-xs text-[#A1A1AA]">Refundable Deposit</p>
              <p className="font-mono text-sm font-medium text-[#E4E4E7]">
                {formatCurrency(vehicle.depositAmount)} · {vehicle.deliveryEstimate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onBookLiveTour(vehicle)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              <Calendar className="h-4 w-4" />
              Schedule Live Concierge
            </button>
            <button
              type="button"
              onClick={() => onConfigureVehicle(vehicle, selectedColor)}
              className="px-5 py-2.5 rounded-lg bg-[#B45309] hover:bg-[#9A470A] text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              Configure & Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
