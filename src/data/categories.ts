import { CategoryDefinition } from '../types';

export const COMPLAINT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'roads-potholes',
    name: 'Roads & Potholes',
    shortDesc: 'Asphalt craters, damaged curbs, damaged traffic signals',
    iconName: 'Cone',
    color: '#ea580c', // Orange
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
  },
  {
    id: 'streetlights',
    name: 'Streetlights',
    shortDesc: 'Outages, flickering poles, broken fixtures, dark corridors',
    iconName: 'Lightbulb',
    color: '#ca8a04', // Amber
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
  },
  {
    id: 'waste-sanitation',
    name: 'Waste & Sanitation',
    shortDesc: 'Missed trash pickup, overflowing bins, illegal dumping',
    iconName: 'Trash2',
    color: '#e11d48', // Rose
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
  },
  {
    id: 'water-drainage',
    name: 'Water Supply & Drainage',
    shortDesc: 'Burst mains, clogged storm drains, standing floodwater',
    iconName: 'Droplets',
    color: '#0284c7', // Sky
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
  },
  {
    id: 'public-transport',
    name: 'Public Transport',
    shortDesc: 'Shelter glass damage, sign board failure, transit stops',
    iconName: 'Bus',
    color: '#4f46e5', // Indigo
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
  },
  {
    id: 'parks-spaces',
    name: 'Parks & Public Spaces',
    shortDesc: 'Broken playground gear, downed branches, untended greens',
    iconName: 'Trees',
    color: '#059669', // Emerald
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    id: 'noise',
    name: 'Noise Disturbances',
    shortDesc: 'Excessive construction noise, unpermitted loudspeakers',
    iconName: 'Volume2',
    color: '#9333ea', // Purple
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
  },
  {
    id: 'accessibility',
    name: 'Accessibility Obstacles',
    shortDesc: 'Blocked wheelchair ramps, missing tactile paving, curbs',
    iconName: 'Accessibility',
    color: '#0d9488', // Teal
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
  },
  {
    id: 'other',
    name: 'Other Issues',
    shortDesc: 'Graffiti, stray animals, general municipal maintenance',
    iconName: 'HelpCircle',
    color: '#64748b', // Slate
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  },
];

export const SUGGESTION_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'transport-mobility',
    name: 'Transport & Mobility',
    shortDesc: 'Protected bike lanes, crosswalk upgrades, micro-mobility hubs',
    iconName: 'Bike',
    color: '#2563eb', // Blue
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },
  {
    id: 'clean-energy',
    name: 'Clean Energy',
    shortDesc: 'Rooftop solar on civic buildings, EV chargers, heat pumps',
    iconName: 'SunMedium',
    color: '#d97706', // Amber
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
  },
  {
    id: 'waste-reduction',
    name: 'Waste Reduction',
    shortDesc: 'Community compost stations, water refill points, repair cafes',
    iconName: 'Recycle',
    color: '#16a34a', // Green
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    id: 'accessibility',
    name: 'Accessibility & Inclusivity',
    shortDesc: 'Auditory signals at crossings, sensory-friendly public spaces',
    iconName: 'Accessibility',
    color: '#0d9488', // Teal
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
  },
  {
    id: 'parks-spaces',
    name: 'Parks & Public Spaces',
    shortDesc: 'Pocket orchards, native wildflower meadows, dog park upgrades',
    iconName: 'Trees',
    color: '#059669', // Emerald
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    shortDesc: 'Well-lit pedestrian trails, safe school drop-off zones',
    iconName: 'ShieldCheck',
    color: '#7c3aed', // Violet
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
  },
  {
    id: 'other',
    name: 'Other Community Ideas',
    shortDesc: 'Public murals, neighborhood book sharing, cultural events',
    iconName: 'Sparkles',
    color: '#64748b', // Slate
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  },
];

export interface CityDistrict {
  id: string;
  name: string;
  ward: string;
  defaultLat: number;
  defaultLng: number;
  landmarks: string[];
}

export const CITY_DISTRICTS: CityDistrict[] = [
 {id:'chennai', name:'Chennai', ward:'Tamil Nadu',defaultLat:13.0827,defaultLng:80.2707,landmarks:['Chennai']},
 {id:'coimbatore',name:'Coimbatore',ward:'Tamil Nadu',defaultLat:11.0168,defaultLng:76.9558,landmarks:['Coimbatore']},
 {id:'madurai',name:'Madurai',ward:'Tamil Nadu',defaultLat:9.9252,defaultLng:78.1198,landmarks:['Madurai']},
 {id:'tiruchirappalli',name:'Tiruchirappalli',ward:'Tamil Nadu',defaultLat:10.7905,defaultLng:78.7047,landmarks:['Tiruchirappalli']},
 {id:'salem',name:'Salem',ward:'Tamil Nadu',defaultLat:11.6643,defaultLng:78.146,landmarks:['Salem']},
 {id:'tirunelveli',name:'Tirunelveli',ward:'Tamil Nadu',defaultLat:8.7139,defaultLng:77.7567,landmarks:['Tirunelveli']},
 {id:'other',name:'Other Tamil Nadu location',ward:'Tamil Nadu',defaultLat:11.1271,defaultLng:78.6569,landmarks:['Tamil Nadu']},
];
