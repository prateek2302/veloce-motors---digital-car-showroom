export interface VehicleTrim {
  id: string;
  name: string;
  priceDelta: number;
  horsepower: number;
  zeroToSixty: string;
  rangeOrTopSpeed: string;
  drivetrain: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  priceDelta: number;
  metalness: number;
  roughness: number;
}

export interface InteriorOption {
  id: string;
  name: string;
  swatchHex: string;
  priceDelta: number;
}

export interface WheelOption {
  id: string;
  name: string;
  size: string;
  priceDelta: number;
}

export interface TourHotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  title: string;
  metric: string;
  description: string;
}

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  category: 'Grand Tourer' | 'Performance SUV' | 'Roadster' | 'Executive';
  bodyStyle: 'coupe' | 'suv' | 'roadster' | 'sedan' | 'wagon';
  powertrain: string;
  drivetrainSummary: string;
  tagline: string;
  description: string;
  basePrice: number;
  depositAmount: number;
  availability: 'In Showroom' | 'Build Slot Open';
  deliveryEstimate: string;
  imageUrl: string;
  heroImageUrl?: string;
  interiorImageUrl: string;
  specs: {
    horsepower: number;
    zeroToSixty: string;
    rangeLabel: string;
    rangeValue: string;
    torque: string;
    chargingOrFuel: string;
  };
  trims: VehicleTrim[];
  exteriorColors: ColorOption[];
  interiorFinishes: InteriorOption[];
  wheelPackages: WheelOption[];
  exteriorHotspots: TourHotspot[];
  interiorHotspots: TourHotspot[];
}

export const SHOWROOM_LOCATIONS = [
  'San Francisco Flagship',
  'New York SoHo Gallery',
  'Los Angeles Melrose Studio',
  'Zurich Bahnhofstrasse',
  'Tokyo Aoyama Atelier',
] as const;

export const CABIN_COCKPIT_IMAGE =
  '/src/assets/images/car_cabin_cockpit_1794844409068.jpg';

const SHARED_INTERIOR_HOTSPOTS: TourHotspot[] = [
  {
    id: 'oled-cluster',
    xPercent: 24,
    yPercent: 48,
    title: 'Curved OLED Driver Cockpit',
    metric: '16.4" 4K Display',
    description:
      'Optical-bonded anti-reflective glass instrument binnacle with real-time energy telemetry, navigation overlay, and night-vision mode.',
  },
  {
    id: 'nappa-seating',
    xPercent: 78,
    yPercent: 68,
    title: 'Aniline Nappa & Alcantara Seats',
    metric: '18-Way Heated & Ventilated',
    description:
      'Hand-stitched full-grain cognac leather bolsters paired with perforated Alcantara centers and integrated pneumatic side support.',
  },
  {
    id: 'center-console',
    xPercent: 52,
    yPercent: 63,
    title: 'Milled Aluminum Control Bridge',
    metric: 'Haptic Tactile Dial',
    description:
      'CNC-machined anodized aluminum drive selector and dual inductive cooling pads anchored by open-pore carbon weave trim.',
  },
  {
    id: 'glass-canopy',
    xPercent: 68,
    yPercent: 18,
    title: 'Electrochromic Acoustic Roof',
    metric: '99.4% UV Rejection',
    description:
      'Liquid-crystal laminated glass transitions instantaneously from crystal clear to privacy tint while isolating road resonance.',
  },
];

