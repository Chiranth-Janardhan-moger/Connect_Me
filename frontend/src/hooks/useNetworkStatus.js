// hooks/useNetworkStatus.js - Network connectivity monitoring
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { showErrorAlert, showWarningAlert } from '../../app/components/CustomAlert';

let hasShownOfflineAlert = false;

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;
      
      console.log('🌐 Network Status:', {
        connected,
        reachable,
        type: state.type,
      });

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      // Show alert when going offline
      if (!connected || !reachable) {
        if (!hasShownOfflineAlert) {
          hasShownOfflineAlert = true;
          showErrorAlert(
            '📡 No Internet Connection',
            'You are currently offline. Location tracking may not work properly. Please check your internet connection.',
          );
        }
      } else {
        // Reset flag when back online
        if (hasShownOfflineAlert) {
          hasShownOfflineAlert = false;
          showWarningAlert(
            '✅ Back Online',
            'Internet connection restored. Location tracking is now active.',
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
  };
};
