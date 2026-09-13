import { messaging } from "./firebaseAdmin";

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
) {
  if (!tokens.length) {
    console.log("No FCM token found");
    return;
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
  });

  console.log(
    `Push notification sent: ${response.successCount} success, ${response.failureCount} failed`,
  );
}
