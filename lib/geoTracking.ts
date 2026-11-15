import { Client } from '@/types';

export interface DistrictGeo {
  id: string;
  name: string;
  headquarters: string;
  center: [number, number]; // [x, y] in viewBox 0 0 460 760
  coordinates: [number, number]; // [lat, lng] for Leaflet Real Map
  path: string;
  aliases: string[];
}

export interface StateGeo {
  id: string;
  name: string;
  center: [number, number]; // [x, y] in viewBox 0 0 650 680
  coordinates: [number, number]; // [lat, lng] for Leaflet Real Map
  path: string;
  aliases: string[];
}

export const ALL_DISTRICT_OPTIONS = [
  // 14 Kerala Districts
  { label: 'Ernakulam (Kochi)', value: 'Ernakulam', region: 'Kerala' },
  { label: 'Kozhikode (Calicut)', value: 'Kozhikode', region: 'Kerala' },
  { label: 'Thiruvananthapuram (Trivandrum)', value: 'Thiruvananthapuram', region: 'Kerala' },
  { label: 'Thrissur', value: 'Thrissur', region: 'Kerala' },
  { label: 'Malappuram', value: 'Malappuram', region: 'Kerala' },
  { label: 'Palakkad', value: 'Palakkad', region: 'Kerala' },
  { label: 'Kannur', value: 'Kannur', region: 'Kerala' },
  { label: 'Kottayam', value: 'Kottayam', region: 'Kerala' },
  { label: 'Alappuzha (Alleppey)', value: 'Alappuzha', region: 'Kerala' },
  { label: 'Kollam (Quilon)', value: 'Kollam', region: 'Kerala' },
  { label: 'Idukki (Munnar)', value: 'Idukki', region: 'Kerala' },
  { label: 'Wayanad', value: 'Wayanad', region: 'Kerala' },
  { label: 'Pathanamthitta', value: 'Pathanamthitta', region: 'Kerala' },
  { label: 'Kasaragod', value: 'Kasaragod', region: 'Kerala' },

  // Out of state / Destination shoots
  { label: 'Bangalore / Karnataka', value: 'Karnataka', region: 'Other States' },
  { label: 'Coimbatore / Tamil Nadu', value: 'Tamil Nadu', region: 'Other States' },
  { label: 'Chennai / Tamil Nadu', value: 'Tamil Nadu', region: 'Other States' },
  { label: 'Mumbai / Maharashtra', value: 'Maharashtra', region: 'Other States' },
  { label: 'Goa (Destination)', value: 'Goa', region: 'Other States' },
  { label: 'Delhi / NCR', value: 'Delhi', region: 'Other States' },
  { label: 'Hyderabad / Telangana', value: 'Telangana', region: 'Other States' },
  { label: 'Other Location', value: 'Other', region: 'Other States' },
];

