package com.carvision.ai.model

import com.google.gson.annotations.SerializedName

/**
 * Top-level response returned by the AI vision image analysis model.
 */
data class CarAnalysisResponse(
    @SerializedName("car_detected")
    val carDetected: Boolean,

    @SerializedName("cars")
    val cars: List<DetectedCar> = emptyList(),

    @SerializedName("message")
    val message: String? = null
)

/**
 * Detailed information for each detected motor vehicle in the image.
 */
data class DetectedCar(
    @SerializedName("make")
    val make: String,

    @SerializedName("model")
    val model: String,

    @SerializedName("colour")
    val colour: String,

    @SerializedName("colour_hex")
    val colourHex: String? = "#3B82F6",

    @SerializedName("make_confidence")
    val makeConfidence: Float, // e.g. 0.94f for 94%

    @SerializedName("model_confidence")
    val modelConfidence: Float, // e.g. 0.87f for 87%

    @SerializedName("colour_confidence")
    val colourConfidence: Float, // e.g. 0.98f for 98%

    @SerializedName("bounding_box")
    val boundingBox: BoundingBox? = null,

    @SerializedName("body_type")
    val bodyType: String? = "Sedan / SUV",

    @SerializedName("year_estimate")
    val yearEstimate: String? = null,

    @SerializedName("notes")
    val notes: String? = null
) {
    /**
     * Checks if the model could be reliably determined.
     * As per specification: If confidence is too low (< 60%), display:
     * "Model could not be reliably identified."
     */
    val displayModel: String
        get() = if (modelConfidence < 0.60f || model.contains("could not be reliably identified", ignoreCase = true)) {
            "Model could not be reliably identified."
        } else {
            model
        }

    val makeConfidencePercent: Int
        get() = (makeConfidence * 100).toInt().coerceIn(0, 100)

    val modelConfidencePercent: Int
        get() = (modelConfidence * 100).toInt().coerceIn(0, 100)

    val colourConfidencePercent: Int
        get() = (colourConfidence * 100).toInt().coerceIn(0, 100)
}

/**
 * Normalized bounding box coordinates (0 to 100 percentage values).
 */
data class BoundingBox(
    @SerializedName("ymin")
    val ymin: Float,

    @SerializedName("xmin")
    val xmin: Float,

    @SerializedName("ymax")
    val ymax: Float,

    @SerializedName("xmax")
    val xmax: Float
)
