// Progressive Map Loading Service
// Loads low-resolution tiles first, then progressively loads high-resolution

class ProgressiveMapLoader {
  constructor() {
    this.loadedTiles = new Set();
    this.loadingQueue = [];
    this.isLoading = false;
  }

  /**
   * Get tile URL for specific zoom level
   */
  getTileUrl(zoom, x, y, quality = 'high') {
    const servers = ['a', 'b', 'c'];
    const server = servers[Math.floor(Math.random() * servers.length)];
    
    // For low quality, use lower zoom level tiles (faster to load)
    const actualZoom = quality === 'low' ? Math.max(zoom - 2, 10) : zoom;
    
    return `https://${server}.tile.openstreetmap.org/${actualZoom}/${x}/${y}.png`;
  }

  /**
   * Calculate tile coordinates from lat/lng
   */
  latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y, zoom };
  }

  /**
   * Get visible tiles for current viewport
   */
  getVisibleTiles(center, zoom, viewportSize = { width: 400, height: 800 }) {
    const tiles = [];
    const centerTile = this.latLngToTile(center.latitude, center.longitude, zoom);
    
    // Calculate how many tiles are visible
    const tilesX = Math.ceil(viewportSize.width / 256) + 2;
    const tilesY = Math.ceil(viewportSize.height / 256) + 2;
    
    const startX = centerTile.x - Math.floor(tilesX / 2);
    const startY = centerTile.y - Math.floor(tilesY / 2);
    
    for (let x = startX; x < startX + tilesX; x++) {
      for (let y = startY; y < startY + tilesY; y++) {
        if (x >= 0 && y >= 0 && x < Math.pow(2, zoom) && y < Math.pow(2, zoom)) {
          tiles.push({ x, y, zoom });
        }
      }
    }
    
    return tiles;
  }

  /**
   * Preload tiles progressively (low-res first, then high-res)
   */
  async preloadTiles(center, zoom) {
    const tiles = this.getVisibleTiles(center, zoom);
    
    console.log(`🔄 Progressive loading ${tiles.length} tiles...`);
    
    // Phase 1: Load low-resolution tiles (fast)
    const lowResPromises = tiles.map(tile => 
      this.loadTile(tile.zoom, tile.x, tile.y, 'low')
    );
    
    await Promise.allSettled(lowResPromises);
    console.log('✅ Low-res tiles loaded');
    
    // Phase 2: Load high-resolution tiles (slower, but better quality)
    const highResPromises = tiles.map(tile => 
      this.loadTile(tile.zoom, tile.x, tile.y, 'high')
    );
    
    await Promise.allSettled(highResPromises);
    console.log('✅ High-res tiles loaded');
    
    return tiles.length;
  }

  /**
   * Load a single tile
   */
  async loadTile(zoom, x, y, quality = 'high') {
    const tileKey = `${zoom}/${x}/${y}/${quality}`;
    
    if (this.loadedTiles.has(tileKey)) {
      return true; // Already loaded
    }
    
    try {
      const url = this.getTileUrl(zoom, x, y, quality);
      const response = await fetch(url);
      
      if (response.ok) {
        this.loadedTiles.add(tileKey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn(`Failed to load tile ${tileKey}`);
      return false;
    }
  }

  /**
   * Preload tiles for a route path
   */
  async preloadRouteTiles(routePath, zoom = 13) {
    console.log(`🗺️ Preloading tiles for route with ${routePath.length} points`);
    
    const allTiles = new Set();
    
    // Get tiles for each point in the route
    routePath.forEach(point => {
      const tiles = this.getVisibleTiles(point, zoom, { width: 200, height: 200 });
      tiles.forEach(tile => {
        allTiles.add(`${tile.zoom}/${tile.x}/${tile.y}`);
      });
    });
    
    console.log(`📦 Total unique tiles to load: ${allTiles.size}`);
    
    // Load all tiles progressively
    const tileArray = Array.from(allTiles).map(key => {
      const [zoom, x, y] = key.split('/').map(Number);
      return { zoom, x, y };
    });
    
    // Load in batches to avoid overwhelming the network
    const batchSize = 10;
    let loaded = 0;
    
    for (let i = 0; i < tileArray.length; i += batchSize) {
      const batch = tileArray.slice(i, i + batchSize);
      
      // Load low-res first
      await Promise.allSettled(
        batch.map(tile => this.loadTile(tile.zoom, tile.x, tile.y, 'low'))
      );
      
      // Then high-res
      await Promise.allSettled(
        batch.map(tile => this.loadTile(tile.zoom, tile.x, tile.y, 'high'))
      );
      
      loaded += batch.length;
      console.log(`📊 Progress: ${loaded}/${tileArray.length} tiles loaded`);
    }
    
    console.log('✅ Route tiles preloaded');
    return allTiles.size;
  }

  /**
   * Clear tile cache
   */
  clearCache() {
    this.loadedTiles.clear();
    console.log('🗑️ Tile cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalTiles: this.loadedTiles.size,
      estimatedSize: this.loadedTiles.size * 15, // ~15KB per tile
    };
  }
}

export default new ProgressiveMapLoader();
