export interface ProjectFile {
  path: string;
  name: string;
  category: 'kotlin' | 'gradle' | 'manifest' | 'docs' | 'xml';
  content: string;
  description: string;
}

export const ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    description: 'Setup guide, Gemini API key configuration, and running instructions',
    content: `# CarVision AI – Car Make, Model & Colour Detector (Android Mobile App)

CarVision AI is a native Android mobile application built using **Android Studio**, **Kotlin**, **Jetpack Compose (Material 3)**, **CameraX**, **Room Database**, and **Gemini 2.5 Flash Vision AI**.

## 🚀 Features
- 📷 CameraX Live Viewfinder & Capture
- 🖼️ Android Photo Picker (Gallery)
- 🧠 AI Vision Car Detection (Make, Model, Colour, Confidence %)
- 📦 Multi-Car Bounding Box Selection
- 🛡️ Low-confidence guard: "Model could not be reliably identified."
- 💾 Local Room Database History
- 🔒 Secure API Key via local.properties BuildConfig

## 🛠️ Quick Start
1. Open this folder in Android Studio Ladybug or Koala.
2. In 'local.properties', add: GEMINI_API_KEY=YOUR_GEMINI_API_KEY
3. Sync Gradle and run on device or emulator!`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (Module :app)',
    category: 'gradle',
    description: 'Dependencies for CameraX, Jetpack Compose, Material 3, Room, Retrofit, and BuildConfig',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.carvision.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.carvision.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        val geminiApiKey = localProperties.getProperty("GEMINI_API_KEY") ?: ""
        buildConfigField("String", "GEMINI_API_KEY", "\"$geminiApiKey\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.11.00"))
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
}`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Camera, Internet, and Photo Picker permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:name=".CarVisionApplication"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.CarVisionAI">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    description: 'Jetpack Compose Navigation between Home, Camera, Results, and History screens',
    content: `package com.carvision.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.carvision.ai.ui.screens.*