// 14 Kerala districts geographically ordered from North to South
export const KERALA_DISTRICTS: DistrictGeo[] = [
  {
    id: 'kasaragod',
    name: 'Kasaragod',
    headquarters: 'Kasaragod',
    center: [112, 52],
    coordinates: [12.5102, 74.9852],
    path: 'M 85 25 L 128 35 L 140 75 L 105 85 L 85 25 Z',
    aliases: ['kasaragod', 'kasargod', 'kanhangad', 'nileshwar', 'uppala', 'trikaripur', 'bekal'],
  },
  {
    id: 'kannur',
    name: 'Kannur',
    headquarters: 'Kannur',
    center: [135, 115],
    coordinates: [11.8745, 75.3704],
    path: 'M 105 85 L 140 75 L 175 110 L 145 155 L 115 135 L 105 85 Z',
    aliases: ['kannur', 'cannanore', 'thalassery', 'tellicherry', 'payyanur', 'taliparamba', 'mattannur', 'iritty', 'dharmadam'],
  },
  {
    id: 'wayanad',
    name: 'Wayanad',
    headquarters: 'Kalpetta',
    center: [198, 148],
    coordinates: [11.6854, 76.1320],
    path: 'M 175 110 L 230 115 L 245 170 L 195 185 L 145 155 L 175 110 Z',
    aliases: ['wayanad', 'kalpetta', 'sulthan bathery', 'bathery', 'mananthavady', 'vythiri', 'meppadi', 'amabalavayal'],
  },
  {
    id: 'kozhikode',
    name: 'Kozhikode',
    headquarters: 'Kozhikode (Calicut)',
    center: [152, 185],
    coordinates: [11.2588, 75.7804],
    path: 'M 115 135 L 145 155 L 195 185 L 175 235 L 135 210 L 115 135 Z',
    aliases: ['kozhikode', 'calicut', 'koyilandy', 'vadakara', 'feroke', 'balussery', 'ramanattukara', 'mavoor', 'koduvally'],
  },
  {
    id: 'malappuram',
    name: 'Malappuram',
    headquarters: 'Malappuram',
    center: [190, 252],
    coordinates: [11.0510, 76.0711],
    path: 'M 135 210 L 175 235 L 195 185 L 245 220 L 235 285 L 175 295 L 145 260 L 135 210 Z',
    aliases: ['malappuram', 'manjeri', 'tirur', 'perinthalmanna', 'kottakkal', 'nilambur', 'ponnani', 'kondotty', 'edappal', 'valanchery', 'tanur'],
  },
  {
    id: 'palakkad',
    name: 'Palakkad',
    headquarters: 'Palakkad',
    center: [285, 285],
    coordinates: [10.7867, 76.6548],
    path: 'M 245 220 L 325 245 L 340 315 L 285 345 L 235 285 L 245 220 Z',
    aliases: ['palakkad', 'palghat', 'ottapalam', 'chittur', 'mannarkkad', 'shornur', 'alathur', 'pattambi', 'cherpulassery', 'kollengode'],
  },
  {
    id: 'thrissur',
    name: 'Thrissur',
    headquarters: 'Thrissur',
    center: [215, 335],
    coordinates: [10.5276, 76.2144],
    path: 'M 145 260 L 175 295 L 235 285 L 285 345 L 255 385 L 195 380 L 165 325 L 145 260 Z',
    aliases: ['thrissur', 'trichur', 'guruvayur', 'chalakudy', 'irinjalakuda', 'kodungallur', 'kunnamkulam', 'vadakkanchery', 'mala', 'ollur'],
  },
  {
    id: 'ernakulam',
    name: 'Ernakulam',
    headquarters: 'Kochi (Cochin)',
    center: [220, 405],
    coordinates: [9.9816, 76.2999],
    path: 'M 165 325 L 195 380 L 255 385 L 275 440 L 210 445 L 180 395 L 165 325 Z',
    aliases: [
      'ernakulam', 'kochi', 'cochin', 'aluva', 'edappally', 'kakkanad',
      'tripunithura', 'angamaly', 'perumbavoor', 'muvattupuzha', 'kothamangalam',
      'kaloor', 'marine drive', 'fort kochi', 'mattancherry', 'vytilla',
      'bolgatty', 'kadavanthra', 'panampilly', 'chittoor'
    ],
  },
  {
    id: 'idukki',
    name: 'Idukki',
    headquarters: 'Painavu / Thodupuzha',
    center: [315, 442],
    coordinates: [9.8494, 76.9744],
    path: 'M 255 385 L 355 390 L 375 480 L 295 500 L 275 440 L 255 385 Z',
    aliases: ['idukki', 'munnar', 'thodupuzha', 'kattappana', 'nedumkandam', 'adimali', 'peermade', 'vagamon', 'kumily', 'marayoor'],
  },
  {
    id: 'kottayam',
    name: 'Kottayam',
    headquarters: 'Kottayam',
    center: [250, 480],
    coordinates: [9.5916, 76.5222],
    path: 'M 210 445 L 275 440 L 295 500 L 255 525 L 215 485 L 210 445 Z',
    aliases: ['kottayam', 'changanassery', 'changanacherry', 'pala', 'palai', 'vaikom', 'ettumanoor', 'kanjirappally', 'kumarakom', 'erattupetta'],
  },
  {
    id: 'alappuzha',
    name: 'Alappuzha',
    headquarters: 'Alappuzha (Alleppey)',
    center: [198, 470],
    coordinates: [9.4981, 76.3388],
    path: 'M 180 395 L 210 445 L 215 485 L 210 545 L 190 525 L 180 395 Z',
    aliases: ['alappuzha', 'alleppey', 'cherthala', 'kayamkulam', 'mavelikkara', 'haripad', 'ambalapuzha', 'mararikulam', 'kuttanad'],
  },
  {
    id: 'pathanamthitta',
    name: 'Pathanamthitta',
    headquarters: 'Pathanamthitta',
    center: [295, 545],
    coordinates: [9.2648, 76.7870],
    path: 'M 255 525 L 295 500 L 345 540 L 315 585 L 255 565 L 255 525 Z',
    aliases: ['pathanamthitta', 'thiruvalla', 'adoor', 'ranni', 'konni', 'kozhencherry', 'pandalam', 'sabarimala', 'mallappally'],
  },
  {
    id: 'kollam',
    name: 'Kollam',
    headquarters: 'Kollam (Quilon)',
    center: [255, 585],
    coordinates: [8.8932, 76.6141],
    path: 'M 210 545 L 255 565 L 315 585 L 295 635 L 225 615 L 210 545 Z',
    aliases: ['kollam', 'quilon', 'karunagappally', 'kottarakkara', 'punalur', 'paravur', 'chavara', 'anchal', 'kundara', 'munroe island'],
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    headquarters: 'Trivandrum',
    center: [280, 665],
    coordinates: [8.5241, 76.9366],
    path: 'M 225 615 L 295 635 L 335 680 L 295 725 L 245 685 L 225 615 Z',
    aliases: [
      'thiruvananthapuram', 'trivandrum', 'attingal', 'varkala', 'neyyattinkara',
      'kazhakkoottam', 'kovalam', 'technopark', 'poojappura', 'nedumangad', 'vizhinjam'
    ],
  },
];

