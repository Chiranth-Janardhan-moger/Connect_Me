// Predictive Tile Caching Service
// Learns user patterns and pre-caches frequently viewed map tiles

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CACHE_CONFIG } from '../config/keys';

const USAGE_HISTORY_KEY = STORAGE_KEYS.TILE_USAGE_HISTORY;
const TILE_CACHE_KEY = STORAGE_KEYS.TILE_CACHE;
const MAX_CACHE_SIZE = CACHE_CONFIG.MAX_TILE_CACHE_SIZE; // Store top 100 tiles
const BANGALORE_BOUNDS = {
  north: 13.1,
  south: 12.8,
  east: 77.8,
  west: 77.4
};

class TileCachingService {
  constructor() {
    this.tileFrequency = new Map();
    this.cachedTiles = new Set();
    this.initialized = false;
  }

  /**
   * Initialize cache from storage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const cached = await AsyncStorage.getItem(TILE_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        this.tileFrequency = new Map(Object.entries(data.frequency || {}));
        this.cachedTiles = new Set(data.cached || []);
        console.log(`📦 Loaded ${this.cachedTiles.size} cached tiles`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error loading tile cache:', error);
    }
  }

  /**
   * Record tile view
   */
  recordTileView(zoom, x, y) {
    const tileKey = `${zoom}/${x}/${y}`;
    const currentCount = this.tileFrequency.get(tileKey) || 0;
    this.tileFrequency.set(tileKey, currentCount + 1);
  }

  /**
   * Get tile URL
   */
  getTileUrl(zoom, x, y) {
    const servers = ['a', 'b', 'c'];
    const server = servers[Math.floor(Math.random() * servers.length)];
    return `https://${server}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  }

  /**
   * Get tiles for Bangalore area at given zoom
   */
  getBangaloreTiles(zoom) {
    const tiles = [];
    const n = Math.pow(2, zoom);
    
    const minX = Math.floor((BANGALORE_BOUNDS.west + 180) / 360 * n);
    const maxX = Math.floor((BANGALORE_BOUNDS.east + 180) / 360 * n);
    const minY = Math.floor((1 - Math.log(Math.tan(BANGALORE_BOUNDS.north * Math.PI / 180) + 1 / Math.cos(BANGALORE_BOUNDS.north * Math.PI / 180)) / Math.PI) / 2 * n);
    const maxY = Math.floor((1 - Math.log(Math.tan(BANGALORE_BOUNDS.south * Math.PI / 180) + 1 / Math.cos(BANGALORE_BOUNDS.south * Math.PI / 180)) / Math.PI) / 2 * n);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ zoom, x, y });
      }
    }

    return tiles;
  }

  /**
   * Get most frequently viewed tiles
   */
  getTopTiles(limit = MAX_CACHE_SIZE) {
    const sorted = Array.from(this.tileFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return sorted.map(([key]) => {
      const [zoom, x, y] = key.split('/').map(Number);
      return { zoom, x, y, url: this.getTileUrl(zoom, x, y) };
    });
  }

  /**
   * Predict next tiles based on current location
   */
  predictNextTiles(currentLat, currentLng, zoom = 13) {
    const tiles = [];
    const n = Math.pow(2, zoom);
    
    // Convert lat/lng to tile coordinates
    const x = Math.floor((currentLng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(currentLat * Math.PI / 180) + 1 / Math.cos(currentLat * Math.PI / 180)) / Math.PI) / 2 * n);

    // Get surrounding tiles (3x3 grid)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tileX = x + dx;
        const tileY = y + dy;
        if (tileX >= 0 && tileX < n && tileY >= 0 && tileY < n) {
          tiles.push({
            zoom,
            x: tileX,
            y: tileY,
            url: this.getTileUrl(zoom, tileX, tileY)
          });
        }
      }
    }

    return tiles;
  }

  /**
   * Preload tiles
   */
  async preloadTiles(tiles) {
    console.log(`🔄 Preloading ${tiles.length} tiles...`);
    
    const promises = tiles.map(tile => 
      fetch(tile.url)
        .then(() => {
          this.cachedTiles.add(`${tile.zoom}/${tile.x}/${tile.y}`);
          return true;
        })
        .catch(err => {
          console.warn(`Failed to cache tile ${tile.zoom}/${tile.x}/${tile.y}`);
          return false;
        })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`✅ Cached ${successful}/${tiles.length} tiles`);
    await this.saveCache();
    
    return successful;
  }

  /**
   * Save cache to storage
   */
  async saveCache() {
    try {
      const data = {
        frequency: Object.fromEntries(this.tileFrequency),
        cached: Array.from(this.cachedTiles),
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(TILE_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving tile cache:', error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.tileFrequency.clear();
    this.cachedTiles.clear();
    await AsyncStorage.removeItem(TILE_CACHE_KEY);
    console.log('🗑️ Tile cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalViews: Array.from(this.tileFrequency.values()).reduce((a, b) => a + b, 0),
      uniqueTiles: this.tileFrequency.size,
      cachedTiles: this.cachedTiles.size
    };
  }
}

export default new TileCachingService();
