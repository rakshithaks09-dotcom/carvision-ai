# CarVision AI – Car Make, Model & Colour Detector (Android Mobile App)

CarVision AI is a production-grade native Android mobile application built using **Android Studio**, **Kotlin**, **Jetpack Compose (Material 3)**, **CameraX**, **Room Database**, and **Gemini 2.5 Flash Vision AI**.

---

## 🚀 Features

- **📷 CameraX Real-Time Capture**: High-performance camera preview with pinch-to-zoom, tap-to-focus, flashlight toggle, and front/back lens switching.
- **🖼️ Android Photo Picker**: Native, secure gallery picker contract (`ActivityResultContracts.PickVisualMedia`).
- **🧠 AI Vision Recognition**: Uses Gemini AI vision model to determine:
  - Car presence (`car_detected`: `true` / `false`)
  - **Make / Brand** (e.g. *Toyota, BMW, Hyundai, Honda, Porsche*)
  - **Model** (e.g. *Creta, Innova, 3 Series, Swift*)
  - **Colour** (e.g. *White, Black, Red, Blue, Guards Red, Obsidian Black*) with exact hex color codes
  - **Confidence percentages** for Make, Model, and Colour
- **📦 Multi-Car Bounding Boxes**: Detects multiple vehicles in street scenes with interactive touch bounding boxes.
- **🛡️ Uncertainty Guarding**: If confidence is too low (< 60%), the app does not invent a model and cleanly displays: `"Model could not be reliably identified."`
- **💾 Local History (Room DB)**: Automatically stores and organizes scan history with image thumbnails, color dots, timestamps, and confidence ratings.
- **🔒 Secure API Key Management**: Uses `local.properties` injection via Gradle `BuildConfig` — never hardcoding API secrets into the APK.

---

## 📁 Project Structure

```
CarVisionAI/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/
│   └── wrapper/
└── app/
    ├── build.gradle.kts
    └── src/
        └── main/
            ├── AndroidManifest.xml
            ├── java/com/carvision/ai/
            │   ├── CarVisionApplication.kt
            │   ├── MainActivity.kt
            │   ├── model/
            │   │   └── CarDetectionResult.kt
            │   ├── data/local/
            │   │   ├── CarDatabase.kt
            │   │   ├── CarHistoryDao.kt
            │   │   └── CarHistoryEntity.kt
            │   ├── network/
            │   │   ├── GeminiVisionApiService.kt
            │   │   └── CarVisionRepository.kt
            │   ├── ui/
            │   │   ├── components/
            │   │   │   ├── BoundingBoxOverlay.kt
            │   │   │   └── ConfidenceBar.kt
            │   │   ├── screens/
            │   │   │   ├── HomeScreen.kt
            │   │   │   ├── ResultsScreen.kt
            │   │   │   ├── HistoryScreen.kt
            │   │   │   └── CameraCaptureScreen.kt
            │   │   └── theme/
            │   │       ├── Color.kt
            │   │       ├── Theme.kt
            │   │       └── Type.kt
            │   ├── utils/
            │   │   └── ImageUtils.kt
            │   └── viewmodel/
            │       └── CarVisionViewModel.kt
            └── res/
                └── values/
                    └── strings.xml
```

---

## 🛠️ Step-by-Step Setup in Android Studio

### 1. Requirements
- **Android Studio Ladybug (2024.2+)** or **Android Studio Iguana/Koala**
- **JDK 17** (bundled with modern Android Studio)
- Android SDK 26 (Android 8.0) or higher (Target SDK: 35)

### 2. Configure Your Gemini API Key
To keep your API key secure and out of version control:
1. Open the root directory of the project in Android Studio.
2. Locate or create a file named `local.properties` in the project root directory.
3. Add your Gemini API key:
   ```properties
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
4. Click **Sync Project with Gradle Files** (elephant icon in toolbar).
5. The `app/build.gradle.kts` will automatically inject this into `BuildConfig.GEMINI_API_KEY`.

### 3. Run the App
1. Connect a physical Android device with USB debugging enabled OR launch an Android Virtual Device (AVD).
2. Select `app` in the run configurations dropdown.
3. Click the green **Run (▶)** button.
4. When prompted, grant **Camera** permission.

---

## 🔐 Production Security: Using a Backend Proxy
For public production apps on Google Play Store, it is recommended to route image recognition through your backend server rather than bundling a client key:
1. Deploy a small Node.js / Cloud Run service (like the included `/server.ts`).
2. Point `BACKEND_URL` in `local.properties` to your server.
3. The server validates user sessions and holds `GEMINI_API_KEY` securely in server environment variables.
