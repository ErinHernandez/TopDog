import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { updateTournamentEntryStats, getUserStats } from '../lib/userStats';

const mainPrizes = [
  { place: '1st', amount: '$2,000,000' },
  { place: '2nd', amount: '$1,000,000' },
  { place: '3rd', amount: '$500,000' },
  { place: '4th', amount: '$250,000' },
  { place: '5th', amount: '$125,000' },
  { place: '6th', amount: '$120,000' },
  { place: '7th', amount: '$115,000' },
  { place: '8th', amount: '$110,000' },
  { place: '9th', amount: '$105,000' },
  { place: '10th', amount: '$100,000' },
  { place: '11th', amount: '$95,000' },
  { place: '12th', amount: '$90,000' },
  { place: '13th', amount: '$85,000' },
  { place: '14th', amount: '$80,000' },
  { place: '15th', amount: '$75,000' },
  { place: '16th', amount: '$70,000' },
  { place: '17 - 20th', amount: '$70,000' },
  { place: '21 - 30th', amount: '$50,000' },
  { place: '31 - 40th', amount: '$30,000' },
  { place: '41 - 50th', amount: '$15,000' },
  { place: '51 - 100th', amount: '$10,000' },
  { place: '101 - 200th', amount: '$7,000' },
  { place: '201 - 300th', amount: '$5,000' },
  { place: '301 - 539th', amount: '$3,750' },
  { place: '540 - 1078th', amount: '$1,000' },
  { place: '1079 - 1617th', amount: '$500' },
  { place: '1618 - 2156th', amount: '$250' },
  { place: '2157 - 2695th', amount: '$100' },
  { place: '2696 - 8624th', amount: '$70' },
  { place: '8625 - 112112th', amount: '$25' },
];

const round1Prizes = [
  { place: '1st', amount: '$100,000' },
  { place: '2nd', amount: '$50,000' },
  { place: '3rd', amount: '$35,000' },
  { place: '4th', amount: '$25,000' },
  { place: '5th', amount: '$20,000' },
  { place: '6th', amount: '$14,000' },
  { place: '7th', amount: '$13,000' },
  { place: '8th', amount: '$12,000' },
  { place: '9th', amount: '$11,000' },
  { place: '10th', amount: '$10,000' },
  { place: '11 - 15th', amount: '$5,000' },
  { place: '16 - 20th', amount: '$2,000' },
  { place: '21 - 50th', amount: '$1,000' },
  { place: '51 - 100th', amount: '$500' },
  { place: '101 - 500th', amount: '$300' },
  { place: '501 - 1000th', amount: '$200' },
  { place: '1001 - 10000th', amount: '$100' },
];

const scoring = [
  { label: 'Reception', value: '0.5' },
  { label: 'Receiving TD', value: '6.0' },
  { label: 'Receiving Yard', value: '0.1' },
  { label: 'Rushing TD', value: '6.0' },
  { label: 'Rushing Yard', value: '0.1' },
  { label: 'Passing Yard', value: '0.05' },
  { label: 'Passing TD', value: '4.0' },
  { label: 'Interception', value: '-1.0' },
  { label: '2-PT Conversion', value: '2.0' },
  { label: 'Fumble Lost', value: '-2.0' },
];

const roster = [
  { label: 'QB', value: '1' },
  { label: 'RB', value: '2' },
  { label: 'WR', value: '3' },
  { label: 'FLEX', value: '2' },
  { label: 'BENCH', value: '9' },
  { label: 'TE', value: '1' },
];

const schedule = [
  { round: 'Qualifiers', weeks: 'Weeks 1-14' },
  { round: 'Quarterfinals', weeks: 'Week 15' },
  { round: 'Semifinals', weeks: 'Week 16' },
  { round: 'Championship', weeks: 'Week 17' },
];

