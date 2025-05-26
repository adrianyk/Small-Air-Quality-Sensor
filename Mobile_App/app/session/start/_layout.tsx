import { Stack } from "expo-router"

export default function StartSessionLayout() {
  return (
    <Stack 
        screenOptions={{ headerShown: false, animation: "none" }} 
    />
  )
}