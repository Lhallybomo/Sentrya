// Nigeria states and cities data
export const NIGERIA_CENTER = [9.0820, 8.6753];

export const RIDE_CITIES = ["Lagos", "Abuja", "Port Harcourt"];

export const CITY_COORDS = {
  "Lagos": [6.5244, 3.3792],
  "Abuja": [9.0579, 7.4951],
  "Port Harcourt": [4.8156, 7.0498],
  "Kano": [12.0022, 8.5920],
  "Ibadan": [7.3775, 3.9470],
  "Kaduna": [10.5105, 7.4165],
  "Benin City": [6.3350, 5.6037],
  "Enugu": [6.4527, 7.5248],
  "Calabar": [4.9517, 8.3220],
  "Warri": [5.5167, 5.7500],
  "Owerri": [5.4836, 7.0333],
  "Jos": [9.8965, 8.8583],
  "Abeokuta": [7.1607, 3.3483],
  "Maiduguri": [11.8311, 13.1510],
  "Sokoto": [13.0622, 5.2339],
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const SEVERITY_COLORS = {
  safe: { bg: "bg-safe", text: "text-safe", hex: "#22c55e" },
  caution: { bg: "bg-caution", text: "text-caution", hex: "#eab308" },
  danger: { bg: "bg-danger", text: "text-danger", hex: "#ef4444" },
};

export const INCIDENT_TYPES = [
  "Accident", "Traffic", "Bad Road", "Security Threat",
  "Kidnapping", "Robbery", "Protest", "Flooding", "Fire", "Other"
];

export const TRANSPORT_MODES = [
  { id: "road", label: "Road", icon: "Car" },
  { id: "air", label: "Air", icon: "Plane" },
  { id: "train", label: "Train", icon: "Train" },
  { id: "sea", label: "Sea", icon: "Ship" },
];

export function isRideCity(cityName) {
  return RIDE_CITIES.some(c => 
    cityName?.toLowerCase().includes(c.toLowerCase())
  );
}

export function getSeverityLabel(severity) {
  const labels = {
    safe: "Safe",
    caution: "Travel with Caution",
    danger: "Not Safe to Travel"
  };
  return labels[severity] || "Unknown";
}