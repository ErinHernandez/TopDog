import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DraftNavbar() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  return (
    <header 
      className="w-full z-50" 
      style={{ 
                  backgroundImage: 'url(/texture_reduced_highlights.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundColor: '#5f7a7a', // Fallback color
        position: 'relative',
        minWidth: '100vw',
        overflow: 'visible'
      }}
    >
      <nav className="shadow-lg text-black" style={{ 
                  backgroundImage: 'url(/texture_reduced_highlights.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        width: '100vw', 
        marginLeft: '0', 
        position: 'relative', 
        minWidth: '100vw', 
        overflow: 'visible' 
      }}>
        <div className="container mx-auto" style={{ 
          overflow: 'visible', 
          maxWidth: '100vw', 
          paddingLeft: '20px', 
          paddingRight: '20px', 
          position: 'relative', 
          minWidth: '100%', 
          width: '100%' 
        }}>
          <div className="flex justify-between items-center h-16 min-w-0" style={{ 
            position: 'relative', 
            minWidth: '100%', 
            overflow: 'visible', 
            width: '100%' 
          }}>
            
            {/* Logo and Text */}
            <div className="flex items-center flex-shrink-0" style={{ 
              marginLeft: '16px', 
              paddingLeft: '16px', 
              position: 'relative', 
              minWidth: 'fit-content', 
              overflow: 'visible' 
            }}>
              <Link 
                href="/" 
                className="flex-shrink-0 flex items-center" 
                style={{ 
                  paddingLeft: '0px', 
                  paddingRight: '0px', 
                  paddingTop: '7px', 
                  paddingBottom: '7px',
                  minWidth: 'fit-content',
                  marginLeft: '0px',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="TopDog.dog Logo" 
                  className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto" 
                  style={{
                    minHeight: '24px',
                    maxHeight: '48px',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                />
                <span 
                  className="ml-2 sm:ml-4 md:ml-6 lg:ml-8 text-base font-medium hidden sm:inline" 
                  style={{ 
                    fontSize: 'clamp(0.9rem, 2vw, 1.5rem)', 
                    WebkitTextStroke: '0.12px #18181b', 
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  TopDog.dog
                </span>
              </Link>
            </div>
            
            {/* Arrow Dropdown */}
            <div className="flex items-center flex-shrink-0" style={{
              minWidth: 'fit-content',
              position: 'relative',
              overflow: 'visible'
            }}>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="hover:text-accent px-3 py-2 rounded-md text-base font-medium flex items-center cursor-pointer"
                  style={{ 
                    fontSize: '1.25rem', 
                    WebkitTextStroke: '0.12px #18181b', 
                    color: '#ffffff', 
                    pointerEvents: 'auto',
                    backgroundColor: 'transparent',
                    position: 'relative',
                    overflow: 'visible',
                    minWidth: 'fit-content'
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl py-1 z-50" style={{ 
                    zIndex: 9999, 
                    position: 'absolute', 
                    overflow: 'visible', 
                    top: '100%', 
                    right: '0', 
                    minWidth: '256px', 
                    maxWidth: '320px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151'
                  }}>
                    
                    {/* Main Profile Section */}
                    <div className="px-4 py-2 border-b border-gray-600" style={{ 
                      position: 'relative', 
                      overflow: 'visible', 
                      borderColor: 'rgba(255, 255, 255, 0.1)' 
                    }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ 
                        position: 'relative', 
                        overflow: 'visible',
                        background: 'url(/wr_blue.png) no-repeat center center',
                        backgroundSize: 'cover',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Profile & Account</h4>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Profile
                      </Link>
                      <Link href="/my-teams" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        My Teams
                      </Link>
                      <Link href="/deposit" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Deposit
                      </Link>
                      <Link href="/deposit-history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Transaction History
                      </Link>
                    </div>

                    {/* Analytics Section */}
                    <div className="px-4 py-2 border-b border-gray-600" style={{ 
                      position: 'relative', 
                      overflow: 'visible', 
                      borderColor: 'rgba(255, 255, 255, 0.1)' 
                    }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ 
                        position: 'relative', 
                        overflow: 'visible',
                        background: 'url(/wr_blue.png) no-repeat center center',
                        backgroundSize: 'cover',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Analytics</h4>
                      <Link href="/statistics" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Statistics
                      </Link>
                      <Link href="/rankings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Rankings
                      </Link>
                      <Link href="/exposure" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Exposure Report
                      </Link>
                    </div>

                    {/* Research Section */}
                    <div className="px-4 py-2 border-b border-gray-600" style={{ 
                      position: 'relative', 
                      overflow: 'visible', 
                      borderColor: 'rgba(255, 255, 255, 0.1)' 
                    }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ 
                        position: 'relative', 
                        overflow: 'visible',
                        background: 'url(/wr_blue.png) no-repeat center center',
                        backgroundSize: 'cover',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Research</h4>
                      <Link href="/unregulated-analysis" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Unregulated Analysis
                      </Link>
                      <Link href="/location-research" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Location Research
                      </Link>
                      <Link href="/ireland" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Ireland
                      </Link>
                    </div>

                    {/* About Section */}
                    <div className="px-4 py-2" style={{ 
                      position: 'relative', 
                      overflow: 'visible' 
                    }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ 
                        position: 'relative', 
                        overflow: 'visible',
                        background: 'url(/wr_blue.png) no-repeat center center',
                        backgroundSize: 'cover',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>About</h4>
                      <Link href="/our-mission" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] hover:text-[#c7c7c7] transition-colors">
                        Our Mission
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </nav>
    </header>
  );
}
