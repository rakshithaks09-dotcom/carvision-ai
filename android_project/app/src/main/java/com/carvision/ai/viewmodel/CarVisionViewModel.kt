package com.carvision.ai.viewmodel

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.carvision.ai.CarVisionApplication
import com.carvision.ai.data.local.CarHistoryEntity
import com.carvision.ai.model.CarAnalysisResponse
import com.carvision.ai.model.DetectedCar
import com.carvision.ai.network.CarVisionRepository
import com.carvision.ai.utils.ImageUtils
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * UI State for CarVision AI analysis.
 */
sealed interface AnalysisUiState {
    object Idle : AnalysisUiState
    object Loading : AnalysisUiState
    data class Success(val response: CarAnalysisResponse) : AnalysisUiState
    data class NoCarDetected(val message: String) : AnalysisUiState
    data class Error(val errorMessage: String) : AnalysisUiState
}

/**
 * Main ViewModel coordinating Image Capture, AI Analysis,
 * Multi-Car Selection, and Room Database History.
 */
class CarVisionViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: CarVisionRepository = (application as CarVisionApplication).repository
    private val gson = Gson()

    // Holds the currently loaded image (Uri or preview Bitmap)
    private val _selectedImageUri = MutableStateFlow<Uri?>(null)
    val selectedImageUri: StateFlow<Uri?> = _selectedImageUri.asStateFlow()

    private val _selectedBitmap = MutableStateFlow<Bitmap?>(null)
    val selectedBitmap: StateFlow<Bitmap?> = _selectedBitmap.asStateFlow()

    // Holds the AI analysis state
    private val _uiState = MutableStateFlow<AnalysisUiState>(AnalysisUiState.Idle)
    val uiState: StateFlow<AnalysisUiState> = _uiState.asStateFlow()

    // Selected car index when multiple cars are detected
    private val _selectedCarIndex = MutableStateFlow(0)
    val selectedCarIndex: StateFlow<Int> = _selectedCarIndex.asStateFlow()

    // State flag indicating if current scan has been saved to history
    private val _isSavedToHistory = MutableStateFlow(false)
    val isSavedToHistory: StateFlow<Boolean> = _isSavedToHistory.asStateFlow()

    // Local scan history Flow from Room
    val historyList: StateFlow<List<CarHistoryEntity>> = repository.allHistory
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun setImageUri(uri: Uri) {
        _selectedImageUri.value = uri
        _selectedBitmap.value = null
        _uiState.value = AnalysisUiState.Idle
        _isSavedToHistory.value = false
    }

    fun setBitmap(bitmap: Bitmap) {
        _selectedBitmap.value = bitmap
        _selectedImageUri.value = null
        _uiState.value = AnalysisUiState.Idle
        _isSavedToHistory.value = false
    }

    fun setSelectedCarIndex(index: Int) {
        _selectedCarIndex.value = index
    }

    /**
     * Triggers AI Analysis of the currently selected image.
     */
    fun analyzeCar() {
        val context = getApplication<Application>().applicationContext
        _uiState.value = AnalysisUiState.Loading

        viewModelScope.launch {
            // Convert current image to Base64
            val base64Data: String? = when {
                _selectedBitmap.value != null -> {
                    ImageUtils.bitmapToBase64(_selectedBitmap.value!!)
                }
                _selectedImageUri.value != null -> {
                    ImageUtils.uriToBase64(context, _selectedImageUri.value!!)
                }
                else -> null
            }

            if (base64Data.isNullOrBlank()) {
                _uiState.value = AnalysisUiState.Error(
                    "Invalid image: Please select an image from your gallery or take a photo first."
                )
                return@launch
            }

            // Call Repository
            val result = repository.analyzeCarImage(base64Image = base64Data)

            result.onSuccess { response ->
                if (!response.carDetected || response.cars.isEmpty()) {
                    _uiState.value = AnalysisUiState.NoCarDetected(
                        response.message ?: "No car detected. Please upload a clear image containing a car."
                    )
                } else {
                    _selectedCarIndex.value = 0
                    _uiState.value = AnalysisUiState.Success(response)
                }
            }.onFailure { exception ->
                _uiState.value = AnalysisUiState.Error(
                    exception.localizedMessage ?: "An unexpected error occurred during AI analysis."
                )
            }
        }
    }

    /**
     * Saves the current analysis to Room database.
     */
    fun saveCurrentToHistory() {
        val currentState = _uiState.value
        if (currentState !is AnalysisUiState.Success) return

        val cars = currentState.response.cars
        if (cars.isEmpty()) return

        val activeIndex = _selectedCarIndex.value.coerceIn(0, cars.size - 1)
        val selectedCar = cars[activeIndex]

        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            var savedPath = _selectedImageUri.value?.toString() ?: ""

            // If it's a bitmap from camera, save to internal cache file
            if (_selectedBitmap.value != null) {
                savedPath = ImageUtils.saveBitmapToInternalCache(context, _selectedBitmap.value!!)
            }

            val jsonString = gson.toJson(currentState.response)
            repository.saveScanToHistory(
                imagePath = savedPath,
                car = selectedCar,
                fullJson = jsonString
            )
            _isSavedToHistory.value = true
        }
    }

    fun deleteHistoryItem(id: Long) {
        viewModelScope.launch {
            repository.deleteScanFromHistory(id)
        }
    }

    fun clearAllHistory() {
        viewModelScope.launch {
            repository.clearAllHistory()
        }
    }

    fun resetAnalysis() {
        _uiState.value = AnalysisUiState.Idle
        _isSavedToHistory.value = false
    }
}
