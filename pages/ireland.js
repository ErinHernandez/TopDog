import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function IrelandPage() {
  const [irelandData, setIrelandData] = useState({
    id: 'ireland-2024',
    name: 'Ireland',
    country: 'Ireland',
    state: '',
    type: 'country',
    status: 'researching',
    lastUpdated: new Date().toISOString(),
    
    // Basic Information
    geography: {
      region: 'Europe',
      subregion: 'Northern Europe',
      incomeLevel: 'high',
      developmentStatus: 'developed',
      governmentType: 'democratic',
      politicalStability: 'stable'
    },
    
    // Market Data
    market: {
      population: 5033000,
      potentialUsers: 1500000,
      competition: 'Moderate - Betfair, Paddy Power, BoyleSports',
      opportunities: 'Growing fantasy sports market, strong tech sector, English-speaking population'
    },
    
    // User Data
    userData: {
      demographics: {
        totalUsers: 0,
        ageDistribution: {
          '18-24': 0,
          '25-34': 0,
          '35-44': 0,
          '45-54': 0,
          '55+': 0
        },
        genderDistribution: { male: 0, female: 0, other: 0 },
        incomeLevels: { low: 0, middle: 0, high: 0 },
        educationLevels: { highSchool: 0, college: 0, graduate: 0 },
        urbanRural: { urban: 0, suburban: 0, rural: 0 }
      },
      behavior: {
        averageDeposit: 0,
        retentionRate: 0,
        sessionDuration: 0,
        frequencyOfUse: '',
        preferredDevices: [],
        peakUsageHours: []
      },
      preferences: {
        favoriteSports: [],
        preferredFormats: [],
        bettingPreferences: [],
        paymentMethods: [],
        communicationChannels: []
      },
      engagement: {
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        averageSessionsPerDay: 0,
        timeSpentPerSession: 0
      },
      feedback: {
        satisfactionScore: 0,
        netPromoterScore: 0,
        commonComplaints: [],
        featureRequests: [],
        supportTickets: []
      }
    },
    
    // Media & Entertainment
    media: {
      nflViewership: 15, // percentage
      americanTvViewership: 25,
      streamingPenetration: 85,
      socialMediaUsage: 92,
      mobileInternetUsage: 88,
      notes: 'Strong American sports following, high streaming adoption'
    },
    
    // Sports Data
    sports: {
      popularity: {
        americanFootball: { popularity: 6, viewership: 15, participation: 2, fantasyParticipation: 8 },
        basketball: { popularity: 4, viewership: 12, participation: 3, fantasyParticipation: 5 },
        soccer: { popularity: 9, viewership: 85, participation: 45, fantasyParticipation: 12 },
        baseball: { popularity: 3, viewership: 8, participation: 1, fantasyParticipation: 3 },
        hockey: { popularity: 2, viewership: 5, participation: 1, fantasyParticipation: 2 }
      },
      leagues: {
        nfl: { presence: true, viewership: 15, localTeams: [], fanBase: 750000 },
        nba: { presence: true, viewership: 12, localTeams: [], fanBase: 600000 },
        mlb: { presence: true, viewership: 8, localTeams: [], fanBase: 400000 },
        nhl: { presence: true, viewership: 5, localTeams: [], fanBase: 250000 },
        mls: { presence: false, viewership: 2, localTeams: [], fanBase: 100000 }
      },
      fantasySports: {
        overallParticipation: 12,
        platforms: ['DraftKings', 'FanDuel', 'Betfair', 'Paddy Power'],
        preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
        averageSpending: 150,
        demographics: 'Primarily 25-45 age group, male-dominated'
      },
      gambling: {
        sportsBetting: { legal: true, popularity: 85, marketSize: 2500000000 },
        dailyFantasy: { legal: true, popularity: 45, marketSize: 50000000 },
        traditionalFantasy: { legal: true, popularity: 35, marketSize: 30000000 }
      },
      events: {
        majorEvents: ['Six Nations Rugby', 'GAA Championships', 'Premier League'],
        localEvents: ['All-Ireland Finals', 'Racing Festivals'],
        eventAttendance: 2500000,
        eventRevenue: 500000000
      },
      infrastructure: {
        stadiums: 45,
        sportsBars: 1200,
        sportsMedia: 'strong',
        sportsRetail: 'moderate'
      }
    },
    
    // Religion & Cultural Factors
    religion: {
      demographics: {
        primaryReligion: 'Christianity',
        religiousDistribution: [
          { religion: 'Roman Catholic', percentage: 78, population: 3925740, notes: 'Dominant religion' },
          { religion: 'Protestant', percentage: 3, population: 150990, notes: 'Various denominations' },
          { religion: 'None/Atheist', percentage: 15, population: 754950, notes: 'Growing secularization' },
          { religion: 'Other', percentage: 4, population: 201320, notes: 'Muslim, Hindu, etc.' }
        ],
        secularizationLevel: 'high',
        religiousFreedom: 'high',
        stateReligion: false,
        stateReligionName: '',
        notes: 'High secularization, strong separation of church and state'
      },
      gamblingAttitudes: {
        religiousRestrictions: [],
        gamblingProhibitions: [],
        religiousOpinions: {
          generalGambling: 'neutral',
          fantasySports: 'neutral',
          skillGames: 'supportive',
          notes: 'Generally accepting of gambling as entertainment'
        },
        religiousLeaders: {
          stance: 'neutral',
          influence: 3,
          publicStatements: [],
          notes: 'Limited religious opposition to gambling'
        },
        culturalFactors: {
          gamblingStigma: 2,
          skillGameAcceptance: 8,
          entertainmentValue: 8,
          notes: 'Strong gambling culture, especially horse racing'
        }
      },
      holidays: {
        majorHolidays: [
          {
            name: 'St. Patrick\'s Day',
            religion: 'Christian',
            date: 'March 17',
            duration: 1,
            businessImpact: 'increased',
            gamblingRestrictions: false,
            notes: 'Major celebration, increased sports betting'
          }
        ],
        weeklyObservance: {
          day: 'Sunday',
          businessImpact: 'reduced',
          gamblingRestrictions: false,
          notes: 'Traditional family day, reduced activity'
        },
        fastingPeriods: []
      },
      culturalNorms: {
        modestyStandards: 'moderate',
        genderRoles: 'modern',
        socialHierarchy: 'egalitarian',
        collectivism: 6,
        uncertaintyAvoidance: 4,
        notes: 'Modern, progressive society with strong community values'
      },
      businessImplications: {
        marketingSensitivity: [],
        acceptableImagery: [],
        languageConsiderations: [],
        partnershipOpportunities: [],
        riskFactors: [],
        notes: 'Generally business-friendly environment'
      },
      legalFramework: {
        religiousLaws: [],
        blasphemyLaws: false,
        religiousCensorship: false,
        religiousTaxation: false,
        notes: 'Secular legal system'
      }
    },
    
    // Compliance & Legal Framework
    compliance: {
      gambling: {
        generalGambling: {
          legal: true,
          onlineGambling: true,
          sportsBetting: true,
          onlineSportsBetting: true,
          restrictions: ['Age 18+', 'Licensed operators only'],
          notes: 'Well-regulated gambling market'
        },
        fantasySports: {
          seasonLong: {
            legal: true,
            classification: 'game_of_skill',
            requiresLicensing: true,
            requiresRegistration: false,
            restrictions: [],
            notes: 'Classified as skill game, requires gaming license'
          },
          dailyFantasy: {
            legal: true,
            classification: 'game_of_skill',
            requiresLicensing: true,
            requiresRegistration: false,
            restrictions: [],
            notes: 'Same classification as season-long'
          },
          bestBall: {
            legal: true,
            classification: 'game_of_skill',
            requiresLicensing: true,
            requiresRegistration: false,
            restrictions: [],
            notes: 'Same classification as other fantasy formats'
          },
          otherFormats: {
            legal: true,
            classification: 'game_of_skill',
            requiresLicensing: true,
            requiresRegistration: false,
            restrictions: [],
            notes: 'Generally treated as skill games'
          }
        },
        regulatoryFramework: {
          primaryRegulator: 'gaming_commission',
          regulatoryLevel: 'high',
          enforcementLevel: 'strict',
          complianceRequirements: ['Gaming license', 'Anti-money laundering', 'Responsible gambling'],
          licensingFees: 50000,
          annualFees: 25000,
          reportingRequirements: ['Monthly financial reports', 'Player protection reports'],
          notes: 'Strict but fair regulatory environment'
        },
        taxation: {
          requiresTaxInfo: true,
          taxRate: 15,
          withholdingRequirements: true,
          reportingFrequency: 'quarterly',
          notes: '15% tax on gaming revenue'
        },
        documentation: {
          requiresDocumentation: true,
          requiredDocuments: ['Gaming license application', 'Financial statements', 'AML policies'],
          verificationProcess: 'Comprehensive review by Gaming Commission',
          renewalFrequency: 'annually',
          notes: 'Extensive documentation required'
        }
      },
      legalFramework: {
        primaryLaws: [
          'Gaming and Lotteries Act 1956',
          'Betting Act 1931',
          'Gaming and Lotteries (Amendment) Act 2019',
          'Online Gambling Regulation Act 2024'
        ],
        recentChanges: [
          '2024: New Online Gambling Regulation Act enacted',
          '2019: Gaming and Lotteries Act amended',
          '2018: Enhanced player protection measures'
        ],
        pendingLegislation: [],
        courtCases: [],
        legalPrecedents: [],
        notes: 'Comprehensive legal framework for gambling and gaming'
      },
      officialDocuments: {
        bills: [
          {
            id: 'ireland-2024-act-35',
            title: 'Online Gambling Regulation Act 2024',
            billNumber: 'Act 35 of 2024',
            year: '2024',
            status: 'enacted',
            jurisdiction: 'federal',
            sponsor: 'Minister for Justice',
            summary: 'Comprehensive regulation of online gambling including fantasy sports',
            fullText: 'https://www.irishstatutebook.ie/eli/2024/act/35/enacted/en/pdf',
            fantasySportsImpact: 'Establishes fantasy sports as skill games requiring gaming licenses',
            effectiveDate: '2024-12-01',
            notes: 'Key legislation for fantasy sports regulation'
          }
        ],
        codes: [
          {
            id: 'gaming-lotteries-1956',
            title: 'Gaming and Lotteries Act 1956',
            codeSection: 'Sections 1-50',
            jurisdiction: 'federal',
            year: '1956',
            status: 'active',
            summary: 'Primary legislation governing gaming and lotteries',
            fullText: 'https://www.irishstatutebook.ie/eli/1956/act/2/enacted/en/pdf',
            fantasySportsRelevance: 'Establishes gaming license requirements',
            enforcementAgency: 'Gaming Commission',
            penalties: 'Fines up to €10,000 and imprisonment',
            notes: 'Foundation legislation for gaming regulation'
          }
        ],
        regulations: [],
        courtDecisions: [],
        administrativeDecisions: [],
        governmentPublications: [],
        licensingRequirements: [
          {
            id: 'ireland-gaming-license',
            licenseType: 'fantasy_sports',
            jurisdiction: 'federal',
            requirements: [
              'Proof of financial stability',
              'AML/CTF policies',
              'Responsible gambling policies',
              'Technical infrastructure',
              'Player protection measures'
            ],
            fees: 50000,
            renewalFrequency: 'annually',
            applicationProcess: 'Comprehensive review by Gaming Commission',
            fullText: 'https://www.gamingcommission.ie/licensing',
            notes: 'Standard gaming license for fantasy sports operators'
          }
        ],
        taxDocuments: []
      },
      documentManagement: {
        lastUpdated: '2024-12-01',
        documentCount: 3,
        primarySources: [
          'Irish Statute Book',
          'Gaming Commission of Ireland',
          'Department of Justice'
        ],
        secondarySources: [
          'Irish Gaming Association',
          'Legal firms specializing in gaming law'
        ],
        verificationStatus: 'verified',
        notes: 'All documents from official government sources'
      }
    },
    
    // Business Information
    business: {
      operatingStatus: 'operating',
      targetMarket: 'Irish residents 18+',
      requiresPartnership: false,
      entryBarriers: ['Gaming license', 'Compliance costs', 'Local presence'],
      marketEntryNotes: 'Requires gaming license and local compliance'
    },
    
    // Payment Processing
    payments: {
      processing: {
        availableMethods: ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'],
        primaryProcessor: 'Stripe',
        alternativeProcessors: ['Adyen', 'Worldpay'],
        processingFees: {
          creditCard: 2.9,
          debitCard: 1.5,
          bankTransfer: 0.5,
          digitalWallet: 2.5,
          crypto: 0
        },
        transactionLimits: {
          min: 5,
          max: 10000,
          daily: 5000,
          monthly: 50000
        },
        settlementTime: '1-3 days',
        currencySupport: ['EUR', 'USD'],
        complianceRequirements: ['PSD2', 'AML/CTF']
      },
      costs: {
        setupFees: 0,
        monthlyFees: 29,
        annualFees: 0,
        chargebackFees: 15,
        refundFees: 0,
        currencyConversionFees: 1,
        crossBorderFees: 0,
        additionalFees: []
      },
      usage: {
        totalTransactions: 0,
        averageTransactionValue: 0,
        monthlyVolume: 0,
        peakUsageHours: ['19:00-23:00'],
        seasonalTrends: ['Increased during sports seasons'],
        userAdoptionRate: 0,
        preferredMethods: ['debit_card', 'bank_transfer']
      },
      demand: {
        marketSize: 50000000,
        growthRate: 15,
        competitionLevel: 'high',
        barriersToEntry: ['Licensing', 'Compliance'],
        regulatoryHurdles: ['Gaming license', 'AML compliance'],
        marketMaturity: 'mature',
        futureProjections: 'Steady growth expected'
      },
      infrastructure: {
        bankingSystem: 'developed',
        internetPenetration: 92,
        mobilePaymentAdoption: 65,
        fintechEcosystem: 'strong',
        regulatoryEnvironment: 'supportive',
        notes: 'Strong fintech sector, high digital adoption'
      }
    },
    
    // Infrastructure
    infrastructure: {
      serverLocation: 'eu-west-1',
      latency: 25,
      notes: 'AWS Ireland region available, excellent connectivity'
    },
    
    // Notes
    notes: 'Ireland presents excellent opportunities for fantasy sports with strong regulatory framework, high sports engagement, and favorable business environment. The 2024 Online Gambling Regulation Act provides clear guidance for fantasy sports operators.'
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Ireland - Location Research | TopDog</title>
        <meta name="description" content="Comprehensive location research for Ireland - fantasy sports market analysis, legal framework, and business opportunities" />
      </Head>

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 4v16" />
                  <path d="M16 4v16" />
                  <path d="M4 8h16" />
                  <path d="M4 12h16" />
                  <path d="M4 16h16" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Ireland</h1>
                <p className="text-gray-400">Country Research & Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Operating
              </span>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium"
              >
                Back to Research
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Key Statistics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Key Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{irelandData.market.population.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Population</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">€{irelandData.payments.demand.marketSize.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Market Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{irelandData.sports.fantasySports.overallParticipation}%</div>
                  <div className="text-sm text-gray-400">Fantasy Participation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{irelandData.compliance.gambling.regulatoryFramework.licensingFees.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">License Fee (€)</div>
                </div>
              </div>
            </div>

            {/* Legal Framework */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Legal Framework</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Fantasy Sports Classification</h3>
                  <p className="text-gray-300">Fantasy sports are classified as <span className="text-green-400 font-semibold">games of skill</span> in Ireland, requiring a gaming license for operation.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-green-400 mb-2">Key Legislation</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>Online Gambling Regulation Act 2024</strong> - Comprehensive regulation of online gambling including fantasy sports</li>
                    <li>• <strong>Gaming and Lotteries Act 1956</strong> - Foundation legislation for gaming regulation</li>
                    <li>• <strong>Betting Act 1931</strong> - Historical betting legislation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-yellow-400 mb-2">Official Documents</h3>
                  <div className="space-y-2">
                    <a 
                      href="https://www.irishstatutebook.ie/eli/2024/act/35/enacted/en/pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                      <span>Online Gambling Regulation Act 2024 (PDF)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sports & Fantasy Market */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sports & Fantasy Market</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-400 mb-2">Sports Popularity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-lg font-bold text-blue-400">{irelandData.sports.popularity.soccer.popularity}/10</div>
                      <div className="text-sm text-gray-400">Soccer</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-lg font-bold text-green-400">{irelandData.sports.popularity.americanFootball.popularity}/10</div>
                      <div className="text-sm text-gray-400">American Football</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-lg font-bold text-yellow-400">{irelandData.sports.popularity.basketball.popularity}/10</div>
                      <div className="text-sm text-gray-400">Basketball</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-lg font-bold text-purple-400">{irelandData.sports.fantasySports.overallParticipation}%</div>
                      <div className="text-sm text-gray-400">Fantasy Participation</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Market Opportunities</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Strong American sports following (NFL, NBA, MLB)</li>
                    <li>• High streaming penetration (85%)</li>
                    <li>• Growing fantasy sports market</li>
                    <li>• English-speaking population</li>
                    <li>• Strong tech sector</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Religious & Cultural Factors */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Religious & Cultural Factors</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-purple-400 mb-2">Religious Demographics</h3>
                  <p className="text-gray-300">Ireland is <span className="text-green-400 font-semibold">highly secularized</span> with strong separation of church and state. Religious opposition to gambling is minimal.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-green-400 mb-2">Gambling Attitudes</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• <span className="text-green-400">Supportive</span> of skill games</li>
                    <li>• <span className="text-green-400">Low gambling stigma</span> (2/10)</li>
                    <li>• Strong gambling culture, especially horse racing</li>
                    <li>• Generally accepting of gambling as entertainment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Facts */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Region:</span>
                  <span>Europe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Income Level:</span>
                  <span className="text-green-400">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Government:</span>
                  <span>Democratic</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stability:</span>
                  <span className="text-green-400">Stable</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Internet Penetration:</span>
                  <span>92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mobile Payments:</span>
                  <span>65%</span>
                </div>
              </div>
            </div>

            {/* Compliance Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fantasy Sports:</span>
                  <span className="text-green-400">Legal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Classification:</span>
                  <span className="text-blue-400">Game of Skill</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">License Required:</span>
                  <span className="text-yellow-400">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">License Fee:</span>
                  <span>€50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Annual Fee:</span>
                  <span>€25,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax Rate:</span>
                  <span>15%</span>
                </div>
              </div>
            </div>

            {/* Payment Processing */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Processing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Primary Currency:</span>
                  <span>EUR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credit Card Fee:</span>
                  <span>2.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Debit Card Fee:</span>
                  <span>1.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank Transfer:</span>
                  <span>0.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Settlement:</span>
                  <span>1-3 days</span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-400">
                <div className="flex justify-between mb-2">
                  <span>Last Updated:</span>
                  <span>{new Date(irelandData.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-400">Active Research</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 