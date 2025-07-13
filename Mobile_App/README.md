# Get Started with our React Native Expo app!

# About
This is a React Native [Expo](https://expo.dev "https://expo.dev") project developed for Android devices, and has been "ejected" (`npx expo prebuild`) in order to develop BLE features needed for this app. 

# Steps to Follow

> [!IMPORTANT]  
> Requires a physical Android device going forward!

1. First make sure you have Node (`node.js`) installed. Visit their [website](https://nodejs.org/en "https://nodejs.org/en") and download the latest LTS (Long-Term Support) version. Run the installer to install `node.js` onto your laptop. 

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
> Troubleshooting:    
> If your system fails to detect your JDK, repeat Step 4 under "**System variables**" instead.

3. Install Android Studio. Follow the steps listed [here](https://reactnative.dev/docs/set-up-your-environment "https://reactnative.dev/docs/set-up-your-environment") under the section "Android development environment".

4. Go to **Google Cloud Console**, create an account, go to **Google Map Platforms** and get a Google Maps API key. Next, find the `AndroidManifest.xml` file under `Mobile_app/android/app/src/main`, and paste your API key in the field `android:value=""` for the entry `android:name="com.google.android.geo.API_KEY"`.

5. Open a terminal and `cd` into this directory (`Mobile_App`), and run the following command to install dependencies:
   ```bash
   npm install
   ```

6. Now, the fun stuff: 

   A. **First time setup (requires USB connection):**
      1. This setup requires a **physical Android device** to be connected to your laptop via USB. Follow **_steps 1 and 2 only_** [here](https://reactnative.dev/docs/running-on-device "https://reactnative.dev/docs/running-on-device") to set up your Android device. 
      2. Then, with your Android device connected to your laptop, in a terminal `cd` into the `Mobile_App` directory and run:
         ```bash
         npx expo run:android
         ```
      3. This should install a _custom development client_ app (you should now see a new app appearing on your phone) on your Android phone, and will start the app shortly. Note that it might take a while (10+ minutes). 
      4. You will also see a QR code generated in your terminal, more about how to use this later but note that it does NOT work with Expo Go (default app used to test Expo projects, but not used in this project as it doesn't support native modules/packages i.e. BLE).
      5. Do this setup everytime you add a new native package/module or modify any configuration in the `android` folder for the (custom dev client) app to register the changes. 
   
   B. **Later development (no USB needed anymore):**
      1. If you've done the first time setup before, you should now see a new app (the _custom dev client_ app) in your phone. 
      2. In a terminal, in the directory `Mobile_App`, run:
         ```bash
         npx expo start
         ```
      3. This should generate a QR code in your terminal. Open the custom dev client app and use it to scan the QR code, or scan it with your camera app, or input the dev server URL manually.
      4. The app should open after a while. 

> [!IMPORTANT] 
> Make sure your phone and laptop are connected to the same network!

> [!NOTE] 
> Troubleshooting: 
> If you run into any errors, try running `npx expo start --clear` instead. This clears build cache.
> If you're still having build errors, `cd` into the `Mobile_App` directory try running this series of commands:
> ```
> taskkill /F /IM java.exe /T
> taskkill /F /IM gradle* /T
> rd /s /q .gradle
> rd /s /q android\.gradle
> rd /s /q android\build
> rd /s /q android\app\build
> rd /s /q .expo
> rd /s /q node_modules
> npm install
> npx expo prebuild --clean
> npx expo run:android
> ```
> The last command requires a physical Android device connected to your laptop.

7. If you've made changes but the app doesn't refresh on your phone, hit `r` in the terminal on your laptop to reload.

---

# Further Troubleshooting

If you have issues when you're trying to pair with the sensor device but it's not appearing on your screen, try restarting your phone's Bluetooth, and if needed, reset the ESP32. 

# Happy developing!


