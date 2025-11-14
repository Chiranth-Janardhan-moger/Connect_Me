// Marker Clustering Service
// Groups nearby markers when zoomed out for better performance

class MarkerClusteringService {
  constructor() {
    this.clusters = [];
    this.markers = [];
    this.zoomLevel = 13;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Get clustering radius based on zoom level - Enhanced for performance
   */
  getClusterRadius(zoom) {
    // Optimized radius for better performance with large datasets
    if (zoom >= 16) return 30;   // 30m - street level (tighter clustering)
    if (zoom >= 14) return 75;   // 75m - neighborhood
    if (zoom >= 12) return 150;  // 150m - district
    if (zoom >= 10) return 300;  // 300m - area
    return 600;                  // 600m - city level (aggressive clustering)
  }

  /**
   * Cluster markers based on proximity - Optimized for 1000+ markers
   */
  clusterMarkers(markers, zoomLevel) {
    this.markers = markers;
    this.zoomLevel = zoomLevel;
    this.clusters = [];

    console.log(`🎯 Clustering ${markers.length} markers at zoom ${zoomLevel}`);
    const startTime = Date.now();

    // Don't cluster at high zoom levels or with few markers
    if (zoomLevel >= 15 || markers.length < 10) {
      return markers.map(m => ({
        type: 'single',
        marker: m,
        count: 1,
      }));
    }

    // Use spatial grid for performance with large datasets
    if (markers.length > 100) {
      return this.gridBasedClustering(markers, zoomLevel);
    }

    // Original algorithm for smaller datasets
    const radius = this.getClusterRadius(zoomLevel);
    const clustered = new Set();

    markers.forEach((marker, index) => {
      if (clustered.has(index)) return;

      const cluster = {
        type: 'cluster',
        markers: [marker],
        center: {
          latitude: marker.coordinate.latitude,
          longitude: marker.coordinate.longitude,
        },
        count: 1,
      };

      // Find nearby markers
      markers.forEach((otherMarker, otherIndex) => {
        if (index === otherIndex || clustered.has(otherIndex)) return;

        const distance = this.calculateDistance(
          marker.coordinate.latitude,
          marker.coordinate.longitude,
          otherMarker.coordinate.latitude,
          otherMarker.coordinate.longitude
        );

        if (distance <= radius) {
          cluster.markers.push(otherMarker);
          cluster.count++;
          clustered.add(otherIndex);

          // Recalculate center
          const sumLat = cluster.markers.reduce((sum, m) => sum + m.coordinate.latitude, 0);
          const sumLon = cluster.markers.reduce((sum, m) => sum + m.coordinate.longitude, 0);
          cluster.center = {
            latitude: sumLat / cluster.markers.length,
            longitude: sumLon / cluster.markers.length,
          };
        }
      });

      clustered.add(index);
      this.clusters.push(cluster);
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Clustered ${markers.length} → ${this.clusters.length} in ${duration}ms`);
    return this.clusters;
  }

  /**
   * Grid-based clustering for large datasets (1000+ markers)
   * O(n) complexity instead of O(n²)
   */
  gridBasedClustering(markers, zoomLevel) {
    const gridSize = this.getGridSize(zoomLevel);
    const grid = new Map();
    
    // Place markers in grid cells
    markers.forEach((marker, index) => {
      const cellX = Math.floor(marker.coordinate.latitude / gridSize);
      const cellY = Math.floor(marker.coordinate.longitude / gridSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!grid.has(cellKey)) {
        grid.set(cellKey, []);
      }
      grid.get(cellKey).push({ marker, index });
    });

    const clusters = [];
    
    // Create clusters from grid cells
    grid.forEach((cellMarkers, cellKey) => {
      if (cellMarkers.length === 1) {
        clusters.push({
          type: 'single',
          marker: cellMarkers[0].marker,
          count: 1,
        });
      } else {
        // Calculate cluster center
        const sumLat = cellMarkers.reduce((sum, m) => sum + m.marker.coordinate.latitude, 0);
        const sumLon = cellMarkers.reduce((sum, m) => sum + m.marker.coordinate.longitude, 0);
        
        clusters.push({
          type: 'cluster',
          markers: cellMarkers.map(m => m.marker),
          center: {
            latitude: sumLat / cellMarkers.length,
            longitude: sumLon / cellMarkers.length,
          },
          count: cellMarkers.length,
        });
      }
    });

    return clusters;
  }

  /**
   * Get grid size for spatial clustering
   */
  getGridSize(zoomLevel) {
    // Smaller grid cells at higher zoom levels
    if (zoomLevel >= 14) return 0.001;  // ~100m
    if (zoomLevel >= 12) return 0.002;  // ~200m
    if (zoomLevel >= 10) return 0.005;  // ~500m
    return 0.01;                        // ~1km
  }

  /**
   * Get cluster color based on count
   */
  getClusterColor(count) {
    if (count >= 10) return '#dc2626'; // Red - many markers
    if (count >= 5) return '#f59e0b';  // Orange - several markers
    return '#3b82f6';                   // Blue - few markers
  }

  /**
   * Generate cluster marker HTML
   */
  generateClusterHTML(count) {
    const color = this.getClusterColor(count);
    const size = Math.min(40 + (count * 2), 60); // Scale size with count

    return `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.min(12 + count, 18)}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
      ">
        ${count}
      </div>
    `;
  }

  /**
   * Check if should cluster at current zoom
   */
  shouldCluster(zoomLevel) {
    return zoomLevel < 15;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      totalMarkers: this.markers.length,
      totalClusters: this.clusters.length,
      reductionRatio: this.markers.length > 0 ? 
        `${((this.markers.length - this.clusters.length) / this.markers.length * 100).toFixed(1)}%` : '0%',
      algorithm: this.markers.length > 100 ? 'Grid-based O(n)' : 'Distance-based O(n²)',
      zoomLevel: this.zoomLevel,
    };
  }

  /**
   * Viewport-based marker filtering for extreme performance
   * Only process markers visible in current viewport
   */
  getViewportMarkers(markers, viewport) {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = viewport;
    
    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;
    
    return markers.filter(marker => {
      const lat = marker.coordinate.latitude;
      const lng = marker.coordinate.longitude;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }

  /**
   * Adaptive clustering based on marker density
   */
  adaptiveCluster(markers, zoomLevel, viewport) {
    // Filter to viewport first for performance
    const viewportMarkers = this.getViewportMarkers(markers, viewport);
    
    // Calculate marker density
    const area = viewport.latitudeDelta * viewport.longitudeDelta;
    const density = viewportMarkers.length / area;
    
    console.log(`📊 Marker density: ${density.toFixed(2)} markers/deg²`);
    
    // Adjust clustering aggressiveness based on density
    let effectiveZoom = zoomLevel;
    if (density > 1000) effectiveZoom -= 2; // More aggressive clustering
    else if (density > 500) effectiveZoom -= 1;
    
    return this.clusterMarkers(viewportMarkers, Math.max(effectiveZoom, 8));
  }
}

export default new MarkerClusteringService();
