import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import {
  doc, getDoc, updateDoc, arrayUnion, onSnapshot, collection, addDoc, query, orderBy, setDoc, arrayRemove, getDocs, deleteDoc
} from 'firebase/firestore';
import Link from 'next/link';
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PLAYER_POOL, groupPicksByPosition } from '../../lib/playerPool';
import { getRandomMockDrafters } from '../../lib/mockDrafters';
import FullDraftBoard from '../../components/FullDraftBoard';
import { logoOptions } from '../../components/team-logos';
import SevenSegmentCountdown from '../../components/SevenSegmentCountdown';

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

  // Scroll to current pick when picks change
  useEffect(() => {
    if (picksScrollRef.current && picks.length > 0) {
      // Add a longer delay to ensure DOM is fully updated
      setTimeout(() => {
        const currentPickIndex = picks.length;
        const currentPickElement = picksScrollRef.current.children[currentPickIndex];
        if (currentPickElement) {
          console.log(`Scrolling to pick #${currentPickIndex + 1}`);
          currentPickElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        } else {
          console.log(`Could not find element for pick #${currentPickIndex + 1}`);
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
    // Force the user to be "Not Todd Middleton" regardless of what's in localStorage
    const name = 'Not Todd Middleton';
    localStorage.setItem('draftUserName', name);
    setUserName(name);
    
    const userRef = doc(db, 'draftRooms', roomId);
    getDoc(userRef).then(docSnap => {
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
          updateDoc(userRef, { participants: updatedParticipants });
        }
        
        // Add the new username if not already present
        if (!updatedParticipants.includes(name)) {
          updateDoc(userRef, { participants: arrayUnion(name) });
        }
      }
    });
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
      const autoPick = getAutoPickPlayer();
      
      if (!autoPick) {
        console.error(`[ROOM ${roomId}] No valid auto-pick available for ${userName} - autodraft limits reached`);
        // Alert the user and extend timer by 30 seconds
        alert(`No valid players available for autodraft. You have reached autodraft position limits (3QB, 6RB, 7WR, 3TE). Please manually select a player.`);
        setTimer(30); // Give 30 more seconds
        return;
      }
      
      console.log(`[ROOM ${roomId}] Timer expired for ${userName}, auto-picking: ${autoPick.name}`);
      makePick(autoPick.name);
    }
  }, [timer, isMyTurn, isDraftActive, availablePlayers, rankings, queue]);

  // Check for draft completion
  useEffect(() => {
    if (picks.length >= totalPicks && isDraftActive && isRoomOwner) {
      // Mark draft as completed and clear picks to prevent reuse
      const completeDraft = async () => {
        try {
          // First mark as completed
          await updateDoc(doc(db, 'draftRooms', roomId), {
            status: 'completed',
            completedAt: new Date()
          });

          // Save user's drafted team to Firestore
          const userId = 'Not Todd Middleton';
          const userPicks = picks.filter(p => p.user === userId);
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
          
          console.log(`Draft completed, team saved, and picks cleared for room ${roomId}`);
        } catch (error) {
          console.error('Error completing draft:', error);
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
    if (!isMyTurn || pickLoading || !isDraftActive) return;
    
    // Check positional limits
    if (!canDraftPlayer(player)) {
      const playerData = PLAYER_POOL.find(p => p.name === player);
      const limit = POSITIONAL_LIMITS[playerData.position];
      alert(`Cannot draft ${player}. You already have ${limit} ${playerData.position}s. Maximum allowed: ${limit}.`);
      return;
    }
    
    setPickLoading(true);
    try {
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
  
  const filteredPlayers = trulyAvailablePlayers.filter(player => {
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
  console.log('Filtered players count:', filteredPlayers.length);
  
  // Check for any drafted players in the filtered list
  const draftedInFiltered = filteredPlayers.filter(player => pickedPlayerNames.includes(player.name));
  if (draftedInFiltered.length > 0) {
    console.error('🚨 CRITICAL ERROR: Found drafted players in filtered list:', draftedInFiltered.map(p => p.name));
    // Force remove them from the filtered list
    const cleanFilteredPlayers = filteredPlayers.filter(player => !pickedPlayerNames.includes(player.name));
    console.log('Cleaned filtered players count:', cleanFilteredPlayers.length);
    return cleanFilteredPlayers;
  } else {
    console.log('✅ No drafted players found in filtered list');
  }
  
  // Additional safety check: verify no duplicates
  const playerNames = filteredPlayers.map(p => p.name);
  const uniqueNames = new Set(playerNames);
  if (playerNames.length !== uniqueNames.size) {
    console.warn('⚠️ Duplicate players found in filtered list, removing duplicates');
    const seen = new Set();
    return filteredPlayers.filter(player => {
      if (seen.has(player.name)) {
        return false;
      }
      seen.add(player.name);
      return true;
    });
  }
  
  console.log('Sample available player:', availablePlayers[0]);
  console.log('Sample truly available player:', trulyAvailablePlayers[0]);
  console.log('Sample filtered player:', filteredPlayers[0]);
  console.log('Rankings count:', rankings.length);
  console.log('Sample player with ADP:', filteredPlayers[0]);
  console.log('Sample rankings:', rankings.slice(0, 5));
  console.log('Queue count:', queue.length);
  console.log('Queue data:', queue);
  console.log('=== END PLAYER FILTERING DEBUG ===');

  // Mock draft function
  const startMockDraft = async () => {
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
    try {
      // Get available players (excluding already picked ones)
      const pickedPlayers = picks.map(p => p.player);
      const availableForMock = PLAYER_POOL.filter(p => !pickedPlayers.includes(p.name));
      
      if (availableForMock.length === 0) {
        console.error('No available players for mock pick');
        return;
      }
      
      // Simple mock draft strategy: pick best available by ADP
      const bestAvailable = availableForMock.sort((a, b) => (a.adp || 999) - (b.adp || 999))[0];
      
      // Add a small delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(pickNumber));
      await setDoc(pickRef, {
        pickNumber: pickNumber,
        round: round,
        user: mockDrafter,
        player: bestAvailable.name,
        roomId: roomId,
        timestamp: Date.now(),
      });
      
      console.log(`Mock pick: ${mockDrafter} selected ${bestAvailable.name} (ADP: ${bestAvailable.adp})`);
      
    } catch (error) {
      console.error('Error making mock pick:', error);
    }
  };

  // Auto-pick timer for mock drafters
  useEffect(() => {
    if (!isDraftActive || picks.length >= totalPicks) return;
    
    const currentPicker = effectiveDraftOrder[pickIndex];
    const mockDrafterNames = room?.mockDrafters || [];
    const isMockDrafter = currentPicker && currentPicker !== 'Not Todd Middleton' && mockDrafterNames.includes(currentPicker);
    
    // Debug logging
    console.log('=== MOCK PICK DEBUG ===');
    console.log('Current picker:', currentPicker);
    console.log('Mock drafter names:', mockDrafterNames);
    console.log('Is mock drafter:', isMockDrafter);
    console.log('Timer:', timer);
    console.log('Pick loading:', pickLoading);
    console.log('Current pick number:', currentPickNumber);
    console.log('Current round:', currentRound);
    console.log('======================');
    
    // Mock drafters should wait for timer to expire, just like regular users
    if (isMockDrafter && timer === 0 && !pickLoading) {
      console.log(`Timer expired for mock drafter: ${currentPicker}`);
      makeMockPick(currentPicker, currentPickNumber, currentRound);
    }
    
    // Force auto-pick if timer has been at 0 for more than 2 seconds
    if (isMockDrafter && timer === 0 && pickLoading) {
      console.log(`Force auto-pick for stuck mock drafter: ${currentPicker}`);
      setTimeout(() => {
        if (timer === 0) {
          makeMockPick(currentPicker, currentPickNumber, currentRound);
        }
      }, 2000);
    }
  }, [timer, picks.length, currentPicker, isDraftActive, totalPicks, pickLoading, currentPickNumber, currentRound, room?.mockDrafters]);

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
    if (isDraftActive) {
      // Green gradient when user is on the clock
      if (isMyTurn) {
        return 'linear-gradient(to right, #10B981, #34D399)'; // Green gradient
      }
      // Original brand colors for other drafters
      return 'linear-gradient(to right, #60A5FA, #2DE2C5)';
    }
    
    // Calculate color transition based on countdown progress
    const progress = preDraftCountdown / 60; // 60 is the initial countdown
    const startColor = '#60A5FA'; // Your brand color
    const endColor = '#2DE2C5';   // Your secondary brand color
    
    // Interpolate between colors based on progress
    const r1 = parseInt(startColor.slice(1, 3), 16);
    const g1 = parseInt(startColor.slice(3, 5), 16);
    const b1 = parseInt(startColor.slice(5, 7), 16);
    
    const r2 = parseInt(endColor.slice(1, 3), 16);
    const g2 = parseInt(endColor.slice(3, 5), 16);
    const b2 = parseInt(endColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * (1 - progress));
    const g = Math.round(g1 + (g2 - g1) * (1 - progress));
    const b = Math.round(b1 + (b2 - b1) * (1 - progress));
    
    return `linear-gradient(to right, rgb(${r}, ${g}, ${b}), ${endColor})`;
  };

  // Get current team's data
  const currentTeamRoster = getTeamRoster(selectedTeam);
  const currentTeamRosterGrouped = getTeamRosterGrouped(selectedTeam);
  const currentTeamStartingLineup = getTeamStartingLineup(selectedTeam);

  if (!room) return <div className="min-h-screen bg-[#000F55] text-white flex items-center justify-center">Loading...</div>;

  // Debug rendering
  console.log('=== RENDERING DEBUG ===');
  console.log('Room:', room);
  console.log('Is draft active:', isDraftActive);
  console.log('Available players count:', availablePlayers.length);
  console.log('Filtered players count:', filteredPlayers.length);
  console.log('Picks count:', picks.length);
  console.log('Room status:', room?.status);
  console.log('======================');

  return (
    <div className="min-h-screen bg-[#000F55] text-white">
      {/* Header with Room Name and Full Board Link */}
      <div className="p-8 bg-white/5 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div>
          </div>
        </div>
      </div>

      {/* All Picks Display - Full Width */}
      {(isDraftActive || room?.status === 'waiting') && (
        <div className="p-8 bg-white/5">
          <div ref={picksScrollRef} className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
            {Array.from({ length: draftSettings.totalRounds * 12 }, (_, i) => {
              const pickNumber = i + 1;
              const round = Math.ceil(pickNumber / 12);
              const pickIndex = (pickNumber - 1) % 12;
              const isSnakeRound = round % 2 === 0;
              const teamIndex = isSnakeRound ? 12 - 1 - pickIndex : pickIndex;
              const team = effectiveDraftOrder[teamIndex] || `Team ${teamIndex + 1}`;
              const isMyPick = team === 'Not Todd Middleton';
              const isCompleted = picks.length >= pickNumber;
              const isOnTheClock = pickNumber === picks.length + 1;
              
              // Get the player data for completed picks to determine position color
              const completedPick = picks[pickNumber - 1];
              const playerData = completedPick ? PLAYER_POOL.find(p => p.name === completedPick.player) : null;
              
              // Determine background color based on position
              const getPositionColor = () => {
                if (!isCompleted || !playerData) return {};
                switch (playerData.position) {
                  case 'QB': return { backgroundColor: '#F7A8B8' };
                  case 'RB': return { backgroundColor: '#A8E6A3' };
                  case 'WR': return { backgroundColor: '#F7E9A3' };
                  case 'TE': return { backgroundColor: '#A3D8F7' };
                  default: return { backgroundColor: 'rgba(255,255,255,0.1)' };
                }
              };
              
              return (
                <div
                  key={i}
                  className={`flex-shrink-0 px-4 py-4 rounded text-sm font-medium w-36 min-h-[120px] flex flex-col ${
                    isCompleted 
                      ? 'text-[#000F55]' 
                      : isOnTheClock 
                        ? 'text-[#000F55]' 
                        : 'bg-white/10 text-white'
                  }`}
                  style={isOnTheClock ? { backgroundColor: '#fbce01' } : getPositionColor()}
                >
                  <div className="text-sm w-full text-center leading-tight flex-1 flex items-start justify-center">
                    {isCompleted && playerData ? (
                      <div className="w-full">
                        <div className="font-bold text-xs mb-3 h-4 flex items-center justify-center">{team}</div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="font-bold text-xs h-4 flex items-center justify-center">{team}</div>
                        <div className="w-full h-px bg-current opacity-30 mt-3"></div>
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <>
                    </>
                  )}
                  {isCompleted && playerData && (
                    <>
                      <div className="w-full h-px bg-current opacity-30 mb-1"></div>
                      <div className="text-xs text-center mb-1 truncate max-w-full">{playerData.name}</div>
                      <div className="text-xs opacity-75 text-center mb-1">{playerData.position} • {playerData.team}</div>
                    </>
                  )}
                  <div className="text-xs text-center mt-auto">{round}.{String(pickIndex + 1).padStart(2, '0')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* On the Clock Container */}
      {(isDraftActive || (draftOrder.length > 0 && room?.status === 'waiting')) && (
        <div className="px-8 pb-4">
          <div 
            className={`inline-block rounded-lg p-4 shadow-lg transition-all duration-1000 ${
              !isDraftActive && preDraftCountdown <= 10 ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: '#353536',
              opacity: 1,
              position: 'relative',
              width: 320,
              minWidth: 320,
              maxWidth: 320,
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-[#000F55]">
                  {isDraftActive ? 'ON THE CLOCK' : 'DRAFT STARTING'}
                </div>
                <div className="text-lg font-semibold text-[#000F55]">
                  {isDraftActive ? (() => {
                    if (!currentPicker || currentPicker === 'Waiting...') return 'Waiting...';
                    if (currentPicker === 'Not Todd Middleton') return currentPicker;
                    
                    // Check if this is a mock drafter and show animal logo
                    const mockDrafterNames = room?.mockDrafters || [];
                    const isMockDrafter = mockDrafterNames.includes(currentPicker);
                    
                    if (isMockDrafter) {
                      // Find the mock drafter's index to assign a logo
                      const drafterIndex = mockDrafterNames.indexOf(currentPicker);
                      const logoIndex = drafterIndex % logoOptions.length;
                      const LogoComponent = logoOptions[logoIndex].component;
                      const bgColor = logoOptions[logoIndex].bgColor;
                      
                      return (
                        <div className="flex items-center gap-2">
                          <LogoComponent size={24} bgColor={bgColor} />
                          <span>{currentPicker}</span>
                        </div>
                      );
                    }
                    
                    return currentPicker;
                  })() : 'Get Ready!'}
                </div>
                {isMyTurn && isDraftActive && (
                  <div className="bg-[#000F55] text-[#60A5FA] px-3 py-1 rounded-full text-sm font-bold">
                    YOUR TURN
                  </div>
                )}
              </div>
              {/* Autodraft Would Be Container */}
              {isDraftActive && autoPickPlayer && (
                <div className="rounded p-3 border-l-4 border-[#2DE2C5]" style={{ backgroundColor: '#c4b5fd', width: 'calc(100% + 5px)' }}>
                  <div className="text-sm font-bold text-[#000F55] mb-1">Autodraft Would Be:</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-[#000F55] text-sm">{autoPickPlayer.name}</div>
                      <div className="text-xs text-[#000F55] opacity-75">{autoPickPlayer.position} • {autoPickPlayer.team}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-6" style={{ backgroundColor: '#18181a' }}>
                <div className="text-right">
                  <div className={`flex items-center justify-end mb-2 ${
                    isDraftActive && isMyTurn && timer <= 10 ? 'animate-pulse' : ''
                  } ${!isDraftActive && preDraftCountdown <= 10 ? 'animate-pulse' : ''}`}>
                    <div className="bg-black p-0 rounded">
                      <SevenSegmentCountdown initialSeconds={isDraftActive ? timer : preDraftCountdown} />
                    </div>
                  </div>
                  <div className="text-sm text-[#000F55] font-medium">
                    {isDraftActive ? `Pick #${currentPickNumber}` : 'Draft begins in...'}
                  </div>
                  
                  {/* Progress bar for countdown */}
                  {!isDraftActive && (
                    <div className="mt-2 w-32 bg-white/30 rounded-full h-2">
                      <div 
                        className="bg-[#000F55] h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(preDraftCountdown / 60) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {/* Auto-pick indicator */}
                  {isMyTurn && isDraftActive && autoPickPlayer && (
                    <div className="text-xs text-[#000F55] font-medium mt-1">
                      Auto-pick: {autoPickPlayer.name} ({autoPickPlayer.position})
                    </div>
                  )}
                  {isMyTurn && isDraftActive && !autoPickPlayer && (
                    <div className="text-xs text-red-600 font-medium mt-1">
                      ⚠️ No valid auto-pick available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      <div className="flex">
        {/* Left Sidebar: Full Draft Board Button and Your Queue */}
        <div className="w-80 flex flex-col">
          {/* Full Draft Board Button */}
          <div className="p-4">
            <Link 
              href={`/draft/topdog/${roomId}/full-board`}
              className="w-full px-4 py-2 bg-[#60A5FA] text-[#000F55] font-bold rounded-lg hover:bg-[#2DE2C5] transition-colors text-sm text-center block"
            >
              Full Draft Board
            </Link>
          </div>
          
          {/* Your Queue */}
          <div className="px-4">
            <div className="bg-white/10 p-4 z-30 flex flex-col rounded-lg">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#60A5FA' }}>Your Queue</h2>
              
              {queue.length === 0 && (
                <div className="text-gray-300 mb-2">
                  No players in queue.
                  <button 
                    onClick={() => addToQueue(filteredPlayers[0])} 
                    className="ml-2 px-2 py-1 bg-[#60A5FA] text-[#000F55] rounded text-xs font-bold hover:bg-[#2DE2C5]"
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
                                    <div className="w-12 text-center text-xs font-bold text-[#60A5FA]">
                                      {player.adp || 'N/A'}
                                    </div>
                                    <div className="w-12 text-center text-xs font-bold text-[#2DE2C5]">
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
          {(isDraftActive || room?.status === 'waiting') && (
            <div className="bg-white/10 rounded p-4 mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#60A5FA' }}>
                Available Players
              </h2>
              
              {/* Search and Filter Controls */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Search players or teams..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="px-3 py-2 rounded text-black flex-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPositionFilter('ALL')}
                    className={`px-4 py-2 rounded font-bold transition-colors ${
                      positionFilter === 'ALL' 
                        ? 'bg-[#60A5FA] text-[#000F55]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setPositionFilter('QB')}
                    className={`px-4 py-2 rounded font-bold transition-colors ${
                      positionFilter === 'QB' 
                        ? 'bg-[#60A5FA] text-[#000F55]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    QB
                  </button>
                  <button
                    onClick={() => setPositionFilter('RB')}
                    className={`px-4 py-2 rounded font-bold transition-colors ${
                      positionFilter === 'RB' 
                        ? 'bg-[#60A5FA] text-[#000F55]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    RB
                  </button>
                  <button
                    onClick={() => setPositionFilter('WR')}
                    className={`px-4 py-2 rounded font-bold transition-colors ${
                      positionFilter === 'WR' 
                        ? 'bg-[#60A5FA] text-[#000F55]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    WR
                  </button>
                  <button
                    onClick={() => setPositionFilter('TE')}
                    className={`px-4 py-2 rounded font-bold transition-colors ${
                      positionFilter === 'TE' 
                        ? 'bg-[#60A5FA] text-[#000F55]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    TE
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                Showing {filteredPlayers.length} of {availablePlayers.length} available players
              </div>
              
              {/* Single Column Player List */}
              <div className="max-h-[52rem] overflow-y-auto">
                <div className="space-y-2">
                  {/* Column Headers */}
                  <div className="flex items-center justify-between bg-white/10 rounded p-3 font-bold text-sm">
                    <div className="flex items-center gap-3 flex-1">
                      <button 
                        onClick={() => setSortBy('adp')}
                        className={`w-16 text-center hover:text-[#60A5FA] hover:bg-white/5 transition-all cursor-pointer rounded px-1 py-1 ${
                          sortBy === 'adp' ? 'text-[#60A5FA] bg-white/10' : 'text-gray-300'
                        }`}
                        title="Click to sort by ADP"
                      >
                        ADP {sortBy === 'adp' && '↓'}
                      </button>
                      <button 
                        onClick={() => setSortBy('rankings')}
                        className={`w-16 text-center hover:text-[#2DE2C5] hover:bg-white/5 transition-all cursor-pointer rounded px-1 py-1 ${
                          sortBy === 'rankings' ? 'text-[#2DE2C5] bg-white/10' : 'text-gray-300'
                        }`}
                        title="Click to sort by Rankings"
                      >
                        Rank {sortBy === 'rankings' && '↓'}
                      </button>
                      <div className="flex-1"></div>
                    </div>
                    <div className="w-32 text-center">Actions</div>
                  </div>
                  
                  {filteredPlayers.map(player => {
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
                          <div className="w-16 text-center text-sm font-bold text-[#60A5FA]">
                            {player.adp || 'N/A'}
                          </div>
                          <div className="w-16 text-center text-sm font-bold text-[#2DE2C5]">
                            {rankings.indexOf(player.name) !== -1 ? `#${rankings.indexOf(player.name) + 1}` : 'N/A'}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-white">{player.name}</div>
                          </div>
                          <div className="text-sm text-gray-300 mr-4">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="w-8 text-center">{player.position}</span>
                              <span>•</span>
                              <span className="w-8 text-center">{player.team}</span>
                              <span>•</span>
                              <span className="w-12 text-center">Bye {player.bye}</span>
                            </div>
                            {!canDraft && (
                              <div className="text-red-400 text-center">
                                ({currentCount}/{limit} {player.position}s)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-32 justify-center">
                          <button
                            className={`px-3 py-1 rounded font-bold transition-colors text-sm ${
                              canDraft && isDraftActive
                                ? 'bg-[#60A5FA] text-[#000F55] hover:bg-[#2DE2C5] disabled:opacity-50' 
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
                              className="px-2 py-1 rounded bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
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

        {/* Right Sidebar: Team Roster */}
        <div className="w-80 bg-white/10 p-4 z-30 flex flex-col overflow-y-auto">
          {/* Team Selection Dropdown */}
          <div className="mb-4 team-dropdown">
            <div className="relative">
              <button
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className="w-full flex items-center justify-between bg-white/10 rounded p-3 text-left hover:bg-white/20 transition-colors"
              >
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#60A5FA' }}>
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
                <span className="text-[#60A5FA] font-bold">QB:</span>
                <span className="text-white">{currentTeamRosterGrouped.QB?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#60A5FA] font-bold">RB:</span>
                <span className="text-white">{currentTeamRosterGrouped.RB?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#60A5FA] font-bold">WR:</span>
                <span className="text-white">{currentTeamRosterGrouped.WR?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#60A5FA] font-bold">TE:</span>
                <span className="text-white">{currentTeamRosterGrouped.TE?.length || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Starting Lineup Section */}
          <div className="mb-6">
            <div className="space-y-3">
              {/* QB - 1 spot */}
              <div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#60A5FA' }}>
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
                <h4 className="font-bold text-sm mb-1" style={{ color: '#60A5FA' }}>
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
                <h4 className="font-bold text-sm mb-1" style={{ color: '#60A5FA' }}>
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
                <h4 className="font-bold text-sm mb-1" style={{ color: '#60A5FA' }}>
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
                <h4 className="font-bold text-sm mb-1" style={{ color: '#60A5FA' }}>
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
            <h3 className="font-bold text-lg mb-3" style={{ color: '#2DE2C5' }}>Bench</h3>
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
            className="bg-black border border-[#60A5FA] text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            title="Start a mock draft with 11 simulated drafters"
          >
            🎯 Mock Draft
          </button>
        </div>
      )}
    </div>
  );
} 