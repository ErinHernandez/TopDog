import React from 'react'
import Head from 'next/head'

export default function TopDogTournament() {
  return (
    <>
      <Head>
        <title>TopDog Tournament - TopDog.dog</title>
        <meta name="description" content="Join the TopDog tournament with massive payouts" />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                TopDog Tournament
              </h1>
              <p className="text-xl text-gray-300">
                The premier fantasy football tournament with massive payouts
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1b1b1b' }}>Tournament Details</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>Entry Fee</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>$150</p>
                  
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>Format</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>Best Ball</p>
                  
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>League Size</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>12 Teams</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>Draft Date</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>August 15, 2024</p>
                  
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>Season Length</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>17 Weeks</p>
                  
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#1b1b1b' }}>Payout Structure</h3>
                  <p className="text-lg mb-6" style={{ color: '#1b1b1b' }}>1st: $8M, 2nd: $4M, 3rd: $2M, 4th: $1M</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button 
                  className="px-8 py-4 rounded-lg font-bold text-xl transition-colors"
                  style={{ backgroundColor: '#59c5bf', color: '#111827' }}
                >
                  Join Tournament
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 