export const VEHICLES: Vehicle[] = [
  {
    id: 'aethera-gt',
    name: 'Aethera GT',
    year: 2026,
    category: 'Grand Tourer',
    bodyStyle: 'coupe',
    powertrain: 'Dual-Motor Electric',
    drivetrainSummary: 'Electric · AWD · 2026',
    tagline: 'Sculpted aerodynamic poise with 840 horsepower.',
    description:
      'Engineered on an 800-volt bonded aluminum architecture, the Aethera GT pairs grand-touring silence with effortless transcontinental range and carbon-ceramic stopping precision.',
    basePrice: 118500,
    depositAmount: 2500,
    availability: 'In Showroom',
    deliveryEstimate: '4–6 Weeks',
    imageUrl: '/src/assets/images/hero_showroom_flagship_1794844407434.jpg',
    heroImageUrl: '/src/assets/images/hero_showroom_flagship_1794844407434.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 840,
      zeroToSixty: '2.4s',
      rangeLabel: 'EPA Range',
      rangeValue: '480 mi',
      torque: '795 lb-ft',
      chargingOrFuel: '350 kW DC Fast Charge',
    },
    trims: [
      {
        id: 'gt-pure',
        name: 'Aethera GT Pure',
        priceDelta: 0,
        horsepower: 680,
        zeroToSixty: '2.9s',
        rangeOrTopSpeed: '450 mi',
        drivetrain: 'Dual-Motor AWD',
      },
      {
        id: 'gt-touring',
        name: 'Aethera GT Grand Touring',
        priceDelta: 14500,
        horsepower: 840,
        zeroToSixty: '2.4s',
        rangeOrTopSpeed: '480 mi',
        drivetrain: 'Dual-Motor Torque-Vectoring AWD',
      },
      {
        id: 'gt-apex',
        name: 'Aethera GT Apex Edition',
        priceDelta: 29000,
        horsepower: 960,
        zeroToSixty: '2.1s',
        rangeOrTopSpeed: '445 mi',
        drivetrain: 'Tri-Motor Carbon Chassis',
      },
    ],
    exteriorColors: [
      {
        id: 'obsidian-black',
        name: 'Obsidian Metallic',
        hex: '#191B1F',
        priceDelta: 0,
        metalness: 0.78,
        roughness: 0.22,
      },
      {
        id: 'titanium-silver',
        name: 'Liquid Titanium',
        hex: '#9BA2AA',
        priceDelta: 1800,
        metalness: 0.88,
        roughness: 0.18,
      },
      {
        id: 'british-emerald',
        name: 'Heritage Emerald',
        hex: '#1D4232',
        priceDelta: 2900,
        metalness: 0.72,
        roughness: 0.2,
      },
      {
        id: 'chalk-pearl',
        name: 'Limestone Chalk',
        hex: '#DED9CE',
        priceDelta: 2400,
        metalness: 0.4,
        roughness: 0.26,
      },
    ],
    interiorFinishes: [
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Charcoal Alcantara',
        swatchHex: '#8C5230',
        priceDelta: 0,
      },
      {
        id: 'obsidian-nappa',
        name: 'Obsidian Full-Grain Nappa',
        swatchHex: '#1F2024',
        priceDelta: 1600,
      },
      {
        id: 'stone-linen',
        name: 'Nordic Stone & Slate Wool',
        swatchHex: '#C8C2B8',
        priceDelta: 2200,
      },
    ],
    wheelPackages: [
      {
        id: 'aero-20',
        name: '20" Forged Aero Turbine',
        size: '20 inch',
        priceDelta: 0,
      },
      {
        id: 'carbon-21',
        name: '21" Split-Spoke Forged Bronze',
        size: '21 inch',
        priceDelta: 3400,
      },
    ],
    exteriorHotspots: [
      {
        id: 'matrix-optics',
        xPercent: 40,
        yPercent: 60,
        title: 'Matrix Micro-LED Optics',
        metric: '0.20 Cd Aero Profile',
        description:
          'Adaptive 1,024-zone high-definition headlights integrated seamlessly beneath a flush wind-tunnel hood lip.',
      },
      {
        id: 'forged-wheels',
        xPercent: 52,
        yPercent: 69,
        title: 'Carbon-Ceramic Braking System',
        metric: '420mm Front Rotors',
        description:
          'Lightweight 10-piston monoblock calipers housed inside forged multi-spoke wheels for fade-free deceleration.',
      },
      {
        id: 'fastback-roof',
        xPercent: 61,
        yPercent: 46,
        title: 'Continuous Glass Canopy',
        metric: 'Bonded Aluminum Unibody',
        description:
          'Flush acoustic glass architecture sweeps uninterrupted from windshield header to rear decklid.',
      },
      {
        id: 'rear-diffuser',
        xPercent: 74,
        yPercent: 60,
        title: 'Active Rear Aero Wing',
        metric: '260 lb Peak Downforce',
        description:
          'Speed-sensitive deployable spoiler balances highway efficiency with planted high-speed cornering.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
  {
    id: 'strada-coupe-s',
    name: 'Strada Coupe S',
    year: 2026,
    category: 'Grand Tourer',
    bodyStyle: 'coupe',
    powertrain: 'Dual-Motor Electric',
    drivetrainSummary: 'Electric · AWD · 2026',
    tagline: 'Pure fastback silhouette crafted for effortless speed.',
    description:
      'Featuring an ultra-low 0.197 drag coefficient and whisper-quiet dual-pane glazing, the Strada Coupe S turns continental highways into calm private lounges.',
    basePrice: 94900,
    depositAmount: 2500,
    availability: 'In Showroom',
    deliveryEstimate: '3–5 Weeks',
    imageUrl: '/src/assets/images/car_gt_coupe_1794844407331.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 670,
      zeroToSixty: '2.9s',
      rangeLabel: 'EPA Range',
      rangeValue: '435 mi',
      torque: '640 lb-ft',
      chargingOrFuel: '320 kW DC Fast Charge',
    },
    trims: [
      {
        id: 'strada-base',
        name: 'Strada Coupe S',
        priceDelta: 0,
        horsepower: 670,
        zeroToSixty: '2.9s',
        rangeOrTopSpeed: '435 mi',
        drivetrain: 'Dual-Motor AWD',
      },
      {
        id: 'strada-veloce',
        name: 'Strada Coupe S Veloce',
        priceDelta: 12000,
        horsepower: 790,
        zeroToSixty: '2.5s',
        rangeOrTopSpeed: '460 mi',
        drivetrain: 'Performance Torque-Vectoring AWD',
      },
    ],
    exteriorColors: [
      {
        id: 'liquid-silver',
        name: 'Liquid Silver',
        hex: '#A7AEB5',
        priceDelta: 0,
        metalness: 0.9,
        roughness: 0.16,
      },
      {
        id: 'slate-graphite',
        name: 'Satin Graphite',
        hex: '#43484F',
        priceDelta: 2200,
        metalness: 0.7,
        roughness: 0.34,
      },
      {
        id: 'deep-bronze',
        name: 'Champagne Bronze',
        hex: '#8C745B',
        priceDelta: 2400,
        metalness: 0.8,
        roughness: 0.22,
      },
    ],
    interiorFinishes: [
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Charcoal Alcantara',
        swatchHex: '#8C5230',
        priceDelta: 0,
      },
      {
        id: 'obsidian-nappa',
        name: 'Obsidian Full-Grain Nappa',
        swatchHex: '#1F2024',
        priceDelta: 1500,
      },
    ],
    wheelPackages: [
      {
        id: 'blade-20',
        name: '20" Machined Aero Blade',
        size: '20 inch',
        priceDelta: 0,
      },
      {
        id: 'forged-21',
        name: '21" Satin Anthracite Forged',
        size: '21 inch',
        priceDelta: 2800,
      },
    ],
    exteriorHotspots: [
      {
        id: 'lightbar',
        xPercent: 26,
        yPercent: 52,
        title: 'Full-Width Prism Light Blade',
        metric: 'Adaptive Cornering',
        description:
          'Micro-prism optical bar projects an ultra-even daylight beam without glare to oncoming traffic.',
      },
      {
        id: 'aero-curtain',
        xPercent: 45,
        yPercent: 64,
        title: 'Air-Curtain Wheel Chambers',
        metric: '0.197 Cd Drag Coefficient',
        description:
          'Channelled front bumper vents smooth airflow across the 20-inch machined aero wheels.',
      },
      {
        id: 'flush-handles',
        xPercent: 65,
        yPercent: 49,
        title: 'Flush Illuminated Door Blades',
        metric: 'Keyless UWB Proximity',
        description:
          'Ultra-wideband proximity sensors deploy flush anodized handles smoothly as you approach.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
  {
    id: 'korsa-atelier-suv',
    name: 'Korsa Atelier SUV',
    year: 2026,
    category: 'Performance SUV',
    bodyStyle: 'suv',
    powertrain: 'Tri-Motor Electric',
    drivetrainSummary: 'Electric · AWD · 2026',
    tagline: 'Commanding proportion meets adaptive air-suspension poise.',
    description:
      'Built for seven-day versatility without sacrificing sports-car chassis discipline, the Korsa Atelier SUV pairs active roll stabilization with cavernous quiet luxury.',
    basePrice: 106400,
    depositAmount: 2500,
    availability: 'In Showroom',
    deliveryEstimate: '4–6 Weeks',
    imageUrl: '/src/assets/images/car_performance_suv_1794844407101.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 760,
      zeroToSixty: '3.1s',
      rangeLabel: 'EPA Range',
      rangeValue: '395 mi',
      torque: '740 lb-ft',
      chargingOrFuel: '350 kW DC Fast Charge',
    },
    trims: [
      {
        id: 'korsa-awd',
        name: 'Korsa Atelier Dual-Motor',
        priceDelta: 0,
        horsepower: 620,
        zeroToSixty: '3.6s',
        rangeOrTopSpeed: '410 mi',
        drivetrain: 'Dual-Motor Air Suspension',
      },
      {
        id: 'korsa-tri',
        name: 'Korsa Atelier Tri-Motor S',
        priceDelta: 16500,
        horsepower: 760,
        zeroToSixty: '3.1s',
        rangeOrTopSpeed: '395 mi',
        drivetrain: 'Tri-Motor Active Torque AWD',
      },
    ],
    exteriorColors: [
      {
        id: 'satin-graphite',
        name: 'Satin Graphite Slate',
        hex: '#4A4E54',
        priceDelta: 0,
        metalness: 0.72,
        roughness: 0.35,
      },
      {
        id: 'obsidian-black',
        name: 'Obsidian Metallic',
        hex: '#191B1F',
        priceDelta: 1500,
        metalness: 0.8,
        roughness: 0.22,
      },
      {
        id: 'chalk-pearl',
        name: 'Limestone Chalk',
        hex: '#DED9CE',
        priceDelta: 2200,
        metalness: 0.42,
        roughness: 0.25,
      },
    ],
    interiorFinishes: [
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Charcoal Alcantara',
        swatchHex: '#8C5230',
        priceDelta: 0,
      },
      {
        id: 'stone-linen',
        name: 'Nordic Stone & Slate Wool',
        swatchHex: '#C8C2B8',
        priceDelta: 1900,
      },
    ],
    wheelPackages: [
      {
        id: 'korsa-22',
        name: '22" Satin Titanium Five-Spoke',
        size: '22 inch',
        priceDelta: 0,
      },
      {
        id: 'korsa-23',
        name: '23" Forged Monoblock Dark',
        size: '23 inch',
        priceDelta: 3600,
      },
    ],
    exteriorHotspots: [
      {
        id: 'quad-optics',
        xPercent: 64,
        yPercent: 48,
        title: 'Twin-Line Matrix Illumination',
        metric: 'Laser High-Beam Assist',
        description:
          'Signature twin horizontal light bars project 600 meters ahead while automatically masking traffic.',
      },
      {
        id: 'air-suspension',
        xPercent: 54,
        yPercent: 66,
        title: 'Dual-Chamber Air Chassis',
        metric: '95mm Ride Height Travel',
        description:
          'Continuously variable dampers adapt every millisecond between canyon agility and alpine clearance.',
      },
      {
        id: 'coupe-roofline',
        xPercent: 34,
        yPercent: 34,
        title: 'Tapered Fastback Tail',
        metric: '61 cu ft Cargo Volume',
        description:
          'Sloping architectural roofline maintains generous rear headroom and effortless hatchback utility.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
  {
    id: 'monza-v8-spyder',
    name: 'Monza V8 Spyder',
    year: 2026,
    category: 'Roadster',
    bodyStyle: 'roadster',
    powertrain: 'Twin-Turbo V8 Hybrid',
    drivetrainSummary: 'Hybrid · RWD · 2026',
    tagline: 'Open-air mechanical theatre with electrified instant torque.',
    description:
      'A hand-assembled 4.0-liter twin-turbocharged V8 augmented by an axial-flux electric motor delivers instantaneous throttle response and an unmistakable flat-plane crescendo.',
    basePrice: 164000,
    depositAmount: 5000,
    availability: 'Build Slot Open',
    deliveryEstimate: '8–10 Weeks',
    imageUrl: '/src/assets/images/car_track_roadster_1794844406760.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 810,
      zeroToSixty: '2.6s',
      rangeLabel: 'Top Track Speed',
      rangeValue: '205 mph',
      torque: '664 lb-ft',
      chargingOrFuel: '4.0L V8 + Axial E-Motor',
    },
    trims: [
      {
        id: 'monza-spyder',
        name: 'Monza V8 Spyder',
        priceDelta: 0,
        horsepower: 810,
        zeroToSixty: '2.6s',
        rangeOrTopSpeed: '205 mph',
        drivetrain: 'Rear-Drive E-Diff',
      },
      {
        id: 'monza-corsa',
        name: 'Monza V8 Spyder Corsa',
        priceDelta: 24500,
        horsepower: 865,
        zeroToSixty: '2.4s',
        rangeOrTopSpeed: '212 mph',
        drivetrain: 'Titanium Exhaust & Track Aero',
      },
    ],
    exteriorColors: [
      {
        id: 'racing-green',
        name: 'British Racing Emerald',
        hex: '#194530',
        priceDelta: 0,
        metalness: 0.74,
        roughness: 0.18,
      },
      {
        id: 'obsidian-black',
        name: 'Obsidian Metallic',
        hex: '#191B1F',
        priceDelta: 1800,
        metalness: 0.82,
        roughness: 0.2,
      },
      {
        id: 'titanium-silver',
        name: 'Liquid Titanium',
        hex: '#9BA2AA',
        priceDelta: 2100,
        metalness: 0.88,
        roughness: 0.16,
      },
    ],
    interiorFinishes: [
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Charcoal Alcantara',
        swatchHex: '#8C5230',
        priceDelta: 0,
      },
      {
        id: 'obsidian-nappa',
        name: 'Obsidian Carbon-Shell Buckets',
        swatchHex: '#1F2024',
        priceDelta: 3200,
      },
    ],
    wheelPackages: [
      {
        id: 'monza-21',
        name: '21" Forged Satin Gunmetal Y-Spoke',
        size: '21 inch',
        priceDelta: 0,
      },
      {
        id: 'monza-magnesium',
        name: '21" Center-Lock Magnesium',
        size: '21 inch',
        priceDelta: 6500,
      },
    ],
    exteriorHotspots: [
      {
        id: 'carbon-splitter',
        xPercent: 18,
        yPercent: 72,
        title: 'Exposed Carbon Front Splitter',
        metric: 'Autoclave Carbon Weave',
        description:
          'Functional ground-effect front wing channels high-pressure air directly across the flat undertray.',
      },
      {
        id: 'hood-louvers',
        xPercent: 32,
        yPercent: 48,
        title: 'Twin Thermal Extraction Louvers',
        metric: '4.0L Twin-Turbo V8',
        description:
          'Sculpted magnesium hood vents evacuate radiator heat while reducing front-axle lift at speed.',
      },
      {
        id: 'acoustic-softtop',
        xPercent: 60,
        yPercent: 36,
        title: '8-Layer Tailored Cabriolet Roof',
        metric: '14-Second Retraction',
        description:
          'Operates silently up to 31 mph, folding flat beneath an aluminum tonneau behind the headrests.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
  {
    id: 'luminos-ex-saloon',
    name: 'Luminos EX',
    year: 2026,
    category: 'Executive',
    bodyStyle: 'sedan',
    powertrain: 'Dual-Motor Electric',
    drivetrainSummary: 'Electric · AWD · 2026',
    tagline: 'Executive sanctuary with 510 miles of effortless range.',
    description:
      'Designed around rear-cabin serenity, the Luminos EX features active road-noise cancellation, rear-axle steering, and bespoke acoustic wool and leather craftsmanship.',
    basePrice: 129200,
    depositAmount: 2500,
    availability: 'In Showroom',
    deliveryEstimate: '4–6 Weeks',
    imageUrl: '/src/assets/images/car_executive_sedan_1794844407944.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 620,
      zeroToSixty: '3.4s',
      rangeLabel: 'EPA Range',
      rangeValue: '510 mi',
      torque: '615 lb-ft',
      chargingOrFuel: '350 kW DC Fast Charge',
    },
    trims: [
      {
        id: 'luminos-ex',
        name: 'Luminos EX Executive',
        priceDelta: 0,
        horsepower: 620,
        zeroToSixty: '3.4s',
        rangeOrTopSpeed: '510 mi',
        drivetrain: 'Dual-Motor Rear-Steer AWD',
      },
      {
        id: 'luminos-signature',
        name: 'Luminos EX Atelier Lounge',
        priceDelta: 19500,
        horsepower: 710,
        zeroToSixty: '3.0s',
        rangeOrTopSpeed: '495 mi',
        drivetrain: 'Executive Rear Lounge Package',
      },
    ],
    exteriorColors: [
      {
        id: 'chalk-pearl',
        name: 'Warm Limestone Pearl',
        hex: '#DFD9CE',
        priceDelta: 0,
        metalness: 0.45,
        roughness: 0.22,
      },
      {
        id: 'obsidian-black',
        name: 'Obsidian Metallic',
        hex: '#191B1F',
        priceDelta: 1800,
        metalness: 0.82,
        roughness: 0.2,
      },
      {
        id: 'liquid-silver',
        name: 'Liquid Titanium',
        hex: '#9BA2AA',
        priceDelta: 1800,
        metalness: 0.88,
        roughness: 0.16,
      },
    ],
    interiorFinishes: [
      {
        id: 'stone-linen',
        name: 'Nordic Stone & Slate Wool',
        swatchHex: '#C8C2B8',
        priceDelta: 0,
      },
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Charcoal Alcantara',
        swatchHex: '#8C5230',
        priceDelta: 1400,
      },
    ],
    wheelPackages: [
      {
        id: 'luminos-20',
        name: '20" Forged Multi-Spoke Diamond Cut',
        size: '20 inch',
        priceDelta: 0,
      },
      {
        id: 'luminos-21',
        name: '21" Acoustic Dish Forged',
        size: '21 inch',
        priceDelta: 2900,
      },
    ],
    exteriorHotspots: [
      {
        id: 'lidar-optics',
        xPercent: 72,
        yPercent: 48,
        title: 'Solid-State Lidar & Pixel LED',
        metric: 'Level 3 Highway Pilot Ready',
        description:
          'Discreetly recessed optical sensor suite provides 300-meter forward depth mapping in all weather.',
      },
      {
        id: 'rear-steer',
        xPercent: 20,
        yPercent: 62,
        title: 'Active Rear-Axle Steering',
        metric: '4.5° Counter-Steer',
        description:
          'Reduces urban turning circle to compact-hatchback agility while stabilizing high-speed lane changes.',
      },
      {
        id: 'acoustic-glazing',
        xPercent: 48,
        yPercent: 39,
        title: 'Double-Laminated Acoustic Glass',
        metric: '54 dBA Cabin Silence',
        description:
          'Active road-noise cancellation pairs with triple door seals for library-grade cabin tranquility.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
  {
    id: 'terra-shooting-brake',
    name: 'Terra Shooting Brake',
    year: 2026,
    category: 'Performance SUV',
    bodyStyle: 'wagon',
    powertrain: 'Dual-Motor Electric',
    drivetrainSummary: 'Electric · AWD · 2026',
    tagline: 'Tailored shooting-brake utility engineered for alpine roads.',
    description:
      'Merging estate practicality with long-travel adaptive dampers and an anodized aluminum skid architecture, the Terra Shooting Brake thrives far beyond paved city limits.',
    basePrice: 98600,
    depositAmount: 2500,
    availability: 'Build Slot Open',
    deliveryEstimate: '5–7 Weeks',
    imageUrl: '/src/assets/images/car_adventure_tourer_1794844408023.jpg',
    interiorImageUrl: CABIN_COCKPIT_IMAGE,
    specs: {
      horsepower: 690,
      zeroToSixty: '3.2s',
      rangeLabel: 'EPA Range',
      rangeValue: '420 mi',
      torque: '680 lb-ft',
      chargingOrFuel: '320 kW DC Fast Charge',
    },
    trims: [
      {
        id: 'terra-awd',
        name: 'Terra Cross Tourer',
        priceDelta: 0,
        horsepower: 690,
        zeroToSixty: '3.2s',
        rangeOrTopSpeed: '420 mi',
        drivetrain: 'Dual-Motor All-Terrain AWD',
      },
      {
        id: 'terra-expedition',
        name: 'Terra Alpine Spec',
        priceDelta: 11800,
        horsepower: 745,
        zeroToSixty: '2.9s',
        rangeOrTopSpeed: '405 mi',
        drivetrain: 'Torque-Vectoring + Underbody Armor',
      },
    ],
    exteriorColors: [
      {
        id: 'brushed-bronze',
        name: 'Brushed Sand Bronze',
        hex: '#8C745B',
        priceDelta: 0,
        metalness: 0.78,
        roughness: 0.28,
      },
      {
        id: 'british-emerald',
        name: 'Heritage Emerald',
        hex: '#1D4232',
        priceDelta: 2100,
        metalness: 0.72,
        roughness: 0.22,
      },
      {
        id: 'satin-graphite',
        name: 'Satin Graphite Slate',
        hex: '#4A4E54',
        priceDelta: 1800,
        metalness: 0.7,
        roughness: 0.34,
      },
    ],
    interiorFinishes: [
      {
        id: 'cognac-alcantara',
        name: 'Saddle Cognac & Weatherproof Weave',
        swatchHex: '#8C5230',
        priceDelta: 0,
      },
      {
        id: 'obsidian-nappa',
        name: 'Obsidian Full-Grain Nappa',
        swatchHex: '#1F2024',
        priceDelta: 1600,
      },
    ],
    wheelPackages: [
      {
        id: 'terra-20',
        name: '20" Satin Bronze All-Terrain Forged',
        size: '20 inch',
        priceDelta: 0,
      },
      {
        id: 'terra-21',
        name: '21" Forged Aero Touring',
        size: '21 inch',
        priceDelta: 2400,
      },
    ],
    exteriorHotspots: [
      {
        id: 'roof-rails',
        xPercent: 56,
        yPercent: 28,
        title: 'Integrated Milled Roof Rails',
        metric: '220 lb Dynamic Load',
        description:
          'Flush-machined anodized rails carry expedition boxes or ski racks with minimal wind whistle.',
      },
      {
        id: 'all-terrain-wheels',
        xPercent: 39,
        yPercent: 68,
        title: 'Reinforced All-Weather Forged Alloys',
        metric: '8.4" Max Ground Clearance',
        description:
          'Pair Michelin Pilot All-Season tires with liftable air springs for confident snow and gravel traction.',
      },
      {
        id: 'thor-optics',
        xPercent: 28,
        yPercent: 45,
        title: 'Precision Signature DRL Optics',
        metric: 'Heated Lens Washers',
        description:
          'High-output LED projectors include integrated thermal defrosting and high-pressure fluid jets.',
      },
    ],
    interiorHotspots: SHARED_INTERIOR_HOTSPOTS,
  },
];
