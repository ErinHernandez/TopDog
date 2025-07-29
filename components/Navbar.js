import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/router';
import { getUserStats } from '../lib/userStats';
import DepositModal from './DepositModal';
import { canAccessDevFeatures } from '../lib/devAuth';

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [userStats, setUserStats] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [hasDevAccess, setHasDevAccess] = useState(false)
  const dropdownRef = useRef(null)
  const userId = 'Not Todd Middleton' // Replace with real user ID in production

  useEffect(() => {
    fetchUserStats()
    checkDevAccess()
  }, [])

  const checkDevAccess = () => {
    const accessToken = sessionStorage.getItem('devAccessToken');
    if (canAccessDevFeatures(userId, accessToken)) {
      setHasDevAccess(true);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats(userId)
      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  // Button label logic
  const userBalance = userStats?.balance || 0
  const depositButtonLabel = userBalance > 0
    ? `$${userBalance.toFixed(2)}`
    : 'Deposit'

  return (
    <>
      <header className="w-full z-50" style={{ background: '#59c5bf' }}>
        <nav className="shadow-lg text-black" style={{ background: '#59c5bf' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center -ml-8">
                <img src="/logo.png" alt="TopDog.dog Logo" className="h-12 w-auto" />
                  <span className="ml-6 text-base font-medium" style={{ fontSize: '1.1rem', WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>TopDog.dog</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 flex-1 justify-end">
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="hover:text-accent px-3 py-2 rounded-md text-base font-medium flex items-center"
                    style={{ fontSize: '1.1rem', WebkitTextStroke: '0.12px #18181b', color: '#111827' }}
                  >
                    Profile
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </Link>


                      <Link href="/statistics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Statistics
              </Link>
                      <Link href="/rankings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Rankings
              </Link>
                      <Link href="/deposit-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Transaction History
              </Link>
                      {hasDevAccess && (
                        <Link href="/tournaments/dev" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200">
                          Development Tournaments
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Deposit Button */}
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-gray-900 px-4 py-2 rounded-lg font-bold transition-colors ml-8 -mr-8"
                  style={{ color: '#e5e7eb' }}
                  onMouseEnter={(e) => {
                    e.target.classList.add('blue-marbled-texture');
                    e.target.style.color = '#e5e7eb';
                    e.target.style.border = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.target.classList.remove('blue-marbled-texture');
                    e.target.style.color = '#e5e7eb';
                    e.target.style.border = 'none';
                  }}
                >
                  {depositButtonLabel}
                </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        </nav>
      </header>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/profile" className="hover:text-accent block px-3 py-2 rounded-md text-lg font-medium" style={{ WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>
                Profile
              </Link>


            <Link href="/statistics" className="hover:text-accent block px-3 py-2 rounded-md text-lg font-medium" style={{ WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>
                Statistics
              </Link>
            <Link href="/rankings" className="hover:text-accent block px-3 py-2 rounded-md text-lg font-medium" style={{ WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>
                Rankings
              </Link>
            <Link href="/deposit-history" className="hover:text-accent block px-3 py-2 rounded-md text-lg font-medium" style={{ WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>
                Transaction History
              </Link>
            {hasDevAccess && (
              <Link href="/tournaments/dev" className="hover:text-accent block px-3 py-2 rounded-md text-lg font-medium" style={{ WebkitTextStroke: '0.12px #18181b', color: '#111827' }}>
                Development Tournaments
              </Link>
            )}
              <button
                onClick={() => {
                  setShowDepositModal(true);
                  setIsOpen(false);
                }}
                className="w-full text-left bg-gray-900 px-3 py-2 rounded-md text-lg font-medium transition-colors"
                style={{ color: '#e5e7eb' }}
                onMouseEnter={(e) => {
                  e.target.classList.add('blue-marbled-texture');
                  e.target.style.color = '#e5e7eb';
                  e.target.style.border = 'none';
                }}
                onMouseLeave={(e) => {
                  e.target.classList.remove('blue-marbled-texture');
                  e.target.style.color = '#e5e7eb';
                  e.target.style.border = 'none';
                }}
              >
                {depositButtonLabel}
              </button>
            </div>
          </div>
        )}



      <DepositModal 
        open={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          fetchUserStats(); // Refresh stats after deposit
        }}
        userId={userId}
      />
    </>
  )
} 