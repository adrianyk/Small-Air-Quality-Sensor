# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev "https://expo.dev") project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app "https://www.npmjs.com/package/create-expo-app"). This project uses [file-based routing](https://docs.expo.dev/router/introduction "https://docs.expo.dev/router/introduction").

## Get started

1. First make sure you have `node.js` installed. Visit their [website](https://nodejs.org/en "https://nodejs.org/en") and download the latest LTS (Long-Term Support) version. Run the installer to install `node.js` onto your laptop.

2. `cd` into this directory (`Mobile_App`), and run the following command to install dependencies:

   ```bash
   npm install
   ```

3. Install additional packages:

   - Styling & animation related packages:
      ```bash
      npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
      npm install @shopify/react-native-skia
      ```
   - Bluetooth related packages:
      ```bash
      npm install react-native-ble-plx @config-plugins/react-native-ble-plx
      ```
   - Android related packages:
      ```bash
      npm install expo-device react-native-base64
      ```
   - Packages for custom builds
      ```bash
      npm install eas-cli
      ```

4. Then run the following command in the directory `Mobile_App` to start the app:

   ```bash
   npx expo start
   ```

5. In the terminal output, you'll see different options to open the app:

   - [development build](https://docs.expo.dev/develop/development-builds/introduction/ "https://docs.expo.dev/develop/development-builds/introduction/")
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/ "https://docs.expo.dev/workflow/android-studio-emulator/")
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/ "https://docs.expo.dev/workflow/ios-simulator/")
   - [Expo Go](https://expo.dev/go "https://expo.dev/go")
      - A limited sandbox for trying out app development with Expo
      - _**Easiest and simplest method**_ to test the app, download the Expo Go app for free from Google Play (Android) or App Store (Apple)
      - [Having problems opening in Expo Go?](https://docs.expo.dev/get-started/start-developing/#having-problems "https://docs.expo.dev/get-started/start-developing/#having-problems")

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
