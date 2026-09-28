package com.carvision.ai.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room database entity storing previously scanned vehicles.
 */
@Entity(tableName = "car_history")
data class CarHistoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val imagePath: String,
    val make: String,
    val model: String,
    val colour: String,
    val colourHex: String = "#3B82F6",
    val makeConfidence: Float,
    val modelConfidence: Float,
    val colourConfidence: Float,
    val bodyType: String = "",
    val fullJsonResponse: String = ""
)
