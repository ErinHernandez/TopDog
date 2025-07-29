import React, { useState } from 'react';
import Head from 'next/head';
import JoinTournamentModal from '../components/JoinTournamentModal';
import Link from 'next/link';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const handleJoinTournament = (tournamentType) => {
    setSelectedTournament(tournamentType);
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>TopDog.dog - Fantasy Football Tournaments</title>
        <meta name="description" content="Join the ultimate fantasy football tournaments with TopDog.dog" />
      </Head>

      <main>
        {/* Subheader Navigation */}
        <section className="bg-gray-900 border-b border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex justify-start space-x-8 h-14 items-center" style={{ marginTop: '0px', marginBottom: '0px' }}>
              <span className="text-yellow-400 font-medium border-b-2 border-yellow-400 pb-1 text-base">
                Draft Lobby
              </span>
              <Link href="/my-teams" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
                My Teams
              </Link>
              <Link href="/exposure" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
                Exposure Report
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto text-center">
          </div>
        </section>

        {/* Tournament Cards Section */}
        <section className="pt-0 pb-16 bg-gray-900" style={{ marginTop: '-60px' }}>
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center">
              {/* TopDog Tournament */}
              <div className="rounded-lg shadow-lg flex flex-col text-center items-center bg-gray-900" style={{ border: '8px solid #59c5bf', width: '400px', height: '400px' }}>
                <div className="w-full p-8 flex-1 flex flex-col items-center justify-center">
                  <h2 className="font-bold mb-6 text-inside-outline" style={{ fontFamily: 'Anton SC, sans-serif', fontSize: '60px', paddingBottom: '22px' }}>the TopDog</h2>
                <button
                  onClick={() => handleJoinTournament('topdog')}
                    className="bg-[#59c5bf] text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#4a9e99] transition-colors"
                >
                  Join Tournament
                </button>
                </div>
                {/* Bottom Bar */}
                <div className="w-full bg-[#59c5bf] flex justify-between items-center px-4 py-3 text-black font-bold text-lg border-t border-[#4a9e99]">
                  <div className="flex-1 text-center flex flex-col items-center">$25<span className='font-normal text-xs'>Entry</span></div>
                  <div className="flex-1 text-center flex flex-col items-center">571,480<span className='font-normal text-xs'>Entries</span></div>
                  <div className="flex-1 text-center flex flex-col items-center">$2M<span className='font-normal text-xs'>1st Place</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Copyright Section */}
        <section className="py-6 bg-gray-900">
          <div className="container mx-auto text-center">
            <p className="text-gray-300" style={{ paddingBottom: '1rem', marginTop: '38px' }}>
              © 2024 TopDog.dog. All rights reserved.
            </p>
          </div>
        </section>

      </main>

      <JoinTournamentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tournamentType={selectedTournament}
        userId="Not Todd Middleton"
      />
    </>
  );
} 