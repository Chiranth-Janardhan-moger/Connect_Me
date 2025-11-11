// Location Data Anonymization with Differential Privacy
// Adds controlled noise to location data for privacy-preserving analytics

/**
 * Generate Laplace noise for differential privacy
 */
function generateLaplaceNoise(scale: number): number {
  // Generate random number from Laplace distribution
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Add differential privacy noise to coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @param epsilon - Privacy parameter (smaller = more privacy, more noise)
 * @returns Anonymized coordinates
 */
export function anonymizeLocation(
  lat: number,
  lon: number,
  epsilon: number = 0.1
): { lat: number; lon: number } {
  // Scale for Laplace mechanism (in meters)
  // Smaller epsilon = more noise = more privacy
  const scale = 10 / epsilon; // 10 meters base scale

  // Convert scale to degrees (approximate)
  const latScale = scale / 111000; // 1 degree ≈ 111km
  const lonScale = scale / (111000 * Math.cos(lat * Math.PI / 180));

  // Add Laplace noise
  const noisyLat = lat + generateLaplaceNoise(latScale);
  const noisyLon = lon + generateLaplaceNoise(lonScale);

  return {
    lat: noisyLat,
    lon: noisyLon,
  };
}

/**
 * Anonymize location with bounded noise (stays within radius)
 */
export function anonymizeLocationBounded(
  lat: number,
  lon: number,
  maxRadius: number = 50 // meters
): { lat: number; lon: number } {
  // Generate random angle
  const angle = Math.random() * 2 * Math.PI;
  
  // Generate random radius (uniform distribution)
  const radius = Math.sqrt(Math.random()) * maxRadius;

  // Convert to degrees
  const latOffset = (radius * Math.cos(angle)) / 111000;
  const lonOffset = (radius * Math.sin(angle)) / (111000 * Math.cos(lat * Math.PI / 180));

  return {
    lat: lat + latOffset,
    lon: lon + lonOffset,
  };
}

/**
 * Aggregate locations with k-anonymity
 * Groups locations into clusters to ensure k users per cluster
 */
export function kAnonymizeLocations(
  locations: Array<{ userId: string; lat: number; lon: number }>,
  k: number = 5
): Array<{ clusterLat: number; clusterLon: number; count: number }> {
  if (locations.length < k) {
    // Not enough data for k-anonymity
    return [];
  }

  const clusters: Array<{ clusterLat: number; clusterLon: number; count: number }> = [];
  const used = new Set<number>();

  for (let i = 0; i < locations.length; i++) {
    if (used.has(i)) continue;

    const cluster = [locations[i]];
    used.add(i);

    // Find k-1 nearest neighbors
    const distances = locations
      .map((loc, idx) => ({
        idx,
        distance: calculateDistance(
          locations[i].lat,
          locations[i].lon,
          loc.lat,
          loc.lon
        ),
      }))
      .filter(d => !used.has(d.idx))
      .sort((a, b) => a.distance - b.distance);

    for (let j = 0; j < Math.min(k - 1, distances.length); j++) {
      cluster.push(locations[distances[j].idx]);
      used.add(distances[j].idx);
    }

    if (cluster.length >= k) {
      // Calculate cluster center
      const avgLat = cluster.reduce((sum, loc) => sum + loc.lat, 0) / cluster.length;
      const avgLon = cluster.reduce((sum, loc) => sum + loc.lon, 0) / cluster.length;

      clusters.push({
        clusterLat: avgLat,
        clusterLon: avgLon,
        count: cluster.length,
      });
    }
  }

  return clusters;
}

/**
 * Calculate distance between two points (Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Hash user ID for anonymous analytics
 */
export function hashUserId(userId: string, salt: string = 'default-salt'): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(userId + salt).digest('hex');
}

/**
 * Create anonymized location record for analytics
 */
export function createAnonymousRecord(
  userId: string,
  lat: number,
  lon: number,
  routeNumber: number,
  timestamp: Date
) {
  const anonymized = anonymizeLocation(lat, lon);
  const hashedUserId = hashUserId(userId);

  return {
    userId: hashedUserId, // Hashed, not original
    lat: anonymized.lat,
    lon: anonymized.lon,
    routeNumber,
    timestamp,
    hour: timestamp.getHours(),
    dayOfWeek: timestamp.getDay(),
  };
}

export default {
  anonymizeLocation,
  anonymizeLocationBounded,
  kAnonymizeLocations,
  hashUserId,
  createAnonymousRecord,
};
