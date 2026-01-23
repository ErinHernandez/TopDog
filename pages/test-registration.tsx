import React, { useState } from 'react';
import RegistrationModal from '../components/RegistrationModal';
import { validateUsername, getUsernameRequirements } from '../lib/usernameValidation';
import { getAllowedCharacters, getLocaleDescription } from '../lib/localeCharacters';
import type { UserProfile } from '../lib/userRegistration';

interface Country {
  code: string;
  name: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface UsernameRequirements {
  description: string;
  rules: string[];
  allowedCharacters: string;
}

export default function TestRegistration() {
  const [showModal, setShowModal] = useState(false);
  const [testUsername, setTestUsername] = useState<string>('');
  const [testCountry, setTestCountry] = useState<string>('US');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [requirements, setRequirements] = useState<UsernameRequirements>(getUsernameRequirements('US'));

  const countries: Country[] = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'RU', name: 'Russia' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'Korea' },
    { code: 'AR', name: 'Saudi Arabia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'EE', name: 'Estonia' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' }
  ];

  // Example mixed usernames for different countries
  const mixedUsernameExamples: Record<string, string[]> = {
    'FR': ['Jean123', 'Marie2023', 'François', 'Élise2024', 'Pierre99'],
    'DE': ['Hans2023', 'Müller', 'Schröder', 'Günther', 'Bärbel'],
    'ES': ['José123', 'María2023', 'Carlos', 'Ana2024', 'López'],
    'RU': ['Ivan2023', 'Мария', 'Dmitry', 'Алексей', 'Sergei'],
    'JP': ['Taro2023', '花子', 'Kenji', '美咲', 'Yuki'],
    'KR': ['Kim2023', '민수', 'Park', '지영', 'Lee123'],
    'TR': ['Mehmet123', 'Güneş', 'Ayşe', 'Özkan', 'Fatma'],
    'PL': ['Jan2023', 'Kowalski', 'Marek', 'Nowak', 'Piotr'],
    'CZ': ['Jan2023', 'Novák', 'Petr', 'Svoboda', 'Karel'],
    'HU': ['János2023', 'Nagy', 'István', 'Kovács', 'Ferenc'],
    'RO': ['Ion2023', 'Popescu', 'Maria', 'Ionescu', 'Gheorghe'],
    'BG': ['Ivan2023', 'Петров', 'Georgi', 'Димитров', 'Stefan'],
    'HR': ['Ivan2023', 'Horvat', 'Josip', 'Kovačić', 'Marko'],
    'SI': ['Janez2023', 'Novak', 'Miha', 'Kovač', 'Andrej'],
    'EE': ['Jaan2023', 'Tamm', 'Mihkel', 'Saar', 'Andres'],
    'LV': ['Jānis2023', 'Bērziņš', 'Pēteris', 'Kalniņš', 'Andris'],
    'LT': ['Jonas2023', 'Kazlauskas', 'Petras', 'Jankauskas', 'Antanas']
  };

  const handleTestValidation = () => {
    const result = validateUsername(testUsername, testCountry);
    setValidationResult(result);
  };

  const handleCountryChange = (countryCode: string) => {
    setTestCountry(countryCode);
    setRequirements(getUsernameRequirements(countryCode));
    setValidationResult(null);
  };

  const mockUser = {
    uid: 'test_user_' + Date.now(),
    email: 'test@example.com'
  };

  const handleRegistrationSuccess = (userProfile: UserProfile) => {
    console.log('Registration successful:', userProfile);
    alert('Registration successful! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Registration Test</h1>
        
        {/* Character Mixing Examples */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Character Mixing Examples</h2>
          <p className="text-gray-300 mb-4">
            Users can mix local language characters with standard Western alphabet in any order.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(mixedUsernameExamples).slice(0, 8).map(([countryCode, examples]) => {
              const country = countries.find(c => c.code === countryCode);
              return (
                <div key={countryCode} className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-bold mb-2">{country?.name}</h3>
                  <div className="text-sm text-gray-300 mb-2">
                    {getLocaleDescription(countryCode)}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold mb-1">Valid mixed usernames:</div>
                    {examples.map((example, index) => (
                      <div key={index} className="font-mono bg-gray-600 p-1 rounded mb-1">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Test Username Validation */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Test Username Validation</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Country</label>
              <select
                value={testCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Test Username</label>
              <input
                type="text"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                placeholder="Enter username to test"
              />
            </div>
          </div>
          
          <button
            onClick={handleTestValidation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Test Validation
          </button>
          
          {/* Validation Results */}
          {validationResult && (
            <div className="mt-4 p-4 rounded-lg bg-gray-700">
              <h3 className="font-bold mb-2">Validation Results:</h3>
              <div className={`text-sm ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                <div>Valid: {validationResult.isValid ? 'Yes' : 'No'}</div>
                {validationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-bold">Errors:</div>
                    {validationResult.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Requirements Display */}
          <div className="mt-4 p-4 rounded-lg bg-gray-700">
            <h3 className="font-bold mb-2">Requirements for {countries.find(c => c.code === testCountry)?.name}:</h3>
            <div className="text-sm text-gray-300">
              <div>Description: {requirements.description}</div>
              <div className="mt-2">Rules:</div>
              {requirements.rules.map((rule, index) => (
                <div key={index}>• {rule}</div>
              ))}
              <div className="mt-2">
                <div>Allowed Characters (local + standard):</div>
                <div className="font-mono text-xs bg-gray-600 p-2 rounded mt-1 break-all">
                  {requirements.allowedCharacters}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Registration Modal Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Test Registration Modal</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Open Registration Modal
          </button>
        </div>
        
        {/* Character Set Examples */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Character Set Examples</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {countries.slice(0, 10).map(country => (
              <div key={country.code} className="p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-2">{country.name}</h3>
                <div className="text-sm text-gray-300 mb-2">
                  {getLocaleDescription(country.code)}
                </div>
                <div className="text-xs font-mono bg-gray-600 p-2 rounded break-all">
                  {getAllowedCharacters(country.code)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Registration Modal */}
      <RegistrationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
        user={mockUser}
      />
    </div>
  );
}
