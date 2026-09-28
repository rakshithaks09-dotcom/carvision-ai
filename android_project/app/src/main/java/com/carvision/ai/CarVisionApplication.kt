package com.carvision.ai

import android.app.Application
import com.carvision.ai.data.local.CarDatabase
import com.carvision.ai.network.CarVisionRepository

/**
 * Application class for CarVision AI.
 * Initializes the Room database and repository singleton instances.
 */
class CarVisionApplication : Application() {

    // Lazy initialization of local database
    val database: CarDatabase by lazy { CarDatabase.getDatabase(this) }

    // Lazy initialization of repository
    val repository: CarVisionRepository by lazy {
        CarVisionRepository(
            carHistoryDao = database.carHistoryDao(),
            context = applicationContext
        )
    }

    override fun onCreate() {
        super.onCreate()
    }
}
