/**
 * TopDog Studio — Android Preview Container
 *
 * Main Compose view that displays dynamically injected components.
 * Shows connection status, build status, and the rendered component.
 */

package com.topdog.viewer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.topdog.viewer.BuildStatus
import com.topdog.viewer.ConnectionState
import com.topdog.viewer.WebSocketManager

@Composable
fun PreviewContainer(
    initialComponentId: String?,
    webSocketManager: WebSocketManager,
    modifier: Modifier = Modifier
) {
    val connectionState by webSocketManager.connectionState.collectAsState()
    val buildStatus by webSocketManager.buildStatus.collectAsState()
    val currentCode by webSocketManager.currentCode.collectAsState()
    val currentComponentId by webSocketManager.currentComponentId.collectAsState()

    LaunchedEffect(Unit) {
        webSocketManager.connect()
    }

    Surface(modifier = modifier.fillMaxSize()) {
        when (connectionState) {
            ConnectionState.DISCONNECTED -> DisconnectedView()
            ConnectionState.CONNECTING -> ConnectingView()
            ConnectionState.CONNECTED -> {
                val code = currentCode
                val componentId = currentComponentId
                if (code != null && componentId != null) {
                    ComponentView(
                        componentId = componentId,
                        code = code,
                        buildStatus = buildStatus
                    )
                } else {
                    WaitingForCodeView()
                }
            }
        }
    }
}

@Composable
private fun DisconnectedView() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "📡",
            style = MaterialTheme.typography.displayLarge
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Disconnected",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Waiting for connection to\nTopDog Studio companion service...",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ConnectingView() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Connecting...",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun WaitingForCodeView() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "✅",
            style = MaterialTheme.typography.displayLarge
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Ready",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Connected to TopDog Studio.\nDesign a component in the Studio\nto see it rendered here.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ComponentView(
    componentId: String,
    code: String,
    buildStatus: BuildStatus
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Status bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(
                        when (buildStatus) {
                            is BuildStatus.Idle -> MaterialTheme.colorScheme.outline
                            is BuildStatus.Building -> MaterialTheme.colorScheme.tertiary
                            is BuildStatus.Success -> MaterialTheme.colorScheme.primary
                            is BuildStatus.Error -> MaterialTheme.colorScheme.error
                        }
                    )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = when (buildStatus) {
                    is BuildStatus.Idle -> "Idle"
                    is BuildStatus.Building -> "Building..."
                    is BuildStatus.Success -> "Built in ${String.format("%.1f", buildStatus.duration)}s"
                    is BuildStatus.Error -> "Error: ${buildStatus.message}"
                },
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = componentId,
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Component render area
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Placeholder: In Phase 5D, this renders the actual Compose component
            Text(
                text = "🎨",
                style = MaterialTheme.typography.displayMedium
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Component Preview",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Code received (${code.length} characters)",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))

            // Code preview
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = MaterialTheme.shapes.medium
            ) {
                Text(
                    text = code.take(200),
                    modifier = Modifier.padding(8.dp),
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontFamily = FontFamily.Monospace
                    ),
                    maxLines = 8
                )
            }
        }
    }
}
