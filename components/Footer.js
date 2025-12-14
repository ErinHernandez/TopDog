import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { useUser } from '../lib/userContext';
import AuthModal from './AuthModal';
import { useRouter } from 'next/router';

export default function Footer() {
  const [showPressModal, setShowPressModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (showPressModal) {
      const timer = setTimeout(() => {
        setShowPressModal(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [showPressModal]);

  const handleCustomerSupportClick = (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
    } else {
      // User is logged in, navigate to customer support page
      router.push('/customer-support');
    }
  };

  return (
    <footer className="bg-gray-900 text-white" style={{ padding: '20px 20px 20px 20px', background: '#111827', marginTop: '-20px' }}>
      <div className="container mx-auto" style={{ paddingTop: '20px' }}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start" style={{ width: '200px' }}>
            <img src="/logo.png" alt="TopDog.dog Logo" className="h-12 w-auto mb-4" style={{ filter: 'hue-rotate(200deg) saturate(1.5) brightness(1.2)', marginTop: '12px' }} />
            <h3 className="text-xl font-bold mb-1" style={{ color: '#59c5bf', marginBottom: '16px' }}>TopDog.dog</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors" style={{ color: 'white' }}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/@TopDog" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-red-500 transition-colors" 
                  style={{ color: 'white' }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/topdog" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-pink-500 transition-colors" 
                  style={{ color: 'white' }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" style={{ color: 'white' }}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>
          
          <div className="flex flex-col" style={{ width: '150px' }}>
            <h4 className="text-base font-semibold mb-4" style={{ color: '#59c5bf' }}>Product</h4>
            <ul className="space-y-2">
              <li><Link href="/leagues" className="text-sm text-gray-300 hover:text-white transition-colors">Leagues</Link></li>
              <li><Link href="/tournaments/topdog" className="text-sm text-gray-300 hover:text-white transition-colors">Draft</Link></li>
              <li><Link href="/profile" className="text-sm text-gray-300 hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>
          
          <div className="flex flex-col" style={{ width: '150px' }}>
            <h4 className="text-base font-semibold mb-4" style={{ color: '#59c5bf' }}>Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="https://www.amazon.com/Contact-Jodie-Foster/dp/B008PZZUF2/ref=sr_1_6?crid=24NXFM2YEOL2U&dib=eyJ2IjoiMSJ9.HgHOL92OLnRD1t_Yc83i5QnQ7EsdO2JJpHXsjEst-8DNKI0t-OPRPU4X5eGkxuuR74_P3QRdHIKzrVV9JjyOG1gfBTeri7UG_9qcq0p9cS1ETo0EonDnGc2GVmM3-tsin6iz3uQjafaavaeGcFSLOlGrifx5l5ZBJOuPOK6bGr2KNBZ42XLeG1AEyTIUwhZ3vwE5CjNvta9CLgS3SybRmWZHx3P_94zP5Rd_KAEzokA.MeULnwSWwjnj-WFAchAQnz08VF6Yw_HnDknznHFimoc&dib_tag=se&keywords=contact+movie&qid=1755843007&s=movies-tv&sprefix=contact%2Cmovies-tv%2C327&sr=1-6" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" onClick={handleCustomerSupportClick} className="text-sm text-gray-300 hover:text-white transition-colors">Customer Support</a></li>
            </ul>
          </div>
          
          <div className="flex flex-col" style={{ width: '150px' }}>
            <h4 className="text-base font-semibold mb-4" style={{ color: '#59c5bf' }}>Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
              <li><Link href="/rules" className="text-sm text-gray-300 hover:text-white transition-colors">Rules</Link></li>
            </ul>
          </div>
          
          <div className="flex flex-col" style={{ width: '150px' }}>
            <h4 className="text-base font-semibold mb-4" style={{ color: '#59c5bf' }}>Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Careers</a></li>
              <li className="relative">
                <button onClick={() => setShowPressModal(true)} className="text-sm text-gray-300 hover:text-white transition-colors">Press</button>
                {showPressModal && (
                  <div className="absolute top-0 -left-60 bg-gray-800 p-4 rounded-lg z-10" style={{ width: '280px' }}>
                    <div className="text-center">
                      <p className="text-white pb-0 pr-1">they hate us cuz they ain't us</p>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-2 pt-0.5">
          <p className="text-sm text-gray-400">© TopDog.dog 2024 All Rights Reserved</p>
        </div>
      </div>
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={() => setShowAuthModal(false)}
      />
    </footer>
  )
} 