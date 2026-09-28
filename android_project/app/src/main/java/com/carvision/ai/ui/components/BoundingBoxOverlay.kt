package com.carvision.ai.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import com.carvision.ai.model.DetectedCar

/**
 * Overlay canvas that renders bounding boxes over detected cars on the image preview.
 * Tapping inside a bounding box selects that vehicle.
 */
@Composable
fun BoundingBoxOverlay(
    cars: List<DetectedCar>,
    selectedIndex: Int,
    onSelectCar: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(cars) {
                detectTapGestures { tapOffset ->
                    val canvasWidth = size.width
                    val canvasHeight = size.height

                    // Check which car bounding box was tapped
                    cars.forEachIndexed { index, car ->
                        val box = car.boundingBox ?: return@forEachIndexed
                        val left = (box.xmin / 100f) * canvasWidth
                        val top = (box.ymin / 100f) * canvasHeight
                        val right = (box.xmax / 100f) * canvasWidth
                        val bottom = (box.ymax / 100f) * canvasHeight

                        if (tapOffset.x in left..right && tapOffset.y in top..bottom) {
                            onSelectCar(index)
                            return@detectTapGestures
                        }
                    }
                }
            }
    ) {
        val canvasWidth = size.width
        val canvasHeight = size.height

        cars.forEachIndexed { index, car ->
            val box = car.boundingBox ?: return@forEachIndexed
            val isSelected = index == selectedIndex

            val left = (box.xmin / 100f) * canvasWidth
            val top = (box.ymin / 100f) * canvasHeight
            val width = ((box.xmax - box.xmin) / 100f) * canvasWidth
            val height = ((box.ymax - box.ymin) / 100f) * canvasHeight

            val strokeColor = if (isSelected) Color(0xFF2563EB) else Color(0xAAFFFFFF)
            val strokeWidth = if (isSelected) 3.5f else 2.0f

            // Draw bounding rectangle
            drawRect(
                color = strokeColor,
                topLeft = Offset(left, top),
                size = Size(width, height),
                style = Stroke(width = strokeWidth * density)
            )

            // Optional subtle fill highlight for selected car
            if (isSelected) {
                drawRect(
                    color = Color(0x222563EB),
                    topLeft = Offset(left, top),
                    size = Size(width, height)
                )
            }
        }
    }
}
