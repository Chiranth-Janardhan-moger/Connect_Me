// constants/routes.js
// Bangalore routes configuration

export const BANGALORE_STOPS = {
  1: {
    routeId: 1,
    routeName: "Route-1",
    stops: [
      { id: 1, name: "Yelahanka New Town", lat: 13.1007, lng: 77.5963, time: "06:00 AM" },
      { id: 2, name: "Yelahanka Old Town", lat: 13.0950, lng: 77.5940, time: "06:10 AM" },
      { id: 3, name: "Jakkur Cross", lat: 13.0850, lng: 77.5980, time: "06:20 AM" },
      { id: 4, name: "Hebbal Flyover", lat: 13.0358, lng: 77.5970, time: "06:35 AM" },
      { id: 5, name: "Mekhri Circle", lat: 13.0157, lng: 77.5850, time: "06:50 AM" },
      { id: 6, name: "Cubbon Park", lat: 12.9767, lng: 77.5923, time: "07:05 AM" },
      { id: 7, name: "MG Road", lat: 12.9716, lng: 77.5946, time: "07:15 AM" },
    ]
  },
  2: {
    routeId: 2,
    routeName: "Route-2", 
    stops: [
      { id: 1, name: "BMSIT College", lat: 13.133845, lng: 77.568760, time: "06:30 AM" },
      { id: 2, name: "Puttenahalli Cross", lat: 13.0920, lng: 77.6020, time: "06:40 AM" },
      { id: 3, name: "Kogilu Cross", lat: 13.0800, lng: 77.6100, time: "06:50 AM" },
      { id: 4, name: "Nagavara", lat: 13.0520, lng: 77.6150, time: "07:05 AM" },
      { id: 5, name: "Hennur Cross", lat: 13.0380, lng: 77.6380, time: "07:20 AM" },
      { id: 6, name: "Tin Factory", lat: 13.0280, lng: 77.6280, time: "07:30 AM" },
      { id: 7, name: "KR Puram", lat: 13.0100, lng: 77.6200, time: "07:45 AM" },
      { id: 8, name: "Whitefield", lat: 12.9700, lng: 77.7500, time: "08:00 AM" },
    ]
  },
};

export const DEFAULT_REGION = {
  latitude: 13.1007,
  longitude: 77.5963,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};