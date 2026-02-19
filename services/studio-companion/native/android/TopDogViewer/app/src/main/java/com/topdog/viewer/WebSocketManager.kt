/**
 * TopDog Studio — Android WebSocket Manager
 *
 * Manages WebSocket connection to the companion service using OkHttp.
 * Handles connection lifecycle, auto-reconnect, heartbeat, and message routing.
 */

package com.topdog.viewer

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Connection state
 */
enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED
}

/**
 * Build status for current component
 */
sealed class BuildStatus {
    data object Idle : BuildStatus()
    data class Building(val componentId: String) : BuildStatus()
    data class Success(val componentId: String, val duration: Double) : BuildStatus()
    data class Error(val componentId: String, val message: String) : BuildStatus()
}

/**
 * Manages WebSocket connection to the TopDog companion service
 */
class WebSocketManager private constructor() {
    companion object {
        @Volatile
        private var instance: WebSocketManager? = null

        fun getInstance(): WebSocketManager {
            return instance ?: synchronized(this) {
                instance ?: WebSocketManager().also { instance = it }
            }
        }
    }

    // ─── State ───

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _buildStatus = MutableStateFlow<BuildStatus>(BuildStatus.Idle)
    val buildStatus: StateFlow<BuildStatus> = _buildStatus.asStateFlow()

    private val _currentCode = MutableStateFlow<String?>(null)
    val currentCode: StateFlow<String?> = _currentCode.asStateFlow()

    private val _currentComponentId = MutableStateFlow<String?>(null)
    val currentComponentId: StateFlow<String?> = _currentComponentId.asStateFlow()

    // ─── Configuration ───

    private val host = System.getenv("TOPDOG_COMPANION_HOST") ?: "10.0.2.2" // Android emulator localhost
    private val port = System.getenv("TOPDOG_COMPANION_PORT") ?: "9828"
    private val wsUrl = "ws://$host:$port"

    // ─── Connection ───

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // no timeout for WebSocket
        .build()

    private var webSocket: WebSocket? = null
    private var reconnectJob: Job? = null
    private var heartbeatJob: Job? = null
    private var isManuallyDisconnected = false
    private var reconnectDelay = 1000L // ms, with exponential backoff
    private val maxReconnectDelay = 30000L
    private val heartbeatInterval = 5000L
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ─── Connection Lifecycle ───

    fun connect() {
        if (_connectionState.value != ConnectionState.DISCONNECTED) return
        isManuallyDisconnected = false

        _connectionState.value = ConnectionState.CONNECTING

        val request = Request.Builder()
            .url(wsUrl)
            .build()

        webSocket = client.newWebSocket(request, createWebSocketListener())
    }

    fun disconnect() {
        isManuallyDisconnected = true
        tearDown()
    }

    private fun tearDown() {
        heartbeatJob?.cancel()
        heartbeatJob = null
        reconnectJob?.cancel()
        reconnectJob = null
        webSocket?.close(1000, "Client disconnecting")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    private fun scheduleReconnect() {
        if (isManuallyDisconnected) return

        reconnectJob = scope.launch {
            delay(reconnectDelay)
            reconnectDelay = (reconnectDelay * 2).coerceAtMost(maxReconnectDelay)
            withContext(Dispatchers.Main) {
                connect()
            }
        }
    }

    // ─── Heartbeat ───

    private fun startHeartbeat() {
        heartbeatJob = scope.launch {
            while (isActive) {
                delay(heartbeatInterval)
                send(JSONObject().put("type", "ping"))
            }
        }
    }

    // ─── WebSocket Listener ───

    private fun createWebSocketListener(): WebSocketListener {
        return object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                _connectionState.value = ConnectionState.CONNECTED
                reconnectDelay = 1000 // reset backoff

                startHeartbeat()

                // Announce ourselves
                send(JSONObject().apply {
                    put("type", "register")
                    put("platform", "android")
                    put("appVersion", "1.0.0")
                })
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    routeMessage(json)
                } catch (e: Exception) {
                    // Invalid JSON — ignore
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                tearDown()
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                tearDown()
                scheduleReconnect()
            }
        }
    }

    // ─── Message Routing ───

    private fun routeMessage(json: JSONObject) {
        when (json.optString("type")) {
            "pong" -> { /* heartbeat ack */ }

            "inject-code" -> {
                val componentId = json.optString("componentId") ?: return
                val code = json.optString("code") ?: return

                _currentComponentId.value = componentId
                _currentCode.value = code
                _buildStatus.value = BuildStatus.Building(componentId)
            }

            "hot-reload" -> {
                val componentId = json.optString("componentId") ?: return
                val code = json.optString("code") ?: return

                _currentCode.value = code
                _buildStatus.value = BuildStatus.Building(componentId)
            }

            "set-props" -> {
                // Props update — handled by the component renderer
            }

            "build-complete" -> {
                val componentId = json.optString("componentId") ?: return
                val duration = json.optDouble("duration", 0.0)
                _buildStatus.value = BuildStatus.Success(componentId, duration)
            }

            "build-error" -> {
                val componentId = json.optString("componentId") ?: return
                val errors = json.optJSONArray("errors")
                val message = errors?.optJSONObject(0)?.optString("message") ?: "Unknown error"
                _buildStatus.value = BuildStatus.Error(componentId, message)
            }
        }
    }

    // ─── Sending ───

    fun send(payload: JSONObject) {
        webSocket?.send(payload.toString())
    }

    fun sendRenderComplete(componentId: String, success: Boolean) {
        send(JSONObject().apply {
            put("type", "render-complete")
            put("componentId", componentId)
            put("success", success)
        })
    }
}
