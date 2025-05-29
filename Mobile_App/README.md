# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev "https://expo.dev") project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app "https://www.npmjs.com/package/create-expo-app"). This project uses [file-based routing](https://docs.expo.dev/router/introduction "https://docs.expo.dev/router/introduction").

# Get started
> [!NOTE]  
> This app is developed for Android devices. 

## 1. Running the App with Expo Go / Basic Development Setup (Before Prebuild, Android/iOS)

Use this when testing basic app functionality before Bluetooth integration or native modules.

### Follow steps below:

1. First make sure you have Node (`node.js`) installed. Visit their [website](https://nodejs.org/en "https://nodejs.org/en") and download the latest LTS (Long-Term Support) version. Run the installer to install `node.js` onto your laptop. 

   > [!NOTE]  
   > If you have already installed Node on your system, make sure it is Node 18 or newer.

2. From the `main` branch, create a new git branch (if you haven't already). Make your changes in this branch and _don't push your changes to GitHub yet_ (pls i beg i dun wan any merge conflicts ;-;). 

3. Delete the `node_modules`, `android` and `ios` folders inside `Mobile_App` (if they exist). Then, open a terminal and `cd` into this directory (`Mobile_App`), and run the following command to install dependencies:

   ```bash
   npm install
   ```

4. Then run the following command in the directory `Mobile_App` to start the app:

   ```bash
   npx expo start
   ```

   > [!NOTE]  
   > If you run into any errors, try running `npx expo start --clear` instead

5. In the terminal output, you'll see different options to open the app:

   - [development build](https://docs.expo.dev/develop/development-builds/introduction/ "https://docs.expo.dev/develop/development-builds/introduction/")
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/ "https://docs.expo.dev/workflow/android-studio-emulator/")
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/ "https://docs.expo.dev/workflow/ios-simulator/")
   - [Expo Go](https://expo.dev/go "https://expo.dev/go") <- This is what you want (trust)
      - What it is: a limited sandbox for trying out app development with Expo
      - _**Easiest and simplest method**_ to test the app, works on **_both_** Android and Apple devices! (very convenient)
      - Download the Expo Go app for free from Google Play (Android) or App Store (Apple) and follow the instructions in your terminal. 
      - [Having problems opening in Expo Go?](https://docs.expo.dev/get-started/start-developing/#having-problems "https://docs.expo.dev/get-started/start-developing/#having-problems")

		> [!IMPORTANT] 
		> Make sure your phone and laptop are connected to the same network!

6. If you've made changes but the app doesn't refresh on your phone, hit `r` in the terminal on your laptop to reload.

## 2. Running the App in the Bare Workflow (After Prebuild, Android ONLY)

Use this after running npx expo prebuild, when working with Bluetooth or other native modules.

> [!IMPORTANT]  
> Requires a physical Android device from now on. 

### Follow the steps below:

1. Again, make sure you have Node (`node.js`) installed. See Step 1 [above](#1-running-the-app-with-expo-go--basic-development-setup-before-prebuild).

   > [!NOTE]  
   > If you have already installed Node on your system, make sure it is Node 18 or newer.

2. Install the Java SE Development Kit (JDK) from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17-windows "https://www.oracle.com/java/technologies/downloads/#java17-windows") or any other sources, if you haven't already. Then configure the path variable as follows:  
   1. Press **Windows Key**, search for "**Environment Variables**"
   2. Click "**Edit the system environment variables**"
   3. Click "**Environment Variables...**"
   4. Under **User variables** → Click **New**:
      - Variable name: `JAVA_HOME`
      - Variable value: full path to your JDK (the default path is something like `C:\Program Files\Java\jdk-17`)
   5. Under **System variables** → Find and select `Path` → Click **Edit**
   6. Add this new entry: `%JAVA_HOME%\bin`
   7. Restart your terminal (or VS Code). Run the command `echo %JAVA_HOME%` in a new terminal and you should see the path to your Java SDK. 
   8. Then try running `java -version` in the terminal and you should see something like `java version "17.0.x"`. 

   > [!NOTE]  
   > If you already have a JDK on your system, we recommend JDK17. You may encounter problems using higher JDK versions.  
      
   > [!NOTE]  
   > if (errors) {   
   >   do step 4 under "**System variables**" instead   
   > }

3. Install Android Studio. Follow the steps listed [here](https://reactnative.dev/docs/set-up-your-environment "https://reactnative.dev/docs/set-up-your-environment") under the section "Android development environment".

4. Switch to the `experiment/app-bluetooth` branch. From here, create a new git branch (if you haven't already). Make your changes in this branch and _don't push your changes to GitHub yet_ (again i beg i dun wan any merge conflicts ;-;). 

5. Open a terminal and `cd` into this directory (`Mobile_App`), and run the following command to install dependencies:

   ```bash
   npm install
   ```

6. Now, the fun stuff: 

   1. **First time setup (requires USB connection):**
      - This setup requires a physical **Android device** to be connected to your laptop via USB. Follow **_steps 1 and 2 only_** [here](https://reactnative.dev/docs/running-on-device "https://reactnative.dev/docs/running-on-device") to set up your Android device. 
      - Then, with your Android device connected to your laptop, in a terminal `cd` into the `Mobile_App` directory and run:
         ```bash
         npx expo run:android
         ```
      - This should install a custom development client app (custom "Expo Go") on your Android phone (over USB), and will start the app right away. 
      - You will also see a QR code generated in your terminal, but it does NOT work with Expo Go :( more about this later.
   
   2. **Later development (no USB needed anymore):**
      - If you've done the first time setup before, you should see a new app (custom dev client app) in your phone now. 
      - In a terminal, in the directory `Mobile_App`, run:
         ```bash
         npx expo start
         ```
      - This should generate a QR code in your terminal. Open the custom dev client app and use it to scan the QR code or input the dev server URL manually. 
      - The app should open after loading for a while. 

      > [!IMPORTANT] 
		> Make sure your phone and laptop are connected to the same network!

7. If you've made changes but the app doesn't refresh on your phone, hit `r` in the terminal on your laptop to reload.


## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
