import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useUser } from '../lib/userContext';
import { PAYMENT_METHODS_BY_COUNTRY, PAYMENT_METHOD_DETAILS } from '../lib/paymentMethodConfig';
import { getAvailablePaymentMethods, calculateFees } from '../lib/paymentProcessor';
import { createDeposit } from '../lib/bankingSystem';
import { canMakeDeposits } from '../lib/complianceSystem';


export default function DepositPage() {
  const { user, userBalance, updateUserData } = useUser();
  const [userLocation, setUserLocation] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [stripeCardData, setStripeCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: ''
  });
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [paypalConnecting, setPaypalConnecting] = useState(false);
  const [applePaySetup, setApplePaySetup] = useState(false);
  const [applePaySettingUp, setApplePaySettingUp] = useState(false);
  const [googlePaySetup, setGooglePaySetup] = useState(false);
  const [googlePaySettingUp, setGooglePaySettingUp] = useState(false);
  
  const depositAmounts = [
    { value: 25, label: '$25' },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 250, label: '$250' },
    { value: 500, label: '$500' },
    { value: 1000, label: '$1,000' }
  ];

  // Show all payment methods for informational purposes
  const allMethods = Object.keys(PAYMENT_METHOD_DETAILS || {});

  const getMethodDetails = (methodKey) => {
    const details = PAYMENT_METHOD_DETAILS ? PAYMENT_METHOD_DETAILS[methodKey] : undefined;
    if (!details) {
      return {
        name: (methodKey || 'unknown').replace('_', ' ').toUpperCase(),
        type: 'unknown',
        pros: [],
        cons: [],
        fees: 'Unknown',
        setup_difficulty: 'Unknown'
      };
    }
    return {
      ...details,
      type: details.type || 'unknown'
    };
  };

  const getMethodIcon = (method) => {
    const icons = {
      stripe: (
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 60 24" className="w-6 h-4">
            <path d="M59.64 14.28h-8.06v-1.83h8.06v1.83zm-8.06 5.99h8.06v-1.83h-8.06v1.83zm0-11.8v1.83h8.06V8.47h-8.06zm-2.39-5.62H45.3c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05c0-.66-.54-1.2-1.2-1.2zM42.91 3.05c0-.66-.54-1.2-1.2-1.2H37.9c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05zm-8.06 0c0-.66-.54-1.2-1.2-1.2H29.84c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05zm-8.06 0c0-.66-.54-1.2-1.2-1.2H21.78c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05zm-8.06 0c0-.66-.54-1.2-1.2-1.2H13.72c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05zm-8.06 0c0-.66-.54-1.2-1.2-1.2H5.66c-.66 0-1.2.54-1.2 1.2v13.9c0 .66.54 1.2 1.2 1.2h3.79c.66 0 1.2-.54 1.2-1.2V3.05z" fill="#6772E5"/>
          </svg>
        </div>
      ),
      paypal: (
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 124 33" className="w-6 h-4">
            <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.69.69 0 0 0 .683-.581l.746-4.73a.95.95 0 0 1 .939-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .564-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.541.754l1.818 9.225a.57.57 0 0 0 .541.386h1.818a.69.69 0 0 0 .683-.581l.073-.581a.69.69 0 0 1 .683-.581h.374c2.844 0 4.577-1.415 5.182-4.5.295-1.848-.132-3.225-1.222-4.075-.972-.823-2.348-1.172-4.209-1.172zm2.936 5.925c-.132.803-.704 1.172-1.454 1.172h-.374l.374-2.625a.69.69 0 0 1 .683-.581h.374c.374 0 .704 0 .704.704.132.374.132.704-.132 1.33zM84.096 13.075h-3.275a.57.57 0 0 0-.541.754l1.818 9.225a.57.57 0 0 0 .541.386h1.818a.69.69 0 0 0 .683-.581l.073-.581a.69.69 0 0 1 .683-.581h.374c2.844 0 4.577-1.415 5.182-4.5.295-1.848-.132-3.225-1.222-4.075-.972-.823-2.348-1.172-4.209-1.172zm2.936 5.925c-.132.803-.704 1.172-1.454 1.172h-.374l.374-2.625a.69.69 0 0 1 .683-.581h.374c.374 0 .704 0 .704.704.132.374.132.704-.132 1.33zM101.436 13.075h-3.275a.57.57 0 0 0-.541.754l1.818 9.225a.57.57 0 0 0 .541.386h1.818a.69.69 0 0 0 .683-.581l.073-.581a.69.69 0 0 1 .683-.581h.374c2.844 0 4.577-1.415 5.182-4.5.295-1.848-.132-3.225-1.222-4.075-.972-.823-2.348-1.172-4.209-1.172zm2.936 5.925c-.132.803-.704 1.172-1.454 1.172h-.374l.374-2.625a.69.69 0 0 1 .683-.581h.374c.374 0 .704 0 .704.704.132.374.132.704-.132 1.33zM118.776 13.075h-3.275a.57.57 0 0 0-.541.754l1.818 9.225a.57.57 0 0 0 .541.386h1.818a.69.69 0 0 0 .683-.581l.073-.581a.69.69 0 0 1 .683-.581h.374c2.844 0 4.577-1.415 5.182-4.5.295-1.848-.132-3.225-1.222-4.075-.972-.823-2.348-1.172-4.209-1.172zm2.936 5.925c-.132.803-.704 1.172-1.454 1.172h-.374l.374-2.625a.69.69 0 0 1 .683-.581h.374c.374 0 .704 0 .704.704.132.374.132.704-.132 1.33z" fill="#003087"/>
            <path d="M27.961 12.693l-1.89 11.963h-2.625l1.89-11.963h2.625zm-8.839 0l-1.89 11.963h-2.625l1.89-11.963h2.625zm-8.839 0l-1.89 11.963h-2.625l1.89-11.963h2.625zm-8.839 0l-1.89 11.963h-2.625l1.89-11.963h2.625zm-8.839 0l-1.89 11.963h-2.625l1.89-11.963h2.625z" fill="#009CDE"/>
          </svg>
        </div>
      ),
      apple_pay: (
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-6 h-6">
            <path d="M32.5 20.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5z" fill="white"/>
            <path d="M20 32.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5z" fill="white"/>
            <path d="M7.5 20.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5z" fill="white"/>
            <path d="M20 7.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5z" fill="white"/>
          </svg>
        </div>
      ),
      google_pay: (
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-6 h-6">
            <path d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10z" fill="#4285F4"/>
            <path d="M20 12c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" fill="#34A853"/>
            <path d="M20 16c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4z" fill="#FBBC05"/>
          </svg>
        </div>
      ),
      ideal: (
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">
          i
        </div>
      ),
      swish: (
        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">
          S
        </div>
      ),
      vipps: (
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
          V
        </div>
      ),
      blik: (
        <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white font-bold text-xs">
          B
        </div>
      ),
      eps: (
        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">
          E
        </div>
      ),
      sofort: (
        <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center text-white font-bold text-xs">
          S
        </div>
      ),
      giropay: (
        <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center text-white font-bold text-xs">
          G
        </div>
      ),
      klarna: (
        <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center text-white font-bold text-xs">
          K
        </div>
      ),
      bank_transfer: (
        <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-white font-bold text-xs">
          B
        </div>
      ),
      venmo: (
        <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
          V
        </div>
      ),
      cash_app: (
        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs">
          C
        </div>
      ),
      mercado_pago: (
        <div className="w-8 h-8 bg-blue-800 rounded flex items-center justify-center text-white font-bold text-xs">
          M
        </div>
      ),
      oxxo: (
        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">
          O
        </div>
      ),
      spei: (
        <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center text-white font-bold text-xs">
          S
        </div>
      ),
      poli: (
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
          P
        </div>
      ),
      afterpay: (
        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
          A
        </div>
      )
    };
    
    return icons[method] || (
      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-white font-bold text-xs">
        {method.charAt(0).toUpperCase()}
      </div>
    );
  };

  const getFinalAmount = () => {
    if (customAmount && parseFloat(customAmount) > 0) {
      return parseFloat(customAmount);
    }
    return selectedAmount;
  };

  const calculateTotalFees = () => {
    // Fees are absorbed by the platform, not shown to users
    return 0;
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleWalletConnection = async () => {
    setWalletConnecting(true);
    setError('');
    
    try {
      // Simulate wallet connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock wallet address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      setWalletAddress(mockAddress);
      setWalletConnected(true);
      setSuccess('Wallet connected successfully!');
      
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleStripeCardInput = (field, value) => {
    setStripeCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayPalConnection = async () => {
    setPaypalConnecting(true);
    setError('');
    
    try {
      // Simulate PayPal connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPaypalConnected(true);
      setSuccess('PayPal account connected successfully!');
      
    } catch (error) {
      setError('Failed to connect PayPal. Please try again.');
    } finally {
      setPaypalConnecting(false);
    }
  };

  const handleApplePaySetup = async () => {
    setApplePaySettingUp(true);
    setError('');
    
    try {
      // Simulate Apple Pay setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      setApplePaySetup(true);
      setSuccess('Apple Pay configured successfully!');
      
    } catch (error) {
      setError('Failed to setup Apple Pay. Please try again.');
    } finally {
      setApplePaySettingUp(false);
    }
  };

  const handleGooglePaySetup = async () => {
    setGooglePaySettingUp(true);
    setError('');
    
    try {
      // Simulate Google Pay setup
      await new Promise(resolve => setTimeout(resolve, 1800));
      setGooglePaySetup(true);
      setSuccess('Google Pay configured successfully!');
      
    } catch (error) {
      setError('Failed to setup Google Pay. Please try again.');
    } finally {
      setGooglePaySettingUp(false);
    }
  };

  const getUserLocation = async () => {
    if (locationRequested) return; // Don't request location multiple times
    
    setLocationRequested(true);
    setLoading(true);
    setError('');

    // Development bypass - if running on localhost, skip location verification
    if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
      console.log('🏠 Development mode: Bypassing location verification');
      setUserLocation({
        latitude: 40.7128, // NYC coordinates as default
        longitude: -74.0060,
        country: 'United States',
        state: 'NY'
      });
      const methods = getAvailablePaymentMethods('United States', 'NY');
      setAvailableMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
      setLoading(false);
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });

        const { latitude, longitude } = position.coords;
        const location = await reverseGeocode(latitude, longitude);
        
        setUserLocation({
          latitude,
          longitude,
          country: location.country,
          state: location.state
        });

        const methods = getAvailablePaymentMethods(location.country, location.state);
        setAvailableMethods(methods);
        if (methods.length > 0) {
          setSelectedMethod(methods[0]);
        }

        // Check compliance after getting location
        await checkCompliance();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setUserLocation({ country: 'United States', state: null });
      const methods = getAvailablePaymentMethods('United States');
      setAvailableMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
      setError('Unable to determine your location. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      return {
        country: data.countryName,
        state: data.principalSubdivision
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { country: 'United States', state: null };
    }
  };

  const checkCompliance = async () => {
    try {
      const compliance = await canMakeDeposits(user?.uid || 'NEWUSERNAME');
      setComplianceStatus(compliance);
    } catch (error) {
      console.error('Error checking compliance:', error);
    }
  };

  const handleDeposit = async () => {
    if (!user) {
      setError('Please log in to make a deposit');
      return;
    }

    // Request location only when user tries to deposit
    if (!userLocation) {
      await getUserLocation();
      return; // The function will be called again after location is obtained
    }

    if (complianceStatus !== 'approved') {
      setError('Location approval required before making deposits');
      return;
    }

    const amount = getFinalAmount();
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 5) {
      setError('Minimum deposit amount is $5');
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const deposit = await createDeposit(
        user.uid,
        amount,
        selectedMethod,
        userLocation.country,
        userLocation.state
      );

      setSuccess(`Successfully deposited $${amount}! Your funds will be available shortly.`);
      updateUserData(); // Refresh user data
      
      // Reset form
      setSelectedAmount(50);
      setCustomAmount('');
      setSelectedMethod(availableMethods[0] || '');
      
    } catch (error) {
      console.error('Deposit error:', error);
      setError(`Deposit failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const balance = userBalance?.balance || 0;
  const totalAmount = getFinalAmount(); // No fees shown to users

  return (
    <>
      <Head>
        <title>Deposit Funds - TopDog.dog</title>
        <meta name="description" content="Add funds to your TopDog.dog account using your preferred payment method" />
      </Head>

      <main className="overflow-x-auto">
        {/* Subheader Navigation */}
        <section className="border-b border-gray-700 bg-white">
          <div className="container mx-auto px-4" style={{ minWidth: '1400px' }}>
                          <div className="flex justify-start space-x-8 items-center" style={{ marginTop: '0px', marginBottom: '0px', height: '54px' }}>
              <span className="font-medium border-b-2 border-yellow-400 pb-1 text-base" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Deposit Funds
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
          <div className="container mx-auto px-4" style={{ minWidth: '1400px' }}>
            <div className="max-w-7xl mx-auto" style={{ minWidth: '1400px' }}>
              <div className="grid grid-cols-2 gap-8" style={{ minWidth: '1400px' }}>
                {/* Left Column - Payment Methods */}
                <div className={selectedMethod ? 'lg:col-span-1' : 'lg:col-span-2'}>
                  <h2 className="text-2xl font-semibold mb-6 text-white">Available Payment Methods</h2>
                  
                  {/* Amount Selection - Moved to top for better UX */}
                  <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <label className="block text-white font-medium mb-4">Select Amount (USD)</label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {depositAmounts.map((amount) => (
                        <button
                          key={amount.value}
                          onClick={() => handleAmountSelect(amount.value)}
                          className={`p-3 rounded border transition-colors ${
                            selectedAmount === amount.value && !customAmount
                              ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                              : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                          }`}
                        >
                          {amount.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                      min="5"
                      max="10000"
                    />
                    {getFinalAmount() > 0 && (
                      <div className="mt-4 p-3 bg-[#59c5bf]/10 border border-[#59c5bf]/30 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Total Amount:</span>
                          <span className="text-[#59c5bf] font-semibold">${getFinalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {loading && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                        <span className="text-gray-300">Detecting your location...</span>
                      </div>
                    </div>
                  )}

                  {/* Show all payment methods for informational purposes */}
                  <div className="space-y-3">
                    {allMethods.map(methodKey => {
                      const method = getMethodDetails(methodKey);
                      const isSelected = selectedMethod === methodKey;
                      const isAvailable = userLocation ? availableMethods.includes(methodKey) : true;
                      
                      return (
                        <div
                          key={methodKey}
                          className={`bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                            isSelected 
                              ? 'border-[#59c5bf] bg-[#59c5bf]/10 shadow-lg' 
                              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                          } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => isAvailable && handleMethodSelect(methodKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {getMethodIcon(methodKey)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-white truncate">{method.name}</h3>
                                <p className="text-xs text-gray-400 capitalize">{(method.type || 'unknown').replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {isSelected && (
                                <div className="text-[#59c5bf]">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between text-xs">
                          </div>

                          {!isAvailable && userLocation && (
                            <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-400">
                              Not available in your location ({userLocation.country})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column - Deposit Form */}
                {selectedMethod && (
                  <div className="lg:col-span-1">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Deposit Details</h2>
                    
                    {selectedMethod === 'stripe' ? (
                      // Stripe-specific payment interface
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs mr-3">
                              S
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Stripe Checkout</h3>
                              <p className="text-sm text-gray-400">Secure card payments</p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-blue-400 mr-2">🔒</span>
                              <span className="text-blue-300 font-medium">PCI Compliant</span>
                            </div>
                            <p className="text-xs text-blue-300">Bank-level security, fraud protection</p>
                          </div>
                        </div>

                        {/* Amount Selection */}
                        <div className="mb-6">
                          <label className="block text-white font-medium mb-3">Select Amount</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {depositAmounts.map((amount) => (
                              <button
                                key={amount.value}
                                onClick={() => handleAmountSelect(amount.value)}
                                className={`p-3 rounded border transition-colors ${
                                  selectedAmount === amount.value && !customAmount
                                    ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                                    : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                                }`}
                              >
                                {amount.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                            min="5"
                            max="10000"
                          />
                        </div>

                        {/* Stripe Card Form */}
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                          <h4 className="text-white font-medium mb-3">Card Information</h4>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Card number"
                              value={stripeCardData.cardNumber}
                              onChange={(e) => handleStripeCardInput('cardNumber', e.target.value)}
                              className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={stripeCardData.expiryDate}
                                onChange={(e) => handleStripeCardInput('expiryDate', e.target.value)}
                                className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                              />
                              <input
                                type="text"
                                placeholder="CVC"
                                value={stripeCardData.cvc}
                                onChange={(e) => handleStripeCardInput('cvc', e.target.value)}
                                className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-2">❌</span>
                              <span className="text-red-300">{error}</span>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-green-400 mr-2">✅</span>
                              <span className="text-green-300">{success}</span>
                            </div>
                          </div>
                        )}

                        {/* Deposit Button */}
                        <button
                          onClick={handleDeposit}
                          disabled={isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !stripeCardData.cardNumber || !stripeCardData.expiryDate || !stripeCardData.cvc}
                          className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                            isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !stripeCardData.cardNumber || !stripeCardData.expiryDate || !stripeCardData.cvc
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : !userLocation ? (
                            'Enable Location to Continue'
                          ) : !stripeCardData.cardNumber || !stripeCardData.expiryDate || !stripeCardData.cvc ? (
                            'Complete Card Information'
                          ) : (
                            `Pay $${getFinalAmount().toFixed(2)} with Stripe`
                          )}
                        </button>

                        {/* Security Notice */}
                        <div className="mt-4 text-xs text-gray-400 text-center">
                          🔒 Secured by Stripe - PCI DSS Level 1 Compliant
                        </div>
                      </div>
                    ) : selectedMethod === 'paypal' ? (
                      // PayPal-specific payment interface
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs mr-3">
                              P
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">PayPal Checkout</h3>
                              <p className="text-sm text-gray-400">Fast & secure payments</p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-blue-400 mr-2">🛡️</span>
                              <span className="text-blue-300 font-medium">Buyer Protection</span>
                            </div>
                            <p className="text-xs text-blue-300">180-day money-back guarantee</p>
                          </div>
                        </div>

                        {/* Amount Selection */}
                        <div className="mb-6">
                          <label className="block text-white font-medium mb-3">Select Amount</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {depositAmounts.map((amount) => (
                              <button
                                key={amount.value}
                                onClick={() => handleAmountSelect(amount.value)}
                                className={`p-3 rounded border transition-colors ${
                                  selectedAmount === amount.value && !customAmount
                                    ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                                    : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                                }`}
                              >
                                {amount.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                            min="5"
                            max="10000"
                          />
                        </div>

                        {/* PayPal Account Info */}
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                          <h4 className="text-white font-medium mb-3">PayPal Account</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>• Sign in to your PayPal account</p>
                            <p>• Choose payment method (card or balance)</p>
                            <p>• Complete purchase securely</p>
                          </div>
                          {!paypalConnected ? (
                            <button 
                              onClick={handlePayPalConnection}
                              disabled={paypalConnecting}
                              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                                paypalConnecting 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {paypalConnecting ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Connecting...
                                </div>
                              ) : (
                                'Connect PayPal Account'
                              )}
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                <div className="flex items-center">
                                  <span className="text-green-400 mr-2">✅</span>
                                  <span className="text-green-300 text-sm">PayPal Account Connected</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setPaypalConnected(false);
                                    setSuccess('');
                                  }}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Disconnect
                                </button>
                              </div>
                              <div className="text-xs text-gray-400">
                                <p>Account: {user?.email || 'N/A'}</p>
                                <p>Last Payment: {user?.lastPaymentMethod || 'N/A'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-2">❌</span>
                              <span className="text-red-300">{error}</span>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-green-400 mr-2">✅</span>
                              <span className="text-green-300">{success}</span>
                            </div>
                          </div>
                        )}

                        {/* Deposit Button */}
                        <button
                          onClick={handleDeposit}
                          disabled={isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !paypalConnected}
                          className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                            isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !paypalConnected
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : !userLocation ? (
                            'Enable Location to Continue'
                          ) : !paypalConnected ? (
                            'Connect PayPal Account'
                          ) : (
                            `Pay $${getFinalAmount().toFixed(2)} with PayPal`
                          )}
                        </button>

                        {/* Security Notice */}
                        <div className="mt-4 text-xs text-gray-400 text-center">
                          🔒 Secured by PayPal - Buyer Protection Included
                        </div>
                      </div>
                    ) : selectedMethod === 'apple_pay' ? (
                      // Apple Pay-specific payment interface
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs mr-3">
                              A
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Apple Pay</h3>
                              <p className="text-sm text-gray-400">Touch ID or Face ID</p>
                            </div>
                          </div>
                          
                          <div className="bg-black/20 border border-gray-600 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-gray-400 mr-2">👆</span>
                              <span className="text-gray-300 font-medium">Biometric Authentication</span>
                            </div>
                            <p className="text-xs text-gray-400">Secure with Touch ID or Face ID</p>
                          </div>
                        </div>

                        {/* Amount Selection */}
                        <div className="mb-6">
                          <label className="block text-white font-medium mb-3">Select Amount</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {depositAmounts.map((amount) => (
                              <button
                                key={amount.value}
                                onClick={() => handleAmountSelect(amount.value)}
                                className={`p-3 rounded border transition-colors ${
                                  selectedAmount === amount.value && !customAmount
                                    ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                                    : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                                }`}
                              >
                                {amount.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                            min="5"
                            max="10000"
                          />
                        </div>

                        {/* Apple Pay Setup */}
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                          <h4 className="text-white font-medium mb-3">Apple Pay Setup</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>• Add card to Apple Wallet</p>
                            <p>• Use Touch ID or Face ID</p>
                            <p>• Complete with biometric authentication</p>
                          </div>
                          {!applePaySetup ? (
                            <button 
                              onClick={handleApplePaySetup}
                              disabled={applePaySettingUp}
                              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                                applePaySettingUp 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-black hover:bg-gray-800 text-white'
                              }`}
                            >
                              {applePaySettingUp ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Setting Up...
                                </div>
                              ) : (
                                'Setup Apple Pay'
                              )}
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                <div className="flex items-center">
                                  <span className="text-green-400 mr-2">✅</span>
                                  <span className="text-green-300 text-sm">Apple Pay Configured</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setApplePaySetup(false);
                                    setSuccess('');
                                  }}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Reset Setup
                                </button>
                              </div>
                              <div className="text-xs text-gray-400">
                                <p>Last Setup: {user?.lastApplePaySetup || 'N/A'}</p>
                                <p>Status: {applePaySetup ? 'Configured' : 'Not Configured'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-2">❌</span>
                              <span className="text-red-300">{error}</span>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-green-400 mr-2">✅</span>
                              <span className="text-green-300">{success}</span>
                            </div>
                          </div>
                        )}

                        {/* Deposit Button */}
                        <button
                          onClick={handleDeposit}
                          disabled={isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !applePaySetup}
                          className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                            isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !applePaySetup
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : !userLocation ? (
                            'Enable Location to Continue'
                          ) : !applePaySetup ? (
                            'Setup Apple Pay'
                          ) : (
                            `Pay $${getFinalAmount().toFixed(2)} with Apple Pay`
                          )}
                        </button>

                        {/* Security Notice */}
                        <div className="mt-4 text-xs text-gray-400 text-center">
                          🔒 Secured by Apple - Biometric Authentication Required
                        </div>
                      </div>
                    ) : selectedMethod === 'google_pay' ? (
                      // Google Pay-specific payment interface
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded flex items-center justify-center text-white font-bold text-xs mr-3">
                              G
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Google Pay</h3>
                              <p className="text-sm text-gray-400">Fast & secure payments</p>
                            </div>
                          </div>
                          
                          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-green-400 mr-2">⚡</span>
                              <span className="text-green-300 font-medium">Instant Payment</span>
                            </div>
                            <p className="text-xs text-green-300">One-tap payment with Google security</p>
                          </div>
                        </div>

                        {/* Amount Selection */}
                        <div className="mb-6">
                          <label className="block text-white font-medium mb-3">Select Amount</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {depositAmounts.map((amount) => (
                              <button
                                key={amount.value}
                                onClick={() => handleAmountSelect(amount.value)}
                                className={`p-3 rounded border transition-colors ${
                                  selectedAmount === amount.value && !customAmount
                                    ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                                    : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                                }`}
                              >
                                {amount.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                            min="5"
                            max="10000"
                          />
                        </div>

                        {/* Google Pay Setup */}
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                          <h4 className="text-white font-medium mb-3">Google Pay Setup</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>• Add payment method to Google Pay</p>
                            <p>• Use fingerprint or PIN</p>
                            <p>• Complete with Google security</p>
                          </div>
                          {!googlePaySetup ? (
                            <button 
                              onClick={handleGooglePaySetup}
                              disabled={googlePaySettingUp}
                              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                                googlePaySettingUp 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white'
                              }`}
                            >
                              {googlePaySettingUp ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Setting Up...
                                </div>
                              ) : (
                                'Setup Google Pay'
                              )}
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                <div className="flex items-center">
                                  <span className="text-green-400 mr-2">✅</span>
                                  <span className="text-green-300 text-sm">Google Pay Configured</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setGooglePaySetup(false);
                                    setSuccess('');
                                  }}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Reset Setup
                                </button>
                              </div>
                              <div className="text-xs text-gray-400">
                                <p>Last Setup: {user?.lastGooglePaySetup || 'N/A'}</p>
                                <p>Status: {googlePaySetup ? 'Configured' : 'Not Configured'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-2">❌</span>
                              <span className="text-red-300">{error}</span>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-green-400 mr-2">✅</span>
                              <span className="text-green-300">{success}</span>
                            </div>
                          </div>
                        )}

                        {/* Deposit Button */}
                        <button
                          onClick={handleDeposit}
                          disabled={isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !googlePaySetup}
                          className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                            isProcessing || !userLocation || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved') || !googlePaySetup
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : !userLocation ? (
                            'Enable Location to Continue'
                          ) : !googlePaySetup ? (
                            'Setup Google Pay'
                          ) : (
                            `Pay $${getFinalAmount().toFixed(2)} with Google Pay`
                          )}
                        </button>

                        {/* Security Notice */}
                        <div className="mt-4 text-xs text-gray-400 text-center">
                          🔒 Secured by Google - Advanced Security Protection
                        </div>
                      </div>
                    ) : (
                      // Standard payment interface for other methods
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        {/* Amount Selection */}
                        <div className="mb-6">
                          <label className="block text-white font-medium mb-3">Select Amount</label>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {depositAmounts.map((amount) => (
                              <button
                                key={amount.value}
                                onClick={() => handleAmountSelect(amount.value)}
                                className={`p-3 rounded border transition-colors ${
                                  selectedAmount === amount.value && !customAmount
                                    ? 'border-[#59c5bf] bg-[#59c5bf] text-black'
                                    : 'border-gray-600 text-gray-300 hover:border-[#59c5bf] hover:text-[#59c5bf]'
                                }`}
                              >
                                {amount.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                            min="5"
                            max="10000"
                          />
                        </div>

                        {/* Payment Method Selection */}
                        {allMethods.length > 0 && (
                          <div className="mb-6">
                            <label className="block text-white font-medium mb-3">Payment Method</label>
                            <select
                              value={selectedMethod}
                              onChange={(e) => handleMethodSelect(e.target.value)}
                              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                            >
                              <option value="">Select payment method</option>
                              {allMethods.map((method) => {
                                const isAvailable = userLocation ? availableMethods.includes(method) : true;
                                return (
                                  <option key={method} value={method} disabled={!isAvailable}>
                                    {getMethodDetails(method).name} {!isAvailable ? '(Not Available)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {/* Error/Success Messages */}
                        {error && (
                          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-2">❌</span>
                              <span className="text-red-300">{error}</span>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-green-400 mr-2">✅</span>
                              <span className="text-green-300">{success}</span>
                            </div>
                          </div>
                        )}

                        {/* Deposit Button */}
                        <button
                          onClick={handleDeposit}
                          disabled={isProcessing || !userLocation || (userLocation && !selectedMethod) || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved')}
                          className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                            isProcessing || !userLocation || (userLocation && !selectedMethod) || getFinalAmount() <= 0 || (userLocation && complianceStatus !== 'approved')
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                              Processing...
                            </div>
                          ) : !userLocation ? (
                            'Enable Location to Continue'
                          ) : (
                            `Deposit $${getFinalAmount().toFixed(2)}`
                          )}
                        </button>

                        {/* Security Notice */}
                        <div className="mt-4 text-xs text-gray-400 text-center">
                          🔒 All transactions are secured with bank-level encryption
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

    </>
  );
} 