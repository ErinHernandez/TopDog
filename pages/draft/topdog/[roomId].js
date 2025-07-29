import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import {
  doc, getDoc, updateDoc, arrayUnion, onSnapshot, collection, addDoc, query, orderBy, setDoc, arrayRemove, getDocs, deleteDoc
} from 'firebase/firestore';
import Link from 'next/link';
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PLAYER_POOL, groupPicksByPosition } from '../../../lib/playerPool';
import { getRandomMockDrafters } from '../../../lib/mockDrafters';
import FullDraftBoard from '../../../components/FullDraftBoard';
import { logoOptions } from '../../../components/team-logos';
import dynamic from 'next/dynamic';
const SevenSegmentCountdown = dynamic(() => import('../../../components/SevenSegmentCountdown'), { ssr: false });

// Team colors (from FullDraftBoard)
const TEAM_COLORS = [
  '#2563eb', // blue
  '#e11d48', // red
  '#10b981', // green
  '#f59e42', // orange
  '#a21caf', // purple
  '#14b8a6', // teal
  '#facc15', // yellow
  '#f472b6', // pink
  '#6b7280', // gray
  '#92400e', // brown
  '#84cc16', // lime
  '#6366f1', // indigo
];

function getRandomName() {
  return 'Not Todd Middleton';
}

