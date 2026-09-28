package com.carvision.ai.ui.screens

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.carvision.ai.model.CarAnalysisResponse
import com.carvision.ai.model.DetectedCar
import com.carvision.ai.ui.components.BoundingBoxOverlay
import com.carvision.ai.ui.components.ConfidenceBar
import com.carvision.ai.ui.theme.AmberWarning
import com.carvision.ai.ui.theme.BluePrimary
import com.carvision.ai.ui.theme.GreenSuccess
import com.carvision.ai.ui.theme.RedAlert
import com.carvision.ai.viewmodel.AnalysisUiState
import com.carvision.ai.viewmodel.CarVisionViewModel

/**
 * Results Screen displaying the analyzed image, detection badge,
 * structured comparison table, multi-car selector, and confidence bars.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultsScreen(
    viewModel: CarVisionViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val selectedUri by viewModel.selectedImageUri.collectAsState()
    val selectedBitmap by viewModel.selectedBitmap.collectAsState()
    val selectedCarIndex by viewModel.selectedCarIndex.collectAsState()
    val isSaved by viewModel.isSavedToHistory.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Car Analysis Result", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is AnalysisUiState.Success -> {
                    SuccessResultContent(
                        response = state.response,
                        selectedCarIndex = selectedCarIndex,
                        onSelectCar = { viewModel.setSelectedCarIndex(it) },
                        selectedUri = selectedUri,
                        selectedBitmap = selectedBitmap,
                        isSaved = isSaved,
                        onSave = { viewModel.saveCurrentToHistory() },
                        onAnalyzeAnother = onNavigateBack,
                        onShare = { car ->
                            val shareText = """
                                🚘 CarVision AI Detection Result:
                                • Make: ${car.make} (${car.makeConfidencePercent}%)
                                • Model: ${car.displayModel} (${car.modelConfidencePercent}%)
                                • Colour: ${car.colour} (${car.colourConfidencePercent}%)
                                Detected using CarVision AI
                            """.trimIndent()
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, shareText)
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Share Car Result"))
                        }
                    )
                }

                is AnalysisUiState.NoCarDetected -> {
                    NoCarDetectedContent(
                        message = state.message,
                        selectedUri = selectedUri,
                        selectedBitmap = selectedBitmap,
                        onTryAgain = onNavigateBack
                    )
                }

                is AnalysisUiState.Error -> {
                    ErrorContent(
                        errorMessage = state.errorMessage,
                        onTryAgain = onNavigateBack
                    )
                }

                else -> {
                    // Fallback
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No analysis currently active.")
                    }
                }
            }
        }
    }
}

@Composable
private fun SuccessResultContent(
    response: CarAnalysisResponse,
    selectedCarIndex: Int,
    onSelectCar: (Int) -> Unit,
    selectedUri: Uri?,
    selectedBitmap: Bitmap?,
    isSaved: Boolean,
    onSave: () -> Unit,
    onAnalyzeAnother: () -> Unit,
    onShare: (DetectedCar) -> Unit
) {
    val cars = response.cars
    val safeIndex = selectedCarIndex.coerceIn(0, cars.size - 1)
    val car = cars.getOrNull(safeIndex) ?: cars.first()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // 1. Analyzed Image with Bounding Boxes
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(20.dp)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                if (selectedBitmap != null) {
                    Image(
                        bitmap = selectedBitmap.asImageBitmap(),
                        contentDescription = "Analyzed car",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else if (selectedUri != null) {
                    AsyncImage(
                        model = selectedUri,
                        contentDescription = "Analyzed car",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                // Interactive Bounding Box Overlay for multiple cars
                BoundingBoxOverlay(
                    cars = cars,
                    selectedIndex = safeIndex,
                    onSelectCar = onSelectCar,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // Multi-car selection chips if more than 1 car detected
        if (cars.size > 1) {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                cars.forEachIndexed { index, detectedCar ->
                    val isSelected = index == safeIndex
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSelected) BluePrimary else MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { onSelectCar(index) }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "Car ${index + 1}: ${detectedCar.make}",
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // 2. Detection Badge: "Car Detected ✓"
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(GreenSuccess.copy(alpha = 0.12f))
                .border(1.dp, GreenSuccess.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                .padding(vertical = 12.dp, horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = GreenSuccess,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Car Detected ✓",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = GreenSuccess
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 3. Structured Results Table (As specified by prompt)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                // Table Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Property",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "Result",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }

                Divider(color = MaterialTheme.colorScheme.outlineVariant)

                // Row: Make
                TableRowItem(
                    property = "Make",
                    result = car.make,
                    isHighlight = true
                )

                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Row: Model (With low confidence guard)
                val isModelLowConfidence = car.modelConfidence < 0.60f
                TableRowItem(
                    property = "Model",
                    result = car.displayModel,
                    isWarning = isModelLowConfidence,
                    isHighlight = !isModelLowConfidence
                )

                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Row: Colour
                TableRowItem(
                    property = "Colour",
                    result = car.colour,
                    colorSwatchHex = car.colourHex
                )

                Divider(color = MaterialTheme.colorScheme.outlineVariant)

                // Confidence Rows
                TableRowItem(
                    property = "Make Confidence",
                    result = "${car.makeConfidencePercent}%"
                )

                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                TableRowItem(
                    property = "Model Confidence",
                    result = "${car.modelConfidencePercent}%"
                )

                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                TableRowItem(
                    property = "Colour Confidence",
                    result = "${car.colourConfidencePercent}%"
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Confidence Visual Bars Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "AI Confidence Breakdown",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(10.dp))
                ConfidenceBar(label = "Make / Brand", confidenceFloat = car.makeConfidence)
                ConfidenceBar(label = "Model Identification", confidenceFloat = car.modelConfidence)
                ConfidenceBar(label = "Exterior Colour", confidenceFloat = car.colourConfidence)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Action Buttons: Save to History & Share
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = onSave,
                modifier = Modifier
                    .weight(1f)
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                enabled = !isSaved
            ) {
                Icon(
                    imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (isSaved) "Saved" else "Save")
            }

            OutlinedButton(
                onClick = { onShare(car) },
                modifier = Modifier
                    .weight(1f)
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Share")
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Button: Analyze Another Image
        Button(
            onClick = onAnalyzeAnother,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
        ) {
            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Analyze Another Image", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(30.dp))
    }
}

@Composable
private fun TableRowItem(
    property: String,
    result: String,
    isHighlight: Boolean = false,
    isWarning: Boolean = false,
    colorSwatchHex: String? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 11.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = property,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            if (colorSwatchHex != null) {
                // Color preview circle
                val parsedColor = try {
                    Color(android.graphics.Color.parseColor(colorSwatchHex))
                } catch (e: Exception) {
                    BluePrimary
                }
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .clip(CircleShape)
                        .background(parsedColor)
                        .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), CircleShape)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }

            Text(
                text = result,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (isHighlight) FontWeight.Bold else FontWeight.Medium,
                color = when {
                    isWarning -> AmberWarning
                    isHighlight -> BluePrimary
                    else -> MaterialTheme.colorScheme.onSurface
                },
                textAlign = TextAlign.End
            )
        }
    }
}

@Composable
private fun NoCarDetectedContent(
    message: String,
    selectedUri: Uri?,
    selectedBitmap: Bitmap?,
    onTryAgain: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(AmberWarning.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = AmberWarning,
                modifier = Modifier.size(40.dp)
            )
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(
            text = "No Car Detected",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(28.dp))

        Button(
            onClick = onTryAgain,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
        ) {
            Text("Try Another Image", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ErrorContent(
    errorMessage: String,
    onTryAgain: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.ErrorOutline,
            contentDescription = null,
            tint = RedAlert,
            modifier = Modifier.size(52.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Analysis Failed",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = errorMessage,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onTryAgain,
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("Go Back")
        }
    }
}
