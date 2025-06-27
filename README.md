# Welcome to ParticuLog!

# About

This project was about having a portable small air quality sensor that is easy to use and carry around to measure and track polution levels in your area or on your commute, etc.

# Hardware

We built a sensor device equipped with a PM sensor, temperature and humidity sensor, as well as a GPS module, all connected to a central ESP32 microcontroller. The source code for the ESP32 can be found in the `Hardware/src` folder, named `main.cpp`. 

# Software 

We built a React Native Expo Android app with user authentication that communicates with and controls the sensor device to start/stop a session, collect data, upload data to cloud, and display data in a graph and a map view. We used Firebase as a BaaS in this project. The app communicates with the sensor device using Bluetooth Low Energy (BLE). 

Please head over [here](https://github.com/adrianyk/Small-Air-Quality-Sensor/tree/main/Mobile_App#welcome-to-your-expo-app- "https://github.com/adrianyk/Small-Air-Quality-Sensor/tree/main/Mobile_App#welcome-to-your-expo-app-") for more information on how to start running and developing the app. 
