import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../../../../lib/firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  runTransaction,
  limit as firestoreLimit
} from 'firebase/firestore';
import { usePlayerData } from '../../../../lib/playerDataContext';
import { 
  LatencyTracker, 
  measureLatency, 
  compensateTimer 
} from '../../../../lib/draft/latencyCompensation';
// Note: Query optimization utilities available for future use
// import { optimizeDraftPicksQuery } from '../../../../lib/firebase/queryOptimization';

/**
 * DraftContext - Centralized state management for draft room
 * 
 * Features:
 * - Real-time Firebase sync
 * - Optimized queries for scale
 * - Security validations
 * - Error handling & recovery
 * - Performance monitoring
 */
const DraftContext = createContext(null);

export const useDraft = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
};

export default function DraftProvider({ roomId, children }) {
  // Get centralized player data from context
  const { 
    allPlayers, 
    availablePlayers: contextAvailablePlayers, 
    syncDraftedPlayers,
  } = usePlayerData();
  
  // Core state
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [picks, setPicks] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize available players from context
  useEffect(() => {
    setAvailablePlayers(allPlayers);
  }, [allPlayers]);
  
  // User state
  const [userName, setUserName] = useState('');
  const [userTeamIndex, setUserTeamIndex] = useState(-1);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  // UI state
  const [rankings, setRankings] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'compact', 'board'
  
  // Performance refs
  const timerRef = useRef(null);
  const pickInProgress = useRef(false);
  const lastPickTime = useRef(0);
  
  // Latency compensation
  const latencyTracker = useRef(new LatencyTracker(10));
  const [compensatedTimer, setCompensatedTimer] = useState(30);
  const latencyMeasurementInterval = useRef(null);
  
  // Real-time listeners
  const roomUnsubscribe = useRef(null);
  const picksUnsubscribe = useRef(null);

  /**
   * Initialize latency measurement
   */
  useEffect(() => {
    if (!roomId) return;
    
    // Measure latency periodically
    const measureLatencyPeriodically = async () => {
      try {
        const measurement = await measureLatency('/api/health');
        latencyTracker.current.addMeasurement(measurement);
      } catch (error) {
        console.warn('Latency measurement failed:', error);
      }
    };
    
    // Initial measurement
    measureLatencyPeriodically();
    
    // Measure every 10 seconds
    latencyMeasurementInterval.current = setInterval(measureLatencyPeriodically, 10000);
    
    return () => {
      if (latencyMeasurementInterval.current) {
        clearInterval(latencyMeasurementInterval.current);
      }
    };
  }, [roomId]);
  
  /**
   * Apply latency compensation to timer
   */
  useEffect(() => {
    if (timer === null || timer === undefined) return;
    
    const estimatedLatency = latencyTracker.current.getEstimatedLatency();
    const compensated = compensateTimer(timer * 1000, estimatedLatency); // Convert seconds to ms, then compensate
    setCompensatedTimer(Math.max(0, Math.floor(compensated / 1000))); // Convert back to seconds
    
    // Log compensation in development
    if (process.env.NODE_ENV === 'development' && estimatedLatency > 0) {
      console.log('⏱️ Timer compensation:', {
        serverTimer: timer,
        estimatedLatency: Math.round(estimatedLatency),
        compensatedTimer: Math.floor(compensated / 1000),
      });
    }
  }, [timer]);
  
  /**
   * Initialize draft room listeners
   */
  useEffect(() => {
    if (!roomId) return;
    
    setIsLoading(true);
    setError(null);
    
    // DEVELOPMENT MODE: Create mock room data for testing
    const isDevMode = process.env.NODE_ENV === 'development' || roomId.startsWith('dev-');
    
    if (isDevMode) {
      // Create mock room data
      const mockRoom = {
        id: roomId,
        name: `Development Draft Room - ${roomId}`,
        status: 'active',
        participants: ['User1', 'User2', 'User3', 'User4', 'User5', 'User6', 'User7', 'User8', 'User9', 'User10', 'User11', 'User12'],
        draftOrder: ['User1', 'User2', 'User3', 'User4', 'User5', 'User6', 'User7', 'User8', 'User9', 'User10', 'User11', 'User12'],
        currentTimer: 30,
        settings: {
          totalRounds: 18,
          timePerPick: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setRoom(mockRoom);
      setParticipants(mockRoom.participants);
      setDraftOrder(mockRoom.draftOrder);
      setTimer(mockRoom.currentTimer);
      setUserName('User1'); // Set as first user for testing
      setUserTeamIndex(0);
      setIsMyTurn(true);
      setIsLoading(false);
      
      console.log('🔧 Development mode: Using mock room data');
      return;
    }
    
    // PRODUCTION MODE: Listen to real Firebase data
    roomUnsubscribe.current = onSnapshot(
      doc(db, 'draftRooms', roomId),
      (docSnap) => {
        if (!docSnap.exists()) {
          setError('Draft room not found');
          setIsLoading(false);
          return;
        }
        
        const roomData = { id: docSnap.id, ...docSnap.data() };
        setRoom(roomData);
        setParticipants(roomData.participants || []);
        setDraftOrder(roomData.draftOrder || []);
        setTimer(roomData.currentTimer || 30);
        setIsLoading(false);
        
        // Calculate user position
        const userIndex = roomData.participants?.indexOf(userName);
        setUserTeamIndex(userIndex);
      },
      (error) => {
        console.error('Room listener error:', error);
        setError('Failed to connect to draft room');
        setIsLoading(false);
      }
    );
    
    // Listen to picks (only in production mode)
    if (!isDevMode) {
      // Use optimized query with proper ordering for index usage
      const picksCollection = collection(db, 'draftRooms', roomId, 'picks');
      
      // Optimize query: order by pickNumber for efficient index usage
      // This ensures the query uses the composite index we created
      const optimizedPicksQuery = query(
        picksCollection,
        orderBy('pickNumber', 'asc')
        // Note: We don't limit here because we need all picks for the draft
        // But the query is optimized with proper ordering for index usage
      );
      
      // Track query performance in development
      const queryStartTime = process.env.NODE_ENV === 'development' ? performance.now() : null;
      
      picksUnsubscribe.current = onSnapshot(
        optimizedPicksQuery,
        (snapshot) => {
          // Measure query performance in development
          if (queryStartTime && process.env.NODE_ENV === 'development') {
            const duration = performance.now() - queryStartTime;
            if (duration > 500) {
              console.warn(`⚠️ Slow draft picks query: ${duration.toFixed(2)}ms`);
            }
          }
          
          const picksData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          setPicks(picksData);
          
          // Update available players and sync with context
          const pickedNames = picksData.map(p => p.player);
          syncDraftedPlayers(pickedNames);
          const filtered = allPlayers.filter(p => !pickedNames.includes(p.name));
          setAvailablePlayers(filtered);
          
          // Calculate current pick state
          calculateCurrentPickState(picksData);
        },
        (error) => {
          console.error('Picks listener error:', error);
          setError('Failed to sync draft picks');
        }
      );
    } else {
      // Development mode: Start with empty picks
      setPicks([]);
      syncDraftedPlayers([]);
      setAvailablePlayers(allPlayers);
      calculateCurrentPickState([]);
    }
    
    return () => {
      if (roomUnsubscribe.current) roomUnsubscribe.current();
      if (picksUnsubscribe.current) picksUnsubscribe.current();
      // Copy ref value for cleanup
      const timer = timerRef.current;
      if (timer) clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally limited to prevent re-subscription loops
  }, [roomId, userName]);

  /**
   * Calculate current pick state from picks data
   */
  const calculateCurrentPickState = (picksData) => {
    const totalRounds = room?.settings?.totalRounds || 18;
    const totalParticipants = participants.length || 12;
    const totalPicks = totalRounds * totalParticipants;
    
    const currentPickNumber = picksData.length + 1;
    setCurrentPick(currentPickNumber);
    
    const round = Math.ceil(currentPickNumber / totalParticipants);
    setCurrentRound(round);
    
    // Calculate whose turn it is
    if (currentPickNumber <= totalPicks) {
      const isSnakeRound = round % 2 === 0;
      let pickPosition;
      
      if (isSnakeRound) {
        pickPosition = totalParticipants - ((currentPickNumber - 1) % totalParticipants) - 1;
      } else {
        pickPosition = (currentPickNumber - 1) % totalParticipants;
      }
      
      const currentUser = draftOrder[pickPosition] || participants[pickPosition];
      setIsMyTurn(currentUser === userName);
    }
  };

  /**
   * Make a draft pick with transaction safety
   */
  const makePick = async (playerName) => {
    if (pickInProgress.current) return false;
    if (!isMyTurn) throw new Error('Not your turn');
    
    const player = availablePlayers.find(p => p.name === playerName);
    if (!player) throw new Error('Player not available');
    
    pickInProgress.current = true;
    
    try {
      // Check if we're in development mode
      const isDevMode = process.env.NODE_ENV === 'development' || roomId.startsWith('dev-');
      
      if (isDevMode) {
        // Development mode: Simulate pick locally
        const pickData = {
          id: `dev-pick-${Date.now()}`,
          player: playerName,
          user: userName,
          pickNumber: currentPick,
          round: currentRound,
          position: player.position,
          team: player.team,
          adp: player.adp,
          timestamp: new Date(),
          roomId: roomId,
          userIndex: userTeamIndex
        };
        
        // Update local state
        setPicks(prev => [...prev, pickData]);
        setAvailablePlayers(prev => prev.filter(p => p.name !== playerName));
        setCurrentPick(prev => prev + 1);
        setIsMyTurn(false);
        
        // Log development pick (structured logger in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Development pick:', pickData);
        }
        return pickData;
      }
      
      // PRODUCTION MODE: Use Firestore transaction
      const result = await runTransaction(db, async (transaction) => {
        const roomRef = doc(db, 'draftRooms', roomId);
        const roomDoc = await transaction.get(roomRef);
        
        if (!roomDoc.exists()) {
          throw new Error('Draft room not found');
        }
        
        const picksRef = collection(db, 'draftRooms', roomId, 'picks');
        const newPickRef = doc(picksRef);
        
        const pickData = {
          id: newPickRef.id,
          player: playerName,
          user: userName,
          pickNumber: currentPick,
          round: currentRound,
          position: player.position,
          team: player.team,
          adp: player.adp,
          timestamp: serverTimestamp(),
          roomId: roomId,
          userIndex: userTeamIndex
        };
        
        // Add the pick
        transaction.set(newPickRef, pickData);
        
        // Update room timer
        transaction.update(roomRef, {
          currentTimer: 30,
          lastPickAt: serverTimestamp()
        });
        
        return pickData;
      });
      
      // Remove from queue if present
      setQueue(prev => prev.filter(p => p.name !== playerName));
      
      // Update last pick time for performance tracking
      lastPickTime.current = Date.now();
      
      return result;
      
    } catch (error) {
      // Log error (will use structured logger in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('Pick failed:', error);
      } else {
        // In production, use structured logger
        const { logger, logDraftEvent } = require('../../../../lib/structuredLogger');
        logger.error('Pick failed', error, { roomId, userId: userName, playerName });
        logDraftEvent('Pick failed', { roomId, userId: userName, error: error.message });
      }
      throw error;
    } finally {
      pickInProgress.current = false;
    }
  };

  /**
   * Add player to queue
   */
  const addToQueue = (player) => {
    setQueue(prev => {
      const exists = prev.find(p => p.name === player.name);
      if (exists) return prev;
      return [...prev, player];
    });
  };

  /**
   * Remove player from queue
   */
  const removeFromQueue = (playerName) => {
    setQueue(prev => prev.filter(p => p.name !== playerName));
  };

  /**
   * Auto-pick from queue or rankings
   */
  const autoPick = () => {
    if (queue.length > 0) {
      const nextPick = queue[0];
      if (availablePlayers.find(p => p.name === nextPick.name)) {
        return makePick(nextPick.name);
      }
    }
    
    // Fallback to best available by ADP
    const bestAvailable = availablePlayers
      .sort((a, b) => a.adp - b.adp)[0];
    
    if (bestAvailable) {
      return makePick(bestAvailable.name);
    }
    
    throw new Error('No players available for auto-pick');
  };

  const contextValue = {
    // Core state
    room,
    participants,
    picks,
    availablePlayers,
    allPlayers,
    draftOrder,
    currentPick,
    currentRound,
    timer: compensatedTimer, // Use compensated timer for display (accounts for latency)
    serverTimer: timer, // Keep raw server timer for reference
    latencyStats: latencyTracker.current.getStats(), // Expose latency stats for debugging
    isLoading,
    error,
    
    // User state
    userName,
    setUserName,
    userTeamIndex,
    isMyTurn,
    
    // UI state
    rankings,
    setRankings,
    queue,
    selectedPlayer,
    setSelectedPlayer,
    viewMode,
    setViewMode,
    
    // Actions
    makePick,
    addToQueue,
    removeFromQueue,
    autoPick,
    
    // Utils
    isDraftActive: room?.status === 'active',
    isDraftComplete: room?.status === 'completed',
    totalPicks: (room?.settings?.totalRounds || 18) * participants.length,
    picksRemaining: ((room?.settings?.totalRounds || 18) * participants.length) - picks.length
  };

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  );
}