package com.carvision.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.carvision.ai.ui.screens.CameraCaptureScreen
import com.carvision.ai.ui.screens.HistoryScreen
import com.carvision.ai.ui.screens.HomeScreen
import com.carvision.ai.ui.screens.ResultsScreen
import com.carvision.ai.ui.theme.CarVisionAITheme
import com.carvision.ai.viewmodel.AnalysisUiState
import com.carvision.ai.viewmodel.CarVisionViewModel
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

/**
 * Main Activity hosting Jetpack Compose Navigation for CarVision AI.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            CarVisionAITheme {
                val navController = rememberNavController()
                val viewModel: CarVisionViewModel = viewModel()
                val uiState by viewModel.uiState.collectAsState()

                // Automatically navigate to Results when AI analysis completes
                LaunchedEffect(uiState) {
                    if (uiState is AnalysisUiState.Success ||
                        uiState is AnalysisUiState.NoCarDetected ||
                        uiState is AnalysisUiState.Error
                    ) {
                        navController.navigate("results")
                    }
                }

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
                            onImageCaptured = {
                                navController.popBackStack()
                            },
                            onClose = { navController.popBackStack() }
                        )
                    }

                    composable("results") {
                        ResultsScreen(
                            viewModel = viewModel,
                            onNavigateBack = {
                                viewModel.resetAnalysis()
                                navController.navigate("home") {
                                    popUpTo("home") { inclusive = true }
                                }
                            }
                        )
                    }

                    composable("history") {
                        HistoryScreen(
                            viewModel = viewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onSelectHistoryItem = { entity ->
                                // Optional: load item from history into results view
                                navController.navigate("results")
                            }
                        )
                    }
                }
            }
        }
    }
}
