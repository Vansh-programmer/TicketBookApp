export const INDIAN_LOCATION_OPTIONS = [
  {
    state: 'Maharashtra',
    cities: {
      Mumbai: [
        {
          name: 'PVR Maison, Jio World Drive',
          area: 'BKC',
          formats: ['Luxe', 'Dolby Atmos'],
          showtimes: ['10:00 AM', '1:20 PM', '4:40 PM', '8:05 PM', '11:20 PM'],
          seatPricing: { Luxe: 690, Prime: 430, Classic: 260 },
          experience: 'Luxury loungers and premium service',
        },
        {
          name: 'INOX Laserplex, Nariman Point',
          area: 'Nariman Point',
          formats: ['Laser', 'Insignia'],
          showtimes: ['9:45 AM', '12:50 PM', '4:10 PM', '7:30 PM', '10:55 PM'],
          seatPricing: { Luxe: 640, Prime: 390, Classic: 240 },
          experience: 'Business district favourite for evening premieres',
        },
      ],
      Pune: [
        {
          name: 'Cinepolis, Westend Mall',
          area: 'Aundh',
          formats: ['4K', 'Dolby 7.1'],
          showtimes: ['10:30 AM', '1:35 PM', '4:45 PM', '7:55 PM', '10:50 PM'],
          seatPricing: { Luxe: 520, Prime: 320, Classic: 210 },
          experience: 'Comfort seating and strong family audience',
        },
      ],
    },
  },
  {
    state: 'Delhi NCR',
    cities: {
      'New Delhi': [
        {
          name: "PVR Director's Cut, Ambience Mall",
          area: 'Vasant Kunj',
          formats: ['Director’s Cut', 'Dolby Atmos'],
          showtimes: ['10:15 AM', '1:30 PM', '4:45 PM', '8:00 PM', '11:10 PM'],
          seatPricing: { Luxe: 720, Prime: 440, Classic: 260 },
          experience: 'Flagship premium screen for big event films',
        },
        {
          name: 'Cinepolis, DLF Avenue',
          area: 'Saket',
          formats: ['Laser', 'VIP'],
          showtimes: ['9:55 AM', '1:05 PM', '4:20 PM', '7:40 PM', '10:45 PM'],
          seatPricing: { Luxe: 610, Prime: 370, Classic: 230 },
          experience: 'Sharp projection and reliable prime-time crowd',
        },
      ],
    },
  },
  {
    state: 'Karnataka',
    cities: {
      Bengaluru: [
        {
          name: 'PVR IMAX, Orion Mall',
          area: 'Rajajinagar',
          formats: ['IMAX', 'Dolby Atmos'],
          showtimes: ['10:20 AM', '1:40 PM', '5:00 PM', '8:20 PM', '11:30 PM'],
          seatPricing: { Luxe: 650, Prime: 410, Classic: 250 },
          experience: 'Big-screen destination for spectacle cinema',
        },
        {
          name: 'INOX, Garuda Mall',
          area: 'Magrath Road',
          formats: ['Laser', 'Recliner'],
          showtimes: ['10:05 AM', '1:15 PM', '4:25 PM', '7:35 PM', '10:40 PM'],
          seatPricing: { Luxe: 560, Prime: 360, Classic: 220 },
          experience: 'Central city multiplex with late-night shows',
        },
      ],
    },
  },
  {
    state: 'Telangana',
    cities: {
      Hyderabad: [
        {
          name: 'AMB Cinemas',
          area: 'Gachibowli',
          formats: ['Laser', 'Premium Recliner'],
          showtimes: ['10:10 AM', '1:25 PM', '4:35 PM', '7:50 PM', '11:05 PM'],
          seatPricing: { Luxe: 620, Prime: 400, Classic: 240 },
          experience: 'Fan-favourite luxury auditorium for Telugu releases',
        },
        {
          name: 'Prasads Multiplex',
          area: 'Necklace Road',
          formats: ['Large Screen', 'Dolby Atmos'],
          showtimes: ['9:50 AM', '1:00 PM', '4:15 PM', '7:25 PM', '10:50 PM'],
          seatPricing: { Luxe: 580, Prime: 350, Classic: 210 },
          experience: 'Iconic city venue for mass-market openings',
        },
      ],
    },
  },
  {
    state: 'Tamil Nadu',
    cities: {
      Chennai: [
        {
          name: 'SPI Palazzo',
          area: 'Vadapalani',
          formats: ['Luxe', 'Dolby Atmos'],
          showtimes: ['10:00 AM', '1:10 PM', '4:20 PM', '7:30 PM', '10:45 PM'],
          seatPricing: { Luxe: 590, Prime: 360, Classic: 220 },
          experience: 'Premium Chennai crowd and polished multiplex vibe',
        },
        {
          name: 'Sathyam Cinemas',
          area: 'Royapettah',
          formats: ['XL Screen', 'Atmos'],
          showtimes: ['10:25 AM', '1:35 PM', '4:40 PM', '7:55 PM', '11:00 PM'],
          seatPricing: { Luxe: 560, Prime: 340, Classic: 210 },
          experience: 'Classic city favourite with dependable programming',
        },
      ],
    },
  },
  {
    state: 'West Bengal',
    cities: {
      Kolkata: [
        {
          name: 'INOX, South City Mall',
          area: 'Jadavpur',
          formats: ['Laser', 'Insignia'],
          showtimes: ['10:30 AM', '1:40 PM', '4:50 PM', '8:00 PM', '11:05 PM'],
          seatPricing: { Luxe: 540, Prime: 330, Classic: 200 },
          experience: 'Busy premium multiplex with strong evening occupancy',
        },
      ],
    },
  },
];

const ROW_TIER_MAP = {
  A: 'Luxe',
  B: 'Luxe',
  C: 'Prime',
  D: 'Prime',
  E: 'Prime',
  F: 'Classic',
  G: 'Classic',
  H: 'Classic',
};

export const formatInr = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const getStateConfig = (selectedState, options = INDIAN_LOCATION_OPTIONS) =>
  options.find((location) => location.state === selectedState) || options[0];

export const getTheaterBySelection = ({ state, city, theaterName, options = INDIAN_LOCATION_OPTIONS }) =>
  getStateConfig(state, options).cities?.[city]?.find((theater) => theater.name === theaterName) || null;

export const getStartingPrice = (seatPricing = {}) => {
  const prices = Object.values(seatPricing)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return prices.length ? Math.min(...prices) : 0;
};

export const getSeatTier = (seatId) => ROW_TIER_MAP[seatId?.charAt(0)] || 'Classic';

export const calculateBookingPrice = (seats = [], seatPricing = {}) => {
  const items = seats.map((seatId) => {
    const tier = getSeatTier(seatId);
    const price = seatPricing[tier] || 0;

    return { seatId, tier, price };
  });

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return {
    items,
    total,
    formattedTotal: formatInr(total),
  };
};

export const getTierLegend = (seatPricing = {}) => [
  { tier: 'Luxe', rows: 'A-B', price: formatInr(seatPricing.Luxe) },
  { tier: 'Prime', rows: 'C-E', price: formatInr(seatPricing.Prime) },
  { tier: 'Classic', rows: 'F-H', price: formatInr(seatPricing.Classic) },
];
