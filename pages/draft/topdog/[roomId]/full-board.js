import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../../lib/firebase';
import {
  doc, onSnapshot, collection, query, orderBy
} from 'firebase/firestore';
import Link from 'next/link';
import FullDraftBoard from '../../../../components/FullDraftBoard';
import { PLAYER_POOL } from '../../../../lib/playerPool';

export default function FullDraftBoardPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [picks, setPicks] = useState([]);
  const [draftOrder, setDraftOrder] = useState([]);

  // Listen for room data
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'draftRooms', roomId), (docSnap) => {
      const roomData = { id: docSnap.id, ...docSnap.data() };
      setRoom(roomData);
      setParticipants(roomData?.participants || []);
      setDraftOrder(roomData?.draftOrder || []);
    }, (error) => {
      console.error('Error listening to room data:', error);
    });
    return () => unsub();
  }, [roomId]);

  // Listen for picks
  useEffect(() => {
    if (!roomId) return;
    const picksQuery = query(collection(db, 'draftRooms', roomId, 'picks'), orderBy('pickNumber'));
    const unsub = onSnapshot(picksQuery, (snap) => {
      const picksArr = snap.docs.map(doc => doc.data());
      setPicks(picksArr);
    }, (error) => {
      console.error('Error listening to picks:', error);
    });
    return () => unsub();
  }, [roomId]);

  if (!room) return <div className="min-h-screen text-white flex items-center justify-center" style={{ background: '#18181b' }}>Loading...</div>;

  return (
    <div className="min-h-screen text-white" style={{ background: '#18181b' }}>
      <div className="py-8 pl-1 pr-6">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <Link 
            href={`/draft/topdog/${roomId}`} 
            className="px-4 py-2 bg-[#c4b5fd] text-[#000F55] font-semibold rounded-lg hover:bg-[#2DE2C5] transition-colors text-sm inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Draft</span>
          </Link>
        </div>

        {/* Full Size Draft Board */}
        <FullDraftBoard
          room={room}
          picks={picks}
          participants={participants}
          draftOrder={draftOrder}
          PLAYER_POOL={PLAYER_POOL}
        />
      </div>
    </div>
  );
} 