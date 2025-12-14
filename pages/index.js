import React, { useState } from 'react';
import Head from 'next/head';
import JoinTournamentModal from '../components/JoinTournamentModal';
import Link from 'next/link';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const handleJoinTournament = (tournamentType) => {
    console.log('Tournament button clicked:', tournamentType);
    setSelectedTournament(tournamentType);
    setShowModal(true);
    console.log('Modal should be open:', true);
  };

  return (
    <>
      <Head>
        <title>TopDog.dog - Fantasy Football Tournaments</title>
        <meta name="description" content="Join the ultimate fantasy football tournaments with TopDog.dog" />
      </Head>

      <main style={{ width: '100vw', margin: '0', padding: '0', overflow: 'hidden' }}>
        {/* Background container */}
        <div 
          className="w-full zoom-resistant"
          style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover',
            minHeight: '100%',
            width: '100vw',
            margin: '0',
            padding: '0',
            position: 'relative',
            left: '0',
            right: '0'
          }}
        >
          {/* Top Subheader with wr_blue background */}
          <section className="zoom-resistant" style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', margin: '0', padding: '0' }}>
          </section>

          {/* White Navbar */}
          <section className="bg-white border-b border-gray-200 zoom-resistant" style={{ width: '100vw', height: '53.5px', overflow: 'hidden', margin: '0', padding: '0' }}>
            <div className="w-full px-4 zoom-resistant">
              <div className="flex justify-between items-center zoom-resistant" style={{ marginTop: '0px', marginBottom: '0px', height: '53.5px', width: '100%' }}>
                <div className="flex space-x-8" style={{ marginTop: '2px' }}>
                  <span className="font-medium border-b-2 border-yellow-400 pb-1 text-base" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Draft Lobby
                  </span>
                  <Link href="/my-teams" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    My Teams
                  </Link>
                  <Link href="/exposure" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '1.07rem', WebkitTextStroke: '0.12px #18181b', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Exposure Report
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 7px wr_blue container */}
          <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', margin: '0', padding: '0' }}>
          </section>

          {/* Bottom Subheader with wr_blue background */}
          <section style={{ height: '7px', width: '100vw', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', marginTop: '0px', margin: '0', padding: '0' }}>
          </section>

          {/* Hero Section */}
          <section className="py-20" style={{ width: '100%' }}>
            <div className="container mx-auto text-center" style={{ width: '100%', maxWidth: 'none' }}>
            </div>
          </section>

          {/* Tournament Cards Section */}
          <section className="pt-0 pb-16" style={{ marginTop: '-60px', width: '100%' }}>
            <div className="container mx-auto px-4" style={{ width: '100%', maxWidth: 'none' }}>
              <div className="flex justify-center items-center" style={{ width: '100%' }}>
                {/* TopDog Tournament */}
                <div 
                  className="rounded-2xl shadow-lg relative border border-gray-600"
                  style={{ 
                    width: '472.5px', 
                    height: '525px',
                    background: '#111827',
                    padding: '30.2px',
                    paddingBottom: '91.5px',
                  }}
                >
                  {/* Inner content container */}
                  <div 
                    className="w-full h-full rounded-lg flex flex-col text-center items-center border-2" 
                    style={{ 
                      background: '#1f2937',
                      borderColor: '#59c5bf'
                    }}
                  >
                    <div 
                      className="w-full h-full relative" 
                      style={{ minHeight: 'calc(100% + 1px)' }}
                    >
                      <h2 
                        className="font-bold absolute left-1/2 transform -translate-x-1/2" 
                        style={{ 
                          fontFamily: 'Anton SC, sans-serif', 
                          fontSize: '48px', 
                          color: '#ffffff',
                          top: '20px'
                        }}
                      >
                        the TopDog International
                      </h2>
                      <button
                        onClick={() => handleJoinTournament('topdog')}
                        className="px-8 py-4 rounded-lg font-bold text-lg transition-colors cursor-pointer absolute left-1/2 transform -translate-x-1/2 hover:opacity-90"
                        style={{
                          color: '#111827',
                          background: '#59c5bf',
                          top: '300px',
                          whiteSpace: 'nowrap',
                          border: '2px solid #59c5bf'
                        }}
                      >
                        Join Tournament
                      </button>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div 
                      className="w-full flex justify-between items-center font-bold" 
                      style={{ 
                        height: '91.5px',
                        color: '#ffffff',
                        paddingTop: '18px',
                        paddingLeft: '30px',
                        paddingRight: '30px'
                      }}
                    >
                      <div 
                        className="flex-1 text-center flex flex-col items-center justify-center" 
                        style={{ fontSize: '1.5rem' }}
                      >
                        $25<span className='font-normal text-sm block'>Entry</span>
                      </div>
                      <div 
                        className="flex-1 text-center flex flex-col items-center justify-center" 
                        style={{ fontSize: '1.5rem' }}
                      >
                        571,480<span className='font-normal text-sm block'>Entries</span>
                      </div>
                      <div 
                        className="flex-1 text-center flex flex-col items-center justify-center" 
                        style={{ fontSize: '1.5rem' }}
                      >
                        $2M<span className='font-normal text-sm block'>1st Place</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Copyright Section */}
          <section className="py-6" style={{ width: '100%' }}>
            <div className="container mx-auto text-center" style={{ width: '100%', maxWidth: 'none' }}>

            </div>
          </section>
        </div>
      </main>

      <JoinTournamentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tournamentType={selectedTournament}
        userId="NEWUSERNAME"
      />
    </>
  );
} 