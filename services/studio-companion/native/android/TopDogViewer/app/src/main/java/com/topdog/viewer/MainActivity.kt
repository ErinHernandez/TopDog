/**
 * TopDog Studio — Android Companion Viewer App
 *
 * Single-activity Compose app that connects to the TopDog Studio companion
 * service via WebSocket and renders dynamically injected Compose components.
 *
 * Architecture mirrors the iOS viewer:
 *   MainActivity → WebSocketManager → PreviewContainer → ComponentRenderer
 */

package com.topdog.viewer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.topdog.viewer.ui.PreviewContainer
import com.topdog.viewer.ui.theme.TopDogViewerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check for componentId from intent (launched by companion service)
        val componentId = intent.getStringExtra("componentId")

        setContent {
            TopDogViewerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PreviewContainer(
                        initialComponentId = componentId,
                        webSocketManager = WebSocketManager.getInstance()
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        WebSocketManager.getInstance().disconnect()
    }
}
