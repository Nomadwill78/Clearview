import { Stack } from 'expo-router';

// Note: no session-based redirect here. The index screen redirects signed-in
// users to the app itself, and onboarding lives in this group and must remain
// reachable for signed-in users who haven't completed their profile yet.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
