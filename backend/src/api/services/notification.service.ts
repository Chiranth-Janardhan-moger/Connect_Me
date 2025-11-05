import * as admin from 'firebase-admin';
import User, { UserRole } from '../../models/user.model';
import path from 'path';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  // Check if service account file exists
  const serviceAccountPath = path.join(__dirname, '../../../firebase-service-account.json');
  
  // Try to initialize Firebase Admin
  if (!admin.apps.length) {
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (fileError) {
      console.warn('⚠️ Firebase service account file not found. Using environment variables...');
      
      // Try to initialize with environment variables
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized with environment variables');
      } else {
        console.error('❌ Firebase credentials not found. Notifications will not work.');
        console.error('Please provide either:');
        console.error('  1. firebase-service-account.json file in backend root, OR');
        console.error('  2. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      }
    }
  } else {
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

async function saveUserToken(userId: string, token: string) {
  await User.findByIdAndUpdate(userId, { fcmToken: token }, { new: true });
  console.log(`✅ FCM token saved for user: ${userId}`);
}

async function sendToRole(role: UserRole | 'driver' | 'student', payload: { title: string; body: string }) {
  if (!firebaseInitialized) {
    console.error('❌ Firebase not initialized. Cannot send notifications.');
    return { success: false, error: 'Firebase not initialized', sent: 0, failed: 0 };
  }

  try {
    // Get users with FCM tokens
    const users = await User.find({ role, fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
    const tokens = users.map((u: any) => u.fcmToken).filter((t: string) => t && t.length > 0);
    
    if (tokens.length === 0) {
      console.warn(`⚠️ No FCM tokens found for role: ${role}`);
      return { success: true, sent: 0, failed: 0, tokens: [] };
    }

    console.log(`📤 Sending notification to ${tokens.length} ${role}(s)...`);

    // Create FCM message
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default-channel',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send to all tokens (FCM supports up to 500 tokens per request)
    const batchSize = 500;
    let totalSent = 0;
    let totalFailed = 0;
    const results: any[] = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      try {
        const response = await admin.messaging().sendEachForMulticast({
          ...message,
          tokens: batch,
        });

        totalSent += response.successCount;
        totalFailed += response.failureCount;
        results.push(response);

        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${response.successCount} sent, ${response.failureCount} failed`);

        // Remove invalid tokens
        if (response.failureCount > 0) {
          const invalidTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const errorCode = resp.error.code;
              // Remove tokens that are invalid or unregistered
              if (
                errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered'
              ) {
                invalidTokens.push(batch[idx]);
              }
            }
          });

          // Remove invalid tokens from database
          if (invalidTokens.length > 0) {
            await User.updateMany(
              { fcmToken: { $in: invalidTokens } },
              { $unset: { fcmToken: '' } }
            );
            console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens from database`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending batch ${Math.floor(i / batchSize) + 1}:`, error);
        totalFailed += batch.length;
      }
    }

    console.log(`📊 Total: ${totalSent} sent, ${totalFailed} failed`);
    return { success: true, sent: totalSent, failed: totalFailed, tokens, results };
  } catch (error) {
    console.error('❌ Error in sendToRole:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', sent: 0, failed: 0 };
  }
}

export default { saveUserToken, sendToRole };


