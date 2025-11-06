import User, { UserRole } from '../../models/user.model';

/**
 * Save Expo Push Token for a user
 */
async function saveUserToken(userId: string, token: string) {
  const user = await User.findByIdAndUpdate(
    userId, 
    { expoPushToken: token }, 
    { new: true }
  ).select('name email role expoPushToken');
  
  if (user) {
    console.log(`✅ Expo Push Token saved for user: ${user.name} (${user.role}) - Token: ${token.substring(0, 30)}...`);
  } else {
    console.warn(`⚠️ User not found for ID: ${userId}`);
  }
  
  return user;
}

/**
 * Send push notification to users with a specific role using Expo Push Notifications
 */
async function sendToRole(role: UserRole | 'driver' | 'student' | 'admin', payload: { title: string; body: string }) {
  try {
    console.log(`🔔 Attempting to send notification to role: ${role}`);
    
    // Get users with Expo Push Tokens
    const users = await User.find({ role, expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken');
    const tokens = users.map((u: any) => u.expoPushToken).filter((t: string) => t && t.length > 0);
    
    console.log(`📊 Found ${users.length} users with role '${role}', ${tokens.length} have valid tokens`);
    
    if (tokens.length === 0) {
      console.warn(`⚠️ No Expo Push Tokens found for role: ${role}`);
      return { success: true, sent: 0, failed: 0, tokens: [] };
    }

    console.log(`📤 Sending notification to ${tokens.length} ${role}(s)...`);

    // Prepare messages for Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      priority: 'high',
      channelId: 'default',
    }));

    // Send to Expo Push Notification service (supports up to 100 messages per request)
    const batchSize = 100;
    let totalSent = 0;
    let totalFailed = 0;
    const results: any[] = [];
    const invalidTokens: string[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        const data: any = await response.json();
        results.push(data);

        // Process response
        if (data.data) {
          data.data.forEach((receipt: any, idx: number) => {
            if (receipt.status === 'ok') {
              totalSent++;
            } else {
              totalFailed++;
              console.warn(`❌ Failed to send to token: ${receipt.message}`);
              
              // Mark invalid tokens for removal
              if (receipt.details?.error === 'DeviceNotRegistered') {
                invalidTokens.push(batch[idx].to);
              }
            }
          });
        }

        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Processed`);
      } catch (error) {
        console.error(`❌ Error sending batch ${Math.floor(i / batchSize) + 1}:`, error);
        totalFailed += batch.length;
      }
    }

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      await User.updateMany(
        { expoPushToken: { $in: invalidTokens } },
        { $unset: { expoPushToken: '' } }
      );
      console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens from database`);
    }

    console.log(`📊 Total: ${totalSent} sent, ${totalFailed} failed`);
    return { success: true, sent: totalSent, failed: totalFailed, tokens, results };
  } catch (error) {
    console.error('❌ Error in sendToRole:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', sent: 0, failed: 0 };
  }
}

export default { saveUserToken, sendToRole };


