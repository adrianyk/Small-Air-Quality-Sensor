import { Stack } from "expo-router"

export default function ActiveSessionLayout() {
  return (
    <Stack 
        screenOptions={{ headerShown: false, animation: "none" }} 
    />
  )
}