export default function DraftRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [picks, setPicks] = useState([]);
  const [userName, setUserName] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState(PLAYER_POOL);
  const [pickLoading, setPickLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef();
  const prevPickLength = useRef(0);
  const [rankings, setRankings] = useState([]);
  const [rankingsText, setRankingsText] = useState('');
  const [queue, setQueue] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(userName);
  const [showDraftOrderModal, setShowDraftOrderModal] = useState(false);
  const [draftOrder, setDraftOrder] = useState([]);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draftSettings, setDraftSettings] = useState({
    timerSeconds: 30,
    totalRounds: 18
  });
  const [showRandomizationNotification, setShowRandomizationNotification] = useState(false);
  const [draftOrderTimestamp, setDraftOrderTimestamp] = useState(null);
  const [preDraftCountdown, setPreDraftCountdown] = useState(60);
  const [sortBy, setSortBy] = useState('adp'); // 'adp' or 'rankings'
  const [queueSortBy, setQueueSortBy] = useState('manual'); // 'manual', 'adp', or 'rankings'
  const picksScrollRef = useRef(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mockDraftSpeed, setMockDraftSpeed] = useState(false);
  const lastPickTimestampRef = useRef(0);
  const pickInProgressRef = useRef(false);

  // Auto-scroll to show only one completed pick at a time, positioned as far left as possible
  useEffect(() => {
    if (picksScrollRef.current && picks.length > 0) {
      // Add a longer delay to ensure DOM is fully updated
      setTimeout(() => {
        const completedPicksCount = picks.length;
        const currentPickIndex = completedPicksCount - 1; // Index of the last completed pick
        const currentPickElement = picksScrollRef.current.children[currentPickIndex];
        if (currentPickElement) {
          console.log(`Auto-scrolling to show only completed pick #${completedPicksCount} as far left as possible`);
          currentPickElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        } else {
          console.log(`Could not find element for completed pick #${completedPicksCount}`);
        }
      }, 300);
    }
  }, [picks.length]);

  // Function to clear picks for this room
  const clearPicksForRoom = async () => {
    try {
      const picksRef = collection(db, 'draftRooms', roomId, 'picks');
      const picksSnapshot = await getDocs(picksRef);
      const deletePromises = picksSnapshot.docs.map(pickDoc => 
        deleteDoc(doc(db, 'draftRooms', roomId, 'picks', pickDoc.id))
      );
      await Promise.all(deletePromises);
      console.log(`[ROOM ${roomId}] Cleared picks for room ${roomId}`);
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error clearing picks for room ${roomId}:`, error);
    }
  };

  // Verify and clean up picks that don't belong to this room
  const verifyAndCleanPicks = async () => {
    try {
      const picksRef = collection(db, 'draftRooms', roomId, 'picks');
      const picksSnapshot = await getDocs(picksRef);
      const invalidPicks = [];
      
      picksSnapshot.docs.forEach(pickDoc => {
        const pickData = pickDoc.data();
        if (!pickData.roomId || pickData.roomId !== roomId) {
          invalidPicks.push(pickDoc.id);
        }
      });
      
      if (invalidPicks.length > 0) {
        console.warn(`[ROOM ${roomId}] Found ${invalidPicks.length} invalid picks, cleaning up...`);
        const deletePromises = invalidPicks.map(pickId => 
          deleteDoc(doc(db, 'draftRooms', roomId, 'picks', pickId))
        );
        await Promise.all(deletePromises);
        console.log(`[ROOM ${roomId}] Cleaned up ${invalidPicks.length} invalid picks`);
      }
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error verifying picks:`, error);
    }
  };

  // Join room as a participant
  useEffect(() => {
    if (!roomId) return;
    const joinRoom = async () => {
      // Force the user to be "Not Todd Middleton" regardless of what's in localStorage
      const name = 'Not Todd Middleton';
      localStorage.setItem('draftUserName', name);
      setUserName(name);
      
      const userRef = doc(db, 'draftRooms', roomId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsRoomOwner(data.createdBy === name);
        
        // Check if room is full before trying to join
        const currentParticipants = data.participants || [];
        const maxParticipants = data.maxParticipants || 12;
        
        if (currentParticipants.length >= maxParticipants && !currentParticipants.includes(name)) {
          // Room is full and user is not already in it
          alert('Draft room is full (12 participants max).');
          router.push('/draft');
          return;
        }
        
        // Remove any old usernames that might be the same user (like User-XXXX)
        const oldUsernames = currentParticipants.filter(p => p.startsWith('User-'));
        let updatedParticipants = currentParticipants;
        
        if (oldUsernames.length > 0) {
          // Remove old usernames
          updatedParticipants = currentParticipants.filter(p => !p.startsWith('User-'));
          await updateDoc(userRef, { participants: updatedParticipants });
        }
        
        // Add the new username if not already present
        if (!updatedParticipants.includes(name)) {
          await updateDoc(userRef, { participants: arrayUnion(name) });
        }
      }
    };
    joinRoom();
  }, [roomId, router]);

  // Listen for room data
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'draftRooms', roomId), (docSnap) => {
      const roomData = { id: docSnap.id, ...docSnap.data() };
      const previousStatus = room?.status;
      setRoom(roomData);
      setParticipants(roomData?.participants || []);
      setDraftOrder(roomData?.draftOrder || []);
      setDraftOrderTimestamp(roomData?.draftOrderTimestamp || null);
      setDraftSettings({
        timerSeconds: roomData?.settings?.timerSeconds || 30,
        totalRounds: roomData?.settings?.totalRounds || 18
      });
      
      // Safety check: if room status changed from 'completed' to 'waiting', clear picks
      if (previousStatus === 'completed' && roomData?.status === 'waiting') {
        console.log(`[ROOM ${roomId}] Room reset from completed to waiting - clearing picks`);
        clearPicksForRoom();
      }
      
      // Additional safety: if room is in 'waiting' status and there are picks, clear them
      if (roomData?.status === 'waiting' && picks.length > 0) {
        console.log(`[ROOM ${roomId}] Room is in waiting status but has ${picks.length} picks - clearing picks`);
        clearPicksForRoom();
      }
      
      // Verify picks belong to this room
      verifyAndCleanPicks();
    }, (error) => {
      console.error(`[ROOM ${roomId}] Error listening to room data:`, error);
      if (error.code === 'failed-precondition') {
        alert('Firebase connection error. Please check your internet connection and try again.');
      }
    });
    return () => unsub();
  }, [roomId]);

  // Periodic verification that no drafted players are in available list
  useEffect(() => {
    if (!isDraftActive && room?.status !== 'waiting') return;
    
    const verificationInterval = setInterval(() => {
      const pickedNames = picks.map(p => p.player);
      const invalidAvailablePlayers = availablePlayers.filter(p => pickedNames.includes(p.name));
      
      if (invalidAvailablePlayers.length > 0) {
        console.error(`🚨 PERIODIC CHECK: Found ${invalidAvailablePlayers.length} drafted players in available list:`, 
          invalidAvailablePlayers.map(p => p.name));
        
        // Force refresh available players
        const cleanAvailablePlayers = PLAYER_POOL.filter(p => !pickedNames.includes(p.name));
        setAvailablePlayers(cleanAvailablePlayers);
        console.log(`[ROOM ${roomId}] Forced refresh of available players`);
      } else {
        console.log(`✅ Periodic check passed: No drafted players in available list`);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(verificationInterval);
  }, [picks, availablePlayers, isDraftActive, room?.status, roomId]);

  // Force update available players whenever picks change
  useEffect(() => {
    const pickedNames = picks.map(p => p.player);
    const filteredAvailable = PLAYER_POOL.filter(p => !pickedNames.includes(p.name));
    setAvailablePlayers(filteredAvailable);
  }, [picks]);

  // Listen for picks
  useEffect(() => {
    if (!roomId) return;
    const picksQuery = query(collection(db, 'draftRooms', roomId, 'picks'), orderBy('pickNumber'));
    const unsub = onSnapshot(picksQuery, (snap) => {
      const picksArr = snap.docs.map(doc => doc.data());
      setPicks(picksArr);
      // Remove picked players from available
      const pickedNames = picksArr.map(p => p.player);
      const filteredAvailable = PLAYER_POOL.filter(p => !pickedNames.includes(p.name));
      setAvailablePlayers(filteredAvailable);
      
      // Debug logging
      console.log(`[ROOM ${roomId}] Picks updated:`, picksArr.length, 'picks');
      console.log(`[ROOM ${roomId}] Picked names:`, pickedNames);
      console.log(`[ROOM ${roomId}] Available players before filter:`, PLAYER_POOL.length);
      console.log(`[ROOM ${roomId}] Available players after filter:`, filteredAvailable.length);
      console.log(`[ROOM ${roomId}] Sample picked player:`, pickedNames[0]);
      console.log(`[ROOM ${roomId}] Sample available player:`, filteredAvailable[0]);
      
      // Additional safety check: verify picks belong to this room
      const invalidPicks = picksArr.filter(pick => !pick.roomId || pick.roomId !== roomId);
      if (invalidPicks.length > 0) {
        console.warn(`[ROOM ${roomId}] Found ${invalidPicks.length} picks that don't belong to this room:`, invalidPicks);
      }
    }, (error) => {
      console.error(`[ROOM ${roomId}] Error listening to picks:`, error);
      if (error.code === 'failed-precondition') {
        alert('Firebase connection error. Please check your internet connection and try again.');
      }
    });
    return () => unsub();
  }, [roomId]);

  // Load rankings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('draftRankings');
    if (stored) {
      setRankings(JSON.parse(stored));
    }
  }, []);

  // Load queue from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('draftQueue');
    if (stored) {
      setQueue(JSON.parse(stored));
    }
  }, []);

  // Save rankings to localStorage
  const handleRankingsUpload = (e) => {
    e.preventDefault();
    const lines = rankingsText
      .split(/\n|,/)
      .map(l => l.trim())
      .filter(Boolean);
    setRankings(lines);
    localStorage.setItem('draftRankings', JSON.stringify(lines));
    setRankingsText('');
  };

  // Handle CSV file upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text
        .split(/\n|,/)
        .map(l => l.trim())
        .filter(Boolean);
      setRankings(lines);
      localStorage.setItem('draftRankings', JSON.stringify(lines));
    };
    reader.readAsText(file);
  };

  // Clear/reset rankings
  const clearRankings = () => {
    setRankings([]);
    localStorage.removeItem('draftRankings');
  };

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem('draftQueue', JSON.stringify(queue));
  }, [queue]);

  // Add to queue
  const addToQueue = (player) => {
    console.log('Adding player to queue:', player);
    if (!queue.find(p => p.name === player.name)) {
      const newQueue = [...queue, player];
      console.log('New queue:', newQueue);
      setQueue(newQueue);
    }
  };
  
  // Remove from queue
  const removeFromQueue = (player) => {
    setQueue(queue.filter(p => p.name !== player.name));
  };

  // Draft order management
  const setDraftOrderForRoom = async (newOrder) => {
    const roomRef = doc(db, 'draftRooms', roomId);
    await updateDoc(roomRef, { draftOrder: newOrder });
    setShowDraftOrderModal(false);
  };

  const randomizeDraftOrder = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    setDraftOrder(shuffled);
  };

  // Update draft settings
  const updateDraftSettings = async () => {
    const roomRef = doc(db, 'draftRooms', roomId);
    await updateDoc(roomRef, {
      settings: draftSettings
    });
    setShowSettingsModal(false);
  };

  // Draft order: use custom order if set, otherwise simple snake draft
  const totalRounds = room?.settings?.totalRounds || 18;
  const effectiveDraftOrder = draftOrder.length > 0 ? draftOrder : participants;
  const totalPicks = totalRounds * effectiveDraftOrder.length;
  const currentPickNumber = picks.length + 1;
  const currentRound = Math.ceil(currentPickNumber / effectiveDraftOrder.length);
  
  // Snake draft logic: odd rounds go forward, even rounds go backward
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndex = (currentPickNumber - 1) % effectiveDraftOrder.length;
  const currentPicker = isSnakeRound
    ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
    : effectiveDraftOrder[pickIndex];
  const isMyTurn = 'Not Todd Middleton' === currentPicker;
  const isDraftActive = room?.status === 'active';

  // Timer logic
  useEffect(() => {
    if (!isDraftActive || picks.length >= totalPicks) {
      setTimer(room?.settings?.timerSeconds || 30);
      clearInterval(timerRef.current);
      return;
    }
    
    // Get current picker
    const currentPicker = effectiveDraftOrder[pickIndex];
    const mockDrafterNames = room?.mockDrafters || [];
    const isMockDrafter = currentPicker && currentPicker !== userName && mockDrafterNames.includes(currentPicker);
    
    console.log('⏰ TIMER LOGIC:', {
      isMyTurn,
      isMockDrafter,
      currentPicker,
      userName,
      timer,
      isDraftActive,
      picksLength: picks.length,
      totalPicks
    });
    
    // Timer should count down for both current user and mock drafters
    if (isMyTurn || isMockDrafter) {
      setTimer(room?.settings?.timerSeconds || 30);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      // Reset timer when it's not our turn
      setTimer(room?.settings?.timerSeconds || 30);
      clearInterval(timerRef.current);
    }
  }, [isMyTurn, isDraftActive, picks.length, totalPicks, room?.settings?.timerSeconds, currentPicker, room?.mockDrafters, userName]);

  // Skip pick if timer runs out
  useEffect(() => {
    if (timer === 0 && isMyTurn && isDraftActive && availablePlayers.length > 0) {
      console.log('🚨 TIMER EXPIRED - TRIGGERING AUTO-PICK:', {
        timer,
        isMyTurn,
        isDraftActive,
        availablePlayersLength: availablePlayers.length,
        currentPickNumber,
        currentRound
      });
      
      const autoPick = getAutoPickPlayer();
      
      if (!autoPick) {
        console.error(`[ROOM ${roomId}] No valid auto-pick available for ${userName} - autodraft limits reached`);
        // Alert the user and extend timer by 30 seconds
        alert(`No valid players available for autodraft. You have reached autodraft position limits (3QB, 6RB, 7WR, 3TE). Please manually select a player.`);
        setTimer(30); // Give 30 more seconds
        return;
      }
      
      console.log(`[ROOM ${roomId}] Timer expired for ${userName}, auto-picking: ${autoPick.name}`);
      makeAutoPick(autoPick.name);
    }
  }, [timer, isMyTurn, isDraftActive, availablePlayers, rankings, queue]);

  // Check for draft completion
  useEffect(() => {
    if (picks.length >= totalPicks && isDraftActive) {
      console.log('🏁 DRAFT COMPLETION DETECTED:', {
        picksLength: picks.length,
        totalPicks,
        isDraftActive,
        isRoomOwner,
        roomId
      });
      
      // Mark draft as completed and clear picks to prevent reuse
      const completeDraft = async () => {
        try {
          // First mark as completed
          await updateDoc(doc(db, 'draftRooms', roomId), {
            status: 'completed',
            completedAt: new Date()
          });

          console.log(`✅ Draft marked as completed for room ${roomId}`);

          // Only room owner should save team and clear picks
          if (isRoomOwner) {
            // Save user's drafted team to Firestore
            const userId = 'Not Todd Middleton';
            const userPicks = picks.filter(p => p.user === userId);
            const players = userPicks.map(p => p.player);
            // Optionally, group by position for easier display
            const playerDetails = userPicks.map(p => {
              const playerObj = PLAYER_POOL.find(pl => pl.name === p.player);
              return playerObj ? { name: playerObj.name, position: playerObj.position, team: playerObj.team, pickNumber: p.pickNumber } : { name: p.player };
            });
            await addDoc(collection(db, 'teams'), {
              userId,
              name: room?.name || 'My Team',
              tournament: 'Top Dog',
              players: playerDetails,
              createdAt: new Date(),
          });
          
          // Then clear picks to prevent them from appearing in future drafts
          await clearPicksForRoom();
          
            console.log(`✅ Draft completed, team saved, and picks cleared for room ${roomId}`);
          }
        } catch (error) {
          console.error('❌ Error completing draft:', error);
        }
      };
      
      completeDraft();
    }
  }, [picks.length, totalPicks, isDraftActive, isRoomOwner, roomId]);

  // Positional limits
  const POSITIONAL_LIMITS = {
    QB: 5,
    RB: 11,
    WR: 11,
    TE: 6
  };

  // Function to check if a player can be drafted based on positional limits
  const canDraftPlayer = (player) => {
    const userPicks = picks.filter(pick => pick.user === userName);
    const userRoster = groupPicksByPosition(userPicks.map(p => p.player), PLAYER_POOL);
    
    const playerData = PLAYER_POOL.find(p => p.name === player);
    if (!playerData) return false;
    
    const currentCount = userRoster[playerData.position]?.length || 0;
    const limit = POSITIONAL_LIMITS[playerData.position];
    
    return currentCount < limit;
  };

  const makePick = async (player) => {
    console.log('🎯 MAKE PICK CALLED:', {
      player,
      pickLoading,
      pickInProgress: pickInProgressRef.current,
      isMyTurn,
      isDraftActive,
      currentPickNumber,
      currentRound
    });
    
    if (!isMyTurn) {
      console.log('❌ PICK BLOCKED: Not your turn');
      return;
    }
    
    if (pickLoading || pickInProgressRef.current) {
      console.log('❌ PICK BLOCKED: Pick already in progress');
      return;
    }
    
    if (!canDraftPlayer(player)) {
      const playerData = PLAYER_POOL.find(p => p.name === player);
      const limit = POSITIONAL_LIMITS[playerData.position];
      alert(`Cannot draft ${player}. You already have ${limit} ${playerData.position}s. Maximum allowed: ${limit}.`);
      return;
    }
    
    try {
      pickInProgressRef.current = true;
      setPickLoading(true);
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(currentPickNumber));
      await setDoc(pickRef, {
        pickNumber: currentPickNumber,
        round: currentRound,
        user: userName,
        player,
        roomId: roomId,
        timestamp: Date.now(),
      });
      console.log(`[ROOM ${roomId}] Made pick: ${player} by ${userName} (pick #${currentPickNumber})`);
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error making pick:`, error);
      alert('Error making pick. Please try again.');
    } finally {
      setPickLoading(false);
      pickInProgressRef.current = false;
    }
  };

  // Auto-pick function that bypasses turn checks
  const makeAutoPick = async (player) => {
    console.log('🤖 AUTO PICK CALLED:', {
      player,
      pickLoading,
      pickInProgress: pickInProgressRef.current,
      isDraftActive,
      currentPickNumber,
      currentRound,
      userName
    });
    
    if (pickLoading || !isDraftActive || pickInProgressRef.current) {
      console.log('❌ AUTO PICK BLOCKED:', {
        reason: pickLoading ? 'pick loading' : 
                !isDraftActive ? 'draft not active' : 
                'pick in progress'
      });
      return;
    }
    
    try {
      pickInProgressRef.current = true;
      setPickLoading(true);
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(currentPickNumber));
      await setDoc(pickRef, {
        pickNumber: currentPickNumber,
        round: currentRound,
        user: userName,
        player,
        roomId: roomId,
        timestamp: Date.now(),
      });
      console.log(`[ROOM ${roomId}] Auto-pick made: ${player} by ${userName} (pick #${currentPickNumber})`);
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error making auto-pick:`, error);
    } finally {
      setPickLoading(false);
      pickInProgressRef.current = false;
    }
  };

  // Determine who would be auto-picked
  const getAutoPickPlayer = () => {
    // Get current user's roster to check position counts
    const userPicks = picks.filter(pick => pick.user === userName);
    const userRoster = userPicks.map(pick => {
      const playerData = PLAYER_POOL.find(p => p.name === pick.player);
      return playerData?.position || 'UNK';
    });
    
    const positionCounts = {
      QB: userRoster.filter(pos => pos === 'QB').length,
      RB: userRoster.filter(pos => pos === 'RB').length,
      WR: userRoster.filter(pos => pos === 'WR').length,
      TE: userRoster.filter(pos => pos === 'TE').length
    };
    
    // Autodraft position maximums
    const AUTODRAFT_LIMITS = {
      QB: 3,
      RB: 6,
      WR: 7,
      TE: 3
    };
    
    // Filter available players to only those that can be drafted within autodraft limits
    let draftablePlayers = availablePlayers.filter(player => {
      const currentCount = positionCounts[player.position] || 0;
      const limit = AUTODRAFT_LIMITS[player.position];
      return currentCount < limit;
    });
    
    // If no players within autodraft limits, fall back to regular draftable players
    if (draftablePlayers.length === 0) {
      draftablePlayers = availablePlayers.filter(player => canDraftPlayer(player.name));
    }
    
    if (draftablePlayers.length === 0) {
      return null; // Only return null if truly no players can be drafted
    }
    
    // Sort draftable players by ADP (lowest ADP first)
    draftablePlayers.sort((a, b) => (a.adp || 999) - (b.adp || 999));
    
    // 1. From queue (if draftable) - still respect queue priority
    const queued = queue.find(p => draftablePlayers.find(ap => ap.name === p.name));
    if (queued) return queued;
    
    // 2. From rankings (if draftable) - still respect rankings priority
    if (rankings.length > 0) {
      const rankedPlayer = draftablePlayers.find(p => rankings.includes(p.name));
      if (rankedPlayer) return rankedPlayer;
    }
    
    // 3. Best available player by ADP
    return draftablePlayers[0];
  };
  
  const autoPickPlayer = getAutoPickPlayer();

  // Handle drag end for queue
  const onDragEnd = (result) => {
    console.log('Drag end result:', result);
    if (!result.destination) {
      console.log('No destination, returning');
      return;
    }
    console.log('Updating queue from drag and drop');
    const newQueue = Array.from(queue);
    const [removed] = newQueue.splice(result.source.index, 1);
    newQueue.splice(result.destination.index, 0, removed);
    setQueue(newQueue);
    console.log('New queue:', newQueue);
  };

  // Handle drag end specifically for queue
  const onQueueDragEnd = (result) => {
    console.log('Queue drag end result:', result);
    if (!result.destination) {
      console.log('No destination for queue drag, returning');
      return;
    }
    console.log('Updating queue from queue drag and drop');
    const newQueue = Array.from(queue);
    const [removed] = newQueue.splice(result.source.index, 1);
    newQueue.splice(result.destination.index, 0, removed);
    setQueue(newQueue);
    console.log('New queue after drag:', newQueue);
  };

  // Handle drag end for draft order
  const onDraftOrderDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(draftOrder);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setDraftOrder(newOrder);
  };

  // Auto-randomize draft order when room is filled
  useEffect(() => {
    console.log('Auto-start check:', {
      participantsLength: participants.length,
      roomStatus: room?.status,
      isRoomOwner,
      draftOrderLength: draftOrder.length
    });
    
    if (participants.length >= 1 && room?.status === 'waiting' && isRoomOwner && draftOrder.length === 0) {
      console.log('Starting draft automatically with 1 participant for testing');
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const timestamp = new Date();
      setDraftOrder(shuffled);
      setDraftOrderTimestamp(timestamp);
      setShowRandomizationNotification(true);
      setPreDraftCountdown(60); // Start 60-second countdown
      
      // Save the randomized order but don't start draft yet
      updateDoc(doc(db, 'draftRooms', roomId), { 
        draftOrder: shuffled,
        draftOrderTimestamp: timestamp
      });
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowRandomizationNotification(false);
      }, 5000);
    }
  }, [participants.length, room?.status, isRoomOwner, draftOrder.length, roomId]);

  // Reset countdown when draft order is set
  useEffect(() => {
    if (draftOrder.length > 0 && room?.status === 'waiting') {
      setPreDraftCountdown(60);
    }
  }, [draftOrder.length, room?.status]);

  // Pre-draft countdown timer
  useEffect(() => {
    if (draftOrder.length > 0 && room?.status === 'waiting' && preDraftCountdown > 0) {
      const countdown = setInterval(() => {
        setPreDraftCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            // Start the draft automatically when timer expires
            updateDoc(doc(db, 'draftRooms', roomId), {
              status: 'active',
              startedAt: new Date()
            });
            return 0;
          }
          
          // Play sound effects for countdown
          if (prev <= 10) {
            try {
              const ticking = new Audio('/ticking.mp3');
              ticking.volume = 0.3;
              ticking.play().catch(() => {});
            } catch (error) {
              console.log('Audio not supported');
            }
          }
          
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [draftOrder.length, room?.status, preDraftCountdown, roomId]);

  // 2. Sound/vibration alerts
  useEffect(() => {
    if (isMyTurn && timer === (room?.settings?.timerSeconds || 30)) {
      // Play sound when your turn starts
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Fallback to ticking sound if notification fails
          const ticking = new Audio('/ticking.mp3');
          ticking.volume = 0.5;
          ticking.play().catch(() => {});
        });
      } catch (error) {
        console.log('Audio not supported');
      }
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    }
    if (isMyTurn && timer > 0 && timer <= 5) {
      // Play ticking sound and vibrate when timer is low
      try {
        const ticking = new Audio('/ticking.mp3');
        ticking.volume = 0.3;
        ticking.play().catch(() => {});
      } catch (error) {
        console.log('Audio not supported');
      }
      if (window.navigator.vibrate) window.navigator.vibrate([100, 100, 100]);
    }
  }, [isMyTurn, timer, room?.settings?.timerSeconds]);

  // 2. Draft board grid helpers
  const maxTeams = 12;
  const gridParticipants = [...effectiveDraftOrder];
  while (gridParticipants.length < maxTeams) gridParticipants.push('---');
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const picksByTeam = gridParticipants.map(team =>
    rounds.map(round => picks.find(p => p.user === team && p.round === round)?.player || '')
  );

  // Get team roster for any team
  const getTeamRoster = (teamName) => {
    return picks.filter(pick => pick.user === teamName).map(pick => pick.player);
  };

  // Get grouped roster for any team
  const getTeamRosterGrouped = (teamName) => {
    const teamPicks = getTeamRoster(teamName);
    return groupPicksByPosition(teamPicks, PLAYER_POOL);
  };

  // Get starting lineup for any team
  const getTeamStartingLineup = (teamName) => {
    const userPicks = picks.filter(pick => pick.user === teamName);
    const assignedPlayers = new Set();
    const lineup = {
      QB: [],
      RB: [],
      WR: [],
      TE: [],
      FLEX: []
    };

    // Helper function to assign player to position if available and not already assigned
    const assignPlayer = (player, position) => {
      if (!assignedPlayers.has(player.name)) {
        lineup[position].push(player);
        assignedPlayers.add(player.name);
        return true;
      }
      return false;
    };

    // Process players in draft order
    userPicks.forEach(pick => {
      const playerData = PLAYER_POOL.find(p => p.name === pick.player);
      if (!playerData) return;

      const player = {
        name: pick.player,
        position: playerData.position,
        team: playerData.team,
        bye: playerData.bye,
        adp: playerData.adp
      };

      // Try to assign to position-specific spot first
      if (player.position === 'QB' && lineup.QB.length < 1) {
        assignPlayer(player, 'QB');
      } else if (player.position === 'RB' && lineup.RB.length < 2) {
        assignPlayer(player, 'RB');
      } else if (player.position === 'WR' && lineup.WR.length < 3) {
        assignPlayer(player, 'WR');
      } else if (player.position === 'TE' && lineup.TE.length < 1) {
        assignPlayer(player, 'TE');
      }
      // If position-specific spots are full or player is RB/WR/TE, try FLEX
      else if (['RB', 'WR', 'TE'].includes(player.position) && lineup.FLEX.length < 2) {
        assignPlayer(player, 'FLEX');
      }
    });

    return lineup;
  };

  const openTeamModal = (teamName) => {
    setSelectedTeam(teamName);
    setShowTeamModal(true);
  };

  // Get current user's roster
  const myRoster = getTeamRoster(userName);
  const myRosterGrouped = getTeamRosterGrouped(userName);

  // Function to assign players to starting lineup positions without duplication
  const getStartingLineup = () => {
    const userPicks = picks.filter(pick => pick.user === userName);
    const assignedPlayers = new Set();
    const lineup = {
      QB: [],
      RB: [],
      WR: [],
      TE: [],
      FLEX: []
    };

    // Helper function to assign player to position if available and not already assigned
    const assignPlayer = (player, position) => {
      if (!assignedPlayers.has(player.name)) {
        lineup[position].push(player);
        assignedPlayers.add(player.name);
        return true;
      }
      return false;
    };

    // Process players in draft order
    userPicks.forEach(pick => {
      const playerData = PLAYER_POOL.find(p => p.name === pick.player);
      if (!playerData) return;

      const player = {
        name: pick.player,
        position: playerData.position,
        team: playerData.team,
        bye: playerData.bye,
        adp: playerData.adp
      };

      // Try to assign to position-specific spot first
      if (player.position === 'QB' && lineup.QB.length < 1) {
        assignPlayer(player, 'QB');
      } else if (player.position === 'RB' && lineup.RB.length < 2) {
        assignPlayer(player, 'RB');
      } else if (player.position === 'WR' && lineup.WR.length < 3) {
        assignPlayer(player, 'WR');
      } else if (player.position === 'TE' && lineup.TE.length < 1) {
        assignPlayer(player, 'TE');
      }
      // If position-specific spots are full or player is RB/WR/TE, try FLEX
      else if (['RB', 'WR', 'TE'].includes(player.position) && lineup.FLEX.length < 2) {
        assignPlayer(player, 'FLEX');
      }
    });

    return lineup;
  };

  const startingLineup = getStartingLineup();

  // Calculate draft statistics
  const getDraftStats = () => {
    const stats = {
      totalPicks: picks.length,
      totalPossible: totalPicks,
      percentComplete: Math.round((picks.length / totalPicks) * 100),
      averagePickTime: 0,
      fastestPick: null,
      slowestPick: null
    };

    if (picks.length > 1) {
      const pickTimes = [];
      for (let i = 1; i < picks.length; i++) {
        const timeDiff = picks[i].timestamp - picks[i-1].timestamp;
        pickTimes.push(timeDiff);
      }
      
      if (pickTimes.length > 0) {
        stats.averagePickTime = Math.round(pickTimes.reduce((a, b) => a + b, 0) / pickTimes.length / 1000);
        stats.fastestPick = Math.min(...pickTimes) / 1000;
        stats.slowestPick = Math.max(...pickTimes) / 1000;
      }
    }

    return stats;
  };

  const draftStats = getDraftStats();

  // Calculate upcoming picks for snake draft
  const getUpcomingPicks = () => {
    if (!isDraftActive || picks.length >= totalPicks) return [];
    
    const upcoming = [];
    const roundsToShow = 3;
    
    for (let roundOffset = 0; roundOffset < roundsToShow; roundOffset++) {
      const futureRound = currentRound + roundOffset;
      const futurePickNumber = (futureRound - 1) * effectiveDraftOrder.length + 1;
      
      if (futurePickNumber > totalPicks) break;
      
      const isSnakeRound = futureRound % 2 === 0;
      const roundPicks = [];
      
      for (let pickInRound = 0; pickInRound < effectiveDraftOrder.length; pickInRound++) {
        const actualPickNumber = futurePickNumber + pickInRound;
        if (actualPickNumber > totalPicks) break;
        
        const pickIndex = pickInRound;
        const picker = isSnakeRound
          ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
          : effectiveDraftOrder[pickIndex];
        
        roundPicks.push({
          pickNumber: actualPickNumber,
          picker: picker,
          round: futureRound
        });
      }
      
      upcoming.push({
        round: futureRound,
        picks: roundPicks
      });
    }
    
    return upcoming;
  };

  const upcomingPicks = getUpcomingPicks();

  // Filter available players based on search and position
  const pickedPlayerNames = picks.map(p => p.player);
  
  // Get truly available players (not drafted) - MULTIPLE LAYERS OF PROTECTION
  const trulyAvailablePlayers = PLAYER_POOL.filter(p => {
    // Layer 1: Check against current picks
    if (pickedPlayerNames.includes(p.name)) {
      console.warn(`[FILTER] Player ${p.name} found in picks - removing from available`);
      return false;
    }
    // Layer 2: Double-check against availablePlayers state
    const isInAvailablePlayers = availablePlayers.find(ap => ap.name === p.name);
    if (!isInAvailablePlayers) {
      console.warn(`[FILTER] Player ${p.name} not in availablePlayers state - removing from available`);
      return false;
    }
    return true;
  });
  
  let finalFilteredPlayers = trulyAvailablePlayers.filter(player => {
    // Layer 3: Final safety check in filtered list
    if (pickedPlayerNames.includes(player.name)) {
      console.error(`[FILTER] CRITICAL ERROR: Drafted player ${player.name} found in filtered list`);
      return false;
    }
    const matchesSearch = player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
                         player.team.toLowerCase().includes(playerSearch.toLowerCase());
    const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  }).sort((a, b) => {
    if (sortBy === 'adp') {
      return (a.adp || 999) - (b.adp || 999);
    } else if (sortBy === 'rankings') {
      const aRank = rankings.indexOf(a.name);
      const bRank = rankings.indexOf(b.name);
      // If both players are in rankings, sort by ranking position
      if (aRank !== -1 && bRank !== -1) {
        return aRank - bRank;
      }
      // If only one player is in rankings, prioritize ranked players
      if (aRank !== -1 && bRank === -1) return -1;
      if (aRank === -1 && bRank !== -1) return 1;
      // If neither player is in rankings, fall back to ADP
      return (a.adp || 999) - (b.adp || 999);
    }
    return 0;
  });

  // Enhanced debug logging
  console.log('=== PLAYER FILTERING DEBUG ===');
  console.log('Total PLAYER_POOL size:', PLAYER_POOL.length);
  console.log('Current picks count:', picks.length);
  console.log('Picked player names:', pickedPlayerNames);
  console.log('Available players state count:', availablePlayers.length);
  console.log('Truly available players count:', trulyAvailablePlayers.length);
  console.log('Filtered players count:', finalFilteredPlayers.length);
  
  // Check for any drafted players in the filtered list
  const draftedInFiltered = finalFilteredPlayers.filter(player => pickedPlayerNames.includes(player.name));
  if (draftedInFiltered.length > 0) {
    console.error('🚨 CRITICAL ERROR: Found drafted players in filtered list:', draftedInFiltered.map(p => p.name));
    // Force remove them from the filtered list
    finalFilteredPlayers = finalFilteredPlayers.filter(player => !pickedPlayerNames.includes(player.name));
    console.log('Cleaned filtered players count:', finalFilteredPlayers.length);
  } else {
    console.log('✅ No drafted players found in filtered list');
  }
  
  // Additional safety check: verify no duplicates
  const playerNames = finalFilteredPlayers.map(p => p.name);
  const uniqueNames = new Set(playerNames);
  if (playerNames.length !== uniqueNames.size) {
    console.warn('⚠️ Duplicate players found in filtered list, removing duplicates');
    const seen = new Set();
    finalFilteredPlayers = finalFilteredPlayers.filter(player => {
      if (seen.has(player.name)) {
        return false;
      }
      seen.add(player.name);
      return true;
    });
  }
  
  console.log('Sample available player:', availablePlayers[0]);
  console.log('Sample truly available player:', trulyAvailablePlayers[0]);
  console.log('Sample filtered player:', finalFilteredPlayers[0]);
  console.log('Rankings count:', rankings.length);
  console.log('Sample player with ADP:', finalFilteredPlayers[0]);
  console.log('Sample rankings:', rankings.slice(0, 5));
  console.log('Queue count:', queue.length);
  console.log('Queue data:', queue);
  console.log('=== END PLAYER FILTERING DEBUG ===');

  // Mock draft function
  const startMockDraft = async () => {
    setMockDraftSpeed(true);
    try {
      // Get 11 simulated drafter names from the index
      const mockDrafters = getRandomMockDrafters();
      
      if (mockDrafters.length === 0) {
        alert('No mock drafter names available. Please add names to the mock drafter index.');
        return;
      }
      
      // Add current user (as "Not Todd Middleton") and mock drafters to participants
      const allParticipants = ['Not Todd Middleton', ...mockDrafters];
      
      // Randomize draft order
      const shuffledOrder = [...allParticipants].sort(() => Math.random() - 0.5);
      
      // Update room with participants and draft order - LAUNCH WITH COUNTDOWN
      await updateDoc(doc(db, 'draftRooms', roomId), {
        participants: allParticipants,
        draftOrder: shuffledOrder,
        draftOrderTimestamp: new Date(),
        status: 'waiting', // Start in waiting status to trigger countdown
        startedAt: null, // Will be set when countdown completes
        mockDrafters: mockDrafters // Store mock drafter names for detection
      });
      
      // Set local state to trigger countdown
      setDraftOrder(shuffledOrder);
      setDraftOrderTimestamp(new Date());
      setPreDraftCountdown(60);
      
      console.log('Mock draft launched with countdown - participants:', allParticipants);
      console.log('Draft order:', shuffledOrder);
      console.log('Mock drafters:', mockDrafters);
      console.log('Draft will start in 60 seconds...');
      
    } catch (error) {
      console.error('Error starting mock draft:', error);
      alert('Error starting mock draft. Please try again.');
    }
  };

  // Auto-pick for mock drafters
  const makeMockPick = async (mockDrafter, pickNumber, round) => {
    console.log('🎲 STARTING MOCK PICK:', {
      mockDrafter,
      pickNumber,
      round,
      currentPickLoading: pickLoading,
      pickInProgress: pickInProgressRef.current,
      timestamp: new Date().toISOString()
    });
    
    // Defensive check: if a pick is already in progress, don't start another
    if (pickInProgressRef.current) {
      console.log('❌ MOCK PICK BLOCKED: Pick already in progress');
      return;
    }
    
    // Defensive check: if pickLoading is already true, don't start another
    if (pickLoading) {
      console.log('❌ MOCK PICK BLOCKED: pickLoading already true');
      return;
    }
    
    // Defensive check: if this pick number has already been processed, don't make it again
    if (picks.length >= pickNumber) {
      console.log('❌ MOCK PICK BLOCKED: Pick number already processed', {
        requestedPickNumber: pickNumber,
        currentPicksLength: picks.length
      });
      return;
    }
    
    try {
      pickInProgressRef.current = true;
      setPickLoading(true);
      console.log('🔒 SET PICK LOADING TO TRUE');
      
      // Get available players (excluding already picked ones)
      const pickedPlayers = picks.map(p => p.player);
      const availableForMock = PLAYER_POOL.filter(p => !pickedPlayers.includes(p.name));
      
      console.log('📊 AVAILABLE PLAYERS FOR MOCK:', {
        totalPicked: pickedPlayers.length,
        availableCount: availableForMock.length,
        sampleAvailable: availableForMock.slice(0, 3).map(p => p.name)
      });
      
      if (availableForMock.length === 0) {
        console.error('❌ No available players for mock pick');
        setPickLoading(false);
        pickInProgressRef.current = false;
        return;
      }
      
      // Simple mock draft strategy: pick best available by ADP
      const bestAvailable = availableForMock.sort((a, b) => (a.adp || 999) - (b.adp || 999))[0];
      
      console.log('🎯 SELECTED PLAYER FOR MOCK PICK:', {
        player: bestAvailable.name,
        position: bestAvailable.position,
        team: bestAvailable.team,
        adp: bestAvailable.adp
      });
      
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(pickNumber));
      await setDoc(pickRef, {
        pickNumber: pickNumber,
        round: round,
        user: mockDrafter,
        player: bestAvailable.name,
        roomId: roomId,
        timestamp: Date.now(),
      });
      
      console.log('✅ MOCK PICK COMPLETED:', {
        mockDrafter,
        player: bestAvailable.name,
        pickNumber,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ ERROR MAKING MOCK PICK:', error);
    } finally {
      console.log('🔓 SETTING PICK LOADING TO FALSE');
      setPickLoading(false);
      pickInProgressRef.current = false;
    }
  };

  // Auto-pick timer for mock drafters
  useEffect(() => {
    console.log('🚀 INSTANT PICK EFFECT TRIGGERED:', {
      isDraftActive,
      roomStatus: room?.status,
      picksLength: picks.length,
      totalPicks,
      mockDraftSpeed,
      effectiveDraftOrderLength: effectiveDraftOrder.length,
      pickIndex,
      currentPicker: effectiveDraftOrder[pickIndex],
      roomMockDrafters: room?.mockDrafters,
      pickLoading,
      currentPickNumber,
      currentRound,
      lastPickTimestamp: lastPickTimestampRef.current,
      timestamp: new Date().toISOString()
    });
    
    // Enhanced completion check - also check room status
    if (!isDraftActive || room?.status === 'completed' || picks.length >= totalPicks || !mockDraftSpeed) {
      console.log('❌ INSTANT PICK EFFECT EARLY RETURN:', {
        reason: !isDraftActive ? 'draft not active' : 
                room?.status === 'completed' ? 'room marked completed' :
                picks.length >= totalPicks ? 'draft complete' : 'mock speed off'
      });
      return;
    }
    
    const currentPicker = effectiveDraftOrder[pickIndex];
    const mockDrafterNames = room?.mockDrafters || [];
    const isMockDrafter = currentPicker && currentPicker !== 'Not Todd Middleton' && mockDrafterNames.includes(currentPicker);
    
    console.log('🎯 MOCK DRAFTER CHECK:', {
      currentPicker,
      mockDrafterNames,
      isMockDrafter,
      pickLoading,
      pickInProgress: pickInProgressRef.current,
      shouldMakePick: isMockDrafter && !pickLoading && !pickInProgressRef.current
    });

    if (isMockDrafter && !pickLoading && !pickInProgressRef.current) {
      // Debounce check: only trigger if at least 1 second has passed since last pick
      const now = Date.now();
      const timeSinceLastPick = now - lastPickTimestampRef.current;
      const minInterval = 1000; // 1 second minimum between picks
      
      if (timeSinceLastPick < minInterval) {
        console.log('⏱️ DEBOUNCE: Skipping pick trigger - too soon since last pick:', {
          timeSinceLastPick,
          minInterval,
          remaining: minInterval - timeSinceLastPick
        });
        return;
      }
      
      console.log('✅ MAKING MOCK PICK:', {
        mockDrafter: currentPicker,
        pickNumber: currentPickNumber,
        round: currentRound,
        timeSinceLastPick
      });
      
      // Update timestamp and trigger pick
      lastPickTimestampRef.current = now;
      setTimeout(() => {
          makeMockPick(currentPicker, currentPickNumber, currentRound);
      }, 2000); // 2 second delay for autodraft speed
    } else if (isMockDrafter && (pickLoading || pickInProgressRef.current)) {
      console.log('⏳ MOCK DRAFTER ON CLOCK BUT PICK IN PROGRESS:', {
        currentPicker,
        pickLoading,
        pickInProgress: pickInProgressRef.current
      });
      
      // More aggressive safety mechanism: if pickLoading is stuck for more than 2 seconds, force reset it
      setTimeout(() => {
        if (pickLoading && pickInProgressRef.current) {
          console.log('🚨 PICK LOADING STUCK - FORCING RESET (2s timeout)');
          setPickLoading(false);
          pickInProgressRef.current = false;
        }
      }, 2000);
    } else if (!isMockDrafter) {
      console.log('👤 NOT A MOCK DRAFTER OR USER TURN:', currentPicker);
    }
  }, [isDraftActive, picks.length, totalPicks, mockDraftSpeed, effectiveDraftOrder, pickIndex, room?.mockDrafters, currentPickNumber, currentRound]);

  // Additional debugging: Log every state change
  useEffect(() => {
    console.log('🔄 STATE CHANGE DETECTED:', {
      picksLength: picks.length,
      pickLoading,
      currentPickNumber,
      currentRound,
      isDraftActive,
      mockDraftSpeed,
      timestamp: new Date().toISOString()
    });
  }, [picks.length, pickLoading, currentPickNumber, currentRound, isDraftActive, mockDraftSpeed]);

  // Stall detection and recovery
  useEffect(() => {
    if (!isDraftActive || !mockDraftSpeed || picks.length >= totalPicks || room?.status === 'completed') return;

    const currentPicker = effectiveDraftOrder[pickIndex];
    const mockDrafterNames = room?.mockDrafters || [];
    const isMockDrafter = currentPicker && currentPicker !== 'Not Todd Middleton' && mockDrafterNames.includes(currentPicker);

    if (isMockDrafter) {
      console.log('🔍 STALL DETECTION: Mock drafter on clock, setting up stall monitor');
      
      const stallTimeout = setTimeout(() => {
        console.log('🚨 STALL DETECTED: Mock drafter has been on clock for 10+ seconds');
        console.log('🔄 FORCING PICK LOADING RESET AND RETRY');
        setPickLoading(false);
        pickInProgressRef.current = false;
        
        // Force a retry after a longer delay to allow state to settle
        setTimeout(() => {
          if (isDraftActive && mockDraftSpeed && picks.length < totalPicks && room?.status !== 'completed' && !pickInProgressRef.current) {
            console.log('🔄 STALL RECOVERY: Retrying mock pick after delay');
            makeMockPick(currentPicker, currentPickNumber, currentRound);
          } else {
            console.log('❌ STALL RECOVERY: Conditions not met for retry');
          }
        }, 2000); // 2 second delay before retry
      }, 10000); // 10 second stall threshold

      return () => clearTimeout(stallTimeout);
    }
  }, [isDraftActive, mockDraftSpeed, picks.length, totalPicks, room?.status, effectiveDraftOrder, pickIndex, room?.mockDrafters, currentPickNumber, currentRound]);

  // User turn stall detection and recovery
  useEffect(() => {
    if (!isDraftActive || picks.length >= totalPicks || room?.status === 'completed') return;

    const currentPicker = effectiveDraftOrder[pickIndex];
    const isUserTurn = currentPicker === 'Not Todd Middleton';

    if (isUserTurn && !pickLoading) {
      console.log('👤 USER TURN STALL DETECTION: User on clock, setting up stall monitor');
      
      const userStallTimeout = setTimeout(() => {
        console.log('🚨 USER TURN STALL DETECTED: User has been on clock for 15+ seconds');
        console.log('🔄 FORCING AUTO-PICK FOR USER');
        
        const autoPick = getAutoPickPlayer();
        if (autoPick) {
          console.log('🔄 USER STALL RECOVERY: Auto-picking for user:', autoPick.name);
          makeAutoPick(autoPick.name);
        } else {
          console.log('❌ USER STALL RECOVERY: No valid auto-pick available');
        }
      }, 15000); // 15 second stall threshold for user

      return () => clearTimeout(userStallTimeout);
    }
  }, [isDraftActive, picks.length, totalPicks, room?.status, effectiveDraftOrder, pickIndex, pickLoading]);

  // Auto-switch to user's team when it's their turn
  useEffect(() => {
    if (isMyTurn && isDraftActive) {
      setSelectedTeam('Not Todd Middleton');
    }
  }, [isMyTurn, isDraftActive]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTeamDropdown && !event.target.closest('.team-dropdown')) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTeamDropdown]);

  // Helper function to calculate dynamic color transition
  const getCountdownGradient = () => {
    return '#C4b5fe';
  };

  // Cleanup effect to reset pick progress when draft status changes
  useEffect(() => {
    // Reset pick progress when draft status changes
    if (room?.status === 'completed' || !isDraftActive) {
      console.log('🧹 CLEANUP: Resetting pick progress due to status change');
      pickInProgressRef.current = false;
    }
    
    // Cleanup function for component unmount
    return () => {
      console.log('🧹 CLEANUP: Component unmounting, resetting pick progress');
      pickInProgressRef.current = false;
    };
  }, [room?.status, isDraftActive]);

  // Early return for loading state - MUST be after all hooks
  if (!room) {
    // Check if we're still loading or if the room doesn't exist
    if (roomId) {
      return (
        <div className="min-h-screen bg-[#000F55] text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
            <p className="text-lg mb-4">The draft room "{roomId}" does not exist.</p>
            <p className="text-sm text-gray-300 mb-6">Please check the URL or create a new room.</p>
            <Link 
              href="/tournaments/topdog"
              className="bg-[#c4b5fd] text-[#000F55] px-6 py-3 rounded-lg font-bold hover:bg-[#2DE2C5] transition-colors"
            >
              Back to Tournaments
            </Link>
          </div>
        </div>
      );
    }
    return <div className="min-h-screen bg-[#000F55] text-white flex items-center justify-center">Loading...</div>;
  }

  // Get current team's data
  const currentTeamRoster = getTeamRoster(selectedTeam);
  const currentTeamRosterGrouped = getTeamRosterGrouped(selectedTeam);
  const currentTeamStartingLineup = getTeamStartingLineup(selectedTeam);

  // Debug rendering
  console.log('=== RENDERING DEBUG ===');
  console.log('Room:', room);
  console.log('Is draft active:', isDraftActive);
  console.log('Available players count:', availablePlayers.length);
  console.log('Filtered players count:', finalFilteredPlayers.length);
  console.log('Picks count:', picks.length);
  console.log('Room status:', room?.status);
  console.log('======================');



  return (
    <div className="min-h-screen bg-[#18181A] text-white">
      {/* Removed header with Room Name and Full Board Link */}

      {/* Draft Completion Message */}
      {room?.status === 'completed' && (
        <>
          <div className="px-8 pb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 shadow-lg">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">🎉 Draft Complete!</h2>
                <p className="text-xl mb-4">
                  Congratulations! Your TopDog draft has finished successfully.
                </p>
                <p className="text-lg opacity-90">
                  Your team has been saved and you can view your roster below.
                </p>
          </div>
          </div>
        </div>
          <div className="px-8 pb-4">
            <FullDraftBoard
              room={room}
              picks={picks}
              participants={participants}
              draftOrder={draftOrder}
              PLAYER_POOL={PLAYER_POOL}
            />
      </div>
        </>
      )}

      {/* All Picks Display - Full Width */}
      {(isDraftActive || room?.status === 'waiting') && room?.status !== 'completed' && (
        <div className="pt-8 pb-0 bg-[#18181A]">
          <div ref={picksScrollRef} className="flex overflow-x-auto pb-0 hide-scrollbar" style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            height: 'calc(198px + 40px)'
          }}>
            {Array.from({ length: draftSettings.totalRounds * 12 }, (_, i) => {
              const pickNumber = i + 1;
              const round = Math.ceil(pickNumber / 12);
              const pickIndex = (pickNumber - 1) % 12;
              const isSnakeRound = round % 2 === 0;
              const teamIndex = isSnakeRound ? 12 - 1 - pickIndex : pickIndex;
              const team = effectiveDraftOrder[teamIndex] || `Team ${teamIndex + 1}`;
              const isCompleted = picks.length >= pickNumber;
              

              const isOnTheClock = pickNumber === picks.length + 1;
              // Robust player lookup (from FullDraftBoard)
              const findPlayerInPool = (playerName) => {
                if (!playerName || !PLAYER_POOL) return null;
                
                // Try exact match first
                let player = PLAYER_POOL.find(p => p.name === playerName);
                if (player) return player;
                
                // Try case-insensitive match
                player = PLAYER_POOL.find(p => p.name.toLowerCase() === playerName.toLowerCase());
                if (player) return player;
                
                // Try matching by last name (common format: "McBride" vs "Trey McBride")
                const lastName = playerName.split(' ').pop();
                if (lastName && lastName.length > 2) {
                  player = PLAYER_POOL.find(p => p.name.toLowerCase().includes(lastName.toLowerCase()));
                  if (player) return player;
                }
                
                // Try matching by first name + last name variations
                const nameParts = playerName.split(' ');
                if (nameParts.length >= 2) {
                  const firstName = nameParts[0];
                  const lastName = nameParts.slice(1).join(' ');
                  
                  // Try "First Last" format
                  player = PLAYER_POOL.find(p => {
                    const poolNameParts = p.name.split(' ');
                    if (poolNameParts.length >= 2) {
                      const poolFirstName = poolNameParts[0];
                      const poolLastName = poolNameParts.slice(1).join(' ');
                      return poolFirstName.toLowerCase() === firstName.toLowerCase() && 
                             poolLastName.toLowerCase() === lastName.toLowerCase();
                    }
                    return false;
                  });
                  if (player) return player;
                }
                
                // If still no match, try partial matching
                const normalizedPlayerName = playerName.toLowerCase().replace(/[^a-z\s]/g, '');
                player = PLAYER_POOL.find(p => {
                  const normalizedPoolName = p.name.toLowerCase().replace(/[^a-z\s]/g, '');
                  return normalizedPoolName.includes(normalizedPlayerName) || 
                         normalizedPlayerName.includes(normalizedPoolName);
                });
                if (player) return player;
                
                // Debug: log when player is not found
                console.warn(`Player not found: "${playerName}"`);
                return null;
              };
              const completedPick = picks[pickNumber - 1];
              const playerData = completedPick ? findPlayerInPool(completedPick.player) : null;
              
              // Debug logging for first few picks
              if (pickNumber <= 3) {
                console.log(`Pick ${pickNumber}:`, {
                  completedPick,
                  playerName: completedPick?.player,
                  playerData,
                  picksLength: picks.length,
                  isCompleted: picks.length >= pickNumber
                });
              }

              // Position color logic (from FullDraftBoard)
              const getPositionColor = (position) => {
                switch (position) {
                  case 'QB': return '#ef4444';
                  case 'RB': return '#8b5cf6';
                  case 'WR': return '#10b981';
                  case 'TE': return '#3b82f6';
                  default: return '#6b7280';
                }
              };
              // Team color bar logic (from FullDraftBoard)
              const getTeamPositionProportions = (teamIdx) => {
                // Get the team name for this team index
                const teamName = effectiveDraftOrder[teamIdx];
                const teamPicks = picks.filter(p => {
                  // Find all picks for this team by name
                  return p.user === teamName;
                });
                const positionCounts = {};
                let totalPicks = 0;
                teamPicks.forEach(pick => {
                  const pdata = findPlayerInPool(pick.player);
                  if (pdata && pdata.position) {
                    positionCounts[pdata.position] = (positionCounts[pdata.position] || 0) + 1;
                    totalPicks++;
                  } else {
                    console.warn(`Could not find position for player: ${pick.player}`);
                  }
                });
                
                // If no picks, show equal distribution for all positions
                if (totalPicks === 0) {
                  const positions = ['QB', 'RB', 'WR', 'TE'];
                  return positions.map(position => ({
                    position,
                    proportion: 0.25, // Equal 25% for each position
                    color: getPositionColor(position)
                  }));
                }
                
                const positions = ['QB', 'RB', 'WR', 'TE'];
                return positions.map(position => ({
                  position,
                  proportion: (positionCounts[position] || 0) / totalPicks,
                  color: getPositionColor(position)
                })).filter(prop => prop.proportion > 0);
              };
              // Team logo
              const logoIndex = teamIndex % logoOptions.length;
              const LogoComponent = logoOptions[logoIndex]?.component;
              const bgColor = logoOptions[logoIndex]?.bgColor;
              return (
                <div
                  key={i}
                  className="flex-shrink-0 text-center font-bold"
                  style={{
                    background: '#18181b',
                    color: '#fff',
                                            border: '6px solid #18181b',
                    padding: 0,
                    width: 168,
                    minWidth: 168,
                    maxWidth: 168,
                    height: 198,
                    minHeight: 198,
                    maxHeight: 198,
                    boxSizing: 'border-box',
                    position: 'relative',
                  }}
                >
                  <div className="min-h-full flex items-center justify-center w-full h-full">
                    {playerData ? (
                      // AFTER PICK: Player card style
                      <div
                        className="text-sm rounded w-full h-full flex flex-col justify-center items-center"
                        style={{
                          position: 'relative',
                          overflow: 'visible',
                          background: 'transparent',
                          height: '100%',
                          width: '100%',
                          boxSizing: 'border-box',
                          borderTop: `27px solid ${getPositionColor(playerData.position)}`,
                          borderLeft: `4px solid ${getPositionColor(playerData.position)}`,
                          borderRight: `4px solid ${getPositionColor(playerData.position)}`,
                          borderBottom: `4px solid ${getPositionColor(playerData.position)}`,
                          borderRadius: 8,
                          margin: 0,
                          padding: 0,
                          textAlign: 'left',
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* Team name label at the top */}
                        <div style={{
                            position: 'absolute',
                            top: -22,
                            left: 0,
                            right: 0,
                            height: 16,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            color: isOnTheClock ? '#000' : '#fff',
                            zIndex: 4,
                            pointerEvents: 'none',
                        }}>
                          <span>{(team.length > 18 ? team.slice(0, 17) + '…' : team).toUpperCase().replace(/\s/g, '')}</span>
                        </div>
                        {/* Pick number label below colored bar, top left */}
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          left: 0,
                          right: 0,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#fff',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          zIndex: 4,
                          pointerEvents: 'none',
                          marginBottom: '4px',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                        }}>
                          <span>{`${round}.${String(pickIndex + 1).padStart(2, '0')}`}</span>
                          <span>{pickNumber}</span>
                        </div>
                        {/* Logo for completed pick */}
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          left: 0,
                          right: 0,
                          height: 52,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 3,
                        }}>
                          {(() => {
                            if (!team || team === '---') return null;
                            const logoIndex = teamIndex % logoOptions.length;
                            const LogoComponent = logoOptions[logoIndex].component;
                            const bgColor = logoOptions[logoIndex].bgColor;
                                                          return <LogoComponent size={43} bgColor={bgColor} />;
                          })()}
                        </div>
                        {/* Player info for completed pick - positioned under logo */}
                                <div style={{ 
                          position: 'absolute',
                          top: 79,
                          left: 4,
                          right: 4,
                          fontSize: 12, 
                                    letterSpacing: 0.5, 
                          color: '#fff', 
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                          textAlign: 'center',
                          zIndex: 3,
                        }}>
                          {(() => {
                            if (!playerData.name) return null;
                            const nameParts = playerData.name.split(' ');
                            if (nameParts.length === 1) {
                              return <span>{playerData.name}</span>;
                            }
                            const firstName = nameParts[0];
                            const lastName = nameParts.slice(1).join(' ');
                            return <>
                              <span style={{ display: 'block', marginBottom: 0, lineHeight: 1, marginTop: 0 }}>{firstName}</span>
                              <span style={{ display: 'block', lineHeight: 1, marginBottom: 2 }}>{lastName}</span>
                            </>;
                          })()}
                        </div>
                        <div className="text-xs" style={{ 
                          position: 'absolute',
                          top: 110,
                          left: 4,
                          right: 4,
                          color: '#fff', 
                          fontWeight: 500, 
                          fontSize: 10, 
                          fontFamily: 'Futura, Helvetica, Arial, sans-serif',
                          textAlign: 'center',
                          zIndex: 3,
                        }}>
                          {playerData ? `${playerData.position} • ${playerData.team}` : ''}
                        </div>
                        {/* Colored position tracker bar */}
                        <div style={{ 
                          position: 'absolute',
                          bottom: 9,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '141.2px',
                          maxWidth: '141.2px',
                          minWidth: '141.2px',
                          height: 10.56,
                          display: 'flex',
                          borderRadius: 5.28,
                          overflow: 'hidden',
                          zIndex: 3,
                        }}>
                          {(() => {
                            const proportions = getTeamPositionProportions(teamIndex);
                            // Debug logging for position tracker
                            if (pickNumber <= 3) {
                              const teamName = effectiveDraftOrder[teamIndex];
                              console.log(`Position tracker for pick ${pickNumber}, team ${teamIndex} (${teamName}):`, {
                                proportions,
                                teamPicks: picks.filter(p => p.user === teamName),
                                effectiveDraftOrder,
                                team
                              });
                            }
                            if (proportions.length === 0) {
                              return <div style={{ height: 10.56, width: '100%', background: '#6b7280', borderRadius: 5.28 }} />;
                            }
                            return proportions.map((prop, idx) => (
                              <div
                                key={prop.position}
                                style={{
                                  height: 10.56,
                                  width: `${prop.proportion * 100}%`,
                                  background: prop.color,
                                  borderRadius: idx === 0 ? '5px 0 0 5px' : idx === proportions.length - 1 ? '0 5px 5px 0' : '0',
                                }}
                              />
                            ));
                          })()}
                        </div>
                      </div>
                    ) : (
                      // FUTURE PICK: Grey outline style matching completed picks
                      <div
                        className="text-sm rounded w-full h-full flex flex-col justify-center items-center"
                        style={{
                          position: 'relative',
                          overflow: 'visible',
                          background: 'transparent',
                          height: '100%',
                          width: '100%',
                          boxSizing: 'border-box',
                          borderTop: `27px solid ${isOnTheClock ? '#fbbf24' : '#6b7280'}`,
                          borderLeft: `4px solid ${isOnTheClock ? '#fbbf24' : '#6b7280'}`,
                          borderRight: `4px solid ${isOnTheClock ? '#fbbf24' : '#6b7280'}`,
                          borderBottom: `4px solid ${isOnTheClock ? '#fbbf24' : '#6b7280'}`,
                          borderRadius: 8,
                          margin: 0,
                          padding: 0,
                          textAlign: 'left',
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* User name and round.pickInRound at the top border */}
                        {/* Team name label at the top */}
                        <div style={{
                            position: 'absolute',
                            top: -22,
                            left: 0,
                            right: 0,
                            height: 16,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            color: isOnTheClock ? '#000' : '#fff',
                            zIndex: 4,
                            pointerEvents: 'none',
                        }}>
                          <span>{(team.length > 18 ? team.slice(0, 17) + '…' : team).toUpperCase().replace(/\s/g, '')}</span>
                        </div>
                        {/* Pick number label below colored bar, top left */}
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          left: 0,
                          right: 0,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#fff',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          zIndex: 4,
                          pointerEvents: 'none',
                          marginBottom: '4px',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                        }}>
                          <span>{`${round}.${String(pickIndex + 1).padStart(2, '0')}`}</span>
                          <span>{pickNumber}</span>
                        </div>
                        {/* Team card for unpicked slot */}
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'flex-start', 
                          height: '100%', 
                          width: '100%',
                          padding: '8px 4px',
                          boxSizing: 'border-box',
                          background: 'transparent'
                        }}>
                        {/* Logo for future pick */}
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          left: 0,
                          right: 0,
                          height: 52,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 3,
                        }}>
                          {(() => {
                            if (typeof team !== 'string' || team === '---') return null;
                            const logoIndex = teamIndex % logoOptions.length;
                            const LogoComponent = logoOptions[logoIndex].component;
                            const bgColor = logoOptions[logoIndex].bgColor;
                            return <LogoComponent size={43} bgColor={bgColor} />;
                          })()}
                        </div>
                          <div style={{ 
                            height: '20px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 'auto'
                          }}>
                          </div>
                        {/* Colored position tracker bar for future picks */}
                        <div style={{ 
                          position: 'absolute',
                          bottom: 9,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '141.2px',
                          maxWidth: '141.2px',
                          minWidth: '141.2px',
                          height: 10.56,
                          display: 'flex',
                          borderRadius: 5.28,
                          overflow: 'hidden',
                          zIndex: 3,
                        }}>
                              {(() => {
                                const proportions = getTeamPositionProportions(teamIndex);
                                // Debug logging for position tracker rendering
                                if (pickNumber <= 5) {
                                  console.log(`Rendering position tracker for pick ${pickNumber}, team ${teamIndex}:`, {
                                    proportions,
                                    proportionsLength: proportions.length,
                                    teamName: effectiveDraftOrder[teamIndex]
                                  });
                                }
                                if (proportions.length === 0) {
                                  return <div style={{ height: 10.56, width: '100%', background: '#6b7280', borderRadius: 5.28 }} />;
                                }
                                return proportions.map((prop, idx) => (
                                  <div
                                    key={prop.position}
                                    style={{
                                      height: 10.56,
                                      width: `${prop.proportion * 100}%`,
                                      background: prop.color,
                                      borderRadius: idx === 0 ? '5px 0 0 5px' : idx === proportions.length - 1 ? '0 5px 5px 0' : '0',
                                    }}
                                  />
                                ));
                              })()}
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Info Button Under Scrolling Bar */}
          
        </div>
      )}



      {/* Three Column Layout */}
      <div className="flex">
        {/* Left Sidebar: On the Clock Container and Your Queue */}
        <div className="w-80 flex flex-col">
          {/* Full Draft Board Button, Info Button, Timer, and Autodraft */}
          <div className="px-4 mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    console.log('Info button clicked!');
                    setShowInfoModal(true);
                  }}
                  className="w-7 h-7 text-[#3B82F6] rounded-full flex items-center justify-center hover:text-[#1d4ed8] transition-colors font-bold text-base border-2 border-[#3B82F6]"
                  title="Tournament Info"
                >
                  i
                </button>
                <Link 
                  href={`/draft/topdog/${roomId}/full-board`}
                  className="inline-block px-4 py-2 bg-[#3B82F6] font-bold rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm text-center"
                  style={{
                    width: 240,
                    minWidth: 240,
                    maxWidth: 240,
                    color: '#ffffff',
                  }}
                >
                  Full Draft Board
                </Link>
              </div>
              <div className="flex items-center gap-4">
                {/* Autodraft Would Be Container */}
                {autoPickPlayer && (
                  <div className="rounded p-3 border-l-4 border-[#3B82F6]" style={{ backgroundColor: '#1e40af', minWidth: 180 }}>
                    <div className="text-xs font-bold text-white mb-1">Autodraft Would Be:</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{autoPickPlayer.name}</div>
                        <div className="text-xs text-white opacity-75">{autoPickPlayer.position} • {autoPickPlayer.team}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-black pt-1 pr-1 pl-1 rounded" style={{ display: 'inline-block', transform: 'scale(1.0)', marginTop: '0px' }}>
                  <SevenSegmentCountdown initialSeconds={isDraftActive ? timer : preDraftCountdown} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Your Queue */}
          <div className="px-4 mt-0">
            <div className="bg-white/10 p-4 z-30 flex flex-col rounded-lg w-80">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#3B82F6' }}>Your Queue</h2>
              
              {queue.length === 0 && (
                <div className="text-gray-300 mb-2">
                  No players in queue.
                  <button 
                    onClick={() => addToQueue(finalFilteredPlayers[0])} 
                    className="ml-2 px-2 py-1 bg-[#3B82F6] text-white rounded text-xs font-bold hover:bg-[#1d4ed8]"
                  >
                    Add Player
                  </button>
                </div>
              )}
              
              {queue.length > 0 && (
                <DragDropContext onDragEnd={onQueueDragEnd}>
                  <Droppable droppableId="player-queue">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col gap-2"
                      >
                        {/* Queue Column Headers */}
                        <div className="flex items-center justify-between bg-white/10 rounded p-2 font-bold text-xs">
                          <div className="flex-1">Player</div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 text-center text-gray-300">ADP</div>
                            <div className="w-12 text-center text-gray-300">Rank</div>
                            <div className="w-4"></div>
                          </div>
                        </div>

                        {queue.map((player, index) => (
                          <Draggable key={`queue-${player.name}-${index}`} draggableId={`queue-${player.name}-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white/5 p-3 rounded cursor-move hover:bg-white/10 transition-all"
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: provided.draggableProps.style?.transform
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-bold text-white">{player.name}</div>
                                    <div className="text-sm text-gray-300">{player.position} • {player.team}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 text-center text-xs font-bold text-[#3B82F6]">
                                      {player.adp || 'N/A'}
                                    </div>
                                    <div className="w-12 text-center text-xs font-bold text-[#3B82F6]">
                                      {rankings.indexOf(player.name) !== -1 ? `#${rankings.indexOf(player.name) + 1}` : 'N/A'}
                                    </div>
                                    <button
                                      onClick={() => removeFromQueue(player)}
                                      className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>

        {/* Autodraft Would Be Container - HIDDEN */}

        {/* Center Column: Available Players */}
        <div className="flex-1 ml-8 mr-8">
          {room && (
            <div className="bg-[#18181A] rounded pt-4 pb-4 pl-4 pr-4 mb-2 border-4 border-white/20" style={{ marginBottom: '2px', marginTop: 'auto' }}>
              
              {/* Search and Filter Controls */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="player-search-input"
                  name="playerSearch"
                  placeholder="Search players or teams..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="px-3 py-2 rounded text-black flex-1"
                />
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="px-3 py-2 rounded text-black bg-white"
                >
                  <option value="ALL">All Positions</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                Showing {finalFilteredPlayers.length} of {availablePlayers.length} available players
              </div>
              
              {/* Single Column Player List */}
              <div className="overflow-y-auto" style={{ height: '1095px' }}>
                <div className="space-y-2">
                  {/* Column Headers */}
                  <div className="flex items-center justify-between bg-white/10 rounded p-3 font-bold text-xs">
                    <div className="flex items-center gap-3 flex-1">
                      <button 
                        onClick={() => setSortBy('adp')}
                        className={`w-16 text-center hover:text-[#3B82F6] hover:bg-white/5 transition-all cursor-pointer rounded px-1 py-1 ${
                          sortBy === 'adp' ? 'text-[#3B82F6] bg-white/10' : 'text-gray-300'
                        }`}
                        title="Click to sort by ADP"
                      >
                        ADP {sortBy === 'adp' && '↓'}
                      </button>
                      <button 
                        onClick={() => setSortBy('rankings')}
                        className={`w-16 text-center hover:text-[#3B82F6] hover:bg-white/5 transition-all cursor-pointer rounded px-1 py-1 ${
                          sortBy === 'rankings' ? 'text-[#3B82F6] bg-white/10' : 'text-gray-300'
                        }`}
                        title="Click to sort by Rankings"
                      >
                        Rank {sortBy === 'rankings' && '↓'}
                      </button>
                      <div className="w-32 text-center text-gray-300">Name</div>
                      <div className="w-12 text-center text-gray-300">Pos</div>
                      <div className="w-16 text-center text-gray-300">Team</div>
                      <div className="w-12 text-center text-gray-300">Bye</div>
                      <div className="flex-1"></div>
                    </div>
                    <div className="w-32 text-center">Actions</div>
                  </div>
                  
                  {finalFilteredPlayers.map(player => {
                    const canDraft = canDraftPlayer(player.name);
                    const playerData = PLAYER_POOL.find(p => p.name === player.name);
                    const currentCount = picks.filter(pick => pick.user === userName)
                      .map(p => PLAYER_POOL.find(pp => pp.name === p.player))
                      .filter(p => p?.position === playerData?.position).length;
                    const limit = POSITIONAL_LIMITS[playerData?.position];
                    
                    return (
                      <div key={player.name} className={`flex items-center justify-between rounded p-3 transition-colors ${
                        canDraft ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/20 opacity-60'
                      }`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-16 text-center text-xs font-bold text-[#3B82F6]">
                            {player.adp || 'N/A'}
                          </div>
                          <div className="w-16 text-center text-xs font-bold text-[#3B82F6]">
                            {rankings.indexOf(player.name) !== -1 ? `#${rankings.indexOf(player.name) + 1}` : 'N/A'}
                          </div>
                          <div className="w-32 text-center text-white font-medium text-sm">
                            <div className="truncate overflow-hidden text-ellipsis whitespace-nowrap" title={player.name}>
                              {player.name}
                            </div>
                          </div>
                          <div className="w-12 text-center text-white text-sm">
                            {player.position}
                          </div>
                          <div className="w-16 text-center text-white text-sm">
                            {player.team}
                          </div>
                          <div className="w-12 text-center text-white text-sm">
                            {player.bye}
                          </div>
                          {!canDraft && (
                            <div className="text-red-400 text-xs">
                              ({currentCount}/{limit})
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-32 justify-center">
                          <button
                            className={`px-3 py-1 rounded font-bold transition-colors text-sm ${
                              canDraft && isDraftActive
                                ? 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                                : canDraft && !isDraftActive
                                ? 'bg-yellow-500 text-[#000F55] hover:bg-yellow-400'
                                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                            disabled={!isMyTurn || pickLoading || !canDraft || !isDraftActive}
                            onClick={() => canDraft && isDraftActive ? makePick(player.name) : null}
                            title={
                              !canDraft 
                                ? `Cannot draft: ${currentCount}/${limit} ${player.position}s`
                                : !isDraftActive 
                                ? 'Draft not started yet'
                                : 'Draft this player'
                            }
                          >
                            {canDraft && isDraftActive ? 'Draft' : canDraft && !isDraftActive ? 'Ready' : 'Limit'}
                          </button>
                          {queue.find(q => q.name === player.name) ? (
                            <button 
                              onClick={() => removeFromQueue(player)} 
                              className="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          ) : (
                            <button 
                              onClick={() => addToQueue(player)} 
                              className="px-2 py-1 rounded bg-[#c4b5fd] text-gray-900 text-xs font-bold hover:bg-[#a78bfa] transition-colors"
                            >
                              Queue
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Roster Container */}
                  <div className="w-80 bg-white/10 p-4 pr-6 z-30 flex flex-col overflow-y-auto pt-4 -ml-4 mr-4 mb-2">
          {/* Team Selection Dropdown */}
          <div className="mb-4 team-dropdown">
            <div className="relative">
              <button
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className="w-full flex items-center justify-between bg-white/10 rounded p-3 text-left hover:bg-white/20 transition-colors"
              >
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#3B82F6' }}>
                    {selectedTeam === userName ? 'Your Team' : selectedTeam}
                  </h2>
                  <div className="text-sm text-gray-300">
                    {currentTeamRoster.length === 0 ? 'My Team' : ''}
                  </div>
                </div>
                <div className="text-white">▼</div>
              </button>
              
              {showTeamDropdown && (
                <div className="absolute top-full left-0 right-0 bg-[#000F55] border border-white/20 rounded mt-1 z-50 max-h-60 overflow-y-auto">
                  {effectiveDraftOrder.map((team, index) => (
                    <button
                      key={team}
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowTeamDropdown(false);
                      }}
                      className={`w-full p-3 text-left hover:bg-white/10 transition-colors ${
                        selectedTeam === team ? 'bg-[#60A5FA] text-[#000F55]' : 'text-white'
                      }`}
                    >
                      <div className="font-medium">{team === userName ? 'Your Team' : team}</div>
                      <div className="text-xs opacity-75">
                        
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Positional Count Display */}
          <div className="mb-4 p-3 bg-white/5 rounded">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[#3B82F6] font-bold">QB:</span> {currentTeamRosterGrouped.QB?.length || 0} &nbsp;
                <span className="text-[#3B82F6] font-bold">RB:</span> {currentTeamRosterGrouped.RB?.length || 0} &nbsp;
                <span className="text-[#3B82F6] font-bold">WR:</span> {currentTeamRosterGrouped.WR?.length || 0} &nbsp;
                <span className="text-[#3B82F6] font-bold">TE:</span> {currentTeamRosterGrouped.TE?.length || 0}
              </div>
            </div>
          </div>
          
          {/* Starting Lineup Section */}
          <div className="mb-6">
            <div className="space-y-3">
              {/* QB - 1 spot */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#3B82F6' }}>
                  QB
                </h4>
                <div className="space-y-1">
                  {currentTeamStartingLineup.QB?.slice(0, 1).map((player, idx) => (
                    <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-300">
                        {player.team} • Bye {player.bye} • ADP {player.adp}
                      </div>
                    </div>
                  ))}
                  {(!currentTeamStartingLineup.QB || currentTeamStartingLineup.QB.length === 0) && (
                    <div className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                      <div className="text-gray-500 italic">Empty QB Spot</div>
                    </div>
                  )}
                </div>
              </div>

              {/* RB - 2 spots */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#3B82F6' }}>
                  RB
                </h4>
                <div className="space-y-1">
                  {currentTeamStartingLineup.RB?.slice(0, 2).map((player, idx) => (
                    <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-300">
                        {player.team} • Bye {player.bye} • ADP {player.adp}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - (currentTeamStartingLineup.RB?.slice(0, 2).length || 0)) }, (_, i) => (
                    <div key={`rb-starter-empty-${i}`} className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                      <div className="text-gray-500 italic">Empty RB Spot</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WR - 3 spots */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#3B82F6' }}>
                  WR
                </h4>
                <div className="space-y-1">
                  {currentTeamStartingLineup.WR?.slice(0, 3).map((player, idx) => (
                    <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-300">
                        {player.team} • Bye {player.bye} • ADP {player.adp}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - (currentTeamStartingLineup.WR?.slice(0, 3).length || 0)) }, (_, i) => (
                    <div key={`wr-starter-empty-${i}`} className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                      <div className="text-gray-500 italic">Empty WR Spot</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TE - 1 spot */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#3B82F6' }}>
                  TE
                </h4>
                <div className="space-y-1">
                  {currentTeamStartingLineup.TE?.slice(0, 1).map((player, idx) => (
                    <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-300">
                        {player.team} • Bye {player.bye} • ADP {player.adp}
                      </div>
                    </div>
                  ))}
                  {(!currentTeamStartingLineup.TE || currentTeamStartingLineup.TE.length === 0) && (
                    <div className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                      <div className="text-gray-500 italic">Empty TE Spot</div>
                    </div>
                  )}
                </div>
              </div>

              {/* FLEX - 2 spots */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#3B82F6' }}>
                  FLEX
                </h4>
                <div className="space-y-1">
                  {currentTeamStartingLineup.FLEX?.slice(0, 2).map((player, idx) => (
                    <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-300">
                        {player.team} • Bye {player.bye} • ADP {player.adp}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - (currentTeamStartingLineup.FLEX?.slice(0, 2).length || 0)) }, (_, i) => (
                    <div key={`flex-starter-empty-${i}`} className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                      <div className="text-gray-500 italic">Empty FLEX Spot</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bench Section */}
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#c4b5fd' }}>Bench</h3>
            <div className="space-y-1">
              {/* Show all bench players organized by draft order */}
              {(() => {
                // Get all players in draft order for selected team
                const teamPicks = picks.filter(pick => pick.user === selectedTeam);
                
                // Get starting lineup players to exclude from bench
                const startingLineupPlayers = new Set();
                Object.values(currentTeamStartingLineup).forEach(positionPlayers => {
                  positionPlayers.forEach(player => {
                    startingLineupPlayers.add(player.name);
                  });
                });
                
                // Get bench players (players not in starting lineup)
                const benchPlayers = teamPicks.filter(pick => !startingLineupPlayers.has(pick.player));
                
                // Create bench player objects with draft order info
                const benchPlayerObjects = benchPlayers.map((pick, index) => {
                  const playerData = PLAYER_POOL.find(p => p.name === pick.player);
                  return {
                    name: pick.player,
                    position: playerData?.position || 'UNK',
                    team: playerData?.team || 'FA',
                    bye: playerData?.bye || 0,
                    adp: playerData?.adp || 999,
                    draftOrder: teamPicks.indexOf(pick) + 1
                  };
                });
                
                return benchPlayerObjects.map((player, idx) => (
                  <div key={player.name} className="text-sm bg-white/5 rounded p-2">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-gray-300">
                      {player.position} {player.team} • Bye {player.bye} • ADP {player.adp} • Pick #{player.draftOrder}
                    </div>
                  </div>
                ));
              })()}
              
              {/* Add empty bench spots to fill remaining space */}
              {(() => {
                const teamPicks = picks.filter(pick => pick.user === selectedTeam);
                const startingLineupPlayers = new Set();
                Object.values(currentTeamStartingLineup).forEach(positionPlayers => {
                  positionPlayers.forEach(player => {
                    startingLineupPlayers.add(player.name);
                  });
                });
                const benchPlayers = teamPicks.filter(pick => !startingLineupPlayers.has(pick.player));
                const totalBenchSpots = 10;
                const emptySpots = Math.max(0, totalBenchSpots - benchPlayers.length);
                
                return Array.from({ length: emptySpots }, (_, i) => (
                  <div key={`bench-empty-${i}`} className="text-sm bg-white/5 rounded p-2 border border-dashed border-gray-600">
                    <div className="text-gray-500 italic">Empty Bench Spot</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Launch Draft Button for Testing */}
      {room?.status === 'waiting' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => {
              if (draftOrder.length === 0) {
                // If no draft order, randomize first
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                setDraftOrder(shuffled);
                setDraftOrderTimestamp(new Date());
                setPreDraftCountdown(60);
                updateDoc(doc(db, 'draftRooms', roomId), { 
                  draftOrder: shuffled,
                  draftOrderTimestamp: new Date()
                });
              } else {
                // Start the draft immediately
                updateDoc(doc(db, 'draftRooms', roomId), {
                  status: 'active',
                  startedAt: new Date()
                });
              }
            }}
            className="bg-gradient-to-r from-[#60A5FA] to-[#2DE2C5] text-[#000F55] px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {draftOrder.length === 0 ? 'Randomize & Launch Draft' : 'Launch Draft Now'}
          </button>
        </div>
      )}

      {/* Mock Draft Button */}
      {room?.status === 'waiting' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={startMockDraft}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            title="Start a mock draft with 11 simulated drafters"
          >
            🎯 Mock Draft
          </button>
        </div>
      )}

      {/* Debug Button for Stalled Drafts */}
      {isDraftActive && mockDraftSpeed && room?.status !== 'completed' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => {
              console.log('🔧 MANUAL DEBUG TRIGGER');
              const currentPicker = effectiveDraftOrder[pickIndex];
              const mockDrafterNames = room?.mockDrafters || [];
              const isMockDrafter = currentPicker && currentPicker !== 'Not Todd Middleton' && mockDrafterNames.includes(currentPicker);
              const isUserTurn = currentPicker === 'Not Todd Middleton';
              
              console.log('Manual trigger state:', {
                currentPicker,
                mockDrafterNames,
                isMockDrafter,
                isUserTurn,
                pickLoading,
                currentPickNumber,
                currentRound
              });
              
              if (isMockDrafter) {
                console.log('🔧 MANUALLY TRIGGERING MOCK PICK');
                setPickLoading(false);
                setTimeout(() => {
                  makeMockPick(currentPicker, currentPickNumber, currentRound);
                }, 100);
              } else if (isUserTurn) {
                console.log('🔧 MANUALLY TRIGGERING USER AUTO-PICK');
                const autoPick = getAutoPickPlayer();
                if (autoPick) {
                  console.log('🔧 MANUALLY AUTO-PICKING FOR USER:', autoPick.name);
                  makeAutoPick(autoPick.name);
                } else {
                  console.log('❌ MANUAL AUTO-PICK: No valid player available');
                }
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-red-600 transition-all"
            title="Force next pick if draft is stalled"
          >
            🔧 Force Pick
          </button>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#000F55] border border-[#60A5FA] rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#60A5FA' }}>
                Tournament Info
              </h2>
              <div className="text-white text-lg mb-6">
                <strong>TopDog</strong>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="bg-[#60A5FA] text-[#000F55] px-6 py-2 rounded-lg font-bold hover:bg-[#2DE2C5] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 