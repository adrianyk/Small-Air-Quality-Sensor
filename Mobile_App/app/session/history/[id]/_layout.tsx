import { Stack } from "expo-router"

export default function PastSessionLayout() {
  return (
    <Stack 
        screenOptions={{ headerShown: false, animation: "none" }} 
    />
  )
}