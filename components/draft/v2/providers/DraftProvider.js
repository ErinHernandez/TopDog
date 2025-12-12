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
  runTransaction 
} from 'firebase/firestore';
import { usePlayerData } from '../../../../lib/playerDataContext';

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
    headshotsMap,
    getPlayerHeadshot 
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
  
  // Real-time listeners
  const roomUnsubscribe = useRef(null);
  const picksUnsubscribe = useRef(null);

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
      picksUnsubscribe.current = onSnapshot(
        query(collection(db, 'draftRooms', roomId, 'picks'), orderBy('pickNumber')),
        (snapshot) => {
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
        
        console.log('🔧 Development pick:', pickData);
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
      console.error('Pick failed:', error);
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
    timer,
    isLoading,
    error,
    
    // Player data from centralized context
    headshotsMap,
    getPlayerHeadshot,
    
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