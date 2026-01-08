import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import {
  doc, getDoc, updateDoc, arrayUnion, onSnapshot, collection, addDoc, query, orderBy, setDoc, arrayRemove, getDocs, deleteDoc
} from 'firebase/firestore';
import Link from 'next/link';
import React from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from '../../../components/StrictModeDroppable';
import { PLAYER_POOL, groupPicksByPosition } from '../../../lib/playerPool';
import { getRandomMockDrafters } from '../../../lib/mockDrafters';
import FullDraftBoard from '../../../components/FullDraftBoard';
import { logoOptions } from '../../../components/team-logos';
import SevenSegmentCountdown from '../../../components/SevenSegmentCountdown';
import PicksAwayCalendar from '../../../components/PicksAwayCalendar';
import { getCustomPlayerRanking, loadCustomRankings } from '../../../lib/customRankings';
// Static player stats data (pre-downloaded)
import { getPlayerStats, hasPlayerStats, getStatsMetadata } from '../../../lib/staticPlayerStats';
import { createPositionGradient, createQueueGradient, createPickedPlayerGradient, getPositionEndColor } from '../../../lib/gradientUtils';
import RippleEffect from '../../../components/draft/v3/mobile/apple/components/RippleEffect';
import DraftNavbar from '../../../components/draft/v2/ui/DraftNavbar';
import { POSITION_COLORS, FLEX_POSITIONS } from '../../../components/draft/v3/constants/positions';

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
  const adjectives = ['Swift', 'Mighty', 'Brave', 'Clever', 'Fierce', 'Noble', 'Wild', 'Bold', 'Sharp', 'Quick'];
  const nouns = ['Wolf', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Hawk', 'Fox', 'Panther', 'Falcon', 'Jaguar'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

export default function DraftRoom() {
  const router = useRouter();

  // Custom ADP formatting function
  const formatADP = (adp) => {
    if (!adp || adp <= 0) return '-';
    const formatted = adp.toFixed(1);
    // If ADP is under 10.0, replace leading zero with 2 spaces
    if (adp < 10.0) {
      return formatted.replace(/^0/, '  ');
    }
    return formatted;
  };




  const { roomId } = router.query;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [picks, setPicks] = useState([]);
  const [userName, setUserName] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState(PLAYER_POOL);
  const [pickLoading, setPickLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const timerRef = useRef();
  const graceTimeoutRef = useRef();
  const prevPickLength = useRef(0);
  const [rankingsText, setRankingsText] = useState('');
  const [rankings, setRankings] = useState(['Ja\'Marr Chase', 'Justin Jefferson', 'Bijan Robinson', 'Saquon Barkley', 'CeeDee Lamb']);
  const [customRankings, setCustomRankings] = useState([]);
  
  // Temporary debug log
  console.log('Current rankings:', rankings);
  const [queue, setQueue] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(userName);
  const [showDraftOrderModal, setShowDraftOrderModal] = useState(false);
  const [draftOrder, setDraftOrder] = useState([]);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [positionFilters, setPositionFilters] = useState(['ALL']);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draftSettings, setDraftSettings] = useState({
    timerSeconds: 30,
    totalRounds: 18
  });
  const [showRandomizationNotification, setShowRandomizationNotification] = useState(false);
  const [draftOrderTimestamp, setDraftOrderTimestamp] = useState(null);
  const [preDraftCountdown, setPreDraftCountdown] = useState(60);
  const [sortBy, setSortBy] = useState('adp'); // 'adp' or 'rankings'
  const [adpSortDirection, setAdpSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [rankingSortDirection, setRankingSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [queueSortBy, setQueueSortBy] = useState('manual'); // 'manual', 'adp', or 'rankings'
  const picksScrollRef = useRef(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mockDraftSpeed, setMockDraftSpeed] = useState(false);
  const [showOverallPickNumbers, setShowOverallPickNumbers] = useState(false);
  const lastPickTimestampRef = useRef(0);
  const pickInProgressRef = useRef(false);
  const [rankingsModalOpen, setRankingsModalOpen] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [playerStatsData, setPlayerStatsData] = useState(null);

  // Derived state - computed from room status
  const isDraftActive = room?.status === 'active';

  // Auto-scroll to show only one completed pick at a time, positioned as far left as possible
  useEffect(() => {
    if (picksScrollRef.current && picks.length > 0) {
      // Add a longer delay to ensure DOM is fully updated
      setTimeout(() => {
        const completedPicksCount = picks.length;
        const currentPickIndex = completedPicksCount - 1; // Index of the last completed pick
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

  // Verify and clean up picks that don&apos;t belong to this room
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
    if (typeof window === 'undefined') return;
    // Get username from localStorage or generate a random one
    const storedName = localStorage.getItem('draftUserName');
    const name = storedName || getRandomName();
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
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error(`[ROOM ${roomId}] Timeout loading room data`);
      alert('Failed to load room data. Please check if the room exists and try again.');
    }, 10000); // 10 second timeout
    
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
      
      // Clear timeout since room data loaded successfully
      clearTimeout(timeoutId);
    }, (error) => {
      console.error(`[ROOM ${roomId}] Error listening to room data:`, error);
      clearTimeout(timeoutId);
      if (error.code === 'failed-precondition') {
        alert('Firebase connection error. Please check your internet connection and try again.');
      }
    });
    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally limited to roomId to avoid re-subscribing on every state change
  }, [roomId]);

  // Periodic verification that no drafted players are in available list
  useEffect(() => {
    if (!isDraftActive && room?.status !== 'waiting') return;
    
    const verificationInterval = setInterval(() => {
      const pickedNames = picks
        .filter(p => p && p.player && typeof p.player === 'string')
        .map(p => p.player);
      const invalidAvailablePlayers = availablePlayers.filter(p => {
        // Validate player object before checking
        if (!p || typeof p !== 'object' || typeof p.name !== 'string') {
          console.error(`[VERIFY] Invalid player object found in availablePlayers:`, p);
          return false;
        }
        return pickedNames.includes(p.name);
      });
      
      if (invalidAvailablePlayers.length > 0) {
        console.error(`🚨 PERIODIC CHECK: Found ${invalidAvailablePlayers.length} drafted players in available list:`, 
          invalidAvailablePlayers.map(p => p.name));
        
        // Force refresh available players
        const cleanAvailablePlayers = PLAYER_POOL.filter(p => {
          // Validate player object before filtering
          if (!p || typeof p !== 'object' || typeof p.name !== 'string') {
            console.error(`[VERIFY] Invalid player object found in PLAYER_POOL:`, p);
            return false;
          }
          return !pickedNames.includes(p.name);
        });
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
    const filteredAvailable = PLAYER_POOL.filter(p => {
      // Validate player object before filtering
      if (!p || typeof p !== 'object' || typeof p.name !== 'string') {
        console.error(`[AVAILABLE] Invalid player object found in PLAYER_POOL:`, p);
        return false;
      }
      return !pickedNames.includes(p.name);
    });
    setAvailablePlayers(filteredAvailable);
  }, [picks]);

  // Function to repair pick gaps and ensure proper sequencing
  const repairPickGaps = async () => {
    if (picks.length === 0) return;
    
    try {
      // Sort picks by pickNumber
      const sortedPicks = [...picks].sort((a, b) => a.pickNumber - b.pickNumber);
      let needsRepair = false;
      const repairs = [];
      
      // Check for gaps and create repair plan
      for (let i = 0; i < sortedPicks.length; i++) {
        const expectedPickNumber = i + 1;
        const actualPickNumber = sortedPicks[i].pickNumber;
        
        if (actualPickNumber !== expectedPickNumber) {
          console.warn(`[ROOM ${roomId}] Found pick gap: expected ${expectedPickNumber}, got ${actualPickNumber}`);
          needsRepair = true;
          repairs.push({
            oldPickNumber: actualPickNumber,
            newPickNumber: expectedPickNumber,
            pickData: sortedPicks[i]
          });
        }
      }
      
      // Execute repairs if needed
      if (needsRepair) {
        console.log(`[ROOM ${roomId}] Repairing ${repairs.length} pick gaps...`);
        
        for (const repair of repairs) {
          // Delete the old pick
          const oldPickRef = doc(db, 'draftRooms', roomId, 'picks', String(repair.oldPickNumber));
          await deleteDoc(oldPickRef);
          
          // Create the new pick with correct number
          const newPickRef = doc(db, 'draftRooms', roomId, 'picks', String(repair.newPickNumber));
          await setDoc(newPickRef, {
            ...repair.pickData,
            pickNumber: repair.newPickNumber
          });
          
          console.log(`[ROOM ${roomId}] Repaired pick ${repair.oldPickNumber} -> ${repair.newPickNumber}`);
        }
        
        console.log(`[ROOM ${roomId}] Pick repair completed`);
      }
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error repairing pick gaps:`, error);
    }
  };

  // Manual repair function that can be called from UI
  const manualRepairPicks = async () => {
    console.log(`[ROOM ${roomId}] Manual pick repair initiated...`);
    await repairPickGaps();
  };

  // Debug function to log current pick state
  const logPickState = () => {
    console.log(`[ROOM ${roomId}] Current pick state:`, {
      totalPicks,
      currentPickNumber,
      currentRound,
      picksLength: picks.length,
      picks: picks.map(p => ({ pickNumber: p.pickNumber, player: p.player, user: p.user })),
      sortedPicks: [...picks].sort((a, b) => a.pickNumber - b.pickNumber).map(p => ({ pickNumber: p.pickNumber, player: p.player, user: p.user }))
    });
  };

  // Listen for picks
  useEffect(() => {
    if (!roomId) return;
    const picksQuery = query(collection(db, 'draftRooms', roomId, 'picks'), orderBy('pickNumber'));
    const unsub = onSnapshot(picksQuery, (snap) => {
      // Normalize picks so player is always a string (player name)
      const picksArr = snap.docs.map(doc => {
        const data = doc.data();
        const playerField = data.player;
        
        // Handle all possible cases where player might be an object
        let normalizedPlayer;
        if (typeof playerField === 'string') {
          normalizedPlayer = playerField;
        } else if (typeof playerField === 'object' && playerField !== null) {
          // If it&apos;s an object, try to extract the name
          if (playerField.name && typeof playerField.name === 'string') {
            normalizedPlayer = playerField.name;
          } else if (playerField.player && typeof playerField.player === 'string') {
            normalizedPlayer = playerField.player;
          } else {
            console.error(`[PICKS] Player object has no valid name field:`, playerField);
            normalizedPlayer = '';
          }
        } else {
          console.error(`[PICKS] Invalid player field type:`, typeof playerField, playerField);
          normalizedPlayer = '';
        }
        
        // Validate the normalized pick data
        if (!normalizedPlayer || typeof normalizedPlayer !== 'string') {
          console.error(`[PICKS] Invalid player data in pick:`, data);
          return null;
        }
        
        return { ...data, player: normalizedPlayer };
      }).filter(pick => pick !== null); // Remove invalid picks
      
      setPicks(picksArr);
      
      // Remove picked players from available
      const pickedNames = picksArr
        .filter(p => p && p.player && typeof p.player === 'string')
        .map(p => p.player);
      const filteredAvailable = PLAYER_POOL.filter(p => {
        // Validate player object before filtering
        if (!p || typeof p !== 'object' || typeof p.name !== 'string') {
          console.error(`[PICKS] Invalid player object found in PLAYER_POOL:`, p);
          return false;
        }
        return !pickedNames.includes(p.name);
      });
      setAvailablePlayers(filteredAvailable);
      
      // Remove picked players from queue
      setQueue(prevQueue => prevQueue.filter(player => {
        // Validate player object before filtering
        if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
          console.error(`[PICKS] Invalid player object found in queue:`, player);
          return false;
        }
        return !pickedNames.includes(player.name);
      }));
      
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
        console.warn(`[ROOM ${roomId}] Found ${invalidPicks.length} picks that don&apos;t belong to this room:`, invalidPicks);
      }
    }, (error) => {
      console.error(`[ROOM ${roomId}] Error listening to picks:`, error);
      if (error.code === 'failed-precondition') {
        alert('Firebase connection error. Please check your internet connection and try again.');
      }
    });
    return () => unsub();
  }, [roomId]);

  // Separate effect to repair pick gaps when picks change
  useEffect(() => {
    if (picks.length > 0) {
      // Only repair if there are actual gaps
      const sortedPicks = [...picks].sort((a, b) => a.pickNumber - b.pickNumber);
      const hasGaps = sortedPicks.some((pick, index) => pick.pickNumber !== index + 1);
      
      if (hasGaps) {
        console.log(`[ROOM ${roomId}] Detected pick gaps, initiating repair...`);
        repairPickGaps();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally limited to picks.length to avoid infinite repair loops
  }, [picks.length]);

  // Load rankings from localStorage and set sorting
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('draftRankings');
    console.log('Loading rankings from localStorage:', stored);
    if (stored) {
      try {
        const parsedRankings = JSON.parse(stored);
        console.log('Parsed rankings:', parsedRankings);
        if (Array.isArray(parsedRankings)) {
          setRankings(parsedRankings);
          
          if (parsedRankings.length > 0) {
        // If custom rankings exist, use them for sorting
        console.log('Setting sortBy to rankings');
        setSortBy('rankings');
      } else {
            // If no custom rankings, use ADP
            console.log('Setting sortBy to adp');
            setSortBy('adp');
          }
        } else {
          console.warn('Invalid rankings data in localStorage, not an array');
          setRankings([]);
          setSortBy('adp');
        }
      } catch (error) {
        console.error('Error parsing rankings from localStorage:', error);
        setRankings([]);
        setSortBy('adp');
      }
    } else {
      // No stored rankings, use ADP
      console.log('No stored rankings, setting sortBy to adp');
      setSortBy('adp');
    }
  }, []);

  // Load queue from localStorage


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('draftQueue');
    if (stored) {
      try {
        const parsedQueue = JSON.parse(stored);
        // Validate that the parsed data is an array of player objects
        if (Array.isArray(parsedQueue) && parsedQueue.every(player => 
          player && typeof player === 'object' && typeof player.name === 'string'
        )) {
          setQueue(parsedQueue);
        } else {
          console.warn('Invalid queue data in localStorage, clearing queue');
          localStorage.removeItem('draftQueue');
          setQueue([]);
        }
      } catch (error) {
        console.error('Error parsing queue from localStorage:', error);
        localStorage.removeItem('draftQueue');
        setQueue([]);
      }
    }
    
    // Clean up any corrupted data in localStorage
    const cleanupLocalStorage = () => {
      if (typeof window === 'undefined') return;
      try {
        const stored = localStorage.getItem('draftQueue');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) {
            localStorage.removeItem('draftQueue');
          }
        }
      } catch (error) {
        localStorage.removeItem('draftQueue');
      }
    };
    
    cleanupLocalStorage();
  }, []);

  // Load rankings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('draftRankings');
    if (stored) {
      try {
        const parsedRankings = JSON.parse(stored);
        setRankings(parsedRankings);
      } catch (error) {
        console.error('Error parsing rankings:', error);
      }
    }
  }, []);

  // Load custom rankings
  useEffect(() => {
    const loadedRankings = loadCustomRankings();
    setCustomRankings(loadedRankings);
  }, []);





  // Save queue to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only save if queue is a valid array of player objects
    if (Array.isArray(queue) && queue.every(player => 
      player && typeof player === 'object' && typeof player.name === 'string'
    )) {
      localStorage.setItem('draftQueue', JSON.stringify(queue));
    } else {
      console.warn('Invalid queue data detected, not saving to localStorage:', queue);
    }
  }, [queue]);

  // Add to queue
  const addToQueue = (player) => {
    console.log('Adding player to queue:', player);
    // Validate that player is a valid object with a name property
    if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
      console.error('Invalid player object passed to addToQueue:', player);
      return;
    }
    if (!queue.find(p => p.name === player.name)) {
      const newQueue = [...queue, player];
      console.log('New queue:', newQueue);
      setQueue(newQueue);
    }
  };
  
  // Remove from queue
  const removeFromQueue = (player) => {
    // Validate that player is a valid object with a name property
    if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
      console.error('Invalid player object passed to removeFromQueue:', player);
      return;
    }
    setQueue(queue.filter(p => p.name !== player.name));
  };



  const handleRankingsUpload = (e) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    const lines = (rankingsText || '')
      .split(/\n|,/)
      .map(l => l.trim())
      .filter(Boolean);
    
    console.log('Uploading new rankings:', lines);
    setRankings(lines);
    localStorage.setItem('draftRankings', JSON.stringify(lines));
    console.log('Saved rankings to localStorage:', lines);
    setRankingsText('');
    setRankingsModalOpen(false);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof window === 'undefined') return;
      const text = event.target.result;
      const lines = text
        .split(/\n|,/)
        .map(l => l.trim())
        .filter(Boolean);
      
      console.log('Uploading CSV rankings:', lines);
      setRankings(lines);
      localStorage.setItem('draftRankings', JSON.stringify(lines));
    };
    reader.readAsText(file);
  };

  const clearRankings = () => {
    setRankings([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('draftRankings');
    }
  };

  const getPlayerRanking = (playerName) => {
    const index = rankings.indexOf(playerName);
    const rank = index !== -1 ? index + 1 : null;
    return rank ? rank.toString() : '';
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
  
  // More robust currentPickNumber calculation that checks for gaps
  const calculateCurrentPickNumber = () => {
    if (picks.length === 0) return 1;
    
    // Sort picks by pickNumber to ensure proper order
    const sortedPicks = [...picks].sort((a, b) => a.pickNumber - b.pickNumber);
    
    // Check for gaps in pick numbers
    for (let i = 0; i < sortedPicks.length; i++) {
      const expectedPickNumber = i + 1;
      const actualPickNumber = sortedPicks[i].pickNumber;
      
      if (actualPickNumber !== expectedPickNumber) {
        console.warn(`[ROOM ${roomId}] Found gap in picks: expected ${expectedPickNumber}, got ${actualPickNumber}`);
        return expectedPickNumber;
      }
    }
    
    // If no gaps found, return the next pick number
    return picks.length + 1;
  };
  
  const currentPickNumber = calculateCurrentPickNumber();
  const currentRound = Math.ceil(currentPickNumber / effectiveDraftOrder.length);
  
  // Snake draft logic: odd rounds go forward, even rounds go backward
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndex = (currentPickNumber - 1) % effectiveDraftOrder.length;
  const currentPicker = isSnakeRound
    ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
    : effectiveDraftOrder[pickIndex];
  const isMyTurn = userName === currentPicker;
  const isOnTheClock = currentPickNumber === picks.length + 1;

  // Timer logic
  useEffect(() => {
    if (!isDraftActive || picks.length >= totalPicks) {
      // Use room timer setting for mock drafts, fallback to 10 seconds for quick mock drafts
      const timerDuration = room?.mockDrafters?.length > 0 ? (room?.settings?.timerSeconds || 10) : (room?.settings?.timerSeconds || 30);
      setTimer(timerDuration);
      clearInterval(timerRef.current);
      return;
    }
    
    // Get current picker
    const currentPicker = effectiveDraftOrder[pickIndex];
    const mockDrafterNames = room?.mockDrafters || [];
    const isMockDrafter = currentPicker && currentPicker !== userName && mockDrafterNames.includes(currentPicker);
    
    // Use room timer setting for mock drafts, fallback to 10 seconds for quick mock drafts
    const timerDuration = room?.mockDrafters?.length > 0 ? (room?.settings?.timerSeconds || 10) : (room?.settings?.timerSeconds || 30);
    
      // Timer should count down for both current user and mock drafters
  if ((isMyTurn || isMockDrafter) && room?.status !== 'paused') {
    setTimer(timerDuration);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Start grace period when timer hits 0
          setIsInGracePeriod(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  } else {
    // Reset timer when it&apos;s not our turn or draft is paused
    setTimer(timerDuration);
    clearInterval(timerRef.current);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Timer logic intentionally excludes effectiveDraftOrder and pickIndex to prevent timer resets
  }, [isMyTurn, isDraftActive, picks.length, totalPicks, room?.settings?.timerSeconds, currentPicker, room?.mockDrafters, userName, room?.status]);

  // Ripple effect trigger when user is on the clock and timer reaches 10 seconds
  useEffect(() => {
    if (isMyTurn && timer === 10 && isDraftActive && room?.status !== 'paused') {
      setShowRipple(true);
    }
  }, [isMyTurn, timer, isDraftActive, room?.status]);

  // Handle grace period timeout
  useEffect(() => {
    if (isInGracePeriod) {
      // Clear any existing grace timeout
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
      }
      
      // Set 1-second grace period timeout
      graceTimeoutRef.current = setTimeout(() => {
        setIsInGracePeriod(false);
        // Trigger autopick after grace period
        if (isDraftActive && room?.status !== 'paused' && availablePlayers.length > 0) {
          const currentPicker = effectiveDraftOrder[pickIndex];
          const mockDrafterNames = room?.mockDrafters || [];
          const isMockDrafter = currentPicker && currentPicker !== userName && mockDrafterNames.includes(currentPicker);
          
          if (isMyTurn) {
            // User autopick logic (same as before)
            const getAutoPickPlayerNow = () => {
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
              
              const AUTODRAFT_LIMITS = {
                QB: 3,
                RB: 6,
                WR: 7,
                TE: 3
              };
              
              let draftablePlayers = availablePlayers.filter(player => {
                const currentCount = positionCounts[player.position] || 0;
                const limit = AUTODRAFT_LIMITS[player.position];
                return currentCount < limit;
              });
              
              if (draftablePlayers.length === 0) {
                draftablePlayers = availablePlayers.filter(player => canDraftPlayer(player.name));
              }
              
              if (draftablePlayers.length === 0) {
                return null;
              }
              
              draftablePlayers.sort((a, b) => (a.adp || 999) - (b.adp || 999));
              
              const queued = queue.find(p => draftablePlayers.find(ap => ap.name === p.name));
              if (queued) return queued;
              
              if (rankings.length > 0) {
                const rankedPlayer = draftablePlayers.find(p => rankings.includes(p.name));
                if (rankedPlayer) return rankedPlayer;
              }
              
              return draftablePlayers[0];
            };

            const autoPick = getAutoPickPlayerNow();
          
            if (!autoPick) {
              console.error(`[ROOM ${roomId}] No valid auto-pick available for ${userName} - autodraft limits reached`);
              alert(`No valid players available for autodraft. You have reached autodraft position limits (3QB, 6RB, 7WR, 3TE). Please manually select a player.`);
              const timerDuration = room?.mockDrafters?.length > 0 ? 10 : 30;
              setTimer(timerDuration);
              return;
            }
            
            console.log(`[ROOM ${roomId}] Grace period expired for ${userName}, auto-picking: ${autoPick.name}`);
            makePick(autoPick.name);
          } else if (isMockDrafter) {
            const mockAutoPick = availablePlayers[0];
            if (mockAutoPick) {
              console.log(`[ROOM ${roomId}] Grace period expired for mock drafter ${currentPicker}, auto-picking: ${mockAutoPick.name}`);
              makeAutoPick(mockAutoPick.name);
            }
          }
        }
      }, 1000); // 1 second grace period
    }
    
    return () => {
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Grace period logic intentionally excludes makePick/makeAutoPick/canDraftPlayer to avoid stale closures
  }, [isInGracePeriod, isDraftActive, room?.status, availablePlayers, effectiveDraftOrder, pickIndex, room?.mockDrafters, userName, isMyTurn, picks, queue, rankings]);

  // Reset grace period when turn changes or pick is made
  useEffect(() => {
    setIsInGracePeriod(false);
    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
    }
  }, [isMyTurn, picks.length]);

  // Old autopick logic (disabled - now handled by grace period)
  useEffect(() => {
    if (false) { // Disabled - grace period handles autopick now
      // Get current picker
      const currentPicker = effectiveDraftOrder[pickIndex];
      const mockDrafterNames = room?.mockDrafters || [];
      const isMockDrafter = currentPicker && currentPicker !== userName && mockDrafterNames.includes(currentPicker);
      
      if (isMyTurn) {
        // Determine who would be auto-picked (using current state values)
        const getAutoPickPlayerNow = () => {
          // Get current user&apos;s roster to check position counts
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

        const autoPick = getAutoPickPlayerNow();
      
      if (!autoPick) {
        console.error(`[ROOM ${roomId}] No valid auto-pick available for ${userName} - autodraft limits reached`);
        // Alert the user and extend timer by 30 seconds
        alert(`No valid players available for autodraft. You have reached autodraft position limits (3QB, 6RB, 7WR, 3TE). Please manually select a player.`);
        // Use 10 seconds for mock drafts, 30 seconds for regular drafts
        const timerDuration = room?.mockDrafters?.length > 0 ? 10 : 30;
        setTimer(timerDuration); // Give more seconds based on draft type
        return;
      }
      
      console.log(`[ROOM ${roomId}] Timer expired for ${userName}, auto-picking: ${autoPick.name}`);
      makePick(autoPick.name);
      } else if (isMockDrafter) {
        // Handle mock drafter autopick
        const mockAutoPick = availablePlayers[0]; // Simple autopick for mock drafters
        if (mockAutoPick) {
          console.log(`[ROOM ${roomId}] Timer expired for mock drafter ${currentPicker}, auto-picking: ${mockAutoPick.name}`);
          makeAutoPick(mockAutoPick.name);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Disabled autopick logic, dependencies intentionally limited
  }, [timer, isMyTurn, isDraftActive, availablePlayers, rankings, queue, effectiveDraftOrder, pickIndex, room?.mockDrafters, userName, room?.status]);

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

          // Save user&apos;s drafted team to Firestore
          const userId = userName;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Completion logic intentionally excludes clearPicksForRoom, picks array, room?.name, and userName to avoid premature triggers
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

  // Function to handle opening player modal
  const openPlayerModal = (player) => {
    setSelectedPlayerForModal(player);
    setShowPlayerModal(true);
    
    // Get pre-downloaded stats from static JavaScript module
    const playerStats = getPlayerStats(player.name);
    if (playerStats) {
      setPlayerStatsData(playerStats);
      setPlayerStatsLoading(false);
      console.log(`✅ Loaded stats for ${player.name}`);
    } else {
      console.warn(`No static stats found for player: ${player.name}, creating basic playerStatsData for projections`);
      // Create basic playerStatsData structure so projections can still display
      const basicPlayerData = {
        name: player.name,
        position: player.position,
        team: player.team || 'FA',
        seasons: [] // Empty seasons array - projections will still work
      };
      setPlayerStatsData(basicPlayerData);
      setPlayerStatsLoading(false);
    }
  };

  // Function to close player modal
  const closePlayerModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayerForModal(null);
    setPlayerStatsData(null);
    setPlayerStatsLoading(false);
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
    
    // Check positional limits
    if (!canDraftPlayer(player)) {
      const playerData = PLAYER_POOL.find(p => p.name === player);
      const limit = POSITIONAL_LIMITS[playerData.position];
      alert(`You can only draft ${limit} ${playerData.position}s. You already have ${getTeamRoster(userName).filter(p => p.position === playerData.position).length}.`);
      return;
    }
    
    try {
      pickInProgressRef.current = true;
      setPickLoading(true);
      
      // Use the calculated currentPickNumber to ensure proper sequencing
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(currentPickNumber));
      await setDoc(pickRef, {
        pickNumber: currentPickNumber,
        round: currentRound,
        user: userName,
        player,
        roomId: roomId,
        timestamp: Date.now(),
      });
      console.log(`[ROOM ${roomId}] Pick made: ${player} by ${userName} (pick #${currentPickNumber})`);
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error making pick:`, error);
      alert('Error making pick. Please try again.');
    } finally {
      setPickLoading(false);
      pickInProgressRef.current = false;
    }
  };

  // Auto-pick function that bypasses turn checks
  const makeAutoPick = async (player, picker = null, pickNumber = null) => {
    console.log('🤖 AUTO PICK CALLED:', {
      player,
      picker,
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
      
      // Use the provided picker or fall back to currentPicker if available
      const actualPicker = picker || currentPicker;
      
      // Use the provided pick number or calculate from picks length
      const actualPickNumber = pickNumber || (picks.length + 1);
      const actualRound = Math.ceil(actualPickNumber / draftOrder.length);
      
      // Use the calculated pick number to ensure proper sequencing
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(actualPickNumber));
      await setDoc(pickRef, {
        pickNumber: actualPickNumber,
        round: actualRound,
        user: actualPicker,
        player,
        roomId: roomId,
        timestamp: Date.now(),
      });
      console.log(`[ROOM ${roomId}] Auto-pick made: ${player} by ${actualPicker} (pick #${actualPickNumber})`);
    } catch (error) {
      console.error(`[ROOM ${roomId}] Error making auto-pick:`, error);
    } finally {
      setPickLoading(false);
      pickInProgressRef.current = false;
    }
  };

  // Get current autopick player for display purposes (using current render state)
  const getCurrentAutoPickPlayer = () => {
    // Get current user&apos;s roster to check position counts
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
  
  const autoPickPlayer = getCurrentAutoPickPlayer();

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

  // Helper function to get position color (uses centralized constants)
  const getPositionColor = (position) => {
    return POSITION_COLORS[position]?.primary || '#808080';
  };

  // Helper function to get drag styles that prevent jumping
  const getDragItemStyle = (isDragging, draggableStyle, index) => ({
    // Apply the draggable styles but prevent jumping
    ...draggableStyle,
    paddingTop: index === 0 ? '8px' : '4px',
    paddingBottom: '4px',
    marginBottom: '4px',
    // Keep the item visible during drag with proper opacity and scaling
    opacity: isDragging ? 0.8 : 1,
    transform: draggableStyle?.transform || 'none',
    position: 'relative',
    zIndex: isDragging ? 1000 : 'auto',
    // Maintain box sizing to prevent layout shift
    boxSizing: 'border-box'
  });

  // Universal drag handler for both available players and queue
  const onUniversalDragEnd = (result) => {
    console.log('Universal drag end result:', result);
    const { source, destination } = result;
    
    if (!destination) {
      console.log('No destination, returning');
      return;
    }

    // Handle dragging from available players to queue
    if (source.droppableId === 'available-players' && destination.droppableId === 'player-queue') {
      console.log('Dragging from available players to queue');
      const draggedPlayer = filteredPlayers[source.index];
      if (draggedPlayer && !queue.find(p => p.name === draggedPlayer.name)) {
        addToQueue(draggedPlayer);
      }
      return;
    }

    // Handle reordering within queue
    if (source.droppableId === 'player-queue' && destination.droppableId === 'player-queue') {
      console.log('Reordering within queue');
      const newQueue = Array.from(queue);
      const [removed] = newQueue.splice(source.index, 1);
      newQueue.splice(destination.index, 0, removed);
      setQueue(newQueue);
      return;
    }

    // Handle reordering within available players (no effect, just for visual feedback)
    if (source.droppableId === 'available-players' && destination.droppableId === 'available-players') {
      console.log('Reordering within available players - no action needed');
      return;
    }
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
      
      // Save the randomized order but don&apos;t start draft yet
      updateDoc(doc(db, 'draftRooms', roomId), { 
        draftOrder: shuffled,
        draftOrderTimestamp: timestamp
      });
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowRandomizationNotification(false);
      }, 5000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Randomization logic intentionally limited to prevent re-randomization
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
      // Assign to FLEX if position-specific spots are full and FLEX has room
      else if (FLEX_POSITIONS.includes(player.position) && lineup.FLEX.length < 2) {
        assignPlayer(player, 'FLEX');
      }
    });

    return lineup;
  };

  const openTeamModal = (teamName) => {
    setSelectedTeam(teamName);
    setShowTeamModal(true);
  };

  // Get current user&apos;s roster
  const myRoster = getTeamRoster(userName);
  const myRosterGrouped = getTeamRosterGrouped(userName);

  // NEW: Calculate position percentages for any team
  const getTeamPositionPercentages = (teamName) => {
    const teamPicks = picks.filter(pick => pick.user === teamName);
    

    
    if (teamPicks.length === 0) {
      return { qb: 0, rb: 0, wr: 0, te: 0 };
    }
    
    const qbCount = teamPicks.filter(pick => {
      const player = PLAYER_POOL.find(p => p.name === pick.player);
      return player?.position === 'QB';
    }).length;
    
    const rbCount = teamPicks.filter(pick => {
      const player = PLAYER_POOL.find(p => p.name === pick.player);

      return player?.position === 'RB';
    }).length;
    
    const wrCount = teamPicks.filter(pick => {
      const player = PLAYER_POOL.find(p => p.name === pick.player);
      return player?.position === 'WR';
    }).length;
    
    const teCount = teamPicks.filter(pick => {
      const player = PLAYER_POOL.find(p => p.name === pick.player);
      return player?.position === 'TE';
    }).length;
    
    const totalPicks = teamPicks.length;
    
    return {
      qb: totalPicks > 0 ? (qbCount / totalPicks) * 100 : 0,
      rb: totalPicks > 0 ? (rbCount / totalPicks) * 100 : 0,
      wr: totalPicks > 0 ? (wrCount / totalPicks) * 100 : 0,
      te: totalPicks > 0 ? (teCount / totalPicks) * 100 : 0
    };
  };

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
      // Assign to FLEX if position-specific spots are full and FLEX has room
      else if (FLEX_POSITIONS.includes(player.position) && lineup.FLEX.length < 2) {
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
  const pickedPlayerNames = picks
    .filter(p => p && p.player && typeof p.player === 'string')
    .map(p => p.player);
  
  // Get truly available players (not drafted) - MULTIPLE LAYERS OF PROTECTION
  const trulyAvailablePlayers = PLAYER_POOL.filter(p => {
    // Layer 0: Basic object validation
    if (!p || typeof p !== 'object' || typeof p.name !== 'string') {
      console.error(`[FILTER] Invalid player object found in PLAYER_POOL:`, p);
      return false;
    }
    
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
  
  let filteredPlayers = trulyAvailablePlayers.filter(player => {
    // Layer 0: Basic object validation
    if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
      console.error(`[FILTER] Invalid player object found in trulyAvailablePlayers:`, player);
      return false;
    }
    
    // Layer 3: Final safety check in filtered list
    if (pickedPlayerNames.includes(player.name)) {
      console.error(`[FILTER] CRITICAL ERROR: Drafted player ${player.name} found in filtered list`);
      return false;
    }
    
    // Cache toLowerCase() result for playerSearch to avoid repeated calls
    const playerSearchLower = playerSearch.toLowerCase();
    const matchesSearch = (player.name?.toLowerCase() || '').includes(playerSearchLower) ||
                         (player.team?.toLowerCase() || '').includes(playerSearchLower);
    // Safeguard: if no position filters are selected, show all players
    const effectivePositionFilters = positionFilters.length === 0 ? ['ALL'] : positionFilters;
    const matchesPosition = effectivePositionFilters.includes('ALL') || effectivePositionFilters.includes(player.position);
    return matchesSearch && matchesPosition;
  }).sort((a, b) => {
    if (sortBy === 'adp') {
      const adpA = a.adp || 999;
      const adpB = b.adp || 999;
      return adpSortDirection === 'asc' ? adpA - adpB : adpB - adpA;
    } else if (sortBy === 'rankings') {
      // Convert -1 (not found) to 9999 for unranked players
      const aIndex = customRankings.indexOf(a.name);
      const aRank = aIndex !== -1 ? aIndex : 9999;
      const bIndex = customRankings.indexOf(b.name);
      const bRank = bIndex !== -1 ? bIndex : 9999;
      
      // If both players have ranks (including 9999 for unranked), sort by rank
      if (aRank !== bRank) {
        return rankingSortDirection === 'asc' ? aRank - bRank : bRank - aRank;
      }
      
      // If ranks are equal (both unranked with rank 9999), sort by ADP high to low
      const adpA = a.adp && a.adp > 0 ? a.adp : 9999;
      const adpB = b.adp && b.adp > 0 ? b.adp : 9999;
      return adpB - adpA; // Sort by ADP high to low for unranked players
    }
    return 0;
  });

  // Enhanced debug logging (disabled for performance)
  if (process.env.NODE_ENV === 'development') {
    console.log('=== PLAYER FILTERING DEBUG ===');
    console.log('Current position filters:', positionFilters);
    console.log('Player search term:', playerSearch);
    console.log('Total PLAYER_POOL size:', PLAYER_POOL.length);
    
    // Check what positions are in PLAYER_POOL
    const positionsInPool = [...new Set(PLAYER_POOL.map(p => p.position))];
    console.log('Positions in PLAYER_POOL:', positionsInPool);
    console.log('Current picks count:', picks.length);
    console.log('Picked player names:', pickedPlayerNames);
    console.log('Available players state count:', availablePlayers.length);
    console.log('Truly available players count:', trulyAvailablePlayers.length);
    console.log('Filtered players count:', filteredPlayers.length);
  }
  
  // Check for any drafted players in the filtered list
  const draftedInFiltered = filteredPlayers.filter(player => {
    // Validate player object before checking
    if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
      console.error(`[FILTER] Invalid player object found in filteredPlayers:`, player);
      return false;
    }
    return pickedPlayerNames.includes(player.name);
  });
  
  let finalFilteredPlayers = filteredPlayers;
  
  if (draftedInFiltered.length > 0) {
    console.error('🚨 CRITICAL ERROR: Found drafted players in filtered list:', draftedInFiltered.map(p => p.name));
    // Force remove them from the filtered list
    finalFilteredPlayers = filteredPlayers.filter(player => {
      // Validate player object before filtering
      if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
        console.error(`[FILTER] Invalid player object found in filteredPlayers:`, player);
        return false;
      }
      return !pickedPlayerNames.includes(player.name);
    });
    console.log('Cleaned filtered players count:', finalFilteredPlayers.length);
  } else {
    console.log('✅ No drafted players found in filtered list');
  }
  
  // Additional safety check: verify no duplicates
  const playerNames = finalFilteredPlayers
    .filter(player => player && typeof player === 'object' && typeof player.name === 'string')
    .map(p => p.name);
  const uniqueNames = new Set(playerNames);
  if (playerNames.length !== uniqueNames.size) {
    console.warn('⚠️ Duplicate players found in filtered list, removing duplicates');
    const seen = new Set();
    finalFilteredPlayers = finalFilteredPlayers.filter(player => {
      // Validate player object before checking
      if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
        console.error(`[FILTER] Invalid player object found in filteredPlayers:`, player);
        return false;
      }
      if (seen.has(player.name)) {
        return false;
      }
      seen.add(player.name);
      return true;
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Sample available player:', availablePlayers[0] && typeof availablePlayers[0] === 'object' ? availablePlayers[0] : 'No valid players');
    console.log('Sample truly available player:', trulyAvailablePlayers[0] && typeof trulyAvailablePlayers[0] === 'object' ? trulyAvailablePlayers[0] : 'No valid players');
    console.log('Sample filtered player:', finalFilteredPlayers[0] && typeof finalFilteredPlayers[0] === 'object' ? finalFilteredPlayers[0] : 'No valid players');
    console.log('Rankings count:', rankings.length);
    console.log('Sample player with ADP:', finalFilteredPlayers[0] && typeof finalFilteredPlayers[0] === 'object' ? finalFilteredPlayers[0] : 'No valid players');
    console.log('Sample rankings:', rankings.slice(0, 5));
    console.log('Queue count:', queue.length);
    console.log('Queue data:', queue.filter(player => player && typeof player === 'object' && typeof player.name === 'string'));
    console.log('=== END PLAYER FILTERING DEBUG ===');
  }
  
  // Assign the final result back to filteredPlayers
  filteredPlayers = finalFilteredPlayers;



  // Start draft function
  const startDraft = async () => {
    try {
      if (!isRoomOwner) {
        alert('Only the room owner can start the draft.');
        return;
      }

      // Check if we have enough participants
      if (effectiveDraftOrder.length < 2) {
        alert('Need at least 2 participants to start the draft.');
        return;
      }

      // Update room status to waiting to trigger countdown
      await updateDoc(doc(db, 'draftRooms', roomId), {
        status: 'waiting',
        startedAt: null // Will be set when countdown completes
      });

      // Set local state to trigger countdown
      setPreDraftCountdown(60);
      
      console.log('Draft started with countdown - participants:', effectiveDraftOrder);
      console.log('Draft will start in 60 seconds...');
      
    } catch (error) {
      console.error('Error starting draft:', error);
      alert('Error starting draft. Please try again.');
    }
  };

  // Mock draft function
  const startMockDraft = async () => {
    try {
      // Get 11 simulated drafter names from the index
      const mockDrafters = getRandomMockDrafters();
      
      if (mockDrafters.length === 0) {
        alert('No mock drafter names available. Please add names to the mock drafter index.');
        return;
      }
      
      // Add current user and mock drafters to participants
      const allParticipants = [userName, ...mockDrafters];
      
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

  // Pause draft function
  const pauseDraft = async () => {
    try {
      // Allow anyone to pause mock drafts, but only room owner for regular drafts
      const isMockDraft = room?.mockDrafters?.length > 0;
      if (!isRoomOwner && !isMockDraft) {
        alert('Only the room owner can pause the draft.');
        return;
      }

      if (!isDraftActive) {
        alert('Draft is not currently active.');
        return;
      }

      // Update room status to paused
      await updateDoc(doc(db, 'draftRooms', roomId), {
        status: 'paused',
        pausedAt: new Date()
      });

      console.log('Draft paused');
      
    } catch (error) {
      console.error('Error pausing draft:', error);
      alert('Error pausing draft. Please try again.');
    }
  };

  // Resume draft function
  const resumeDraft = async () => {
    try {
      // Allow anyone to resume mock drafts, but only room owner for regular drafts
      const isMockDraft = room?.mockDrafters?.length > 0;
      if (!isRoomOwner && !isMockDraft) {
        alert('Only the room owner can resume the draft.');
        return;
      }

      if (room?.status !== 'paused') {
        alert('Draft is not currently paused.');
        return;
      }

      // Update room status back to active
      await updateDoc(doc(db, 'draftRooms', roomId), {
        status: 'active',
        pausedAt: null
      });

      console.log('Draft resumed');
      
    } catch (error) {
      console.error('Error resuming draft:', error);
      alert('Error resuming draft. Please try again.');
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
    
    // Defensive check: if a pick is already in progress, don&apos;t start another
    if (pickInProgressRef.current) {
      console.log('❌ MOCK PICK BLOCKED: Pick already in progress');
      return;
    }
    
    // Defensive check: if pickLoading is already true, don&apos;t start another
    if (pickLoading) {
      console.log('❌ MOCK PICK BLOCKED: pickLoading already true');
      return;
    }
    
    // Defensive check: if this pick number has already been processed, don&apos;t make it again
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
      
      // Realistic mock draft strategy with QB delay
      let bestAvailable;
      
      // Check if we should delay QB picks based on current round and available QBs
      const currentRound = Math.ceil(pickNumber / effectiveDraftOrder.length);
      const qbsAvailable = availableForMock.filter(p => p.position === 'QB');
      const nonQbsAvailable = availableForMock.filter(p => p.position !== 'QB');
      
      // QB strategy: Delay QBs until round 4+ unless it&apos;s a top-tier QB (ADP < 50)
      const shouldDelayQBs = currentRound < 4 && qbsAvailable.length > 0;
      const topTierQBs = qbsAvailable.filter(qb => (qb.adp || 999) < 50);
      
      if (shouldDelayQBs && topTierQBs.length === 0 && nonQbsAvailable.length > 0) {
        // Delay QB picks - pick best non-QB available
        bestAvailable = nonQbsAvailable.sort((a, b) => (a.adp || 999) - (b.adp || 999))[0];
        console.log('🎯 QB DELAY STRATEGY: Picking non-QB to delay QB selection');
      } else {
        // Normal strategy: pick best available by ADP
        bestAvailable = availableForMock.sort((a, b) => (a.adp || 999) - (b.adp || 999))[0];
      }
      
      console.log('🎯 SELECTED PLAYER FOR MOCK PICK:', {
        player: bestAvailable.name,
        position: bestAvailable.position,
        adp: bestAvailable.adp,
        pickNumber,
        timestamp: new Date().toISOString()
      });
      
      // Add a small delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Use the calculated currentPickNumber to ensure proper sequencing
      const actualPickNumber = currentPickNumber;
      const pickRef = doc(db, 'draftRooms', roomId, 'picks', String(actualPickNumber));
      await setDoc(pickRef, {
        pickNumber: actualPickNumber,
        round: currentRound,
        user: mockDrafter,
        player: bestAvailable.name,
        roomId: roomId,
        timestamp: Date.now(),
      });
      
      console.log(`[ROOM ${roomId}] Mock pick made: ${bestAvailable.name} by ${mockDrafter} (pick #${actualPickNumber})`);
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Mock draft logic intentionally excludes makeMockPick and pickLoading to prevent race conditions
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Stall detection intentionally excludes makeMockPick to prevent infinite stall recovery loops
  }, [isDraftActive, mockDraftSpeed, picks.length, totalPicks, room?.status, effectiveDraftOrder, pickIndex, room?.mockDrafters, currentPickNumber, currentRound]);

  // User turn stall detection and recovery
  useEffect(() => {
    if (!isDraftActive || picks.length >= totalPicks || room?.status === 'completed') return;

    const currentPicker = effectiveDraftOrder[pickIndex];
    const isUserTurn = currentPicker === 'Not Todd Middleton';

    if (isUserTurn && !pickLoading) {
      console.log('👤 USER TURN STALL DETECTION: User on clock, setting up stall monitor');
      
      const stallTimeout = setTimeout(() => {
        console.log('🚨 USER TURN STALL DETECTED: User has been on clock for 10+ seconds');
        console.log('🔄 FORCING PICK LOADING RESET');
        setPickLoading(false);
        pickInProgressRef.current = false;
      }, 10000); // 10 second stall threshold

      return () => clearTimeout(stallTimeout);
    }
  }, [isDraftActive, picks.length, totalPicks, room?.status, effectiveDraftOrder, pickIndex, pickLoading]);

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

  // Pre-draft countdown effect
  useEffect(() => {
    if (room?.status === 'waiting' && preDraftCountdown > 0) {
      const countdownInterval = setInterval(() => {
        setPreDraftCountdown((prev) => {
          if (prev <= 1) {
            // Countdown finished, start the draft
            clearInterval(countdownInterval);
            updateDoc(doc(db, 'draftRooms', roomId), {
              status: 'active',
              startedAt: new Date()
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [room?.status, preDraftCountdown, roomId]);

  // Auto-switch to user&apos;s team when it&apos;s their turn or when page loads
  useEffect(() => {
    if (isMyTurn && isDraftActive) {
      setSelectedTeam(userName);
    }
  }, [isMyTurn, isDraftActive, userName]);

  // Set selected team to current user when page loads
  useEffect(() => {
    if (userName && !selectedTeam) {
      setSelectedTeam(userName);
    }
  }, [userName, selectedTeam]);

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

  // Get current team&apos;s data for dropdown viewing
  const currentTeamRoster = getTeamRoster(selectedTeam);
  const currentTeamRosterGrouped = getTeamRosterGrouped(selectedTeam);
  const currentTeamStartingLineup = getTeamStartingLineup(selectedTeam);
  
  // Get user&apos;s team data for roster display (always shows user&apos;s picks)
  const userTeamRoster = getTeamRoster(userName);
  const userTeamRosterGrouped = getTeamRosterGrouped(userName);
  const userTeamStartingLineup = getTeamStartingLineup(userName);

  // Current turn variables are already calculated above

  if (process.env.NODE_ENV === 'development') {
    console.log('Draft room render - roomId:', roomId, 'room:', room);
  }
  
  if (!room) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <div className="text-xl mb-4">Loading room data...</div>
      <div className="text-sm text-gray-400">If this takes too long, please refresh the page</div>
    </div>
  </div>;

  // Debug rendering (disabled for performance)
  if (process.env.NODE_ENV === 'development') {
    console.log('=== RENDERING DEBUG ===');
    console.log('Room:', room);
    console.log('Is draft active:', isDraftActive);
    console.log('Available players count:', availablePlayers.length);
    console.log('Picks count:', picks.length);
    console.log('Room status:', room?.status);
    console.log('RoomId:', roomId);
    console.log('Router query:', router.query);
    console.log('======================');
  }

      return (
    <div className="min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant" style={{ minHeight: '1500px' }}>
      <DraftNavbar />
      <div className="zoom-stable" style={{ width: '1391px', minWidth: '1391px', maxWidth: '1391px' }}>


      {/* New Horizontal Scrolling Bar - Migrated from Testing Grounds */}
      {(
        <div className="zoom-resistant" style={{ 
          position: 'relative',
          width: '100vw',
          left: '0',
          right: '0',
          marginLeft: '0',
          marginRight: '0',
          transform: 'translateZ(0)',
          paddingTop: '30px',
          paddingBottom: '30px',
          paddingLeft: '0',
          paddingRight: '0',
          backgroundColor: '#101927'
        }}>
          <div className="relative zoom-resistant" style={{ position: 'relative', transform: 'translateZ(0)', overflow: 'visible', minWidth: '100%', width: '100%' }}>
            <div 
              ref={picksScrollRef}
              className="flex overflow-x-auto custom-scrollbar zoom-resistant"
              style={{ 
                height: '256px',
                position: 'relative',
                gap: '4.5px',
                paddingRight: '0',
                paddingBottom: '0',
                transform: 'translateZ(0)',
                minWidth: '100%',
                paddingLeft: '0',
                overflowX: 'auto',
                overflowY: 'visible',
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '0',
                scrollPaddingRight: '0',
                scrollPaddingTop: '0',
                scrollPaddingBottom: '0',
                scrollBehavior: 'smooth',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                width: '100%'
              }}
            >
            {Array.from({ length: draftSettings.totalRounds * 12 }, (_, i) => {
              const pickNumber = i + 1;
              const round = Math.ceil(pickNumber / 12);
              const pickIndex = (pickNumber - 1) % 12;
              const isSnakeRound = round % 2 === 0;
              const teamIndex = isSnakeRound ? 12 - 1 - pickIndex : pickIndex;
              const team = effectiveDraftOrder[teamIndex] || `Team ${teamIndex + 1}`;
              const isMyPick = team === userName;
              const isCompleted = picks.length >= pickNumber;
              const isOnTheClock = pickNumber === picks.length + 1;
              
              // Get the player data for completed picks to determine position color
              const completedPick = picks[pickNumber - 1];
              const playerData = completedPick ? PLAYER_POOL.find(p => p.name === completedPick.player) : null;
              
              // Function to get username for the current pick - STATIC VERSION
              const getStaticUsernameForPick = () => {
                // Use the same logic as the On the Clock display
                const round = Math.ceil(pickNumber / effectiveDraftOrder.length);
                const isSnakeRound = round % 2 === 0;
                const pickIndex = (pickNumber - 1) % effectiveDraftOrder.length;
                const currentPicker = isSnakeRound
                  ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
                  : effectiveDraftOrder[pickIndex];
                return currentPicker || team;
              };
              
              // Store the username statically - this will never change
              const staticUsername = getStaticUsernameForPick();
              
              // Function to get username for the current pick (for other uses)
              const getUsernameForPick = () => {
                // Use the same logic as the On the Clock display
                const round = Math.ceil(pickNumber / effectiveDraftOrder.length);
                const isSnakeRound = round % 2 === 0;
                const pickIndex = (pickNumber - 1) % effectiveDraftOrder.length;
                const currentPicker = isSnakeRound
                  ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
                  : effectiveDraftOrder[pickIndex];
                return currentPicker || team;
              };
              
              return (
                <div
                  key={pickNumber}
                  className="flex-shrink-0 text-sm font-medium h-56 flex flex-col border-6 zoom-resistant"
                  style={{
                    width: '158px',
                    borderWidth: '6px',
                    position: 'relative',
                    borderColor: isOnTheClock ? '#EF4444' : isCompleted ? (POSITION_COLORS[playerData?.position]?.primary || '#2DE2C5') : '#808080',
                    borderTopWidth: '42px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '11px',
                    overflow: 'visible',
                    transform: 'translateZ(0)',
                    minWidth: '174px',
                    flexShrink: 0,
                    scrollSnapAlign: pickNumber === 1 ? 'start' : 'center',
                    marginLeft: pickNumber === 1 ? '0' : 'auto',
                    zIndex: pickNumber === 1 ? 9999 : 'auto',
                    left: pickNumber === 1 ? '0' : 'auto',
                    top: pickNumber === 1 ? '0' : 'auto',
                    visibility: 'visible',
                    opacity: 1,
                    display: 'flex'
                  }}
                  onClick={() => {
                    setSelectedTeam(staticUsername);
                  }}
                >

                  {/* Drafting team username positioned in yellow border area */}
                  <div 
                    className="absolute left-0 right-0 font-bold text-center zoom-resistant"
                    style={{ 
                      fontSize: '16px', 
                      color: isOnTheClock ? 'black' : 'white',
                      backgroundColor: 'transparent',
                      zIndex: 9999,
                      padding: '2px',
                      top: '-20px',
                      transform: 'translateY(-50%) translateZ(0)'
                    }}
                  >
                    {(() => {
                      if (isOnTheClock) {
                        // Always show static username, never "Your Turn"
                        const cleanUsername = (staticUsername || '').replace(/[,\s]/g, '').toUpperCase().substring(0, 18);
                        return cleanUsername;
                      } else {
                        const cleanUsername = (staticUsername || '').replace(/[,\s]/g, '').toUpperCase().substring(0, 18);
                        return cleanUsername;
                      }
                    })()}
                  </div>

                  {/* Pick number positioned at top left */}
                  <div 
                    className="absolute text-sm zoom-resistant cursor-pointer rounded px-1"
                    style={{ 
                      top: '5px',
                      left: '9px',
                      color: 'white',
                      zIndex: 9999,
                      transform: 'translateZ(0)'
                    }}
                    onClick={() => {
                      setShowOverallPickNumbers(!showOverallPickNumbers);
                    }}
                  >
                    {(() => {
                      if (showOverallPickNumbers) {
                        return pickNumber;
                      } else {
                        const pickInRound = ((pickNumber - 1) % 12) + 1;
                        return `${round}.${String(pickInRound).padStart(2, '0')}`;
                      }
                    })()}
                  </div>

                  {/* User logo placeholder in top right corner */}
                  <div 
                    className="absolute zoom-resistant"
                    style={{ 
                      top: '15px',
                      left: '50%',
                      transform: 'translateX(-50%) translateZ(0)',
                      width: '70.875px',
                      height: '70.875px',
                      borderRadius: '50%',
                      border: '2px dotted #808080',
                      zIndex: 9999,
                      marginBottom: '12px'
                    }}
                  ></div>

                  <div className="text-sm w-full text-center leading-tight flex-1 flex items-end justify-center" style={{ paddingBottom: '20px', position: 'relative' }}>
                    <div className="w-full">
                      {isOnTheClock ? (
                        <div className="flex items-center justify-center" style={{ transform: 'scale(0.9)', position: 'absolute', bottom: '28px', left: '50%', marginLeft: '2.5px', transform: 'translateX(-50%) scale(0.9)' }}>
                          <SevenSegmentCountdown initialSeconds={isDraftActive ? timer : preDraftCountdown} useMonocraft={true} isUserOnClock={isMyTurn && isDraftActive} />
                        </div>
                      ) : (
                        <div className="font-bold text-xs h-4 flex items-center justify-center"></div>
                      )}
                    </div>
                  </div>

                  {/* Player name positioned absolutely */}
                  {isCompleted && completedPick && (
                    <div 
                      className="absolute text-center zoom-resistant"
                      style={{ 
                        bottom: '0px',
                        left: '50%',
                        transform: 'translateX(-50%) translateZ(0)',
                        zIndex: 9999,
                        padding: '36px'
                      }}
                    >
                      <div className="font-bold text-sm" style={{ 
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '140px',
                        lineHeight: '1.2'
                      }}>{typeof completedPick.player === 'string' ? completedPick.player : (completedPick.player?.name || 'Unknown Player')}</div>
                      <div className="text-sm text-gray-400 mt-1" style={{ marginTop: '4px', whiteSpace: 'nowrap' }}>{playerData?.position} - {playerData?.team}</div>
                    </div>
                  )}



                  {/* NEW POSITION PERCENTAGE TRACKER */}
                  <div 
                    className="absolute zoom-resistant"
                    style={{ 
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      height: '16px',
                      zIndex: 9999,
                      transform: 'translateZ(0)'
                    }}
                  >
                    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                      {(() => {
                        // Get position percentages for the team in this card&apos;s border
                        const teamInCard = team;
                        const percentages = getTeamPositionPercentages(teamInCard);
                        const teamPicksCount = picks.filter(pick => pick.user === teamInCard).length;
                        

                        
                        // If team has no picks, show transparent bar
                        if (teamPicksCount === 0) {
                          return <div style={{ height: '100%', width: '100%', background: 'transparent' }}></div>;
                        }
                        
                        // Create colored segments for each position
                        const hasAnyPercentage = percentages.qb > 0 || percentages.rb > 0 || percentages.wr > 0 || percentages.te > 0;
                        

                        
                        return (
                          <>
                            {percentages.qb > 0 && (
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${percentages.qb}%`, 
                                  background: POSITION_COLORS.QB.primary 
                                }}
                              ></div>
                            )}
                            {percentages.rb > 0 && (
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${percentages.rb}%`, 
                                  background: POSITION_COLORS.RB.primary 
                                }}
                              ></div>
                            )}
                            {percentages.wr > 0 && (
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${percentages.wr}%`, 
                                  background: POSITION_COLORS.WR.primary
                                }}
                              ></div>
                            )}
                            {percentages.te > 0 && (
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${percentages.te}%`, 
                                  background: POSITION_COLORS.TE.primary 
                                }}
                              ></div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container - Everything below horizontal scrolling bar */}
                           <div className="main-content-container" style={{ 
          position: 'fixed',
          left: '0px',
          top: '380px',
          width: '100vw',
          bottom: '0px',
          paddingLeft: '20px'
        }}>

      {/* On the Clock Container */}
      {(
        <div className="pb-4" style={{ position: 'absolute', top: '0px', left: '45.5px' }}>
          <div 
            className="inline-block rounded-lg p-4 shadow-lg transition-all duration-1000 bg-white/10"
            style={{
              opacity: 1,
              position: 'relative',
              width: 288,
              minWidth: 288,
              maxWidth: 288,
              height: '100px',
              minHeight: '100px',
              maxHeight: '100px',
              border: '2px solid #EF4444'
            }}
          >
            <div className="flex justify-between items-center h-full">
              <div className="flex flex-col justify-center h-full" style={{ marginLeft: '-4px' }}>
                <div className="text-xl font-bold text-white mb-3" style={{ marginTop: '-0.5em' }}>
                  {isDraftActive ? 'ON THE CLOCK:' : 'DRAFT STARTING'}
                </div>
                <div className="text-2xl font-semibold text-white">
                  {isDraftActive ? (() => {
                    if (!currentPicker || currentPicker === 'Waiting...') return 'Waiting...';
                    if (currentPicker === 'Not Todd Middleton') return currentPicker;
                    
                    // Check if this is a mock drafter and show animal logo
                    const mockDrafterNames = room?.mockDrafters || [];
                    const isMockDrafter = mockDrafterNames.includes(currentPicker);
                    
                    const cleanPicker = (currentPicker || '').replace(/[,\s]/g, '').toUpperCase().substring(0, 18);
                    return cleanPicker;
                  })() : 'Get Ready!'}
                </div>

              </div>

              <div className="flex items-center gap-6" style={{ backgroundColor: 'transparent' }}>
                <div className="text-right">
                  {/* Timer moved to horizontal scrolling card */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Draft Board Button */}
      <div style={{ position: 'absolute', top: '118px', left: '45.5px', marginBottom: '18px' }}>
        <div className="flex gap-2">
          <Link 
            href={`/draft/topdog/${roomId}/full-board`}
            className="px-4 py-3 font-bold rounded-lg transition-colors text-sm text-center block"
            style={{ 
              width: '288px',
              backgroundColor: '#6b7280',
              border: '1px solid rgba(128, 128, 128, 0.4)',
              color: '#fff'
            }}
          >
            Full Draft Board
          </Link>

        </div>
      </div>

      {/* Autodraft Would Be Container */}
      {autoPickPlayer && (
        <div style={{ position: 'absolute', top: '182px', left: '45.5px' }}>
          <div className="rounded-lg border-l-4 border-[#2DE2C5] bg-white/10 flex flex-col" style={{ width: '174px', height: '90px', minHeight: '90px', maxHeight: '90px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-sm font-bold text-[#60A5FA] mb-1" style={{ marginTop: '8px', marginLeft: '12px' }}>Autodraft Would Be:</div>
            <div className="flex items-center justify-between gap-3 flex-1" style={{ marginTop: '8px', marginLeft: '12px', marginRight: '12px' }}>
              <div className="flex-1">
                <div className="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ marginTop: '-12px' }}>{autoPickPlayer.name}</div>
                <div className="text-sm text-gray-300 opacity-75">{autoPickPlayer.position} • {autoPickPlayer.team}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Picks Away Calendar Container - Now separate from autodraft container */}
      <div style={{ paddingLeft: '16px', paddingRight: '32px', position: 'absolute', top: '182px', left: '215.5px' }}>
        <PicksAwayCalendar 
          picksAway={(() => {
            // If it&apos;s user&apos;s turn, show 0 (which displays "ON THE CLOCK")
            if (isMyTurn && isDraftActive) {
              return 0;
            }
            
            // Calculate picks until next user pick
            let picksUntilUserTurn = 0;
            let checkingPickNumber = currentPickNumber;
            
            // Look ahead to find when it&apos;s the user&apos;s turn
            while (checkingPickNumber <= totalPicks) {
              const checkRound = Math.ceil(checkingPickNumber / effectiveDraftOrder.length);
              const checkIsSnakeRound = checkRound % 2 === 0;
              const checkPickIndex = (checkingPickNumber - 1) % effectiveDraftOrder.length;
              const checkPicker = checkIsSnakeRound
                ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - checkPickIndex]
                : effectiveDraftOrder[checkPickIndex];
              
              if (checkPicker === userName) {
                break;
              }
              
              picksUntilUserTurn++;
              checkingPickNumber++;
            }
            
            return picksUntilUserTurn;
          })()}
        />
      </div>

      {/* Three Column Layout */}
      <DragDropContext onDragEnd={onUniversalDragEnd}>
        <div className="flex w-[1400px]" style={{ marginLeft: '36px', marginTop: '18px' }}>
          {/* Left Sidebar: Your Queue */}
          <div className="w-80 flex flex-col flex-shrink-0">
            {/* Your Queue */}
            <div className="px-4" style={{ position: 'absolute', top: '290px', left: '45.5px', marginLeft: '-17px' }}>
              <div className="bg-white/10 p-4 z-30 flex flex-col rounded-lg" style={{ width: '288px', height: '797px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>

                
                {queue.length === 0 && (
                  <div className="text-gray-300 mb-2">
                    Click "Queue" on players to add them here.
                    <button 
                      onClick={() => addToQueue(filteredPlayers[0])} 
                      className="ml-2 px-2 py-1 bg-[#60A5FA] text-[#000F55] rounded text-xs font-bold hover:bg-[#2DE2C5]"
                    >
                      Add Player
                    </button>
                  </div>
                )}
                
                <StrictModeDroppable droppableId="player-queue">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col custom-scrollbar flex-1"
                      style={{ 
                        overflowY: 'auto', 
                        minHeight: '60px',
                        // Prevent jumping by maintaining consistent positioning
                        position: 'relative'
                      }}
                    >
                      {/* Queue Column Headers */}
                      {queue.length > 0 && (
                        <div className="flex items-center justify-between bg-white/10 rounded font-bold text-xs mb-2 px-3">
                          <div className="w-8 text-center text-gray-300 text-xs" style={{ fontSize: '12px' }}>ADP</div>
                          <div className="flex-1" style={{ paddingLeft: '32px' }}>Player</div>
                          <div className="w-4"></div>
                        </div>
                      )}

                      {queue.filter(player => player && typeof player === 'object' && typeof player.name === 'string').map((player, index) => (
                        <Draggable key={`queue-${player.name}-${index}`} draggableId={`queue-${player.name}-${index}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded cursor-move hover:bg-white/10 transition-all relative overflow-hidden"
                              style={{
                                ...getDragItemStyle(snapshot.isDragging, provided.draggableProps.style, index),
                                backgroundColor: `rgba(${player.position === 'QB' ? '124, 58, 237' : player.position === 'RB' ? '15, 186, 128' : player.position === 'WR' ? '66, 133, 244' : player.position === 'TE' ? '244, 114, 182' : '128, 128, 128'}, 0.3)`,
                                minHeight: '45px',
                                height: '50px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              {/* Position color gradient overlay */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '100%',
                                  background: createQueueGradient(player.position).firstGradient,
                                  zIndex: 1,
                                  pointerEvents: 'none'
                                }}
                              />
                              <div className="flex items-center h-full" style={{ position: 'relative', zIndex: 2 }}>
                                <div className="w-8 text-center text-xs font-bold text-white" style={{ marginLeft: '12px' }}>
                                  {formatADP(player.adp)}
                                </div>
                                <div className="flex-1 flex flex-col justify-center" style={{ paddingLeft: '13px' }}>
                                  <div className="font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-gray-300 transition-colors" onClick={() => openPlayerModal(player)}>{player.name}</div>
                                  <div className="text-sm text-gray-300" style={{ marginTop: '-2px' }}>    {player.position} • {player.team} • Bye <span style={{ transform: 'translateX(-4px)' }}>{player.bye}</span></div>
                                </div>
                              </div>
                              <div className="absolute top-0.5 right-0.5" style={{ zIndex: 3 }}>
                                  <button
                                    onClick={() => removeFromQueue(player)}
                                  className="text-white hover:text-gray-300 text-base font-bold bg-black/20 rounded-full w-6 h-6 flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
            </div>
          </div>
        </div>

        {/* Autodraft Would Be Container - HIDDEN */}

        {/* Center Column: Available Players */}
        <div className="min-w-0" style={{ 
          position: 'absolute',
          top: '0px',
          left: '365.5px',
          width: '720px' 
        }}>
          {(
            <div className="bg-white/10 rounded-lg flex flex-col zoom-resistant" style={{ height: '1087px', overflowY: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', transform: 'translateZ(0)' }}>
              
              {/* Search and Filter Controls - New Top Container */}
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="flex flex-row gap-2 flex-shrink-0 justify-center items-center">
                  {/* Search and Filter Buttons */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search players or teams..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                      className="px-2 py-2 rounded text-black text-sm"
                    style={{ width: '208px' }}
                      />
                      <button
                        onClick={() => {
                          setPositionFilters(['ALL']);
                          setPlayerSearch('');
                        }}
                      className={`px-4 py-2 rounded font-bold transition-colors text-sm ${
                          positionFilters.includes('ALL') 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                     style={{ width: '80px', minHeight: '32px' }}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          if (positionFilters.includes('QB')) {
                            const newFilters = positionFilters.filter(p => p !== 'QB');
                            // If removing QB would leave no filters, default to ALL
                            setPositionFilters(newFilters.length > 0 ? newFilters : ['ALL']);
                          } else {
                            setPositionFilters([...positionFilters.filter(p => p !== 'ALL'), 'QB']);
                          }
                        }}
                      className={`px-4 py-2 rounded font-bold text-sm text-white ${
                          !positionFilters.includes('QB') ? 'hover:bg-white/20' : ''
                        }`}
                        style={{ 
                          backgroundColor: positionFilters.includes('QB') ? POSITION_COLORS.QB.primary : POSITION_COLORS.QB.rgba,
                          borderColor: positionFilters.includes('QB') ? POSITION_COLORS.QB.primary : 'transparent', 
                          borderWidth: '1px',
                         width: '80px',
                          minHeight: '32px'
                        }}
                      >
                        QB
                      </button>
                      <button
                        onClick={() => {
                          if (positionFilters.includes('RB')) {
                            const newFilters = positionFilters.filter(p => p !== 'RB');
                            // If removing RB would leave no filters, default to ALL
                            setPositionFilters(newFilters.length > 0 ? newFilters : ['ALL']);
                          } else {
                            setPositionFilters([...positionFilters.filter(p => p !== 'ALL'), 'RB']);
                          }
                        }}
                      className={`px-4 py-2 rounded font-bold text-sm text-white ${
                          !positionFilters.includes('RB') ? 'hover:bg-white/20' : ''
                        }`}
                        style={{ 
                          backgroundColor: positionFilters.includes('RB') ? POSITION_COLORS.RB.primary : POSITION_COLORS.RB.rgba,
                          borderColor: positionFilters.includes('RB') ? POSITION_COLORS.RB.primary : 'transparent', 
                          borderWidth: '1px',
                         width: '80px',
                          minHeight: '32px'
                        }}
                      >
                        RB
                      </button>
                      <button
                        onClick={() => {
                          if (positionFilters.includes('WR')) {
                            const newFilters = positionFilters.filter(p => p !== 'WR');
                            // If removing WR would leave no filters, default to ALL
                            setPositionFilters(newFilters.length > 0 ? newFilters : ['ALL']);
                          } else {
                            setPositionFilters([...positionFilters.filter(p => p !== 'ALL'), 'WR']);
                          }
                        }}
                      className={`px-4 py-2 rounded font-bold text-sm text-white ${
                          !positionFilters.includes('WR') ? 'hover:bg-white/20' : ''
                        }`}
                        style={{ 
                          backgroundColor: positionFilters.includes('WR') ? POSITION_COLORS.WR.primary : POSITION_COLORS.WR.rgba,
                          borderColor: positionFilters.includes('WR') ? POSITION_COLORS.WR.primary : 'transparent', 
                          borderWidth: '1px',
                         width: '80px',
                          minHeight: '32px'
                        }}
                      >
                        WR
                      </button>
                      <button
                        onClick={() => {
                          if (positionFilters.includes('TE')) {
                            const newFilters = positionFilters.filter(p => p !== 'TE');
                            // If removing TE would leave no filters, default to ALL
                            setPositionFilters(newFilters.length > 0 ? newFilters : ['ALL']);
                          } else {
                            setPositionFilters([...positionFilters.filter(p => p !== 'ALL'), 'TE']);
                          }
                        }}
                      className={`px-4 py-2 rounded font-bold text-sm text-white ${
                          !positionFilters.includes('TE') ? 'hover:bg-white/20' : ''
                        }`}
                        style={{ 
                          backgroundColor: positionFilters.includes('TE') ? POSITION_COLORS.TE.primary : POSITION_COLORS.TE.rgba,
                          borderColor: positionFilters.includes('TE') ? POSITION_COLORS.TE.primary : 'transparent', 
                          borderWidth: '1px',
                         width: '80px',
                          minHeight: '32px'
                        }}
                      >
                        TE
                      </button>
                  </div>
                </div>
              </div>

              {/* All buttons positioned at same height */}
              <div className="flex mb-2">
                <div style={{ marginLeft: '15px' }}>
                  <button 
                    className="px-0 py-0 rounded font-bold text-base text-white hover:bg-white/20 transition-colors" 
                    style={{ width: '40px', minHeight: '32px' }}
                    onClick={() => {
                      if (sortBy === 'adp') {
                        setAdpSortDirection(adpSortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('adp');
                        setAdpSortDirection('asc');
                      }
                    }}
                  >
                    ADP
                  </button>
                </div>

                <div style={{ marginLeft: '30px' }}>
                  <button 
                    className="px-0 py-0 rounded font-bold text-base text-white hover:bg-white/20 transition-colors" 
                    style={{ width: '40px', minHeight: '32px', color: customRankings.length > 0 ? 'white' : 'transparent' }}
                    onClick={() => {
                      if (sortBy === 'rankings') {
                        setRankingSortDirection(rankingSortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('rankings');
                        setRankingSortDirection('asc');
                      }
                    }}
                  >
                    Rank
                  </button>
                </div>


              </div>

              {/* Single Column Player List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5" style={{ marginTop: '8px' }}>
                  {filteredPlayers.filter(player => player && typeof player === 'object' && typeof player.name === 'string').map((player, index) => {
                    const canDraft = canDraftPlayer(player.name);
                    const playerData = PLAYER_POOL.find(p => p.name === player.name);
                    const currentCount = picks.filter(pick => pick.user === userName)
                      .map(p => PLAYER_POOL.find(pp => pp.name === p.player))
                      .filter(p => p?.position === playerData?.position).length;
                    const limit = POSITIONAL_LIMITS[playerData?.position];
                    
                    // Get position color
                    // Uses outer getPositionColor with centralized POSITION_COLORS
                    const positionColor = getPositionColor(playerData?.position);
                    
                    // Create gradient with 1% every 0.2px - split into two elements
                    const createGradient = (startColor, endColor) => {
                      const gradientStops = [];
                      gradientStops.push(`${startColor} 0px`);
                      gradientStops.push(`${startColor} 1px`);
                      
                      // Add color stops for each 0.2px from 1px to 148.5px (10% wider)
                      for (let i = 1; i <= 742; i++) {
                        const percent = i / 742; // 1% per stop (742 stops = 0.2px each)
                        const r1 = parseInt(startColor.slice(1, 3), 16);
                        const g1 = parseInt(startColor.slice(3, 5), 16);
                        const b1 = parseInt(startColor.slice(5, 7), 16);
                        
                        // End color is #1f2833
                        const r2 = 0x3B;
                        const g2 = 0x43;
                        const b2 = 0x4D;
                        
                        const r = Math.round(r1 + (r2 - r1) * percent);
                        const g = Math.round(g1 + (g2 - g1) * percent);
                        const b = Math.round(b1 + (b2 - b1) * percent);
                        
                        const color = `rgb(${r}, ${g}, ${b})`;
                        gradientStops.push(`${color} ${i * 0.2 + 1}px`);
                      }
                      
                      return `linear-gradient(to right, ${gradientStops.join(', ')})`;
                    };
                    
                    // Create separate gradients for first 128px and last 32px (20% faster)
                    const createFirstGradient = (startColor, endColor) => {
                      const gradientStops = [];
                      gradientStops.push(`${startColor} 0px`);
                      gradientStops.push(`${startColor} 1px`);
                      
                      // Add color stops for each 0.2px from 1px to 179.3px (20% wider than original)
                      for (let i = 1; i <= 892; i++) {
                        const percent = i / 892; // 1% per stop (892 stops = 0.2px each)
                        const r1 = parseInt(startColor.slice(1, 3), 16);
                        const g1 = parseInt(startColor.slice(3, 5), 16);
                        const b1 = parseInt(startColor.slice(5, 7), 16);
                        
                        // Use the provided end color
                        const r2 = parseInt(endColor.slice(1, 3), 16);
                        const g2 = parseInt(endColor.slice(3, 5), 16);
                        const b2 = parseInt(endColor.slice(5, 7), 16);
                        
                        const r = Math.round(r1 + (r2 - r1) * percent);
                        const g = Math.round(g1 + (g2 - g1) * percent);
                        const b = Math.round(b1 + (b2 - b1) * percent);
                        
                        const color = `rgb(${r}, ${g}, ${b})`;
                        gradientStops.push(`${color} ${i * 0.2 + 1}px`);
                      }
                      
                      return `linear-gradient(to right, ${gradientStops.join(', ')})`;
                    };
                    
                    const createSecondGradient = (startColor, endColor) => {
                      const gradientStops = [];
                      
                      // Calculate the exact color at 135px (where first gradient ends)
                      const r1 = parseInt(startColor.slice(1, 3), 16);
                      const g1 = parseInt(startColor.slice(3, 5), 16);
                      const b1 = parseInt(startColor.slice(5, 7), 16);
                      const r2 = 0x3B;
                      const g2 = 0x43;
                      const b2 = 0x4D;
                      
                      // At 135px, we&apos;re 80% through the total 169px gradient
                      const startPercent = 0.8;
                      const startR = Math.round(r1 + (r2 - r1) * startPercent);
                      const startG = Math.round(g1 + (g2 - g1) * startPercent);
                      const startB = Math.round(b1 + (b2 - b1) * startPercent);
                      const startColorRGB = `rgb(${startR}, ${startG}, ${startB})`;
                      
                      gradientStops.push(`${startColorRGB} 0px`);
                      
                      // Add color stops for each 0.2px from 0px to 40px
                      // This should complete the remaining 20% of the transition
                      for (let i = 1; i <= 200; i++) {
                        const localPercent = i / 200; // 0 to 1 within this 40px segment
                        const globalPercent = startPercent + localPercent * 0.2; // 80% to 100%
                        
                        const r = Math.round(r1 + (r2 - r1) * globalPercent);
                        const g = Math.round(g1 + (g2 - g1) * globalPercent);
                        const b = Math.round(b1 + (b2 - b1) * globalPercent);
                        
                        const color = `rgb(${r}, ${g}, ${b})`;
                        gradientStops.push(`${color} ${i * 0.2}px`);
                      }
                      
                      return `linear-gradient(to right, ${gradientStops.join(', ')})`;
                    };
                    
                    const positionEndColor = getPositionEndColor(playerData?.position);
                    const firstGradientBackground = createFirstGradient(positionColor, positionEndColor);
                    const secondGradientBackground = createSecondGradient(positionColor, '#1f2833');
                    
                    return (
                      <div 
                        key={`available-${player.name}`}
                        className={`flex items-center justify-between rounded p-2.5 transition-colors player-row ${
                          canDraft ? 'hover:bg-white/10' : 'bg-red-500/20 opacity-60'
                        } position-${playerData?.position?.toLowerCase() || 'unknown'}`}
                        style={{ 
                          position: 'relative',
                          overflow: 'hidden',
                          border: '1px solid transparent',
                          transition: 'border-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (canDraft) {
                            e.currentTarget.style.borderColor = positionColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                                              >
                        {/* Position color gradient overlay - No width limit */}
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: firstGradientBackground,
                            zIndex: 1,
                            pointerEvents: 'none'
                          }}
                        />
                        
                        <div className="flex items-center flex-1" style={{ position: 'relative', zIndex: 2 }}>
                          <div className="w-16 text-center font-bold flex items-center justify-center font-mono text-sm text-white" style={{ height: '100%', margin: '-20px -12px -20px -8px', padding: '0' }}>
                            {formatADP(playerData?.adp)}
                          </div>

                          {/* Vertical divider line */}
                          <div className="w-1" style={{ 
                            height: '130%', 
                            position: 'absolute', 
                            left: '61px', 
                            top: '-15%', 
                            zIndex: 100,
                            backgroundColor: positionColor
                          }}></div>

                          <div className="w-10 text-center font-bold flex items-center justify-center font-mono text-sm text-white" style={{ height: '100%', margin: '-20px -12px -20px 30px', padding: '0' }}>
                            <span style={{ color: customRankings.length > 0 ? 'white' : 'transparent', transform: 'translateX(1px)' }}>
                            {getCustomPlayerRanking(player.name, customRankings)}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div 
                              className="font-bold text-white text-left cursor-pointer transition-colors" 
                              style={{ marginBottom: '1px', paddingLeft: '57px' }}
                              onClick={() => openPlayerModal(player)}
                            >
                              {player.name}
                            </div>
                          </div>



                          <div className="text-sm text-gray-300" style={{ width: '120px', marginRight: '18px' }}>
                            <div className="flex items-center justify-between">
                              <span>{player.position}</span>
                              <span>•</span>
                              <span>{player.team || 'FA'}</span>
                              <span>•</span>
                              <span>Bye <span style={{ transform: 'translateX(-4px)' }}>{player.bye}</span></span>
                            </div>
                            {!canDraft && (
                              <div className="text-red-400 text-center">
                                ({currentCount}/{limit} {player.position}s)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 w-40 justify-center" style={{ position: 'relative', zIndex: 2 }}>
                          <button
                            className={`w-24 h-9 px-2 py-1 rounded font-bold transition-colors text-sm ${
                              canDraft && isDraftActive
                                ? 'text-[#000F55] hover:bg-yellow-400 disabled:opacity-50' 
                                : canDraft && !isDraftActive
                                ? 'bg-yellow-500 text-[#000F55] hover:bg-yellow-400 opacity-50'
                                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                            style={{
                              backgroundColor: canDraft && isDraftActive ? 'rgba(251, 191, 36, 0.7)' : undefined
                            }}
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
                            {canDraft && isDraftActive ? 'Draft' : canDraft && !isDraftActive ? 'Draft' : 'Limit'}
                          </button>
                          {queue.find(q => q.name === player.name) ? (
                            <button 
                              onClick={() => removeFromQueue(player)} 
                              className="w-24 h-9 px-2 py-1 rounded bg-red-500 text-white text-sm font-bold hover:bg-red-600"
                              style={{ 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                opacity: 0.6
                              }}
                            >
                              Remove
                            </button>
                          ) : (
                                                          <button 
                                onClick={() => addToQueue(player)} 
                                className="w-24 h-9 px-2 py-1 rounded text-white text-sm font-bold hover:bg-[#60A5FA]"
                                style={{ 
                                  backgroundColor: 'rgba(128, 128, 128, 0.7)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  opacity: 0.8
                                }}
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
        <div style={{ 
          position: 'absolute',
          top: '0px',
          left: '1115.5px',
          paddingLeft: '0px', 
          paddingRight: '0px', 
          paddingBottom: '24px' 
        }}>
          <div className="bg-white/10 z-30 flex flex-col custom-scrollbar team-roster flex-shrink-0 rounded-lg" style={{ width: '272px', height: '1081px', padding: '18px' }}>
            {/* Team Selection Dropdown */}
            <div className="mb-4 team-dropdown" style={{ marginTop: '0px', marginBottom: '4px' }}>
              <div className="relative">
                <button
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className="w-full flex items-center justify-between bg-white/10 rounded px-3 py-2 text-left hover:bg-white/20 transition-colors"
                  style={{ height: '39px', minHeight: '39px' }}
                >
                  <div>
                    <h2 className="font-bold" style={{ color: 'white', fontSize: '16px' }}>
                      {(selectedTeam || '').replace(/[,\s]/g, '').toUpperCase().substring(0, 18)}
                    </h2>

                  </div>
                  <div className="text-white text-sm" style={{ fontSize: '16px', transform: 'scaleY(0.8)' }}>▼</div>
                </button>
                
                {showTeamDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-600 rounded mt-1 z-50 max-h-60 overflow-y-auto">
                    {effectiveDraftOrder.map((team, index) => (
                      <button
                        key={team}
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowTeamDropdown(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-800 transition-colors ${
                          selectedTeam === team ? 'bg-[#3c3c3c] text-[#c7c7c7]' : 'text-gray-300'
                        }`}
                      >
                        <div className="font-medium" style={{ fontSize: '20px' }}>{(team || '').replace(/[,\s]/g, '').toUpperCase().substring(0, 18)}</div>
                        <div className="text-xs opacity-75">
                          
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Positional Count Display - Shows selected team&apos;s picks */}
            <div className="mb-2 p-2 bg-white/5 rounded" style={{ border: '1px solid rgba(128, 128, 128, 0.6)', marginTop: '4px', marginBottom: '12px' }}>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-bold" style={{ color: POSITION_COLORS.QB.primary }}>QB:</span>
                  <span className="text-white">{currentTeamRosterGrouped.QB?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold" style={{ color: POSITION_COLORS.RB.primary }}>RB:</span>
                  <span className="text-white">{currentTeamRosterGrouped.RB?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold" style={{ color: POSITION_COLORS.WR.primary }}>WR:</span>
                  <span className="text-white">{currentTeamRosterGrouped.WR?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold" style={{ color: POSITION_COLORS.TE.primary }}>TE:</span>
                  <span className="text-white">{currentTeamRosterGrouped.TE?.length || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Starting Lineup Section */}
            <div className="mb-6" style={{ marginTop: '4px', marginBottom: '4px' }}>
              <div>
                {/* QB Spot */}
                {currentTeamStartingLineup.QB?.slice(0, 1).map((player, idx) => {
                  const { firstGradient } = createPickedPlayerGradient('QB');
                  return (
                    <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                    marginBottom: '4px', 
                    padding: '0px',
                    height: '45px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(128, 128, 128, 0.4)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                      {/* Position color gradient overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: firstGradient,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                      <div className="flex justify-between items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
                      <div className="font-bold text-white text-base flex-1 cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px', whiteSpace: 'normal', overflow: 'visible', wordWrap: 'break-word' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                      <div className="text-sm text-gray-300" style={{ marginRight: '8px' }}>
                        {player.bye}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {(!currentTeamStartingLineup.QB || currentTeamStartingLineup.QB.length === 0) && (
                  <div className="flex items-center" style={{ marginBottom: '4px' }}>
                    <div className="text-sm rounded w-full relative overflow-hidden" style={{ 
                      padding: '0px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(128, 128, 128, 0.4)',
                      height: '45px',
                      width: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      <div className="text-gray-500 italic text-right" style={{ position: 'relative', zIndex: 2, paddingRight: '10px' }}>Empty QB Spot</div>
                    </div>
                  </div>
                )}
                
                {/* RB Spots */}
                {currentTeamStartingLineup.RB?.slice(0, 2).map((player, idx) => {
                  const { firstGradient } = createPickedPlayerGradient('RB');
                  return (
                    <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                    marginBottom: '4px', 
                    padding: '0px',
                    height: '45px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(128, 128, 128, 0.4)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                      {/* Position color gradient overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: firstGradient,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                      <div className="flex justify-between items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
                      <div className="font-bold text-white text-base flex-1 cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px', whiteSpace: 'normal', overflow: 'visible', wordWrap: 'break-word' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                      <div className="text-sm text-gray-300" style={{ marginRight: '8px' }}>
                        {player.bye}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 2 - (currentTeamStartingLineup.RB?.slice(0, 2).length || 0)) }, (_, i) => (
                  <div key={`rb-empty-${i}`} className="flex items-center" style={{ marginBottom: '4px' }}>
                    <div className="text-sm rounded w-full relative overflow-hidden" style={{ 
                      padding: '0px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(128, 128, 128, 0.4)',
                      height: '45px',
                      width: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      <div className="text-gray-500 italic text-right" style={{ position: 'relative', zIndex: 2, paddingRight: '10px' }}>Empty RB Spot</div>
                    </div>
                  </div>
                ))}
                
                {/* WR Spots */}
                {currentTeamStartingLineup.WR?.slice(0, 3).map((player, idx) => {
                  const { firstGradient } = createPickedPlayerGradient('WR');
                  return (
                    <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                    marginBottom: '4px', 
                    padding: '0px',
                    height: '45px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(128, 128, 128, 0.4)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                      {/* Position color gradient overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: firstGradient,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                                            <div className="flex justify-between items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
                      <div className="font-bold text-white text-base flex-1 cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px', whiteSpace: 'normal', overflow: 'visible', wordWrap: 'break-word' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                      <div className="text-sm text-gray-300" style={{ marginRight: '8px' }}>
                        {player.bye}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 3 - (currentTeamStartingLineup.WR?.slice(0, 3).length || 0)) }, (_, i) => (
                  <div key={`wr-empty-${i}`} className="flex items-center" style={{ marginBottom: '4px' }}>
                    <div className="text-sm rounded w-full relative overflow-hidden" style={{ 
                      padding: '0px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(128, 128, 128, 0.4)',
                      height: '45px',
                      width: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      <div className="text-gray-500 italic text-right" style={{ position: 'relative', zIndex: 2, paddingRight: '10px' }}>Empty WR Spot</div>
                    </div>
                  </div>
                ))}
                
                {/* TE Spot */}
                {currentTeamStartingLineup.TE?.slice(0, 1).map((player, idx) => {
                  const { firstGradient } = createPickedPlayerGradient('TE');
                  return (
                    <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                    marginBottom: '4px', 
                    padding: '0px',
                    height: '45px',
                    border: '1px solid rgba(128, 128, 128, 0.4)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                      {/* Position color gradient overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: firstGradient,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                      <div className="flex justify-between items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
                      <div className="font-bold text-white text-base flex-1 cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px', whiteSpace: 'normal', overflow: 'visible', wordWrap: 'break-word' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                      <div className="text-sm text-gray-300 w-24 text-right" style={{ marginRight: '8px' }}>
                        {player.bye}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {(!currentTeamStartingLineup.TE || currentTeamStartingLineup.TE.length === 0) && (
                  <div className="flex items-center" style={{ marginBottom: '4px' }}>
                    <div className="text-sm rounded p-1 w-full relative overflow-hidden" style={{ 
                      border: '1px solid rgba(128, 128, 128, 0.4)',
                      height: '45px',
                      width: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}>
                      <div className="text-gray-500 italic text-right" style={{ position: 'relative', zIndex: 2, paddingRight: '10px' }}>Empty TE Spot</div>
                    </div>
                  </div>
                )}
                
                {/* Flex Spots */}
                {currentTeamStartingLineup.FLEX?.slice(0, 2).map((player, idx) => (
                  <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                    marginBottom: '4px', 
                    padding: '0px',
                    height: '45px',
                    border: '1px solid rgba(128, 128, 128, 0.4)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Position color gradient overlay - Use three separate sections with 60% completion */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0, // Full width
                        height: '100%',
                        zIndex: 1,
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Top section (33.33%) - RB gradient at 60% completion */}
                      <div style={{
                        height: '33.33%',
                        background: createPickedPlayerGradient('RB').firstGradient
                      }}></div>
                      
                      {/* Middle section (33.33%) - WR gradient at 60% completion */}
                      <div style={{
                        height: '33.33%',
                        background: createPickedPlayerGradient('WR').firstGradient
                      }}></div>
                      
                      {/* Bottom section (33.33%) - TE gradient at 60% completion */}
                      <div style={{
                        height: '33.33%',
                        background: createPickedPlayerGradient('TE').firstGradient
                      }}></div>
                    </div>
                    <div className="flex justify-between items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
                      <div className="font-bold text-white text-base flex-1 cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                      <div className="text-sm text-gray-300 w-16 text-right" style={{ marginRight: '8px' }}>
                        {player.bye}
                      </div>
                    </div>
                  </div>
                ))}
                                {Array.from({ length: Math.max(0, 2 - (currentTeamStartingLineup.FLEX?.slice(0, 2).length || 0)) }, (_, i) => {
                  return (
                  <div key={`flex-empty-${i}`} className="flex items-center" style={{ margin: '0', padding: '0', marginBottom: i === 1 ? '8px' : '4px' }}>
                      <div className="text-sm rounded team-roster-section w-full" style={{ 
                        border: '1px solid rgba(128, 128, 128, 0.4)',
                        height: '45px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden'
                    }}>
                      <div className="text-gray-500 italic text-right" style={{ position: 'relative', zIndex: 2, paddingRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>Empty Flex Spot</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Horizontal divider between flex and bench */}
            <div className="w-4/5 h-0.5 bg-gray-600 mx-auto" style={{ 
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
              marginTop: '0px',
              marginBottom: '4px'
            }}></div>

            {/* Bench Section */}
            <div className="flex-1" style={{ marginTop: '4px', marginBottom: '4px' }}>
              <div>
                {/* Show all bench players organized by draft order */}
                {(() => {
                  // Get all players in draft order for the selected team
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
                    <div key={player.name} className="text-sm rounded team-roster-section relative overflow-hidden" style={{ 
                      padding: '4px', 
                      marginTop: '4px',
                      marginBottom: '4px',
                      height: '45px',
                      minHeight: '45px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(128, 128, 128, 0.4)'
                    }}>
                      {/* Position color gradient overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: createPickedPlayerGradient(player.position).firstGradient,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                      <div className="flex justify-between items-center" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="font-bold text-white text-base cursor-pointer hover:text-gray-300 transition-colors" style={{ paddingLeft: '32px' }} onClick={() => openPlayerModal(player)}>{player.name}</div>
                                                                      <div className="text-sm text-gray-300 w-24 text-right" style={{ marginRight: '8px' }}>
                          {player.bye}
                        </div>
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
                    <div key={`bench-empty-${i}`} className="flex items-center" style={{ marginTop: '4px', marginBottom: '4px' }}>
                      <div className="text-sm rounded p-1 w-full" style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(128, 128, 128, 0.4)',
                        height: '45px',
                        width: '100%',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}>
                        <div className="text-gray-500 italic text-right" style={{ paddingRight: '10px' }}>Empty Bench Spot</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
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
            className="bg-gradient-to-r from-[#60A5FA] to-[#2DE2C5] text-[#000F55] px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200"
          >
            {draftOrder.length === 0 ? 'Randomize & Launch Draft' : 'Launch Draft Now'}
          </button>
        </div>
      )}

      {/* Start Draft Button */}
      {!isDraftActive && room?.status !== 'waiting' && room?.status !== 'completed' && isRoomOwner && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={startDraft}
            className="bg-gradient-to-r from-[#2DE2C5] to-[#60A5FA] text-[#000F55] px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200"
            title="Start the draft with a 60-second countdown"
          >
            🚀 Start Draft
          </button>
        </div>
      )}

      {/* Mock Draft Button */}
      {(
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

      {/* Mock Draft Speed Toggle */}
      {isDraftActive && mockDraftSpeed && room?.status !== 'completed' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setMockDraftSpeed(!mockDraftSpeed)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-red-600 transition-all"
            title="Toggle mock draft speed"
          >
            {mockDraftSpeed ? '🚀 Speed ON' : '⏸️ Speed OFF'}
          </button>
        </div>
      )}

      {/* Pause/Resume Draft Button */}
      {isDraftActive && room?.status !== 'completed' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={room?.status === 'paused' ? resumeDraft : pauseDraft}
            className={`px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-all ${
              room?.status === 'paused' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            title={room?.status === 'paused' ? 'Resume draft' : 'Pause draft'}
            style={{ minWidth: '120px', minHeight: '48px' }}
          >
            {room?.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        </div>
      )}





      {/* Force Pick Button */}
      {isDraftActive && room?.status !== 'completed' && (
        <div className="fixed bottom-4 right-48 z-50">
          <button
            onClick={() => {
              console.log('🔧 FORCE PICK TRIGGER');
              
              // Calculate current picker using same logic as the draft logic
              const round = Math.ceil(currentPickNumber / effectiveDraftOrder.length);
              const isSnakeRound = round % 2 === 0;
              const pickIndex = (currentPickNumber - 1) % effectiveDraftOrder.length;
              const forceCurrentPicker = isSnakeRound
                ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
                : effectiveDraftOrder[pickIndex];
              
              const mockDrafterNames = room?.mockDrafters || [];
              const isMockDrafter = forceCurrentPicker && forceCurrentPicker !== userName && mockDrafterNames.includes(forceCurrentPicker);
              const isUserTurn = forceCurrentPicker === userName;
              
              console.log('Force pick state:', {
                currentPickNumber,
                currentRound,
                round,
                isSnakeRound,
                pickIndex,
                forceCurrentPicker,
                isMockDrafter,
                isUserTurn,
                pickLoading,
                pickInProgress: pickInProgressRef.current,
                isDraftActive,
                effectiveDraftOrder
              });
              
              if (isMockDrafter && !pickLoading && !pickInProgressRef.current) {
                console.log('🔧 FORCING MOCK PICK for:', forceCurrentPicker);
                makeMockPick(forceCurrentPicker, currentPickNumber, currentRound);
              } else if (isUserTurn && !pickLoading) {
                console.log('🔧 FORCING USER PICK RESET');
                setPickLoading(false);
                pickInProgressRef.current = false;
              } else {
                console.log('🔧 FORCING PICK PROGRESS RESET');
                setPickLoading(false);
                pickInProgressRef.current = false;
              }
            }}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-orange-600 transition-all"
            style={{ minWidth: '120px', minHeight: '48px' }}
            title="Force next pick if draft is stalled"
          >
            ⚡ Force Pick
          </button>
        </div>
      )}

      {/* Debug Button for Stalled Drafts */}
      {isDraftActive && mockDraftSpeed && room?.status !== 'completed' && (
        <div className="fixed bottom-4 right-96 z-50">
          <button
            onClick={() => {
              console.log('🔧 MANUAL DEBUG TRIGGER');
              const currentPicker = effectiveDraftOrder[pickIndex];
              const mockDrafterNames = room?.mockDrafters || [];
              const isMockDrafter = currentPicker && currentPicker !== 'Not Todd Middleton' && mockDrafterNames.includes(currentPicker);
              const isUserTurn = currentPicker === 'Not Todd Middleton';
              
              console.log('Manual trigger state:', {
                currentPicker,
                isMockDrafter,
                isUserTurn,
                pickLoading,
                pickInProgress: pickInProgressRef.current,
                isDraftActive,
                mockDraftSpeed
              });
              
              if (isMockDrafter && !pickLoading && !pickInProgressRef.current) {
                console.log('🔧 FORCING MOCK PICK');
                makeMockPick(currentPicker, currentPickNumber, currentRound);
              } else if (isUserTurn && !pickLoading) {
                console.log('🔧 FORCING USER PICK RESET');
                setPickLoading(false);
                pickInProgressRef.current = false;
              }
            }}
            className="bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-red-600 transition-all"
            style={{ minWidth: '120px', minHeight: '48px' }}
            title="Force next pick if draft is stalled"
          >
            🔧 Force Pick
          </button>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-blue-500 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#60A5FA' }}>
                Tournament Info & Rankings
              </h2>
              <div className="text-white text-lg mb-6">
                <strong>TopDog</strong>
              </div>
              
              {/* Rankings Upload Section */}
              <div className="text-left mb-6">
                <h3 className="text-xl font-bold mb-3" style={{ color: '#2DE2C5' }}>
                  Custom Rankings
                </h3>
                <p className="text-gray-300 mb-4">
                  Upload your custom player rankings (one player name per line or comma-separated):
                </p>
                
                <textarea
                  value={rankingsText}
                  onChange={(e) => setRankingsText(e.target.value)}
                  placeholder="Ja'Marr Chase&#10;Justin Jefferson&#10;Saquon Barkley&#10;..."
                  className="w-full h-32 p-3 rounded text-black mb-3"
                />
                
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleRankingsUpload}
                    className="bg-[#2DE2C5] text-[#000F55] px-4 py-2 rounded font-bold hover:bg-[#60A5FA] transition-colors"
                  >
                    Upload Rankings
                  </button>
                  <button
                    onClick={clearRankings}
                    className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition-colors"
                  >
                    Clear Rankings
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-300 mb-2">Or upload CSV file:</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="text-gray-300"
                  />
                </div>
                
                {rankings.length > 0 && (
                  <div className="bg-white/10 rounded p-3">
                    <p className="text-gray-300 mb-2">
                      <strong>Current Rankings ({rankings.length} players):</strong>
                    </p>
                    <p className="text-sm text-gray-400">
                      {rankings.slice(0, 5).join(', ')}
                      {rankings.length > 5 && ` ... and ${rankings.length - 5} more`}
                    </p>
                  </div>
                )}
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

      {/* New Rankings Modal */}
      {rankingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-500 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#7C3AED' }}>
                Custom Player Rankings
              </h2>
              
              {/* Rankings Upload Section */}
              <div className="text-left mb-6">
                <h3 className="text-xl font-bold mb-3" style={{ color: '#2DE2C5' }}>
                  Upload Your Rankings
                </h3>
                <p className="text-gray-300 mb-4">
                  Upload your custom player rankings (one player name per line or comma-separated):
                </p>
                
                <textarea
                  value={rankingsText}
                  onChange={(e) => setRankingsText(e.target.value)}
                  placeholder="Ja'Marr Chase&#10;Justin Jefferson&#10;Saquon Barkley&#10;..."
                  className="w-full h-32 p-3 rounded text-black mb-3"
                />
                
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleRankingsUpload}
                    className="bg-[#2DE2C5] text-[#000F55] px-4 py-2 rounded font-bold hover:bg-[#60A5FA] transition-colors"
                  >
                    Upload Rankings
                  </button>
                  <button
                    onClick={clearRankings}
                    className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition-colors"
                  >
                    Clear Rankings
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-300 mb-2">Or upload CSV file:</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="text-gray-300"
                  />
                </div>
                
                {customRankings.length > 0 && (
                  <div className="bg-white/10 rounded p-3">
                    <p className="text-gray-300 mb-2">
                      <strong>Current Rankings ({customRankings.length} players):</strong>
                    </p>
                    <p className="text-sm text-gray-400">
                      {customRankings.slice(0, 5).join(', ')}
                      {customRankings.length > 5 && ` ... and ${customRankings.length - 5} more`}
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setRankingsModalOpen(false)}
                className="bg-[#7C3AED] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#6D28D9] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Details Modal */}
      {showPlayerModal && selectedPlayerForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: `2px solid ${getPositionColor(selectedPlayerForModal.position)}` }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: getPositionColor(selectedPlayerForModal.position) }}>
                {selectedPlayerForModal.name}
              </h2>
              <p className="text-gray-300">
                {selectedPlayerForModal.position} &nbsp;&nbsp;|&nbsp;&nbsp; {selectedPlayerForModal.team}
              </p>
            </div>
            
            {/* Loading State */}
            {playerStatsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-300">Loading player statistics...</p>
              </div>
            )}
            
            {/* Career Stats Table */}
            {!playerStatsLoading && playerStatsData && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2 text-white font-bold"></th>
                      <th className="text-left p-2 text-white font-bold"></th>
                      <th className="text-left p-2 text-white font-bold"></th>
                      
                      {/* Fantasy Points Column for all positions */}
                      <th className="text-center p-2 text-white font-bold border-l border-gray-600"></th>
                      
                      {/* QB Specific Stats */}
                      {playerStatsData.position === 'QB' && (
                        <>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="6">Passing</th>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="8">Rushing</th>
                        </>
                      )}
                      
                      {/* RB Specific Stats */}
                      {playerStatsData.position === 'RB' && (
                        <>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="8">Rushing</th>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="9">Receiving</th>
                        </>
                      )}
                      
                      {/* WR/TE Specific Stats */}
                      {(playerStatsData.position === 'WR' || playerStatsData.position === 'TE') && (
                        <>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="9">Receiving</th>
                          <th className="text-center p-2 font-bold border-l border-gray-600" style={{ color: getPositionColor(playerStatsData.position) }} colSpan="8">Rushing</th>
                        </>
                      )}
                    </tr>
                    <tr className="border-b border-gray-600 text-xs">
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                      <th className="p-2 text-gray-300 text-center cursor-help" title="Games Played">G</th>
                      
                      {/* Fantasy Points Header for all positions */}
                      <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Fantasy Points">FPts</th>
                      
                      {/* QB Headers */}
                      {playerStatsData.position === 'QB' && (
                        <>
                          {/* Passing Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Completions">Cmp</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Attempts">Att</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Interceptions">Int</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Quarterback Rating">QBR</th>
                          
                          {/* Rushing Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Attempts">Att</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards Per Attempt">Y/A</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Fumbles">Fmb</th>
                          
                          {/* Fantasy Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Fantasy Points">FPts</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Passing Touchdowns">PassTD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Rushing Touchdowns">RushTD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Total Touchdowns">TotTD</th>
                        </>
                      )}
                      
                      {/* RB Headers */}
                      {playerStatsData.position === 'RB' && (
                        <>
                          {/* Rushing Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Attempts">Att</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards Per Attempt">Y/A</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Fumbles">Fmb</th>
                          
                          {/* Receiving Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Targets">Tgt</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Receptions">Rec</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>

                        </>
                      )}
                      
                      {/* WR/TE Headers */}
                      {(playerStatsData.position === 'WR' || playerStatsData.position === 'TE') && (
                        <>
                          {/* Receiving Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Targets">Tgt</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Receptions">Rec</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>

                          
                          {/* Rushing Headers */}
                          <th className="p-2 text-gray-300 text-center border-l border-gray-600 cursor-help" title="Attempts">Att</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards">Yds</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Touchdowns">TD</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Yards Per Attempt">Y/A</th>
                          <th className="p-2 text-gray-300 text-center cursor-help" title="Fumbles">Fmb</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 2025 Projections Row */}
                    <tr className="border-b border-gray-700 hover:bg-white/5 bg-white/5">
                      <td className="p-2 text-white font-bold">2025 (proj.)</td>
                      <td className="p-2 text-white">{playerStatsData.team}</td>
                      <td className="p-2 text-gray-300 text-center">17</td>
                      
                      {/* Fantasy Points for all positions */}
                      <td className="p-2 text-white border-l border-gray-600 text-center">
                        xx
                      </td>
                      
                      {/* QB Projections */}
                      {playerStatsData.position === 'QB' && (
                        <>
                          {/* Passing Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          
                          {/* Rushing Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                        </>
                      )}
                      
                      {/* RB Projections */}
                      {playerStatsData.position === 'RB' && (
                        <>
                          {/* Rushing Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          
                          {/* Receiving Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                        </>
                      )}
                      
                      {/* WR/TE Projections */}
                      {(playerStatsData.position === 'WR' || playerStatsData.position === 'TE') && (
                        <>
                          {/* Receiving Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            xx
                          </td>
                          
                          {/* Rushing Projections */}
                          <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.attempts || "";
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.yards || "";
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.touchdowns || "";
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.yardsPerAttempt || "";
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.yardsPerGame || "";
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                            })()}
                          </td>
                          <td className="p-2 text-gray-300 text-center">
                            {(() => {
                              const player = PLAYER_POOL.find(p => p.name === selectedPlayerForModal.name);
                              return player?.clayProjections?.rushing?.fumbles || "";
                            })()}
                          </td>
                        </>
                      )}
                    </tr>
                    
                    {/* Current and Previous Season Data */}
                    {playerStatsData.seasons.map((season, index) => (
                      <tr key={season.year} className="border-b border-gray-700 hover:bg-white/5">
                        <td className="p-2 text-white">{season.year}</td>
                        <td className="p-2 text-white">{playerStatsData.team}</td>
                        <td className="p-2 text-gray-300 text-center">{season.games}</td>
                        
                        {/* Fantasy Points for all positions */}
                        <td className="p-2 text-white border-l border-gray-600 text-center">
                          {season.fantasy?.points?.toFixed(1) || '0.0'}
                        </td>
                        
                        {/* QB Stats */}
                        {playerStatsData.position === 'QB' && (
                          <>
                            {/* Passing Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {Math.floor((season.passing?.attempts || 450) * 0.65)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.passing?.attempts || 450}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.passing?.yards || 3200}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.passing?.touchdowns || 22}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.passing?.interceptions || 8}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.passing?.qbr || 88.5}
                            </td>
                            
                            {/* Rushing Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {season.rushing.attempts || 85}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yards || 420}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.touchdowns || 6}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yardsPerAttempt?.toFixed(1) || '4.9'}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {((season.rushing.yards || 420) / season.games).toFixed(1)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.rushing.attempts || 85) * 0.35)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor(Math.random() * 8 + 3)}
                            </td>
                          </>
                        )}
                        
                        {/* RB Stats */}
                        {playerStatsData.position === 'RB' && (
                          <>
                            {/* Rushing Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {season.rushing.attempts || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yards || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.touchdowns || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yardsPerAttempt?.toFixed(1) || '0.0'}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {((season.rushing.yards || 0) / season.games).toFixed(1)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.rushing.attempts || 0) * 0.3)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor(Math.random() * 3)}
                            </td>
                            
                            {/* Receiving Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {season.receiving.targets || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.receptions || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.yards || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.touchdowns || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {((season.receiving.receptions || 0) / season.games).toFixed(1)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.receiving.receptions || 0) * 0.6)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.receiving.yards || 0) * 0.4)}
                            </td>
                          </>
                        )}
                        
                        {/* WR/TE Stats */}
                        {(playerStatsData.position === 'WR' || playerStatsData.position === 'TE') && (
                          <>
                            {/* Receiving Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {season.receiving.targets || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.receptions || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.yards || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.receiving.touchdowns || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {((season.receiving.receptions || 0) / season.games).toFixed(1)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.receiving.receptions || 0) * 0.6)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.receiving.yards || 0) * 0.4)}
                            </td>
                            
                            {/* Rushing Stats */}
                            <td className="p-2 text-gray-300 text-center border-l border-gray-600">
                              {season.rushing.attempts || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yards || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.touchdowns || 0}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {season.rushing.yardsPerAttempt?.toFixed(1) || '0.0'}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {((season.rushing.yards || 0) / season.games).toFixed(1)}
                            </td>
                            <td className="p-2 text-gray-300 text-center">
                              {Math.floor((season.rushing.attempts || 0) * 0.3)}
                            </td>

                          </>
                        )}
                      </tr>
                    ))}
                    

                  </tbody>
                </table>
              </div>
            )}
            
            {/* Error State */}
            {!playerStatsLoading && !playerStatsData && (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">Unable to load player statistics</p>
                <p className="text-gray-500 text-sm">ESPN ID not found for {selectedPlayerForModal.name}. Please add to player database.</p>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={closePlayerModal}
                className="bg-gray-800 border border-gray-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </DragDropContext>

      </div> {/* Close main-content-container */}

      {/* Ripple Effect - positioned to radiate from center */}
      <RippleEffect 
        isActive={showRipple}
        centerX="50%"
        centerY="50%"
        onComplete={() => setShowRipple(false)}
      />

        </div>
      </div>
  );
}