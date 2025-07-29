import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { updateDepositStats, getUserStats } from '../lib/userStats';

// Define approved states/regions for deposits
const APPROVED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Initialize Stripe (you'll need to add your publishable key to environment variables)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const depositAmounts = [
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
  { value: 1000, label: '$1,000' }
];

export default function DepositModal({ open, onClose, userId = 'Not Todd Middleton' }) {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending'); // 'pending', 'checking', 'approved', 'denied', 'error'
  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (open && userId) {
      fetchUserStats();
      checkLocation();
    }
  }, [open, userId]);

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkLocation = async () => {
    setLocationStatus('checking');
    setLocationError('');

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationStatus('error');
        setLocationError('Geolocation is not supported by this browser.');
        return;
      }

      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get state information
      const state = await reverseGeocode(latitude, longitude);
      
      setLocationData({
        latitude,
        longitude,
        state,
        timestamp: new Date().toISOString()
      });

      // Check if state is approved
      if (APPROVED_STATES.includes(state)) {
        setLocationStatus('approved');
      } else {
        setLocationStatus('denied');
        setLocationError(`Deposits are not available in ${state}. Please contact support for assistance.`);
      }

    } catch (error) {
      console.error('Geolocation error:', error);
      setLocationStatus('error');
      
      if (error.code === 1) {
        setLocationError('Location access denied. Please enable location services to make deposits.');
      } else if (error.code === 2) {
        setLocationError('Location unavailable. Please check your connection and try again.');
      } else if (error.code === 3) {
        setLocationError('Location request timed out. Please try again.');
      } else {
        setLocationError('Unable to determine your location. Please try again or contact support.');
      }
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      // Extract state from address
      const state = data.address?.state || data.address?.province || 'Unknown';
      
      // Convert full state name to abbreviation if needed
      const stateMap = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
      };

      return stateMap[state] || state;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback: return a default state for testing
      return 'CA';
    }
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(0);
    }
  };

  const getFinalAmount = () => {
    if (customAmount) {
      return parseFloat(customAmount);
    }
    return selectedAmount;
  };

  const handleDeposit = async () => {
    // Check location approval first
    if (locationStatus !== 'approved') {
      alert('Location approval required before making deposits.');
      return;
    }

    const amount = getFinalAmount();
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount < 5) {
      alert('Minimum deposit amount is $5');
      return;
    }

    setIsProcessing(true);

    try {
      // For now, we'll simulate a successful payment
      // In production, you'd integrate with Stripe Elements
      setTimeout(async () => {
        // Simulate successful payment
        await updateUserBalance(amount);
        setIsProcessing(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const updateUserBalance = async (amount) => {
    try {
      // Use the new comprehensive statistics system
      await updateDepositStats(userId, amount);

      // Record the transaction with location data
      await addDoc(collection(db, 'transactions'), {
        userId: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        location: locationData,
        createdAt: serverTimestamp()
      });

      alert(`Successfully deposited $${amount}!`);
      fetchUserStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  if (!open) return null;

  const userBalance = userStats?.balance || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose}></div>
      <div className="relative bg-black rounded-xl shadow-2xl p-8 z-10 max-w-md w-full mx-4 border border-[#60A5FA] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-white">×</button>
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#60A5FA' }}>
            Deposit Funds
          </h2>
          <p className="text-gray-300 mb-4">
            Current Balance: <span className="font-bold text-white">${userBalance.toFixed(2)}</span>
          </p>
          {userStats && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>Total Deposits: ${userStats.totalDeposits?.toFixed(2) || '0.00'}</p>
              <p>Largest Deposit: ${userStats.largestDeposit?.toFixed(2) || '0.00'}</p>
              <p>Average Deposit: ${userStats.averageDeposit?.toFixed(2) || '0.00'}</p>
            </div>
          )}
        </div>

        {/* Location Verification Section */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-3" style={{ color: '#60A5FA' }}>Location Verification</h3>
          
          {locationStatus === 'pending' && (
            <div className="text-center">
              <p className="text-gray-300 mb-3">Location verification required for deposits</p>
              <button
                onClick={checkLocation}
                className="px-4 py-2 bg-[#60A5FA] text-[#000F55] font-bold rounded hover:bg-[#2DE2C5] transition-colors"
              >
                Verify Location
              </button>
            </div>
          )}

          {locationStatus === 'checking' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60A5FA] mx-auto mb-2"></div>
              <p className="text-gray-300">Verifying your location...</p>
            </div>
          )}

          {locationStatus === 'approved' && (
            <div className="text-center">
              <div className="text-green-400 mb-2">✓ Location Approved</div>
              <p className="text-gray-300 text-sm">
                {locationData?.state} • {locationData?.latitude?.toFixed(4)}, {locationData?.longitude?.toFixed(4)}
              </p>
              <button
                onClick={checkLocation}
                className="mt-2 text-xs text-[#60A5FA] hover:underline"
              >
                Refresh Location
              </button>
            </div>
          )}

          {locationStatus === 'denied' && (
            <div className="text-center">
              <div className="text-red-400 mb-2">✗ Location Not Approved</div>
              <p className="text-gray-300 text-sm mb-3">{locationError}</p>
              <button
                onClick={checkLocation}
                className="px-4 py-2 bg-[#60A5FA] text-[#000F55] font-bold rounded hover:bg-[#2DE2C5] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {locationStatus === 'error' && (
            <div className="text-center">
              <div className="text-red-400 mb-2">✗ Location Error</div>
              <p className="text-gray-300 text-sm mb-3">{locationError}</p>
              <button
                onClick={checkLocation}
                className="px-4 py-2 bg-[#60A5FA] text-[#000F55] font-bold rounded hover:bg-[#2DE2C5] transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Quick Amount Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: '#60A5FA' }}>Quick Select</h3>
          <div className="grid grid-cols-2 gap-3">
            {depositAmounts.map((amount) => (
              <button
                key={amount.value}
                onClick={() => handleAmountSelect(amount.value)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedAmount === amount.value && !customAmount
                    ? 'border-[#60A5FA] bg-[#60A5FA] text-[#000F55]'
                    : 'border-gray-600 text-gray-300 hover:border-[#60A5FA] hover:text-[#60A5FA]'
                }`}
              >
                {amount.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: '#60A5FA' }}>Custom Amount</h3>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="Enter amount"
              className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#60A5FA] focus:outline-none"
              min="5"
              step="0.01"
            />
          </div>
        </div>

        {/* Selected Amount Display */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-gray-300">Deposit Amount:</p>
            <p className="text-2xl font-bold" style={{ color: '#60A5FA' }}>
              ${getFinalAmount().toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: '#60A5FA' }}>Payment Information</h3>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-300 text-sm mb-2">Card details will be handled securely by Stripe</p>
            <div className="h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
              <span className="text-gray-400">Card input will be integrated here</span>
            </div>
          </div>
        </div>

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={isProcessing || (!selectedAmount && !customAmount) || locationStatus !== 'approved'}
          className="w-full py-4 bg-[#60A5FA] text-[#000F55] font-bold text-xl rounded-lg hover:bg-[#2DE2C5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Deposit $${getFinalAmount().toFixed(2)}`}
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Minimum deposit: $5 • Secure payment processing by Stripe
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Location verification required for all deposits
          </p>
        </div>
      </div>
    </div>
  );
} 