export default function JoinTournamentModal({ open, onClose, tournamentType = 'topdog' }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [selectedDraftSpeed, setSelectedDraftSpeed] = useState('30s');
  const userId = 'Not Todd Middleton'; // Replace with real user ID in production

  // Get tournament config based on type
  const getTournamentConfig = () => {
    switch (tournamentType) {
                      default: // topdog
                  return {
                    name: 'the TopDog',
                    entryFee: 25,
                    entrants: 538140,
                    prizes: 12000000,
                    type: 'topdog',
                    route: 'topdog'
                  };
    }
  };

  const config = getTournamentConfig();

  // Fetch user stats when modal opens
  useEffect(() => {
    if (open) {
      fetchUserStats();
    }
  }, [open]);

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Ensure minimum 3 available rooms exist for this type
  const ensureMinimumRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, 'draftRooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const availableRooms = roomsData.filter(room => 
        room.type === config.type &&
        room.status === 'waiting' && 
        (room.participants?.length || 0) < (room.maxParticipants || 12)
      );

      const roomsToCreate = 3 - availableRooms.length;
      if (roomsToCreate > 0) {
        console.log(`Creating ${roomsToCreate} additional ${tournamentType} rooms`);
        for (let i = 0; i < roomsToCreate; i++) {
          await addDoc(collection(db, 'draftRooms'), {
            name: `${config.name} Room ${Date.now()}-${Math.floor(Math.random()*10000)}`,
            type: config.type,
            createdAt: serverTimestamp(),
            status: 'waiting',
            participants: [],
            createdBy: 'System',
            maxParticipants: 12,
            draftOrder: [],
            settings: {
              timerSeconds: 30,
              totalRounds: 18,
              autoStart: false
            }
          });
        }
      }
    } catch (error) {
      console.error('Error ensuring minimum rooms:', error);
    }
  };

  const handleEnterTournament = async () => {
    setIsJoining(true);
    try {
      console.log('Starting tournament entry process...');
      console.log('User ID:', userId);
      console.log('Tournament type:', config.type);
      console.log('Entry fee:', config.entryFee);
      
      // Check user balance first
      if (userStats && userStats.balance < config.entryFee) {
        alert(`Insufficient balance. You need $${config.entryFee} but only have $${userStats.balance}. Please deposit more funds.`);
        setIsJoining(false);
        return;
      }

      // Use the new comprehensive statistics system
      console.log('Updating tournament entry stats...');
      await updateTournamentEntryStats(userId, config.type, config.entryFee);
      console.log('Tournament entry stats updated successfully');

      // Record the tournament entry transaction
      console.log('Recording tournament entry transaction...');
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        type: 'tournament_entry',
        amount: -config.entryFee,
        tournamentType: config.type,
        tournamentName: config.name,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      console.log('Tournament entry transaction recorded');

      console.log('Ensuring minimum rooms exist...');
      await ensureMinimumRooms();
      
      console.log('Finding available rooms...');
      const roomsSnapshot = await getDocs(collection(db, 'draftRooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const availableRooms = roomsData.filter(room => 
        room.type === config.type &&
        room.status === 'waiting' && 
        (room.participants?.length || 0) < (room.maxParticipants || 12)
      );
      console.log('Available rooms found:', availableRooms.length);
      
      if (availableRooms.length === 0) {
        // Fallback: create a new room
        console.log('No available rooms, creating new room...');
        const newRoomRef = await addDoc(collection(db, 'draftRooms'), {
          name: `${config.name} Room ${Date.now()}`,
          type: config.type,
          createdAt: serverTimestamp(),
          status: 'waiting',
          participants: [],
          createdBy: 'Not Todd Middleton',
          maxParticipants: 12,
          draftOrder: [],
          settings: {
            timerSeconds: 30,
            totalRounds: 18,
            autoStart: false
          }
        });
        console.log('New room created with ID:', newRoomRef.id);
        router.push(`/draft/${config.route}/${newRoomRef.id}`);
      } else {
        // Join a random available room
        console.log('Joining existing room...');
        const selectedRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        console.log('Selected room:', selectedRoom.id);
        await updateDoc(doc(db, 'draftRooms', selectedRoom.id), {
          participants: [...(selectedRoom.participants || []), 'Not Todd Middleton']
        });
        console.log('Successfully joined room');
        router.push(`/draft/${config.route}/${selectedRoom.id}`);
      }
      onClose();
    } catch (error) {
      console.error('Error joining room:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Error joining draft room: ${error.message}. Please try again.`);
    } finally {
      setIsJoining(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose}></div>
      <div className="relative bg-gray-900 rounded-xl shadow-2xl p-8 z-10 max-w-4xl max-h-[90vh] overflow-y-auto border border-[#59c5bf]">
        <button onClick={onClose} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-[#c7c7c7]">×</button>
        
        <div className="text-center mb-8">
          <h2 className="font-bold mb-4 text-inside-outline" style={{ fontFamily: 'Anton SC, sans-serif', fontSize: '48px', marginTop: '-20px' }}>the TopDog</h2>
          
          <div className="text-lg text-gray-300 mb-6 flex justify-center space-x-4">
            <span>${config.entryFee} Entry Fee</span>
            <span>•</span>
            <span>{config.entrants.toLocaleString()} Entrants</span>
            <span>•</span>
            <span>${config.prizes.toLocaleString()} Purse</span>
          </div>
          
          {/* Tournament Fill Bar */}
          <div className="mb-4 py-4">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-[#59c5bf] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(config.entrants / 1000000) * 95}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 text-center">
              {Math.round((config.entrants / 1000000) * 100)}% Full
            </div>
          </div>

          {/* Draft Speed Selection */}
          <div className="mb-6">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setSelectedDraftSpeed('30s')}
                className={`px-8 py-2 rounded-lg font-bold transition-colors ${
                  selectedDraftSpeed === '30s' 
                    ? 'hover:bg-[#3c3c3c]' 
                    : 'hover:bg-[#3c3c3c]'
                }`}
                style={{
                  backgroundColor: selectedDraftSpeed === '30s' ? '#3c3c3c' : '#202020',
                  color: '#c7c7c7',
                  width: '55%'
                }}
              >
                30 seconds per pick
              </button>
              <button
                onClick={() => setSelectedDraftSpeed('8h')}
                className={`px-8 py-2 rounded-lg font-bold transition-colors ${
                  selectedDraftSpeed === '8h' 
                    ? 'hover:bg-[#3c3c3c]' 
                    : 'hover:bg-[#3c3c3c]'
                }`}
                style={{
                  backgroundColor: selectedDraftSpeed === '8h' ? '#3c3c3c' : '#202020',
                  color: '#c7c7c7',
                  width: '55%'
                }}
              >
                8 hours per pick
              </button>
            </div>
          </div>

          <div className="mt-0">
            <button
              onClick={handleEnterTournament}
              disabled={isJoining}
              className="px-9 py-2 bg-[#59c5bf] text-gray-900 font-bold text-lg rounded-lg hover:bg-[#4a9e99] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isJoining ? 'Joining Tournament...' : 'Enter Tournament'}
            </button>
            <div className="text-sm text-gray-400 text-center mb-4">
              Round Advancement: 2/12 - 1/12 - 1/12 - 666 Seat Final
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Roster */}
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#59c5bf' }}>Roster</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {roster.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{item.label}:</span>
                  <span className="font-bold" style={{ color: '#c7c7c7' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring */}
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#59c5bf' }}>Scoring</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {scoring.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{item.label}:</span>
                  <span className="font-bold" style={{ color: '#c7c7c7' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Prize Structure */}
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Prize Structure</h3>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {mainPrizes.map((prize, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-300">{prize.place}</span>
                  <span className="font-bold" style={{ color: '#c7c7c7' }}>{prize.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#59c5bf' }}>Schedule</h4>
            <div className="space-y-1 text-sm">
              {schedule.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{item.round}:</span>
                  <span className="font-bold" style={{ color: '#c7c7c7' }}>{item.weeks}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}