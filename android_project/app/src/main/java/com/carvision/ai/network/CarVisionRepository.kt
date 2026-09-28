package com.carvision.ai.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.carvision.ai.BuildConfig
import com.carvision.ai.data.local.CarHistoryDao
import com.carvision.ai.data.local.CarHistoryEntity
import com.carvision.ai.model.BoundingBox
import com.carvision.ai.model.CarAnalysisResponse
import com.carvision.ai.model.DetectedCar
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.SocketTimeoutException

/**
 * Repository handling AI Car Detection, Network API communication,
 * and local Room database caching.
 */
class CarVisionRepository(
    private val carHistoryDao: CarHistoryDao,
    private val context: Context,
    private val apiService: GeminiVisionApiService = GeminiVisionApiService.create(),
    private val gson: Gson = Gson()
) {

    /**
     * Flow of all saved scan records for the History screen.
     */
    val allHistory: Flow<List<CarHistoryEntity>> = carHistoryDao.getAllHistory()

    /**
     * Checks if the device has an active internet connection.
     */
    fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Sends an image (Base64) to the AI vision model and parses the structured response.
     *
     * @param base64Image Clean Base64 image payload (without "data:image/jpeg;base64," prefix).
     * @param mimeType "image/jpeg" or "image/png"
     * @return Result containing CarAnalysisResponse or failure Exception.
     */
    suspend fun analyzeCarImage(
        base64Image: String,
        mimeType: String = "image/jpeg"
    ): Result<CarAnalysisResponse> = withContext(Dispatchers.IO) {
        // 1. Verify Internet Connection
        if (!isNetworkAvailable()) {
            return@withContext Result.failure(
                IOException("No internet connection detected. Please check your Wi-Fi or mobile data.")
            )
        }

        // 2. Verify API Key configuration
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isBlank()) {
            return@withContext Result.failure(
                IllegalStateException(
                    "GEMINI_API_KEY is not configured.\n" +
                    "Please add GEMINI_API_KEY=YOUR_KEY in your local.properties file and rebuild the project."
                )
            )
        }

        // 3. Construct structured prompt adhering to the CarVision AI specification
        val prompt = """
            You are CarVision AI, an expert computer vision model.
            Analyze this image to detect if any passenger motor vehicle (car, SUV, sedan, coupe, hatchback, truck, etc.) is visible.
            
            Return ONLY a valid JSON object matching this schema:
            {
              "car_detected": true/false,
              "message": "Optional message (e.g. 'No car detected. Please upload a clear image containing a car.')",
              "cars": [
                {
                  "make": "Toyota / BMW / Hyundai / Honda / etc.",
                  "model": "Innova / Creta / 3 Series / Swift / etc. (If confidence is low, output: 'Model could not be reliably identified.')",
                  "colour": "White / Black / Red / Blue / etc.",
                  "colour_hex": "#F5F5F7",
                  "make_confidence": 0.94,
                  "model_confidence": 0.87,
                  "colour_confidence": 0.98,
                  "bounding_box": { "ymin": 15, "xmin": 12, "ymax": 82, "xmax": 88 },
                  "body_type": "SUV / Sedan / Coupe / etc.",
                  "year_estimate": "2022-2024",
                  "notes": "Brief visual notes"
                }
              ]
            }
            
            STRICT RULES:
            - If no car is visible: "car_detected": false, "cars": [], "message": "No car detected. Please upload a clear image containing a car."
            - If multiple cars are visible, include all distinct cars in the "cars" array with bounding boxes (ymin, xmin, ymax, xmax in 0..100%).
            - If model cannot be identified with high confidence (< 60%), model must be "Model could not be reliably identified."
            - Identify dominant exterior paint colour and provide representative hex code.
        """.trimIndent()

        val request = GeminiVisionRequest(
            contents = listOf(
                Content(
                    parts = listOf(
                        Part(inlineData = InlineData(mimeType = mimeType, data = base64Image)),
                        Part(text = prompt)
                    )
                )
            )
        )

        try {
            val response = apiService.generateContent(apiKey = apiKey, request = request)

            if (!response.isSuccessful) {
                val errorCode = response.code()
                val errorBody = response.errorBody()?.string()
                return@withContext Result.failure(
                    IOException("AI Vision API returned error $errorCode: $errorBody")
                )
            }

            val responseBody = response.body()
            val textContent = responseBody?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text

            if (textContent.isNullOrBlank()) {
                return@withContext Result.failure(
                    IllegalStateException("AI Vision service returned an empty response.")
                )
            }

            // Clean markdown code fence if returned
            val cleanJson = textContent
                .replace("```json", "")
                .replace("```", "")
                .trim()

            val analysisResult = gson.fromJson(cleanJson, CarAnalysisResponse::class.java)
                ?: return@withContext Result.failure(
                    IllegalStateException("Failed to parse structured JSON from AI response.")
                )

            return@withContext Result.success(analysisResult)

        } catch (e: SocketTimeoutException) {
            return@withContext Result.failure(
                IOException("Connection timed out. Please try again with a smaller image or better network connection.")
            )
        } catch (e: Exception) {
            return@withContext Result.failure(e)
        }
    }

    /**
     * Saves a successful vehicle analysis to local Room database.
     */
    suspend fun saveScanToHistory(
        imagePath: String,
        car: DetectedCar,
        fullJson: String
    ): Long = withContext(Dispatchers.IO) {
        val entity = CarHistoryEntity(
            imagePath = imagePath,
            make = car.make,
            model = car.displayModel,
            colour = car.colour,
            colourHex = car.colourHex ?: "#3B82F6",
            makeConfidence = car.makeConfidence,
            modelConfidence = car.modelConfidence,
            colourConfidence = car.colourConfidence,
            bodyType = car.bodyType ?: "",
            fullJsonResponse = fullJson
        )
        carHistoryDao.insertRecord(entity)
    }

    suspend fun deleteScanFromHistory(recordId: Long) = withContext(Dispatchers.IO) {
        carHistoryDao.deleteById(recordId)
    }

    suspend fun clearAllHistory() = withContext(Dispatchers.IO) {
        carHistoryDao.clearAll()
    }
}