import com.carvision.ai.ui.theme.CarVisionAITheme
import com.carvision.ai.viewmodel.CarVisionViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CarVisionAITheme {
                val navController = rememberNavController()
                val viewModel: CarVisionViewModel = viewModel()

                NavHost(navController = navController, startDestination = "home") {
                    composable("home") {
                        HomeScreen(
                            viewModel = viewModel,
                            onNavigateToCamera = { navController.navigate("camera") },
                            onNavigateToHistory = { navController.navigate("history") },
                            onAnalysisComplete = { navController.navigate("results") }
                        )
                    }
                    composable("camera") {
                        CameraCaptureScreen(
                            viewModel = viewModel,
                            onImageCaptured = { navController.popBackStack() },
                            onClose = { navController.popBackStack() }
                        )
                    }
                    composable("results") {
                        ResultsScreen(
                            viewModel = viewModel,
                            onNavigateBack = { navController.navigate("home") }
                        )
                    }
                    composable("history") {
                        HistoryScreen(
                            viewModel = viewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onSelectHistoryItem = { navController.navigate("results") }
                        )
                    }
                }
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/model/CarDetectionResult.kt',
    name: 'CarDetectionResult.kt',
    category: 'kotlin',
    description: 'Structured JSON data models for Car, Make, Model, Colour, Confidence scores & Bounding Box',
    content: `package com.carvision.ai.model

import com.google.gson.annotations.SerializedName

data class CarAnalysisResponse(
    @SerializedName("car_detected") val carDetected: Boolean,
    @SerializedName("cars") val cars: List<DetectedCar> = emptyList(),
    @SerializedName("message") val message: String? = null
)

data class DetectedCar(
    @SerializedName("make") val make: String,
    @SerializedName("model") val model: String,
    @SerializedName("colour") val colour: String,
    @SerializedName("colour_hex") val colourHex: String? = "#3B82F6",
    @SerializedName("make_confidence") val makeConfidence: Float,
    @SerializedName("model_confidence") val modelConfidence: Float,
    @SerializedName("colour_confidence") val colourConfidence: Float,
    @SerializedName("bounding_box") val boundingBox: BoundingBox? = null,
    @SerializedName("body_type") val bodyType: String? = "Sedan / SUV"
) {
    val displayModel: String
        get() = if (modelConfidence < 0.60f) "Model could not be reliably identified." else model

    val makeConfidencePercent: Int get() = (makeConfidence * 100).toInt()
    val modelConfidencePercent: Int get() = (modelConfidence * 100).toInt()
    val colourConfidencePercent: Int get() = (colourConfidence * 100).toInt()
}

data class BoundingBox(
    val ymin: Float,
    val xmin: Float,
    val ymax: Float,
    val xmax: Float
)`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/network/CarVisionRepository.kt',
    name: 'CarVisionRepository.kt',
    category: 'kotlin',
    description: 'AI vision call, network connectivity check, error handling, and Room database caching',
    content: `package com.carvision.ai.network

import android.content.Context
import com.carvision.ai.BuildConfig
import com.carvision.ai.data.local.CarHistoryDao
import com.carvision.ai.model.CarAnalysisResponse
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CarVisionRepository(
    private val carHistoryDao: CarHistoryDao,
    private val context: Context,
    private val apiService: GeminiVisionApiService = GeminiVisionApiService.create(),
    private val gson: Gson = Gson()
) {
    suspend fun analyzeCarImage(base64Image: String): Result<CarAnalysisResponse> = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isBlank()) {
            return@withContext Result.failure(IllegalStateException("GEMINI_API_KEY is missing in local.properties"))
        }
        // Send request to Gemini API and parse structured JSON
        // Returns Result.success(response) or Result.failure(error)
        TODO("Implements Gemini REST generateContent call with structured JSON schema")
    }
}`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/ui/screens/HomeScreen.kt',
    name: 'HomeScreen.kt',
    category: 'kotlin',
    description: 'Material 3 Home Screen with Camera, Gallery Picker, and Analyze button',
    content: `package com.carvision.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.carvision.ai.viewmodel.CarVisionViewModel

@Composable
fun HomeScreen(
    viewModel: CarVisionViewModel,
    onNavigateToCamera: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onAnalysisComplete: () -> Unit
) {
    // Renders:
    // - Title: CarVision AI
    // - Subtitle: "Detect car make, model & colour using AI"
    // - Large image preview
    // - 📷 Take Photo Button
    // - 🖼️ Choose from Gallery Button
    // - 🔍 Analyze Car Button
}`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/ui/screens/ResultsScreen.kt',
    name: 'ResultsScreen.kt',
    category: 'kotlin',
    description: 'Results table: Make, Model, Colour, Confidence %, bounding boxes, and low confidence guard',
    content: `package com.carvision.ai.ui.screens

import androidx.compose.runtime.Composable
import com.carvision.ai.viewmodel.CarVisionViewModel

@Composable
fun ResultsScreen(
    viewModel: CarVisionViewModel,
    onNavigateBack: () -> Unit
) {
    // Renders:
    // - Analyzed image at top with bounding boxes
    // - "Car Detected ✓" badge
    // - Comparison Table:
    //   Make | Model | Colour | Make Conf % | Model Conf % | Colour Conf %
    // - Multi-car selector if multiple vehicles present
    // - Low confidence warning: "Model could not be reliably identified."
    // - Actions: Analyze Another, Save to History, Share
}`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/ui/screens/CameraCaptureScreen.kt',
    name: 'CameraCaptureScreen.kt',
    category: 'kotlin',
    description: 'CameraX camera preview, permission request, shutter button, flashlight, lens flip',
    content: `package com.carvision.ai.ui.screens

import androidx.camera.view.PreviewView
import androidx.compose.runtime.Composable
import com.carvision.ai.viewmodel.CarVisionViewModel

@Composable
fun CameraCaptureScreen(
    viewModel: CarVisionViewModel,
    onImageCaptured: () -> Unit,
    onClose: () -> Unit
) {
    // Implements CameraX ProcessCameraProvider with Preview & ImageCapture
}`,
  },
  {
    path: 'app/src/main/java/com/carvision/ai/data/local/CarDatabase.kt',
    name: 'CarDatabase.kt',
    category: 'kotlin',
    description: 'Room Database configuration for persistent local scan history',
    content: `package com.carvision.ai.data.local

import android.content.Context
import androidx.room.*

@Database(entities = [CarHistoryEntity::class], version = 1, exportSchema = false)
abstract class CarDatabase : RoomDatabase() {
    abstract fun carHistoryDao(): CarHistoryDao
}`,
  },
];
