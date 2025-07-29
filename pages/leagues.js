import React from 'react';
import Head from 'next/head'
import { useState } from 'react'

export default function Leagues() {
  const [leagues] = useState([
    {
      id: 1,
      name: "NFL TopDog Championship",
      entryFee: 150,
      prizePool: 15000,
      participants: 100,
      maxParticipants: 100,
      startDate: "2024-09-05",
      status: "Open"
    },
    {
      id: 2,
      name: "Weekend Warriors",
      entryFee: 25,
      prizePool: 2500,
      participants: 85,
      maxParticipants: 100,
      startDate: "2024-09-08",
      status: "Open"
    },
    {
      id: 3,
      name: "Pro League",
      entryFee: 500,
      prizePool: 50000,
      participants: 100,
      maxParticipants: 100,
      startDate: "2024-09-05",
      status: "Full"
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Leagues - TopDog.dog</title>
        <meta name="description" content="Join TopDog.dog leagues and compete for prizes" />
      </Head>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Leagues</h1>
          <p className="text-gray-600">Join a league and start your fantasy football journey</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{league.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  league.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {league.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Entry Fee:</span>
                  <span className="font-semibold">${league.entryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prize Pool:</span>
                  <span className="font-semibold text-green-600">${league.prizePool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-semibold">{league.participants}/{league.maxParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-semibold">{new Date(league.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                className={`w-full mt-4 py-2 px-4 rounded-md font-medium ${
                  league.status === 'Open' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={league.status === 'Full'}
              >
                {league.status === 'Open' ? 'Join League' : 'League Full'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700">
            Create New League
          </button>
        </div>
      </main>
    </div>
  )
} 