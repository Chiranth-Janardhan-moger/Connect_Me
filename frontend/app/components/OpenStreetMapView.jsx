import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const OpenStreetMapView = ({ 
  initialRegion, 
  markers = [], 
  polyline = [], 
  onMapReady,
  style,
  mapRef
}) => {
  const webViewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapHTMLRef = useRef(null);
  
  const generateMapHTML = () => {
    if (mapHTMLRef.current) return mapHTMLRef.current;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>OpenStreetMap</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let markers = {};
    let polylineLayer = null;

    function initMap() {
      const region = ${JSON.stringify(initialRegion)};
      
      map = L.map('map', {
        zoomControl: true,
        attributionControl: false,  // Remove Leaflet/OSM attribution
      }).setView([region.latitude, region.longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',  // No attribution text
        maxZoom: 19,
      }).addTo(map);

      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    const createCustomIcon = (type) => {
      let html;
      
      if (type === 'start') {
        html = '<div style="width:14px;height:14px;border-radius:50%;background:#4CAF50;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>';
      } else if (type === 'end') {
        html = '<div style="width:14px;height:14px;border-radius:50%;background:#F44336;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>';
      } else if (type === 'middle') {
        html = '<div style="width:14px;height:14px;border-radius:50%;background:#2981f3;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>';
      } else if (type === 'bus') {
        html = '<div style="width:40px;height:40px;border-radius:50%;background:#2981f3;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4)">BUS</div>';
      } else if (type === 'student') {
        html = '<div style="width:50px;height:50px;border-radius:50%;background:rgba(66,133,244,0.2);display:flex;align-items:center;justify-content:center;border:1px solid rgba(66,133,244,0.3)"><div style="width:16px;height:16px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div></div>';
      } else {
        html = '<div style="width:14px;height:14px;border-radius:50%;background:#2981f3;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>';
      }

      return L.divIcon({
        html: html,
        className: 'custom-marker',
        iconSize: type === 'bus' ? [40, 40] : (type === 'student' ? [50, 50] : [14, 14]),
        iconAnchor: type === 'bus' ? [20, 20] : (type === 'student' ? [25, 25] : [7, 7]),
      });
    };

    function addMarker(id, lat, lng, type, title) {
      if (markers[id]) {
        // Smooth animated movement for student/bus markers
        const currentLatLng = markers[id].getLatLng();
        const newLatLng = L.latLng(lat, lng);
        
        if (id === 'student' || id === 'bus') {
          // Animate marker movement for smooth transitions
          const duration = 1000; // 1 second animation
          const startTime = Date.now();
          
          function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeProgress = progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const lat = currentLatLng.lat + (newLatLng.lat - currentLatLng.lat) * easeProgress;
            const lng = currentLatLng.lng + (newLatLng.lng - currentLatLng.lng) * easeProgress;
            
            markers[id].setLatLng([lat, lng]);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }
          
          animate();
          
          if (id === 'student') {
            console.log('📍 Animating student marker to:', lat, lng);
          }
        } else {
          // Static markers (stops) - no animation
          markers[id].setLatLng([lat, lng]);
        }
      } else {
        // Create new marker
        const icon = createCustomIcon(type);
        const marker = L.marker([lat, lng], { 
          icon: icon,
          bubblingMouseEvents: false
        }).addTo(map);
        
        if (title) {
          marker.bindPopup(title, {
            closeButton: true,
            autoClose: true,
            closeOnClick: false
          });
        }
        
        // Prevent marker click from propagating
        marker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
        });
        
        markers[id] = marker;
        if (id === 'student') {
          console.log('✨ Created NEW student marker:', lat, lng, 'Type:', type);
        }
      }
    }

    function removeMarker(id) {
      if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    }

    function addPolyline(coordinates) {
      if (polylineLayer) map.removeLayer(polylineLayer);
      if (coordinates.length < 2) return;

      polylineLayer = L.polyline(coordinates, {
        color: '#2981f3',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    }

    function animateToRegion(lat, lng) {
      map.flyTo([lat, lng], 14, { duration: 1 });
    }

    function handleMessage(data) {
      try {
        const message = JSON.parse(data);
        
        switch (message.type) {
          case 'addMarker':
            addMarker(message.id, message.lat, message.lng, message.markerType, message.title);
            break;
          case 'removeMarker':
            removeMarker(message.id);
            break;
          case 'addPolyline':
            addPolyline(message.coordinates);
            break;
          case 'animateToRegion':
            animateToRegion(message.lat, message.lng);
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    }

    document.addEventListener('message', (event) => handleMessage(event.data));
    window.addEventListener('message', (event) => handleMessage(event.data));

    window.onload = initMap;
  </script>
</body>
</html>
    `;
    
    mapHTMLRef.current = html;
    return html;
  };

  const sendMessage = (message) => {
    if (webViewRef.current && isMapReady) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setIsMapReady(true);
        if (onMapReady) onMapReady();
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const markersStringRef = useRef('');
  
  useEffect(() => {
    if (!isMapReady) return;

    // Create a stable string representation for comparison
    const markersString = JSON.stringify(markers.map(m => ({
      id: m.id,
      lat: m.coordinate?.latitude,
      lng: m.coordinate?.longitude,
      type: m.type
    })));
    
    // Only send if markers actually changed
    if (markersString === markersStringRef.current) {
      return; // No changes, don't send
    }
    
    console.log('🔄 Markers changed, updating map...');
    markersStringRef.current = markersString;

    // Send ALL markers every time - Leaflet will handle updates efficiently
    markers.forEach((marker, index) => {
      const coord = marker.coordinate;
      const lat = coord?.latitude ?? coord?.value?.latitude ?? coord?._value?.latitude;
      const lng = coord?.longitude ?? coord?.value?.longitude ?? coord?._value?.longitude;
      
      if (lat != null && lng != null) {
        const id = marker.id || `marker-${index}`;
        
        if (id === 'student') {
          console.log('🔵 Sending student marker:', lat, lng);
        }
        
        sendMessage({
          type: 'addMarker',
          id: id,
          lat: lat,
          lng: lng,
          markerType: marker.type || 'default',
          title: marker.title || ''
        });
      }
    });
  }, [markers, isMapReady]);

  const polylineInitializedRef = useRef(false);

  useEffect(() => {
    if (!isMapReady || polyline.length === 0) return;
    
    // Only draw polyline once (route stops don't change)
    if (polylineInitializedRef.current) return;
    polylineInitializedRef.current = true;

    const coordinates = polyline.map(point => [point.latitude, point.longitude]);
    sendMessage({
      type: 'addPolyline',
      coordinates: coordinates
    });
  }, [polyline, isMapReady]);

  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        animateToRegion: (region) => {
          sendMessage({
            type: 'animateToRegion',
            lat: region.latitude,
            lng: region.longitude,
          });
        },
      };
    }
  }, [isMapReady, mapRef]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2981f3ff" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default OpenStreetMapView;
