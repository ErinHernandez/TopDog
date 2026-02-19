/**
 * TopDog Studio — Nearby Connections Manager (Android)
 *
 * Uses Google Nearby Connections API for local peer-to-peer collaboration
 * over WiFi Direct, Bluetooth, and BLE. Bridges Yjs binary updates between
 * connected peers and relays them to the companion WebSocket.
 */

package com.topdog.viewer

import android.content.Context
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class NearbyPeer(
    val endpointId: String,
    val name: String,
    val isConnected: Boolean
)

class NearbyManager(private val context: Context) {

    companion object {
        private const val TAG = "NearbyManager"
        private const val SERVICE_ID = "com.topdog.studio.cowork"
        private const val STRATEGY_TYPE = "P2P_CLUSTER"

        // Message type prefixes
        private const val MSG_YJS_UPDATE: Byte = 0x01
        private const val MSG_AWARENESS: Byte = 0x02
    }

    // ── State ──

    private val _connectedPeers = MutableStateFlow<List<NearbyPeer>>(emptyList())
    val connectedPeers: StateFlow<List<NearbyPeer>> = _connectedPeers.asStateFlow()

    private val _isActive = MutableStateFlow(false)
    val isActive: StateFlow<Boolean> = _isActive.asStateFlow()

    private val discoveredEndpoints = mutableMapOf<String, String>() // endpointId -> name
    private val connectedEndpoints = mutableSetOf<String>()

    // ── Callbacks ──

    var onYjsUpdate: ((ByteArray) -> Unit)? = null
    var onPeerStateChanged: ((String, Boolean) -> Unit)? = null

    // ── Nearby Connections Client ──

    private val connectionsClient by lazy {
        Nearby.getConnectionsClient(context)
    }

    private val strategy = Strategy.P2P_CLUSTER

    // ── Connection Callbacks ──

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            Log.d(TAG, "Connection initiated with ${info.endpointName} ($endpointId)")
            // Auto-accept connections from TopDog peers
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            when (result.status.statusCode) {
                ConnectionsStatusCodes.STATUS_OK -> {
                    Log.d(TAG, "Connected to $endpointId")
                    connectedEndpoints.add(endpointId)
                    updatePeerList()
                    onPeerStateChanged?.invoke(endpointId, true)
                }
                ConnectionsStatusCodes.STATUS_CONNECTION_REJECTED -> {
                    Log.d(TAG, "Connection rejected by $endpointId")
                }
                else -> {
                    Log.w(TAG, "Connection failed with $endpointId: ${result.status}")
                }
            }
        }

        override fun onDisconnected(endpointId: String) {
            Log.d(TAG, "Disconnected from $endpointId")
            connectedEndpoints.remove(endpointId)
            discoveredEndpoints.remove(endpointId)
            updatePeerList()
            onPeerStateChanged?.invoke(endpointId, false)
        }
    }

    // ── Payload Callbacks ──

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val data = payload.asBytes() ?: return
                if (data.isEmpty()) return

                when (data[0]) {
                    MSG_YJS_UPDATE -> {
                        val update = data.copyOfRange(1, data.size)
                        onYjsUpdate?.invoke(update)
                    }
                    MSG_AWARENESS -> {
                        val update = data.copyOfRange(1, data.size)
                        onYjsUpdate?.invoke(update) // Same handler for now
                    }
                    else -> {
                        Log.w(TAG, "Unknown message type: ${data[0]}")
                    }
                }
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // Track transfer progress if needed
        }
    }

    // ── Discovery Callbacks ──

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            Log.d(TAG, "Found endpoint: ${info.endpointName} ($endpointId)")
            discoveredEndpoints[endpointId] = info.endpointName

            // Auto-connect (use deterministic ordering to avoid duplicates)
            val myName = android.os.Build.MODEL
            if (myName < info.endpointName) {
                connectionsClient.requestConnection(
                    myName,
                    endpointId,
                    connectionLifecycleCallback
                )
            }
        }

        override fun onEndpointLost(endpointId: String) {
            Log.d(TAG, "Lost endpoint: $endpointId")
            discoveredEndpoints.remove(endpointId)
            updatePeerList()
        }
    }

    // ── Public Methods ──

    fun start() {
        if (_isActive.value) return

        _isActive.value = true
        val deviceName = android.os.Build.MODEL

        // Start advertising
        val advertisingOptions = AdvertisingOptions.Builder()
            .setStrategy(strategy)
            .build()

        connectionsClient.startAdvertising(
            deviceName,
            SERVICE_ID,
            connectionLifecycleCallback,
            advertisingOptions
        ).addOnSuccessListener {
            Log.d(TAG, "Advertising started")
        }.addOnFailureListener { e ->
            Log.e(TAG, "Failed to start advertising", e)
        }

        // Start discovery
        val discoveryOptions = DiscoveryOptions.Builder()
            .setStrategy(strategy)
            .build()

        connectionsClient.startDiscovery(
            SERVICE_ID,
            endpointDiscoveryCallback,
            discoveryOptions
        ).addOnSuccessListener {
            Log.d(TAG, "Discovery started")
        }.addOnFailureListener { e ->
            Log.e(TAG, "Failed to start discovery", e)
        }
    }

    fun stop() {
        connectionsClient.stopAdvertising()
        connectionsClient.stopDiscovery()
        connectionsClient.stopAllEndpoints()
        connectedEndpoints.clear()
        discoveredEndpoints.clear()
        _isActive.value = false
        _connectedPeers.value = emptyList()
    }

    /** Send a Yjs update to all connected peers */
    fun sendYjsUpdate(data: ByteArray) {
        if (connectedEndpoints.isEmpty()) return

        val message = ByteArray(data.size + 1)
        message[0] = MSG_YJS_UPDATE
        System.arraycopy(data, 0, message, 1, data.size)

        val payload = Payload.fromBytes(message)
        for (endpointId in connectedEndpoints) {
            connectionsClient.sendPayload(endpointId, payload)
        }
    }

    /** Send an awareness update to all connected peers */
    fun sendAwarenessUpdate(data: ByteArray) {
        if (connectedEndpoints.isEmpty()) return

        val message = ByteArray(data.size + 1)
        message[0] = MSG_AWARENESS
        System.arraycopy(data, 0, message, 1, data.size)

        val payload = Payload.fromBytes(message)
        for (endpointId in connectedEndpoints) {
            connectionsClient.sendPayload(endpointId, payload)
        }
    }

    // ── Internal ──

    private fun updatePeerList() {
        _connectedPeers.value = connectedEndpoints.map { endpointId ->
            NearbyPeer(
                endpointId = endpointId,
                name = discoveredEndpoints[endpointId] ?: "Unknown",
                isConnected = true
            )
        }
    }
}