// Major Indian States & Regions for India-wide Client Tracking
export const INDIA_STATES: StateGeo[] = [
  {
    id: 'kerala',
    name: 'Kerala',
    center: [180, 590],
    coordinates: [10.5, 76.2],
    path: 'M 175 560 L 195 570 L 185 625 L 165 595 Z',
    aliases: ['kerala', 'kl'],
  },
  {
    id: 'tamil_nadu',
    name: 'Tamil Nadu',
    center: [215, 575],
    coordinates: [11.0168, 76.9558],
    path: 'M 195 540 L 245 530 L 235 620 L 185 625 L 195 570 Z',
    aliases: ['tamil nadu', 'tamilnadu', 'tn', 'chennai', 'coimbatore', 'madurai', 'salem', 'trichy', 'tiruchirappalli', 'ooty', 'kanyakumari', 'tirunelveli', 'erode', 'vellore', 'thanjavur'],
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    center: [185, 495],
    coordinates: [12.9716, 77.5946],
    path: 'M 155 450 L 205 440 L 225 505 L 195 540 L 175 560 L 150 515 Z',
    aliases: ['karnataka', 'ka', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'mangalore', 'mangaluru', 'hubli', 'udupi', 'belgaum', 'belagavi', 'shimoga'],
  },
  {
    id: 'goa',
    name: 'Goa',
    center: [150, 498],
    coordinates: [15.2993, 74.1240],
    path: 'M 145 490 L 160 490 L 155 510 L 140 505 Z',
    aliases: ['goa', 'panaji', 'panjim', 'margao', 'calangute', 'candolim', 'vasco', 'mapusa', 'north goa', 'south goa'],
  },
  {
    id: 'andhra_pradesh',
    name: 'Andhra Pradesh',
    center: [260, 470],
    coordinates: [16.5062, 80.6480],
    path: 'M 225 440 L 290 410 L 305 460 L 260 520 L 225 505 Z',
    aliases: ['andhra pradesh', 'andhra', 'ap', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'tirupati', 'kurnool', 'nellore', 'rajahmundry'],
  },
  {
    id: 'telangana',
    name: 'Telangana',
    center: [250, 415],
    coordinates: [17.3850, 78.4867],
    path: 'M 215 395 L 270 385 L 285 430 L 225 440 Z',
    aliases: ['telangana', 'ts', 'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar'],
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    center: [195, 385],
    coordinates: [19.0760, 72.8777],
    path: 'M 130 350 L 245 340 L 265 385 L 215 395 L 155 450 L 130 400 Z',
    aliases: ['maharashtra', 'mh', 'mumbai', 'bombay', 'pune', 'nagpur', 'nashik', 'thane', 'navi mumbai', 'aurangabad', 'kolhapur', 'lonavala', 'alibaug'],
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    center: [110, 335],
    coordinates: [23.0225, 72.5714],
    path: 'M 60 300 L 135 290 L 155 350 L 105 380 L 60 330 Z',
    aliases: ['gujarat', 'gj', 'ahmedabad', 'surat', 'vadodara', 'baroda', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar'],
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    center: [150, 240],
    coordinates: [26.9124, 75.7873],
    path: 'M 95 195 L 185 185 L 210 265 L 145 290 L 95 240 Z',
    aliases: ['rajasthan', 'rj', 'jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'pushkar', 'kota', 'bikaner'],
  },
  {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh',
    center: [250, 305],
    coordinates: [22.9734, 78.6569],
    path: 'M 185 270 L 295 260 L 315 340 L 235 345 L 185 270 Z',
    aliases: ['madhya pradesh', 'mp', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'ujjain'],
  },
  {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    center: [280, 220],
    coordinates: [26.8467, 80.9462],
    path: 'M 210 185 L 335 180 L 350 250 L 250 260 L 210 185 Z',
    aliases: ['uttar pradesh', 'up', 'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj', 'allahabad', 'ayodhya'],
  },
  {
    id: 'delhi',
    name: 'Delhi / NCR',
    center: [212, 192],
    coordinates: [28.6139, 77.2090],
    path: 'M 205 185 L 220 185 L 220 200 L 205 200 Z',
    aliases: ['delhi', 'new delhi', 'ncr', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad'],
  },
  {
    id: 'punjab_haryana',
    name: 'Punjab & Haryana',
    center: [190, 165],
    coordinates: [30.7333, 76.7794],
    path: 'M 160 145 L 215 140 L 220 185 L 175 195 Z',
    aliases: ['punjab', 'pb', 'haryana', 'hr', 'chandigarh', 'amritsar', 'ludhiana', 'jalandhar'],
  },
  {
    id: 'jammu_kashmir_ladakh',
    name: 'J&K / Ladakh',
    center: [205, 100],
    coordinates: [34.0837, 74.7973],
    path: 'M 165 65 L 245 60 L 240 135 L 175 140 Z',
    aliases: ['jammu', 'kashmir', 'srinagar', 'ladakh', 'leh'],
  },
  {
    id: 'himachal_uttarakhand',
    name: 'Himachal & Uttarakhand',
    center: [245, 140],
    coordinates: [31.1048, 77.1734],
    path: 'M 215 110 L 275 110 L 265 170 L 215 140 Z',
    aliases: ['himachal', 'himachal pradesh', 'hp', 'shimla', 'manali', 'uttarakhand', 'uk', 'dehradun', 'rishikesh', 'haridwar'],
  },
  {
    id: 'bihar',
    name: 'Bihar',
    center: [370, 218],
    coordinates: [25.5941, 85.1376],
    path: 'M 335 190 L 405 190 L 400 245 L 345 245 Z',
    aliases: ['bihar', 'patna', 'gaya', 'muzaffarpur'],
  },
  {
    id: 'west_bengal',
    name: 'West Bengal',
    center: [410, 260],
    coordinates: [22.5726, 88.3639],
    path: 'M 395 210 L 425 210 L 430 315 L 395 305 L 390 250 Z',
    aliases: ['west bengal', 'wb', 'kolkata', 'calcutta', 'siliguri', 'darjeeling'],
  },
  {
    id: 'odisha',
    name: 'Odisha',
    center: [350, 350],
    coordinates: [20.2961, 85.8245],
    path: 'M 315 320 L 385 305 L 390 375 L 315 390 Z',
    aliases: ['odisha', 'orissa', 'bhubaneswar', 'puri', 'cuttack'],
  },
  {
    id: 'north_east',
    name: 'North-East',
    center: [480, 200],
    coordinates: [26.1445, 91.7362],
    path: 'M 435 165 L 530 160 L 525 240 L 440 230 Z',
    aliases: ['assam', 'guwahati', 'meghalaya', 'shillong', 'sikkim', 'gangtok', 'nagaland', 'manipur', 'mizoram', 'tripura', 'arunachal'],
  },
];

function normalizeLocationString(raw?: string): string {
  if (!raw) return '';
  return ' ' + raw.toLowerCase().replace(/[^a-z0-9]/g, ' ') + ' ';
}

/**
 * Matches a client's district or location to one of the 14 Kerala districts.
 */
export function matchClientToDistrict(
  clientOrLocation?: Client | string | null
): DistrictGeo | null {
  if (!clientOrLocation) return null;

  let districtField = '';
  let locationField = '';

  if (typeof clientOrLocation === 'object') {
    districtField = clientOrLocation.district || '';
    locationField = clientOrLocation.location || '';
  } else {
    locationField = clientOrLocation;
  }

  // 1. Direct match on explicit district field first
  if (districtField) {
    const normDistrict = normalizeLocationString(districtField);
    for (const district of KERALA_DISTRICTS) {
      if (
        normDistrict.includes(' ' + district.id + ' ') ||
        normDistrict.includes(' ' + district.name.toLowerCase() + ' ')
      ) {
        return district;
      }
      for (const alias of district.aliases) {
        if (normDistrict.includes(' ' + alias + ' ')) {
          return district;
        }
      }
    }
  }

  // 2. Match on manual location / venue text
  if (locationField) {
    const norm = normalizeLocationString(locationField);
    for (const district of KERALA_DISTRICTS) {
      if (norm.includes(' ' + district.id + ' ')) {
        return district;
      }
      for (const alias of district.aliases) {
        if (norm.includes(' ' + alias + ' ')) {
          return district;
        }
      }
    }
  }

  return null;
}

/**
 * Matches a client's location or district to an Indian state or region.
 */
export function matchClientToState(
  clientOrLocation?: Client | string | null
): StateGeo | null {
  if (!clientOrLocation) return null;

  let districtField = '';
  let locationField = '';

  if (typeof clientOrLocation === 'object') {
    districtField = clientOrLocation.district || '';
    locationField = clientOrLocation.location || '';
  } else {
    locationField = clientOrLocation;
  }

  // Check if it's in Kerala
  const keralaDistrict = matchClientToDistrict(clientOrLocation);
  if (keralaDistrict) {
    return INDIA_STATES.find((s) => s.id === 'kerala') || null;
  }

  const combined = normalizeLocationString(`${districtField} ${locationField}`);
  if (combined.includes(' kerala ') || combined.includes(' kl ')) {
    return INDIA_STATES.find((s) => s.id === 'kerala') || null;
  }

  // Check other states
  for (const state of INDIA_STATES) {
    if (combined.includes(' ' + state.id + ' ')) {
      return state;
    }
    for (const alias of state.aliases) {
      if (combined.includes(' ' + alias + ' ')) {
        return state;
      }
    }
  }

  return null;
}

export interface DistrictStat {
  district: DistrictGeo;
  clients: Client[];
  count: number;
  totalRevenue: number;
}

export interface StateStat {
  state: StateGeo;
  clients: Client[];
  count: number;
  totalRevenue: number;
}

/**
 * Groups clients into Kerala districts and calculates statistics.
 */
export function getKeralaDistrictStats(clients: Client[]): {
  districtStats: Record<string, DistrictStat>;
  totalKeralaClients: number;
  unassignedClients: Client[];
  topDistricts: DistrictStat[];
} {
  const stats: Record<string, DistrictStat> = {};
  for (const d of KERALA_DISTRICTS) {
    stats[d.id] = { district: d, clients: [], count: 0, totalRevenue: 0 };
  }

  const unassigned: Client[] = [];
  let totalKerala = 0;

  for (const client of clients) {
    const matched = matchClientToDistrict(client);
    if (matched) {
      stats[matched.id].clients.push(client);
      stats[matched.id].count += 1;
      stats[matched.id].totalRevenue += client.workPrice || 0;
      totalKerala += 1;
    } else {
      unassigned.push(client);
    }
  }

  const topDistricts = Object.values(stats)
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    districtStats: stats,
    totalKeralaClients: totalKerala,
    unassignedClients: unassigned,
    topDistricts,
  };
}

/**
 * Groups clients into Indian states.
 */
export function getIndiaStateStats(clients: Client[]): {
  stateStats: Record<string, StateStat>;
  totalTrackedClients: number;
  otherClients: Client[];
  topStates: StateStat[];
} {
  const stats: Record<string, StateStat> = {};
  for (const s of INDIA_STATES) {
    stats[s.id] = { state: s, clients: [], count: 0, totalRevenue: 0 };
  }

  const other: Client[] = [];
  let total = 0;

  for (const client of clients) {
    const matched = matchClientToState(client);
    if (matched) {
      stats[matched.id].clients.push(client);
      stats[matched.id].count += 1;
      stats[matched.id].totalRevenue += client.workPrice || 0;
      total += 1;
    } else {
      other.push(client);
    }
  }

  const topStates = Object.values(stats)
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    stateStats: stats,
    totalTrackedClients: total,
    otherClients: other,
    topStates,
  };
}

/**
 * Calculates GPS coordinates for a client based on their district or location.
 * Adds a small deterministic spiral offset so multiple clients in the same district don't overlap completely on the map.
 */
export function getClientCoordinates(client: Client, index: number = 0): [number, number] {
  const district = matchClientToDistrict(client);
  if (district) {
    if (index === 0) return district.coordinates;
    const angle = (index * 137.5 * Math.PI) / 180;
    const radius = 0.025 * Math.sqrt(index);
    return [
      district.coordinates[0] + radius * Math.sin(angle),
      district.coordinates[1] + radius * Math.cos(angle),
    ];
  }

  const state = matchClientToState(client);
  if (state) {
    if (index === 0) return state.coordinates;
    const angle = (index * 137.5 * Math.PI) / 180;
    const radius = 0.04 * Math.sqrt(index);
    return [
      state.coordinates[0] + radius * Math.sin(angle),
      state.coordinates[1] + radius * Math.cos(angle),
    ];
  }

  // Fallback to central Kerala coordinates
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.03 * Math.sqrt(index);
  return [10.45 + radius * Math.sin(angle), 76.25 + radius * Math.cos(angle)];
}
