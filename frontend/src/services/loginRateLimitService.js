// services/loginRateLimitService.js - Handle login rate limiting and account lockout
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const STORAGE_KEYS = {
  FAILED_ATTEMPTS: 'loginFailedAttempts',
  LOCKOUT_TIME: 'loginLockoutTime',
  LAST_ATTEMPT_EMAIL: 'lastAttemptEmail',
};

/**
 * Check if account is currently locked out
 */
export const isAccountLocked = async (email) => {
  try {
    const lockoutTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LOCKOUT_TIME);
    const lastAttemptEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ATTEMPT_EMAIL);
    
    // If no lockout time or different email, not locked
    if (!lockoutTimeStr || lastAttemptEmail !== email) {
      return { locked: false, remainingTime: 0 };
    }
    
    const lockoutTime = parseInt(lockoutTimeStr);
    const currentTime = Date.now();
    
    // Check if lockout period has expired
    if (currentTime >= lockoutTime) {
      // Lockout expired, clear the lockout
      await clearLockout();
      return { locked: false, remainingTime: 0 };
    }
    
    // Still locked, return remaining time
    const remainingTime = lockoutTime - currentTime;
    return { locked: true, remainingTime };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    return { locked: false, remainingTime: 0 };
  }
};

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = async (email) => {
  try {
    const lastAttemptEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ATTEMPT_EMAIL);
    
    // If different email, reset counter
    if (lastAttemptEmail !== email) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ATTEMPT_EMAIL, email);
      await AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, '1');
      console.log(`🔐 First failed attempt for ${email}`);
      return { attempts: 1, locked: false };
    }
    
    // Same email, increment counter
    const attemptsStr = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    const attempts = parseInt(attemptsStr || '0') + 1;
    
    await AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, attempts.toString());
    
    console.log(`🔐 Failed attempt ${attempts}/${MAX_FAILED_ATTEMPTS} for ${email}`);
    
    // Check if we've reached the limit
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION;
      await AsyncStorage.setItem(STORAGE_KEYS.LOCKOUT_TIME, lockoutTime.toString());
      
      console.log(`🚫 Account locked for ${email} until ${new Date(lockoutTime).toLocaleString()}`);
      return { attempts, locked: true, lockoutTime };
    }
    
    return { attempts, locked: false };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return { attempts: 0, locked: false };
  }
};

/**
 * Clear failed attempts (on successful login)
 */
export const clearFailedAttempts = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOCKOUT_TIME);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_ATTEMPT_EMAIL);
    console.log('✅ Cleared failed login attempts');
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
};

/**
 * Clear lockout (when lockout period expires)
 */
export const clearLockout = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.LOCKOUT_TIME);
    console.log('🔓 Cleared account lockout');
  } catch (error) {
    console.error('Error clearing lockout:', error);
  }
};

/**
 * Get remaining failed attempts before lockout
 */
export const getRemainingAttempts = async (email) => {
  try {
    const lastAttemptEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ATTEMPT_EMAIL);
    
    if (lastAttemptEmail !== email) {
      return MAX_FAILED_ATTEMPTS;
    }
    
    const attemptsStr = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    const attempts = parseInt(attemptsStr || '0');
    
    return Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
  } catch (error) {
    console.error('Error getting remaining attempts:', error);
    return MAX_FAILED_ATTEMPTS;
  }
};

/**
 * Format remaining lockout time for display
 */
export const formatLockoutTime = (remainingTime) => {
  const minutes = Math.ceil(remainingTime / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${remainingMinutes}m`;
  }
};
