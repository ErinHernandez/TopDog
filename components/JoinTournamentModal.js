import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { updateTournamentEntryStats } from '../lib/userStats';
import { useUser } from '../lib/userContext';
import AuthModal from './AuthModal';
import { createScopedLogger } from '../lib/clientLogger';

const logger = createScopedLogger('[JoinTournament]');

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

const scoring = [
  { label: 'Reception', value: '0.5' },
  { label: 'Receiving TD', value: '6.0' },
  { label: 'Receiving Yard', value: '0.1' },
  { label: 'Rushing TD', value: '6.0' },
  { label: 'Rushing Yard', value: '0.1' },
  { label: 'Passing Yard', value: '0.05' },
  { label: 'Passing TD', value: '4.0' },
  { label: 'Interception', value: '-1.0' },
  { label: '2-PT Conv', value: '2.0' },
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
  const { user, userBalance, updateUserData } = useUser();
  const [isJoining, setIsJoining] = useState(false);
  const [selectedDraftSpeed, setSelectedDraftSpeed] = useState('30s');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  // Get tournament config based on type
  const getTournamentConfig = () => {
    switch (tournamentType) {
                      default: // topdog
                  return {
                    name: 'the TopDog',
                    entryFee: 25,
                    entrants: 571480,
                    prizes: 12000000,
                    type: 'topdog',
                    route: 'topdog'
                  };
    }
  };

  const config = getTournamentConfig();

  // No need to fetch user stats separately - using UserContext

  const ensureMinimumRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, 'draftRooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const waitingRooms = roomsData.filter(room => 
        room.type === config.type &&
        room.status === 'waiting'
      );
      
      if (waitingRooms.length < 5) {
        const roomsToCreate = 5 - waitingRooms.length;
        logger.debug(`Creating ${roomsToCreate} additional rooms`);

        for (let i = 0; i < roomsToCreate; i++) {
          await addDoc(collection(db, 'draftRooms'), {
            name: `${config.name} Room ${Date.now() + i}`,
            type: config.type,
            createdAt: serverTimestamp(),
            status: 'waiting',
            participants: [],
            createdBy: user?.uid || 'NEWUSERNAME',
            maxParticipants: 12,
            draftOrder: [],
                      settings: {
            timerSeconds: selectedDraftSpeed === '8h' ? 28800 : 30, // 8 hours = 28800 seconds, 30 seconds = 30
            totalRounds: 18,
            autoStart: false
          }
          });
        }
      }
    } catch (error) {
      logger.error('Error ensuring minimum rooms', error);
    }
  };

  const handleEnterTournament = async () => {
    logger.debug('Enter Tournament button clicked', { userId: user?.uid, hasBalance: !!userBalance });

    // Check if user is authenticated
    if (!user) {
      logger.debug('No user found, showing auth modal');
      setShowAuthModal(true);
      return;
    }

    setIsJoining(true);
    try {
      logger.debug('Starting tournament entry process', {
        userId: user.uid,
        tournamentType: config.type,
        entryFee: config.entryFee,
        balance: userBalance?.balance
      });

      // Check user balance first
      const currentBalance = userBalance?.balance || 0;

      if (currentBalance < config.entryFee) {
        logger.debug('Insufficient balance', { currentBalance, entryFee: config.entryFee });
        alert(`Insufficient balance. You need $${config.entryFee} but only have $${currentBalance}. Please deposit more funds.`);
        setIsJoining(false);
        return;
      }

      logger.debug('Balance check passed, proceeding with tournament entry');

      // Use the new comprehensive statistics system
      await updateTournamentEntryStats(user.uid, config.type, config.entryFee);
      logger.debug('Tournament entry stats updated');

      // Record the tournament entry transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'tournament_entry',
        amount: -config.entryFee,
        tournamentType: config.type,
        tournamentName: config.name,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      logger.debug('Tournament entry transaction recorded');

      await ensureMinimumRooms();

      const timerSeconds = selectedDraftSpeed === '8h' ? 28800 : 30;
      logger.debug('Finding available rooms', { selectedDraftSpeed, timerSeconds });
      const roomsSnapshot = await getDocs(collection(db, 'draftRooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const availableRooms = roomsData.filter(room =>
        room.type === config.type &&
        room.status === 'waiting' &&
        (room.participants?.length || 0) < (room.maxParticipants || 12) &&
        room.settings?.timerSeconds === timerSeconds
      );
      logger.debug('Available rooms found', { count: availableRooms.length });

      if (availableRooms.length === 0) {
        // Fallback: create a new room
        logger.debug('No available rooms, creating new room');
        const newRoomRef = await addDoc(collection(db, 'draftRooms'), {
          name: `${config.name} Room ${Date.now()}`,
          type: config.type,
          createdAt: serverTimestamp(),
          status: 'waiting',
          participants: [],
          createdBy: user.uid,
          maxParticipants: 12,
          draftOrder: [],
          settings: {
            timerSeconds,
            totalRounds: 18,
            autoStart: false
          }
        });
        logger.info('New room created', { roomId: newRoomRef.id });
        const draftPath = `/draft/${config.route}/${newRoomRef.id}`;
        router.push(draftPath);
        // Fallback in case router.push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== draftPath) {
            logger.warn('Router push failed, using window.location', { path: draftPath });
            window.location.href = draftPath;
          }
        }, 1000);
      } else {
        // Join a random available room
        const selectedRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        logger.debug('Joining existing room', { roomId: selectedRoom.id });
        await updateDoc(doc(db, 'draftRooms', selectedRoom.id), {
          participants: [...(selectedRoom.participants || []), user.uid]
        });
        logger.info('Successfully joined room', { roomId: selectedRoom.id });
        const draftPath = `/draft/${config.route}/${selectedRoom.id}`;
        router.push(draftPath);
        // Fallback in case router.push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== draftPath) {
            logger.warn('Router push failed, using window.location', { path: draftPath });
            window.location.href = draftPath;
          }
        }, 1000);
      }
      onClose();
    } catch (error) {
      logger.error('Error joining room', error, { code: error.code });
      alert(`Error joining draft room: ${error.message}. Please try again.`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    logger.debug('Authentication successful', { userId: authenticatedUser.uid });
    setShowAuthModal(false);
    // Refresh user data after authentication
    updateUserData();
  };

  if (!open) return null;

  return (
    <>
      <style jsx>{`
        .prize-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .prize-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .prize-scroll::-webkit-scrollbar-thumb {
          background-color: #374151;
          border-radius: 2px;
        }
        .prize-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #4b5563;
        }
      `}</style>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-black opacity-70" onClick={onClose}></div>
        <div className="relative bg-gray-900 rounded-3xl shadow-2xl pt-8 px-8 z-10 overflow-hidden" style={{ width: '60vw', maxHeight: 'calc(90vh - 72px)', marginTop: '50px', paddingBottom: '0px' }}>
          <button onClick={onClose} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-[#c7c7c7]">×</button>
          
          <div className="text-center mb-8">
            <h2 className="font-bold mb-4" style={{ fontFamily: 'Anton SC, sans-serif', fontSize: '48px', marginTop: '-20px', lineHeight: '1.06', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>the TopDog<br />International</h2>
            
            <div className="text-lg text-gray-300 mb-6 flex justify-center space-x-4">
              <span>${config.entryFee} Entry Fee</span>
              <span>•</span>
              <span>{config.entrants.toLocaleString()} Entries</span>
              <span>•</span>
              <span>${config.prizes.toLocaleString()} Purse</span>
            </div>
            
            {/* Tournament Fill Bar */}
            <div className="mb-4 py-4">
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(config.entrants / 1000000) * 95}%`, background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover' }}
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
                className="px-9 py-2 font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 cursor-pointer"
                style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', color: '#ffffff' }}
              >
                Enter Tournament
              </button>
              <div className="text-sm text-gray-400 text-center mb-4">
                Round Advancement: 2/12 - 1/12 - 1/12 - 666 Seat Final
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Prize Structure - Left Side */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prize Structure</h3>
              <div 
                className="prize-scroll grid grid-cols-1 gap-2 overflow-y-auto pr-3"
                style={{
                  maxHeight: '274px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#374151 transparent'
                }}
              >
                {mainPrizes.map((prize, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">{prize.place}</span>
                    <span className="font-bold" style={{ color: '#c7c7c7' }}>{prize.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Roster and Scoring */}
            <div className="col-span-2 space-y-6">
              {/* Roster */}
              <div>
                <h4 className="font-bold mb-2 px-2 text-xl" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Roster</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {roster.map((item, index) => (
                    <div key={index} className="flex justify-between px-2">
                      <span className="text-gray-300">{item.label}:</span>
                      <span className="font-bold" style={{ color: '#c7c7c7' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div>
                <h4 className="font-bold mb-2 px-2 text-xl" style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scoring</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {scoring.map((item, index) => (
                    <div key={index} className="flex justify-between px-2">
                      <span className="text-gray-300">{item.label}:</span>
                      <span className="font-bold" style={{ color: '#c7c7c7' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}