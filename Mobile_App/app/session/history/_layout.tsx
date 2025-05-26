import { Stack } from "expo-router"

export default function SessionHistoryLayout() {
  return (
    <Stack 
        screenOptions={{ headerShown: false, animation: "none" }} 
    />
  )
}