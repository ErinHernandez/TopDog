/**
 * State Data for Location Research
 *
 * Contains compliance data for all US states regarding fantasy sports regulations.
 * This data is used by the location-research page to display state-by-state information.
 *
 * @module lib/location-research/stateData
 */

import type { LocationData } from './types';

const initialNevadaData: LocationData = {
  id: 'nevada',
  name: 'Nevada',
  country: 'United States',
  state: 'NV',
  type: 'state',
  status: 'research',
  notes: 'Nevada does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Nevada has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Nevada.'
        }
      }
    }
  }
};

// Washington - Season-long fantasy sports not allowed
const initialWashingtonData: LocationData = {
  id: 'washington',
  name: 'Washington',
  country: 'United States',
  state: 'WA',
  type: 'state',
  status: 'research',
  notes: 'Washington does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Washington has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Washington.'
        }
      }
    }
  }
};

// Montana - Season-long fantasy sports not allowed
const initialMontanaData: LocationData = {
  id: 'montana',
  name: 'Montana',
  country: 'United States',
  state: 'MT',
  type: 'state',
  status: 'research',
  notes: 'Montana does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Montana has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Montana.'
        }
      }
    }
  }
};

// Idaho - Season-long fantasy sports not allowed
const initialIdahoData: LocationData = {
  id: 'idaho',
  name: 'Idaho',
  country: 'United States',
  state: 'ID',
  type: 'state',
  status: 'research',
  notes: 'Idaho does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Idaho has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Idaho.'
        }
      }
    }
  }
};

// Oregon - Unregulated but generally allowed
const initialOregonData: LocationData = {
  id: 'oregon',
  name: 'Oregon',
  country: 'United States',
  state: 'OR',
  type: 'state',
  status: 'research',
  notes: 'Oregon is unregulated but generally allowed for fantasy sports. DraftKings is the only major provider not operating in Oregon.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Oregon has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Oregon does not formally regulate fantasy contest operations but provides FAQ information.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Oregon Revised Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Oregon does not formally regulate fantasy contest operations but provides information in state FAQ.',
      officialDocuments: {
        faqs: [
          {
            id: 'or-fantasy-sports-faq',
            title: 'Oregon Fantasy Sports FAQ',
            date: 'ongoing',
            summary: 'State provides information regarding fantasy sports operations',
            fantasySportsImpact: 'Provides guidance without formal regulation',
            status: 'active'
          }
        ]
      }
    }
  }
};

// Arizona - Season-long fantasy sports not allowed
const initialArizonaData: LocationData = {
  id: 'arizona',
  name: 'Arizona',
  country: 'United States',
  state: 'AZ',
  type: 'state',
  status: 'research',
  notes: 'Arizona does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Arizona has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Arizona.'
        }
      }
    }
  }
};

// Delaware - Season-long fantasy sports not allowed
const initialDelawareData: LocationData = {
  id: 'delaware',
  name: 'Delaware',
  country: 'United States',
  state: 'DE',
  type: 'state',
  status: 'research',
  notes: 'Delaware does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Delaware has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Delaware.'
        }
      }
    }
  }
};

// Illinois - Unregulated but generally allowed
const initialIllinoisData: LocationData = {
  id: 'illinois',
  name: 'Illinois',
  country: 'United States',
  state: 'IL',
  type: 'state',
  status: 'research',
  notes: 'Illinois is unregulated but generally allowed for fantasy sports. In 2020, the Illinois Supreme Court determined that head-to-head fantasy sports is predominately skill-based and is therefore not gambling.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Illinois has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements. Illinois Supreme Court ruled fantasy sports are skill-based.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Illinois does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Illinois Supreme Court Decision: Dew-Becker v. Wu, 2020 IL 124472'
      ],
      recentChanges: [
        {
          date: '2020-04-16',
          description: 'Illinois Supreme Court ruled fantasy sports are skill-based',
          impact: 'positive'
        }
      ],
      pendingLegislation: [
        {
          id: 'il-sb2145-2025',
          title: 'Fantasy Sports Consumer Protection Act',
          billNumber: 'SB 2145',
          session: '2025',
          status: 'pending',
          description: 'Bill to create fantasy sports regulation framework'
        },
        {
          id: 'il-sb1224-2025',
          title: 'Fantasy Sports Regulation Bill',
          billNumber: 'SB 1224',
          session: '2025',
          status: 'pending',
          description: 'Bill to allow regulation of fantasy sports'
        }
      ],
      courtCases: [
        {
          case: 'Dew-Becker v. Wu',
          date: '2020-04-16',
          outcome: 'Illinois Supreme Court ruled head-to-head fantasy sports is skill-based',
          impact: 'positive'
        }
      ],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Illinois Supreme Court determined fantasy sports are skill-based and not gambling. No formal regulation currently exists.',
      officialDocuments: {
        courtDecisions: [
          {
            id: 'il-dew-becker-v-wu-2020',
            title: 'Dew-Becker v. Wu',
            date: '2020-04-16',
            court: 'Illinois Supreme Court',
            caseNumber: '2020 IL 124472',
            summary: 'Ruled head-to-head fantasy sports is predominately skill-based',
            fantasySportsImpact: 'Established fantasy sports as skill-based games',
            status: 'active'
          }
        ]
      }
    }
  }
};

// Indiana - Season-long fantasy sports not allowed
const initialIndianaData: LocationData = {
  id: 'indiana',
  name: 'Indiana',
  country: 'United States',
  state: 'IN',
  type: 'state',
  status: 'research',
  notes: 'Indiana does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Indiana has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Indiana.'
        }
      }
    }
  }
};

// Iowa - Season-long fantasy sports not allowed
const initialIowaData: LocationData = {
  id: 'iowa',
  name: 'Iowa',
  country: 'United States',
  state: 'IA',
  type: 'state',
  status: 'research',
  notes: 'Iowa does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Iowa has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Iowa.'
        }
      }
    }
  }
};

// Louisiana - Season-long fantasy sports not allowed
const initialLouisianaData: LocationData = {
  id: 'louisiana',
  name: 'Louisiana',
  country: 'United States',
  state: 'LA',
  type: 'state',
  status: 'research',
  notes: 'Louisiana does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Louisiana has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Louisiana.'
        }
      }
    }
  }
};

// Michigan - Season-long fantasy sports not allowed
const initialMichiganData: LocationData = {
  id: 'michigan',
  name: 'Michigan',
  country: 'United States',
  state: 'MI',
  type: 'state',
  status: 'research',
  notes: 'Michigan does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Michigan has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Michigan.'
        }
      }
    }
  }
};

// Mississippi - Season-long fantasy sports not allowed
const initialMississippiData: LocationData = {
  id: 'mississippi',
  name: 'Mississippi',
  country: 'United States',
  state: 'MS',
  type: 'state',
  status: 'research',
  notes: 'Mississippi does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Mississippi has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Mississippi.'
        }
      }
    }
  }
};

// New York - Season-long fantasy sports not allowed
const initialNewYorkData: LocationData = {
  id: 'newyork',
  name: 'New York',
  country: 'United States',
  state: 'NY',
  type: 'state',
  status: 'research',
  notes: 'New York does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'New York has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in New York.'
        }
      }
    }
  }
};

// Tennessee - Season-long fantasy sports not allowed
const initialTennesseeData: LocationData = {
  id: 'tennessee',
  name: 'Tennessee',
  country: 'United States',
  state: 'TN',
  type: 'state',
  status: 'research',
  notes: 'Tennessee does not allow season-long fantasy sports.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Tennessee has comprehensive gambling laws but prohibits season-long fantasy sports.'
      },
      fantasySports: {
        seasonLong: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Season-long fantasy sports not allowed'],
          notes: 'Season-long fantasy sports are not allowed in Tennessee.'
        }
      }
    }
  }
};

// Texas - Unregulated but generally allowed
const initialTexasData: LocationData = {
  id: 'texas',
  name: 'Texas',
  country: 'United States',
  state: 'TX',
  type: 'state',
  status: 'research',
  notes: 'Texas is unregulated but generally allowed for fantasy sports. All major providers operate in Texas without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Texas has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Texas does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Texas Penal Code',
        'Texas Constitution'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Texas does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// California - Season-long fantasy sports allowed
const initialCaliforniaData: LocationData = {
  id: 'california',
  name: 'California',
  country: 'United States',
  state: 'CA',
  type: 'state',
  status: 'research',
  notes: 'California allows season-long fantasy sports but has complex DFS regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'California has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: false,
          classification: 'prohibited',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['DFS currently prohibited due to AG opinion'],
          notes: 'Daily fantasy sports are currently prohibited due to recent AG opinion.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'attorney_general',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Consumer protection', 'Age verification'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'California has moderate regulation with focus on consumer protection.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'California Penal Code § 330',
        'California Business and Professions Code'
      ],
      recentChanges: [
        {
          date: '2023-12-01',
          description: 'AG opinion on DFS prohibition',
          impact: 'negative'
        }
      ],
      pendingLegislation: [
        {
          id: 'ca-dfs-bill-2024',
          title: 'California DFS Legalization Bill',
          billNumber: 'AB 1437',
          session: '2024',
          status: 'pending',
          description: 'Bill to legalize daily fantasy sports in California'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'DFS currently prohibited by AG interpretation'
      ],
      notes: 'California has complex fantasy sports regulation with DFS currently prohibited but season-long allowed.',
      officialDocuments: {
        bills: [
          {
            id: 'ca-ab-1437-2024',
            title: 'California DFS Legalization Bill',
            billNumber: 'AB 1437',
            year: '2024',
            status: 'pending',
            jurisdiction: 'state',
            sponsor: 'Assembly Member',
            summary: 'Legalize daily fantasy sports in California',
            fantasySportsImpact: 'Would legalize DFS if passed',
            effectiveDate: 'TBD'
          }
        ],
        opinions: [
          {
            id: 'ca-ag-opinion-2023',
            title: 'California Attorney General DFS Opinion',
            date: '2023-12-01',
            summary: 'AG opinion prohibiting DFS in California',
            fantasySportsImpact: 'Prohibits DFS operations',
            status: 'active'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 9, viewership: 85, participation: 15, fantasyParticipation: 25 },
      basketball: { popularity: 8, viewership: 75, participation: 20, fantasyParticipation: 20 },
      baseball: { popularity: 7, viewership: 65, participation: 12, fantasyParticipation: 18 },
      soccer: { popularity: 6, viewership: 45, participation: 8, fantasyParticipation: 12 },
      hockey: { popularity: 4, viewership: 25, participation: 3, fantasyParticipation: 8 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 85,
        localTeams: ['Los Angeles Rams', 'Los Angeles Chargers', 'San Francisco 49ers', 'Las Vegas Raiders'],
        fanBase: 90,
        notes: 'Strong NFL presence with multiple teams.'
      },
      nba: {
        presence: true,
        viewership: 75,
        localTeams: ['Los Angeles Lakers', 'Los Angeles Clippers', 'Golden State Warriors', 'Sacramento Kings'],
        fanBase: 85,
        notes: 'Strong NBA presence with multiple championship teams.'
      },
      mlb: {
        presence: true,
        viewership: 65,
        localTeams: ['Los Angeles Dodgers', 'Los Angeles Angels', 'San Francisco Giants', 'Oakland Athletics', 'San Diego Padres'],
        fanBase: 80,
        notes: 'Strong MLB presence with multiple teams.'
      },
      nhl: {
        presence: true,
        viewership: 25,
        localTeams: ['Los Angeles Kings', 'Anaheim Ducks', 'San Jose Sharks'],
        fanBase: 40,
        notes: 'Moderate NHL presence with three teams.'
      },
      mls: {
        presence: true,
        viewership: 35,
        localTeams: ['LA Galaxy', 'Los Angeles FC', 'San Jose Earthquakes'],
        fanBase: 50,
        notes: 'Growing MLS presence with multiple teams.'
      },
      internationalLeagues: [
        {
          name: 'Mexican Liga MX',
          popularity: 6,
          notes: 'Strong Mexican soccer following due to proximity.'
        }
      ]
    },
    fantasySports: {
      overallParticipation: 25,
      platforms: ['Yahoo Fantasy', 'ESPN Fantasy', 'NFL Fantasy'],
      preferredFormats: ['Season-long', 'Traditional Leagues'],
      averageSpending: 350,
      seasonalTrends: ['Peak during NFL season', 'High year-round participation'],
      demographics: {
        ageGroups: {
          under25: 22,
          age25to34: 28,
          age35to44: 25,
          age45to54: 18,
          age55plus: 7
        },
        gender: {
          male: 68,
          female: 32
        }
      },
      notes: 'Very high fantasy sports market but limited to season-long formats due to DFS prohibition.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 800,
        notes: 'Legal sports betting market.'
      },
      casino: {
        legal: true,
        tribal: true,
        commercial: false,
        locations: 65,
        notes: 'Tribal casinos throughout California.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'California Lottery'],
        annualRevenue: 8500,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 39538223,
    medianAge: 36.5,
    medianIncome: 78000,
    education: {
      highSchool: 84,
      bachelors: 34,
      graduate: 12
    },
    ethnicity: {
      white: 35,
      black: 6,
      hispanic: 39,
      asian: 15,
      other: 5
    },
    urbanRural: {
      urban: 95,
      suburban: 4,
      rural: 1
    },
    notes: 'Very diverse state with high education levels and strong technology industry.'
  },
  economy: {
    gdp: 3600000,
    unemployment: 4.8,
    majorIndustries: ['Technology', 'Entertainment', 'Agriculture', 'Tourism'],
    averageIncome: 78000,
    notes: 'Largest state economy with strong technology and entertainment sectors.'
  },
  technology: {
    internetPenetration: 92,
    smartphonePenetration: 88,
    broadbandAccess: 89,
    mobileUsage: 85,
    notes: 'High technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['High competition', 'Regulatory complexity'],
    notes: 'Strong market potential but complex regulatory environment.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Colorado - Season-long fantasy sports allowed
const initialColoradoData: LocationData = {
  id: 'colorado',
  name: 'Colorado',
  country: 'United States',
  state: 'CO',
  type: 'state',
  status: 'research',
  notes: 'Colorado has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Colorado legalized sports betting in 2020. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from Colorado Division of Gaming.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'gaming_commission',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 15000,
        annualFees: 0,
        reportingRequirements: ['Annual reports'],
        notes: 'Colorado has moderate regulation with user-based licensing fees.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Colorado Revised Statutes Title 44',
        'House Bill 1327 (2020) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2020-05-01',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'co-hb-1327-2020',
            title: 'Colorado Sports Betting and Fantasy Sports Regulation',
            billNumber: 'HB 1327',
            year: '2020',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Rep. Alec Garnett',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2020-05-01'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 8, viewership: 75, participation: 12, fantasyParticipation: 22 },
      basketball: { popularity: 7, viewership: 65, participation: 15, fantasyParticipation: 18 },
      baseball: { popularity: 6, viewership: 55, participation: 8, fantasyParticipation: 15 },
      soccer: { popularity: 7, viewership: 60, participation: 10, fantasyParticipation: 16 },
      hockey: { popularity: 8, viewership: 70, participation: 6, fantasyParticipation: 12 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 75,
        localTeams: ['Denver Broncos'],
        fanBase: 85,
        notes: 'Strong Broncos fan base with dedicated following.'
      },
      nba: {
        presence: true,
        viewership: 65,
        localTeams: ['Denver Nuggets'],
        fanBase: 75,
        notes: 'Strong Nuggets presence with growing fan base.'
      },
      mlb: {
        presence: true,
        viewership: 55,
        localTeams: ['Colorado Rockies'],
        fanBase: 70,
        notes: 'Good Rockies following with strong attendance.'
      },
      nhl: {
        presence: true,
        viewership: 70,
        localTeams: ['Colorado Avalanche'],
        fanBase: 80,
        notes: 'Strong Avalanche fan base with championship history.'
      },
      mls: {
        presence: true,
        viewership: 60,
        localTeams: ['Colorado Rapids'],
        fanBase: 65,
        notes: 'Growing Rapids interest with dedicated fan base.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 22,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 420,
      seasonalTrends: ['Peak during NFL season', 'Strong year-round participation'],
      demographics: {
        ageGroups: {
          under25: 18,
          age25to34: 28,
          age35to44: 30,
          age45to54: 18,
          age55plus: 6
        },
        gender: {
          male: 65,
          female: 35
        }
      },
      notes: 'Strong fantasy sports market with diverse sports interest.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 450,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: false,
        commercial: true,
        locations: 35,
        notes: 'Commercial casinos throughout Colorado.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Colorado Lottery'],
        annualRevenue: 650,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 5773714,
    medianAge: 36.4,
    medianIncome: 75000,
    education: {
      highSchool: 91,
      bachelors: 41,
      graduate: 14
    },
    ethnicity: {
      white: 68,
      black: 4,
      hispanic: 22,
      asian: 3,
      other: 3
    },
    urbanRural: {
      urban: 85,
      suburban: 12,
      rural: 3
    },
    notes: 'Growing state with high education levels and strong outdoor recreation culture.'
  },
  economy: {
    gdp: 420000,
    unemployment: 3.2,
    majorIndustries: ['Technology', 'Tourism', 'Outdoor Recreation', 'Aerospace'],
    averageIncome: 75000,
    notes: 'Strong economy with diverse industries and growing technology sector.'
  },
  technology: {
    internetPenetration: 89,
    smartphonePenetration: 85,
    broadbandAccess: 87,
    mobileUsage: 82,
    notes: 'Good technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['Moderate competition', 'Regulatory compliance'],
    notes: 'Good market potential with moderate regulatory requirements.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Connecticut - Season-long fantasy sports allowed
const initialConnecticutData: LocationData = {
  id: 'connecticut',
  name: 'Connecticut',
  country: 'United States',
  state: 'CT',
  type: 'state',
  status: 'research',
  notes: 'Connecticut has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Connecticut legalized sports betting in 2021. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from Connecticut Department of Consumer Protection.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'consumer_protection',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 25000,
        annualFees: 10000,
        reportingRequirements: ['Annual reports', 'Financial disclosures'],
        notes: 'Connecticut has moderate regulation with annual licensing fees.'
      },
      taxation: {
        requiresTaxInfo: true,
        taxRate: 13.6,
        withholdingRequirements: true,
        reportingFrequency: 'quarterly',
        notes: '13.6% tax rate on fantasy sports revenue.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements', 'Background checks'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically with annual renewal.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Connecticut General Statutes Title 12',
        'House Bill 6451 (2021) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2021-05-27',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'ct-hb-6451-2021',
            title: 'Connecticut Sports Betting and Fantasy Sports Regulation',
            billNumber: 'HB 6451',
            year: '2021',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Rep. Maria Horn',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2021-05-27'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 8, viewership: 80, participation: 12, fantasyParticipation: 20 },
      basketball: { popularity: 7, viewership: 70, participation: 15, fantasyParticipation: 18 },
      baseball: { popularity: 8, viewership: 75, participation: 10, fantasyParticipation: 16 },
      soccer: { popularity: 5, viewership: 40, participation: 6, fantasyParticipation: 10 },
      hockey: { popularity: 6, viewership: 50, participation: 4, fantasyParticipation: 8 }
    },
    leagues: {
      nfl: {
        presence: false,
        viewership: 80,
        localTeams: ['New York Giants', 'New York Jets', 'New England Patriots'],
        fanBase: 75,
        notes: 'Regional NFL support with nearby teams.'
      },
      nba: {
        presence: false,
        viewership: 70,
        localTeams: ['Brooklyn Nets', 'New York Knicks', 'Boston Celtics'],
        fanBase: 70,
        notes: 'Regional NBA support with nearby teams.'
      },
      mlb: {
        presence: false,
        viewership: 75,
        localTeams: ['New York Yankees', 'New York Mets', 'Boston Red Sox'],
        fanBase: 80,
        notes: 'Regional MLB support with nearby teams.'
      },
      nhl: {
        presence: false,
        viewership: 50,
        localTeams: ['New York Rangers', 'New York Islanders', 'Boston Bruins'],
        fanBase: 60,
        notes: 'Regional NHL support with nearby teams.'
      },
      mls: {
        presence: false,
        viewership: 40,
        localTeams: ['New York Red Bulls', 'New York City FC', 'New England Revolution'],
        fanBase: 45,
        notes: 'Regional MLS support with nearby teams.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 20,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 380,
      seasonalTrends: ['Peak during NFL season', 'Moderate year-round participation'],
      demographics: {
        ageGroups: {
          under25: 16,
          age25to34: 26,
          age35to44: 30,
          age45to54: 20,
          age55plus: 8
        },
        gender: {
          male: 70,
          female: 30
        }
      },
      notes: 'Moderate fantasy sports market with regional sports focus.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 350,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: true,
        commercial: false,
        locations: 2,
        notes: 'Tribal casinos in Connecticut.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Connecticut Lottery'],
        annualRevenue: 1400,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 3605944,
    medianAge: 40.9,
    medianIncome: 83000,
    education: {
      highSchool: 90,
      bachelors: 39,
      graduate: 15
    },
    ethnicity: {
      white: 66,
      black: 12,
      hispanic: 17,
      asian: 5,
      other: 1
    },
    urbanRural: {
      urban: 88,
      suburban: 10,
      rural: 2
    },
    notes: 'Affluent state with high education levels and strong financial services industry.'
  },
  economy: {
    gdp: 290000,
    unemployment: 4.1,
    majorIndustries: ['Financial Services', 'Insurance', 'Manufacturing', 'Healthcare'],
    averageIncome: 83000,
    notes: 'Strong economy with high per-capita income and diverse industries.'
  },
  technology: {
    internetPenetration: 91,
    smartphonePenetration: 87,
    broadbandAccess: 89,
    mobileUsage: 84,
    notes: 'High technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['High licensing costs', 'Regulatory compliance'],
    notes: 'Good market potential but high regulatory costs.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Florida - Season-long fantasy sports allowed (unregulated)
const initialFloridaData: LocationData = {
  id: 'florida',
  name: 'Florida',
  country: 'United States',
  state: 'FL',
  type: 'state',
  status: 'research',
  notes: 'Florida allows fantasy sports but does not formally regulate fantasy contest operations. Most major operators offer contests without regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Florida has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Florida does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Florida Statutes Chapter 551',
        'Seminole Tribe Compact (2021)'
      ],
      recentChanges: [
        {
          date: '2021-05-19',
          description: 'Seminole Tribe Compact amendment upheld by D.C. Circuit Court',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [
        {
          case: 'Seminole Tribe Compact Amendment',
          date: '2021',
          outcome: 'Upheld by D.C. Circuit Court of Appeals',
          impact: 'Allows Seminole Tribe to offer certain fantasy sports contests'
        }
      ],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Fantasy contests offered as skill games for over a decade',
        'Major operators continue to offer contests without issue'
      ],
      notes: 'Florida does not have a separate law authorizing fantasy contests, but they have been offered as skill games for over a decade.',
      officialDocuments: {
        compacts: [
          {
            id: 'fl-seminole-compact-2021',
            title: 'Seminole Tribe Compact Amendment',
            date: '2021',
            status: 'upheld',
            summary: 'Allows Seminole Tribe to offer certain fantasy sports contests',
            fantasySportsImpact: 'Provides tribal gaming framework for fantasy sports',
            courtStatus: 'Upheld by D.C. Circuit Court of Appeals'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 9, viewership: 85, participation: 15, fantasyParticipation: 24 },
      basketball: { popularity: 7, viewership: 65, participation: 12, fantasyParticipation: 18 },
      baseball: { popularity: 8, viewership: 70, participation: 10, fantasyParticipation: 16 },
      soccer: { popularity: 6, viewership: 50, participation: 8, fantasyParticipation: 12 },
      hockey: { popularity: 5, viewership: 35, participation: 3, fantasyParticipation: 6 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 85,
        localTeams: ['Miami Dolphins', 'Tampa Bay Buccaneers', 'Jacksonville Jaguars'],
        fanBase: 80,
        notes: 'Strong NFL presence with three teams.'
      },
      nba: {
        presence: true,
        viewership: 65,
        localTeams: ['Miami Heat', 'Orlando Magic'],
        fanBase: 75,
        notes: 'Strong NBA presence with two teams.'
      },
      mlb: {
        presence: true,
        viewership: 70,
        localTeams: ['Miami Marlins', 'Tampa Bay Rays'],
        fanBase: 70,
        notes: 'Strong MLB presence with two teams.'
      },
      nhl: {
        presence: true,
        viewership: 35,
        localTeams: ['Florida Panthers', 'Tampa Bay Lightning'],
        fanBase: 50,
        notes: 'Moderate NHL presence with two teams.'
      },
      mls: {
        presence: true,
        viewership: 50,
        localTeams: ['Inter Miami CF', 'Orlando City SC'],
        fanBase: 60,
        notes: 'Growing MLS presence with two teams.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 24,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 400,
      seasonalTrends: ['Peak during NFL season', 'Strong year-round participation'],
      demographics: {
        ageGroups: {
          under25: 20,
          age25to34: 28,
          age35to44: 28,
          age45to54: 18,
          age55plus: 6
        },
        gender: {
          male: 68,
          female: 32
        }
      },
      notes: 'Strong fantasy sports market with diverse sports interest.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 600,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: true,
        commercial: false,
        locations: 8,
        notes: 'Tribal casinos throughout Florida.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Florida Lottery'],
        annualRevenue: 7000,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 21781128,
    medianAge: 42.2,
    medianIncome: 61000,
    education: {
      highSchool: 88,
      bachelors: 30,
      graduate: 10
    },
    ethnicity: {
      white: 53,
      black: 16,
      hispanic: 26,
      asian: 3,
      other: 2
    },
    urbanRural: {
      urban: 91,
      suburban: 7,
      rural: 2
    },
    notes: 'Large, diverse state with growing population and strong tourism industry.'
  },
  economy: {
    gdp: 1200000,
    unemployment: 3.0,
    majorIndustries: ['Tourism', 'Agriculture', 'Healthcare', 'Aerospace'],
    averageIncome: 61000,
    notes: 'Strong economy with diverse industries and growing population.'
  },
  technology: {
    internetPenetration: 88,
    smartphonePenetration: 84,
    broadbandAccess: 85,
    mobileUsage: 80,
    notes: 'Good technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['Low regulatory barriers', 'Competition'],
    notes: 'Strong market potential with minimal regulatory requirements.'
  },
  political: {
    governmentType: 'republican',
    politicalStability: 'stable'
  }
};

// Massachusetts - Season-long fantasy sports allowed
const initialMassachusettsData: LocationData = {
  id: 'massachusetts',
  name: 'Massachusetts',
  country: 'United States',
  state: 'MA',
  type: 'state',
  status: 'research',
  notes: 'Massachusetts has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Massachusetts legalized sports betting in 2022. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from Massachusetts Gaming Commission.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'gaming_commission',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 30000,
        annualFees: 15000,
        reportingRequirements: ['Annual reports', 'Financial disclosures'],
        notes: 'Massachusetts has moderate regulation with high licensing fees.'
      },
      taxation: {
        requiresTaxInfo: true,
        taxRate: 5.0,
        withholdingRequirements: true,
        reportingFrequency: 'quarterly',
        notes: '5% tax rate on fantasy sports revenue.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements', 'Background checks'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically with annual renewal.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Massachusetts General Laws Chapter 23K',
        'House Bill 5164 (2022) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2022-08-10',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'ma-hb-5164-2022',
            title: 'Massachusetts Sports Betting and Fantasy Sports Regulation',
            billNumber: 'HB 5164',
            year: '2022',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Rep. Jerald Parisella',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2022-08-10'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 9, viewership: 85, participation: 15, fantasyParticipation: 23 },
      basketball: { popularity: 9, viewership: 80, participation: 18, fantasyParticipation: 20 },
      baseball: { popularity: 8, viewership: 75, participation: 12, fantasyParticipation: 18 },
      soccer: { popularity: 6, viewership: 55, participation: 8, fantasyParticipation: 12 },
      hockey: { popularity: 8, viewership: 70, participation: 6, fantasyParticipation: 10 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 85,
        localTeams: ['New England Patriots'],
        fanBase: 90,
        notes: 'Strong Patriots fan base with dedicated following.'
      },
      nba: {
        presence: true,
        viewership: 80,
        localTeams: ['Boston Celtics'],
        fanBase: 85,
        notes: 'Strong Celtics presence with championship history.'
      },
      mlb: {
        presence: true,
        viewership: 75,
        localTeams: ['Boston Red Sox'],
        fanBase: 85,
        notes: 'Strong Red Sox following with championship history.'
      },
      nhl: {
        presence: true,
        viewership: 70,
        localTeams: ['Boston Bruins'],
        fanBase: 80,
        notes: 'Strong Bruins fan base with championship history.'
      },
      mls: {
        presence: true,
        viewership: 55,
        localTeams: ['New England Revolution'],
        fanBase: 65,
        notes: 'Growing Revolution interest with dedicated fan base.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 23,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 450,
      seasonalTrends: ['Peak during NFL season', 'Strong year-round participation'],
      demographics: {
        ageGroups: {
          under25: 18,
          age25to34: 26,
          age35to44: 30,
          age45to54: 20,
          age55plus: 6
        },
        gender: {
          male: 66,
          female: 34
        }
      },
      notes: 'Strong fantasy sports market with diverse sports interest.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 500,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: false,
        commercial: true,
        locations: 3,
        notes: 'Commercial casinos in Massachusetts.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Massachusetts Lottery'],
        annualRevenue: 5500,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 7029917,
    medianAge: 39.4,
    medianIncome: 89000,
    education: {
      highSchool: 91,
      bachelors: 44,
      graduate: 18
    },
    ethnicity: {
      white: 69,
      black: 8,
      hispanic: 12,
      asian: 7,
      other: 4
    },
    urbanRural: {
      urban: 92,
      suburban: 7,
      rural: 1
    },
    notes: 'Affluent state with high education levels and strong technology industry.'
  },
  economy: {
    gdp: 650000,
    unemployment: 3.4,
    majorIndustries: ['Technology', 'Healthcare', 'Education', 'Financial Services'],
    averageIncome: 89000,
    notes: 'Strong economy with high per-capita income and diverse industries.'
  },
  technology: {
    internetPenetration: 93,
    smartphonePenetration: 89,
    broadbandAccess: 91,
    mobileUsage: 86,
    notes: 'High technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['High licensing costs', 'Regulatory compliance'],
    notes: 'Good market potential but high regulatory costs.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// New Jersey - Season-long fantasy sports allowed
const initialNewJerseyData: LocationData = {
  id: 'newjersey',
  name: 'New Jersey',
  country: 'United States',
  state: 'NJ',
  type: 'state',
  status: 'research',
  notes: 'New Jersey has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'New Jersey legalized sports betting in 2018. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from New Jersey Division of Gaming Enforcement.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'gaming_enforcement',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 25000,
        annualFees: 10000,
        reportingRequirements: ['Annual reports', 'Financial disclosures'],
        notes: 'New Jersey has moderate regulation with annual licensing fees.'
      },
      taxation: {
        requiresTaxInfo: true,
        taxRate: 8.0,
        withholdingRequirements: true,
        reportingFrequency: 'quarterly',
        notes: '8% tax rate on fantasy sports revenue.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements', 'Background checks'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically with annual renewal.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'New Jersey Statutes Title 5',
        'Assembly Bill 4111 (2018) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2018-06-11',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'nj-ab-4111-2018',
            title: 'New Jersey Sports Betting and Fantasy Sports Regulation',
            billNumber: 'AB 4111',
            year: '2018',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Assembly Member Ralph Caputo',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2018-06-11'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 8, viewership: 80, participation: 14, fantasyParticipation: 22 },
      basketball: { popularity: 8, viewership: 75, participation: 16, fantasyParticipation: 19 },
      baseball: { popularity: 7, viewership: 70, participation: 11, fantasyParticipation: 17 },
      soccer: { popularity: 6, viewership: 60, participation: 9, fantasyParticipation: 13 },
      hockey: { popularity: 7, viewership: 65, participation: 5, fantasyParticipation: 9 }
    },
    leagues: {
      nfl: {
        presence: false,
        viewership: 80,
        localTeams: ['New York Giants', 'New York Jets', 'Philadelphia Eagles'],
        fanBase: 75,
        notes: 'Regional NFL support with nearby teams.'
      },
      nba: {
        presence: false,
        viewership: 75,
        localTeams: ['Brooklyn Nets', 'New York Knicks', 'Philadelphia 76ers'],
        fanBase: 70,
        notes: 'Regional NBA support with nearby teams.'
      },
      mlb: {
        presence: false,
        viewership: 70,
        localTeams: ['New York Yankees', 'New York Mets', 'Philadelphia Phillies'],
        fanBase: 75,
        notes: 'Regional MLB support with nearby teams.'
      },
      nhl: {
        presence: false,
        viewership: 65,
        localTeams: ['New York Rangers', 'New York Islanders', 'New Jersey Devils', 'Philadelphia Flyers'],
        fanBase: 70,
        notes: 'Regional NHL support with nearby teams including Devils.'
      },
      mls: {
        presence: false,
        viewership: 60,
        localTeams: ['New York Red Bulls', 'New York City FC', 'Philadelphia Union'],
        fanBase: 55,
        notes: 'Regional MLS support with nearby teams.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 22,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 420,
      seasonalTrends: ['Peak during NFL season', 'Strong year-round participation'],
      demographics: {
        ageGroups: {
          under25: 17,
          age25to34: 27,
          age35to44: 29,
          age45to54: 19,
          age55plus: 8
        },
        gender: {
          male: 67,
          female: 33
        }
      },
      notes: 'Strong fantasy sports market with regional sports focus.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 450,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: false,
        commercial: true,
        locations: 9,
        notes: 'Commercial casinos throughout New Jersey.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'New Jersey Lottery'],
        annualRevenue: 3200,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 9288994,
    medianAge: 39.8,
    medianIncome: 85000,
    education: {
      highSchool: 89,
      bachelors: 40,
      graduate: 16
    },
    ethnicity: {
      white: 55,
      black: 13,
      hispanic: 21,
      asian: 10,
      other: 1
    },
    urbanRural: {
      urban: 95,
      suburban: 4,
      rural: 1
    },
    notes: 'Dense, diverse state with high education levels and strong financial services industry.'
  },
  economy: {
    gdp: 700000,
    unemployment: 3.8,
    majorIndustries: ['Financial Services', 'Pharmaceuticals', 'Telecommunications', 'Tourism'],
    averageIncome: 85000,
    notes: 'Strong economy with high per-capita income and diverse industries.'
  },
  technology: {
    internetPenetration: 92,
    smartphonePenetration: 88,
    broadbandAccess: 90,
    mobileUsage: 85,
    notes: 'High technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['Moderate licensing costs', 'Regulatory compliance'],
    notes: 'Good market potential with moderate regulatory requirements.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Pennsylvania - Season-long fantasy sports allowed
const initialPennsylvaniaData: LocationData = {
  id: 'pennsylvania',
  name: 'Pennsylvania',
  country: 'United States',
  state: 'PA',
  type: 'state',
  status: 'research',
  notes: 'Pennsylvania has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Pennsylvania legalized sports betting in 2017. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from Pennsylvania Gaming Control Board.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'gaming_control_board',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 35000,
        annualFees: 20000,
        reportingRequirements: ['Annual reports', 'Financial disclosures'],
        notes: 'Pennsylvania has moderate regulation with high licensing fees.'
      },
      taxation: {
        requiresTaxInfo: true,
        taxRate: 15.0,
        withholdingRequirements: true,
        reportingFrequency: 'quarterly',
        notes: '15% tax rate on fantasy sports revenue.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements', 'Background checks'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically with annual renewal.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Pennsylvania Statutes Title 4',
        'House Bill 271 (2017) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2017-10-30',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'pa-hb-271-2017',
            title: 'Pennsylvania Sports Betting and Fantasy Sports Regulation',
            billNumber: 'HB 271',
            year: '2017',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Rep. John Payne',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2017-10-30'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 9, viewership: 85, participation: 15, fantasyParticipation: 24 },
      basketball: { popularity: 8, viewership: 75, participation: 16, fantasyParticipation: 20 },
      baseball: { popularity: 8, viewership: 70, participation: 12, fantasyParticipation: 18 },
      soccer: { popularity: 6, viewership: 55, participation: 8, fantasyParticipation: 12 },
      hockey: { popularity: 8, viewership: 75, participation: 6, fantasyParticipation: 10 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 85,
        localTeams: ['Philadelphia Eagles', 'Pittsburgh Steelers'],
        fanBase: 85,
        notes: 'Strong NFL presence with two teams.'
      },
      nba: {
        presence: true,
        viewership: 75,
        localTeams: ['Philadelphia 76ers'],
        fanBase: 75,
        notes: 'Strong 76ers presence with dedicated fan base.'
      },
      mlb: {
        presence: true,
        viewership: 70,
        localTeams: ['Philadelphia Phillies', 'Pittsburgh Pirates'],
        fanBase: 75,
        notes: 'Strong MLB presence with two teams.'
      },
      nhl: {
        presence: true,
        viewership: 75,
        localTeams: ['Philadelphia Flyers', 'Pittsburgh Penguins'],
        fanBase: 80,
        notes: 'Strong NHL presence with two teams.'
      },
      mls: {
        presence: true,
        viewership: 55,
        localTeams: ['Philadelphia Union'],
        fanBase: 60,
        notes: 'Growing Union interest with dedicated fan base.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 24,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 430,
      seasonalTrends: ['Peak during NFL season', 'Strong year-round participation'],
      demographics: {
        ageGroups: {
          under25: 19,
          age25to34: 27,
          age35to44: 28,
          age45to54: 19,
          age55plus: 7
        },
        gender: {
          male: 68,
          female: 32
        }
      },
      notes: 'Strong fantasy sports market with diverse sports interest.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 550,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: false,
        commercial: true,
        locations: 16,
        notes: 'Commercial casinos throughout Pennsylvania.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Pennsylvania Lottery'],
        annualRevenue: 4500,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 13002700,
    medianAge: 40.8,
    medianIncome: 67000,
    education: {
      highSchool: 90,
      bachelors: 32,
      graduate: 12
    },
    ethnicity: {
      white: 76,
      black: 12,
      hispanic: 8,
      asian: 4,
      other: 1
    },
    urbanRural: {
      urban: 78,
      suburban: 18,
      rural: 4
    },
    notes: 'Large, diverse state with strong manufacturing and energy industries.'
  },
  economy: {
    gdp: 900000,
    unemployment: 4.2,
    majorIndustries: ['Manufacturing', 'Energy', 'Healthcare', 'Agriculture'],
    averageIncome: 67000,
    notes: 'Strong economy with diverse industries and growing technology sector.'
  },
  technology: {
    internetPenetration: 89,
    smartphonePenetration: 85,
    broadbandAccess: 87,
    mobileUsage: 82,
    notes: 'Good technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['High licensing costs', 'Regulatory compliance'],
    notes: 'Good market potential but high regulatory costs.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Maryland - Season-long fantasy sports allowed
const initialMarylandData: LocationData = {
  id: 'maryland',
  name: 'Maryland',
  country: 'United States',
  state: 'MD',
  type: 'state',
  status: 'research',
  notes: 'Maryland has comprehensive fantasy sports and sports betting regulations.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Maryland legalized sports betting in 2021. Online gambling is permitted through licensed operators.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports require licensing from Maryland Lottery and Gaming Control Agency.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats require licensing.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: true,
          requiresRegistration: true,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats require licensing.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'lottery_gaming_control',
        regulatoryLevel: 'moderate',
        enforcementLevel: 'moderate',
        complianceRequirements: ['Licensing', 'Consumer protection'],
        licensingFees: 20000,
        annualFees: 8000,
        reportingRequirements: ['Annual reports', 'Financial disclosures'],
        notes: 'Maryland has moderate regulation with reasonable licensing fees.'
      },
      taxation: {
        requiresTaxInfo: true,
        taxRate: 7.0,
        withholdingRequirements: true,
        reportingFrequency: 'quarterly',
        notes: '7% tax rate on fantasy sports revenue.'
      },
      documentation: {
        requiresDocumentation: true,
        requiredDocuments: ['Business license', 'Financial statements', 'Background checks'],
        verificationProcess: 'Comprehensive review',
        renewalFrequency: 'annually',
        notes: 'All documentation submitted electronically with annual renewal.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Maryland Code Title 9',
        'House Bill 940 (2021) - Sports Betting Legalization'
      ],
      recentChanges: [
        {
          date: '2021-05-18',
          description: 'Sports betting and fantasy sports regulation enacted',
          impact: 'positive'
        }
      ],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Online gambling permitted through licensed operators'
      ],
      notes: 'Well-established legal framework with comprehensive regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'md-hb-940-2021',
            title: 'Maryland Sports Betting and Fantasy Sports Regulation',
            billNumber: 'HB 940',
            year: '2021',
            status: 'enacted',
            jurisdiction: 'state',
            sponsor: 'Del. Eric Luedtke',
            summary: 'Legalized sports betting and established fantasy sports regulation',
            fantasySportsImpact: 'Created comprehensive fantasy sports regulatory framework',
            effectiveDate: '2021-05-18'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 8, viewership: 80, participation: 14, fantasyParticipation: 21 },
      basketball: { popularity: 7, viewership: 70, participation: 15, fantasyParticipation: 19 },
      baseball: { popularity: 7, viewership: 65, participation: 11, fantasyParticipation: 17 },
      soccer: { popularity: 6, viewership: 55, participation: 8, fantasyParticipation: 13 },
      hockey: { popularity: 5, viewership: 45, participation: 4, fantasyParticipation: 8 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 80,
        localTeams: ['Baltimore Ravens', 'Washington Commanders'],
        fanBase: 75,
        notes: 'Strong NFL presence with regional teams.'
      },
      nba: {
        presence: false,
        viewership: 70,
        localTeams: ['Washington Wizards'],
        fanBase: 65,
        notes: 'Regional NBA support with nearby team.'
      },
      mlb: {
        presence: true,
        viewership: 65,
        localTeams: ['Baltimore Orioles', 'Washington Nationals'],
        fanBase: 70,
        notes: 'Strong MLB presence with regional teams.'
      },
      nhl: {
        presence: false,
        viewership: 45,
        localTeams: ['Washington Capitals'],
        fanBase: 55,
        notes: 'Regional NHL support with nearby team.'
      },
      mls: {
        presence: true,
        viewership: 55,
        localTeams: ['D.C. United'],
        fanBase: 60,
        notes: 'Regional MLS support with nearby team.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 21,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 380,
      seasonalTrends: ['Peak during NFL season', 'Moderate year-round participation'],
      demographics: {
        ageGroups: {
          under25: 18,
          age25to34: 26,
          age35to44: 29,
          age45to54: 20,
          age55plus: 7
        },
        gender: {
          male: 69,
          female: 31
        }
      },
      notes: 'Moderate fantasy sports market with regional sports focus.'
    },
    gambling: {
      sportsBetting: {
        legal: true,
        online: true,
        retail: true,
        operators: ['DraftKings', 'FanDuel', 'BetMGM'],
        marketSize: 400,
        notes: 'Legal sports betting market with multiple operators.'
      },
      casino: {
        legal: true,
        tribal: false,
        commercial: true,
        locations: 6,
        notes: 'Commercial casinos throughout Maryland.'
      },
      lottery: {
        legal: true,
        games: ['Powerball', 'Mega Millions', 'Maryland Lottery'],
        annualRevenue: 2200,
        notes: 'State lottery with multiple games.'
      }
    }
  },
  demographics: {
    population: 6177224,
    medianAge: 38.8,
    medianIncome: 87000,
    education: {
      highSchool: 90,
      bachelors: 40,
      graduate: 17
    },
    ethnicity: {
      white: 51,
      black: 31,
      hispanic: 11,
      asian: 7,
      other: 1
    },
    urbanRural: {
      urban: 87,
      suburban: 11,
      rural: 2
    },
    notes: 'Affluent state with high education levels and strong technology industry.'
  },
  economy: {
    gdp: 450000,
    unemployment: 3.8,
    majorIndustries: ['Technology', 'Healthcare', 'Biotechnology', 'Federal Government'],
    averageIncome: 87000,
    notes: 'Strong economy with high per-capita income and diverse industries.'
  },
  technology: {
    internetPenetration: 91,
    smartphonePenetration: 87,
    broadbandAccess: 89,
    mobileUsage: 84,
    notes: 'High technology adoption with strong internet infrastructure.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['Moderate licensing costs', 'Regulatory compliance'],
    notes: 'Good market potential with moderate regulatory requirements.'
  },
  political: {
    governmentType: 'democratic',
    politicalStability: 'stable'
  }
};

// Alaska - Season-long fantasy sports allowed (unregulated)
const initialAlaskaData: LocationData = {
  id: 'alaska',
  name: 'Alaska',
  country: 'United States',
  state: 'AK',
  type: 'state',
  status: 'research',
  notes: 'Alaska allows fantasy sports but does not regulate fantasy operators. All major providers permit participation without regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: false,
        onlineSportsBetting: false,
        restrictions: ['Must be 21+'],
        notes: 'Alaska has limited gambling options with no sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Alaska does not regulate fantasy operators in the state.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements currently.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Alaska Statutes Title 5'
      ],
      recentChanges: [
        {
          date: '2022-02',
          description: 'HB 385 introduced to Labor and Commerce Committee',
          impact: 'pending'
        }
      ],
      pendingLegislation: [
        {
          bill: 'HB 385',
          description: 'Would authorize and tax mobile sports gaming and fantasy sports',
          status: 'referred_to_committee',
          committee: 'Labor and Commerce Committee',
          notes: 'If passed, would impose tax on fantasy sports'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as games of skill',
        'Fantasy contests have never been challenged in the state',
        'All major online fantasy sports providers permit participation'
      ],
      notes: 'Alaska does not regulate fantasy operators, so fantasy operators offer contests without regulation.',
      officialDocuments: {
        bills: [
          {
            id: 'ak-hb-385-2022',
            title: 'HB 385 - Mobile Sports Gaming and Fantasy Sports Tax',
            billNumber: 'HB 385',
            year: '2022',
            status: 'referred_to_committee',
            jurisdiction: 'state',
            summary: 'Would authorize and impose tax on mobile sports gaming and fantasy sports',
            fantasySportsImpact: 'Would impose tax on fantasy sports if enacted',
            committee: 'Labor and Commerce Committee',
            dateIntroduced: '2022-02'
          }
        ]
      }
    }
  },
  sports: {
    popularity: {
      americanFootball: { popularity: 8, viewership: 75, participation: 12, fantasyParticipation: 20 },
      basketball: { popularity: 6, viewership: 55, participation: 8, fantasyParticipation: 15 },
      baseball: { popularity: 7, viewership: 60, participation: 6, fantasyParticipation: 12 },
      soccer: { popularity: 5, viewership: 40, participation: 5, fantasyParticipation: 8 },
      hockey: { popularity: 9, viewership: 80, participation: 15, fantasyParticipation: 25 }
    },
    leagues: {
      nfl: {
        presence: true,
        viewership: 75,
        localTeams: [],
        fanBase: 70,
        notes: 'Strong NFL following despite no local team.'
      },
      nba: {
        presence: true,
        viewership: 55,
        localTeams: [],
        fanBase: 60,
        notes: 'Moderate NBA following despite no local team.'
      },
      mlb: {
        presence: true,
        viewership: 60,
        localTeams: [],
        fanBase: 65,
        notes: 'Moderate MLB following despite no local team.'
      },
      nhl: {
        presence: true,
        viewership: 80,
        localTeams: [],
        fanBase: 85,
        notes: 'Strong NHL following despite no local team.'
      },
      mls: {
        presence: true,
        viewership: 40,
        localTeams: [],
        fanBase: 45,
        notes: 'Growing MLS following despite no local team.'
      },
      internationalLeagues: []
    },
    fantasySports: {
      overallParticipation: 20,
      platforms: ['DraftKings', 'FanDuel', 'Yahoo Fantasy'],
      preferredFormats: ['Season-long', 'Daily Fantasy', 'Best Ball'],
      averageSpending: 350,
      seasonalTrends: ['Peak during NFL season', 'Strong hockey interest'],
      demographics: {
        ageGroups: {
          under25: 18,
          age25to34: 25,
          age35to44: 30,
          age45to54: 20,
          age55plus: 7
        },
        gender: {
          male: 72,
          female: 28
        }
      },
      notes: 'Moderate fantasy sports market with strong hockey interest.'
    },
    gambling: {
      sportsBetting: {
        legal: false,
        online: false,
        retail: false,
        operators: [],
        marketSize: 0,
        notes: 'Sports betting not legal in Alaska.'
      },
      casino: {
        legal: false,
        tribal: false,
        commercial: false,
        locations: 0,
        notes: 'No casinos in Alaska.'
      },
      lottery: {
        legal: false,
        games: [],
        annualRevenue: 0,
        notes: 'No state lottery in Alaska.'
      }
    }
  },
  demographics: {
    population: 733391,
    medianAge: 35.0,
    medianIncome: 75000,
    education: {
      highSchool: 92,
      bachelors: 28,
      graduate: 8
    },
    ethnicity: {
      white: 64,
      black: 3,
      hispanic: 7,
      asian: 6,
      native: 15,
      other: 5
    },
    urbanRural: {
      urban: 66,
      suburban: 20,
      rural: 14
    },
    notes: 'Small population with high median income and significant Native American population.'
  },
  economy: {
    gdp: 55000,
    unemployment: 4.5,
    majorIndustries: ['Oil and Gas', 'Fishing', 'Tourism', 'Mining'],
    averageIncome: 75000,
    notes: 'Resource-based economy with high per-capita income.'
  },
  technology: {
    internetPenetration: 85,
    smartphonePenetration: 80,
    broadbandAccess: 75,
    mobileUsage: 75,
    notes: 'Good technology adoption despite remote geography.'
  },
  business: {
    operatingStatus: 'operating',
    targetMarket: true,
    entryBarriers: ['Low regulatory barriers', 'Small population'],
    notes: 'Small but accessible market with minimal regulatory requirements.'
  },
  political: {
    governmentType: 'republican',
    politicalStability: 'stable'
  }
};

// Georgia - Unregulated but generally allowed
const initialGeorgiaData: LocationData = {
  id: 'georgia',
  name: 'Georgia',
  country: 'United States',
  state: 'GA',
  type: 'state',
  status: 'research',
  notes: 'Georgia is unregulated but generally allowed for fantasy sports. All major providers operate in Georgia without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Georgia has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Georgia does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Georgia Code'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Georgia does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// Kentucky - Unregulated but generally allowed
const initialKentuckyData: LocationData = {
  id: 'kentucky',
  name: 'Kentucky',
  country: 'United States',
  state: 'KY',
  type: 'state',
  status: 'research',
  notes: 'Kentucky is unregulated but generally allowed for fantasy sports. HB33 is pending to create regulation framework.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Kentucky has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Kentucky does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Kentucky Revised Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [
        {
          id: 'ky-hb33-2025',
          title: 'Kentucky Fantasy Sports Regulation Bill',
          billNumber: 'HB 33',
          session: '2025',
          status: 'pending',
          description: 'Bill to create framework for Kentucky Horse Racing and Gaming Corporation to regulate fantasy sports'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Kentucky does not formally regulate fantasy contest operations. HB33 pending to create regulation framework.',
      officialDocuments: {
        bills: [
          {
            id: 'ky-hb33-2025',
            title: 'Kentucky Fantasy Sports Regulation Bill',
            billNumber: 'HB 33',
            year: '2025',
            status: 'pending',
            jurisdiction: 'state',
            sponsor: 'Rep.',
            summary: 'Create framework for Kentucky Horse Racing and Gaming Corporation to regulate fantasy sports',
            fantasySportsImpact: 'Would create regulation framework if passed',
            effectiveDate: 'TBD'
          }
        ]
      }
    }
  }
};

// Minnesota - Unregulated but generally allowed
const initialMinnesotaData: LocationData = {
  id: 'minnesota',
  name: 'Minnesota',
  country: 'United States',
  state: 'MN',
  type: 'state',
  status: 'research',
  notes: 'Minnesota is unregulated but generally allowed for fantasy sports. Legislative attempts to legalize DFS have gone nowhere, but regulation bill is pending.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Minnesota has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Minnesota does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Minnesota Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [
        {
          id: 'mn-fantasy-regulation-2025',
          title: 'Minnesota Fantasy Sports Regulation Bill',
          billNumber: 'TBD',
          session: '2025',
          status: 'pending',
          description: 'Bill to provide for fantasy sports regulation'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Minnesota does not formally regulate fantasy contest operations. Legislative attempts to legalize DFS have gone nowhere.',
      officialDocuments: {
        bills: []
      }
    }
  }
};

// Nebraska - Unregulated but generally allowed
const initialNebraskaData: LocationData = {
  id: 'nebraska',
  name: 'Nebraska',
  country: 'United States',
  state: 'NE',
  type: 'state',
  status: 'research',
  notes: 'Nebraska is unregulated but generally allowed for fantasy sports. Regulation bill is pending in legislature.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Nebraska has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Nebraska does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Nebraska Revised Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [
        {
          id: 'ne-fantasy-regulation-2025',
          title: 'Nebraska Fantasy Sports Regulation Bill',
          billNumber: 'TBD',
          session: '2025',
          status: 'pending',
          description: 'Bill to provide for regulation of fantasy sports'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Nebraska does not formally regulate fantasy contest operations. Regulation bill is pending in legislature.',
      officialDocuments: {
        bills: []
      }
    }
  }
};

// New Mexico - Unregulated but generally allowed
const initialNewMexicoData: LocationData = {
  id: 'newmexico',
  name: 'New Mexico',
  country: 'United States',
  state: 'NM',
  type: 'state',
  status: 'research',
  notes: 'New Mexico is unregulated but generally allowed for fantasy sports. No formal regulations for sports gambling or fantasy contests.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'New Mexico has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'New Mexico does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'New Mexico Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'New Mexico does not formally regulate fantasy contest operations. No formal regulations for sports gambling or fantasy contests.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// North Carolina - Unregulated but generally allowed
const initialNorthCarolinaData: LocationData = {
  id: 'northcarolina',
  name: 'North Carolina',
  country: 'United States',
  state: 'NC',
  type: 'state',
  status: 'research',
  notes: 'North Carolina is unregulated but generally allowed for fantasy sports. Sports wagering is regulated through tribes gaming compact.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'North Carolina has comprehensive gambling laws including sports betting through tribal compacts.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'North Carolina does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'North Carolina General Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'North Carolina does not formally regulate fantasy contest operations. Sports wagering regulated through tribes gaming compact.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// North Dakota - Unregulated but generally allowed
const initialNorthDakotaData: LocationData = {
  id: 'northdakota',
  name: 'North Dakota',
  country: 'United States',
  state: 'ND',
  type: 'state',
  status: 'research',
  notes: 'North Dakota is unregulated but generally allowed for fantasy sports. Sports wagering is illegal but fantasy contests are not regulated.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: false,
        onlineGambling: false,
        sportsBetting: false,
        onlineSportsBetting: false,
        restrictions: ['Sports wagering illegal'],
        notes: 'North Dakota does not allow sports wagering but does not regulate fantasy contests.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'North Dakota does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'North Dakota Century Code'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'North Dakota does not formally regulate fantasy contest operations. Sports wagering is illegal but fantasy contests are not regulated.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// Oklahoma - Unregulated but generally allowed
const initialOklahomaData: LocationData = {
  id: 'oklahoma',
  name: 'Oklahoma',
  country: 'United States',
  state: 'OK',
  type: 'state',
  status: 'research',
  notes: 'Oklahoma is unregulated but generally allowed for fantasy sports. All major providers operate in Oklahoma without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Oklahoma has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Oklahoma does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Oklahoma Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Oklahoma does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// Rhode Island - Unregulated but generally allowed
const initialRhodeIslandData: LocationData = {
  id: 'rhodeisland',
  name: 'Rhode Island',
  country: 'United States',
  state: 'RI',
  type: 'state',
  status: 'research',
  notes: 'Rhode Island is unregulated but generally allowed for fantasy sports. All major providers operate in Rhode Island without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Rhode Island has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Rhode Island does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Rhode Island General Laws'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Rhode Island does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// South Carolina - Unregulated but generally allowed
const initialSouthCarolinaData: LocationData = {
  id: 'southcarolina',
  name: 'South Carolina',
  country: 'United States',
  state: 'SC',
  type: 'state',
  status: 'research',
  notes: 'South Carolina is unregulated but generally allowed for fantasy sports. Regulation legislation is pending in legislature.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'South Carolina has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'South Carolina does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'South Carolina Code of Laws'
      ],
      recentChanges: [],
      pendingLegislation: [
        {
          id: 'sc-fantasy-regulation-2025',
          title: 'South Carolina Fantasy Sports Regulation Bill',
          billNumber: 'TBD',
          session: '2025',
          status: 'pending',
          description: 'Bill to provide for regulation of fantasy sports'
        }
      ],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'South Carolina does not formally regulate fantasy contest operations. Regulation legislation is pending in legislature.',
      officialDocuments: {
        bills: []
      }
    }
  }
};

// South Dakota - Unregulated but generally allowed
const initialSouthDakotaData: LocationData = {
  id: 'southdakota',
  name: 'South Dakota',
  country: 'United States',
  state: 'SD',
  type: 'state',
  status: 'research',
  notes: 'South Dakota is unregulated but generally allowed for fantasy sports. All major providers operate in South Dakota without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'South Dakota has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'South Dakota does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'South Dakota Codified Laws'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'South Dakota does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// Utah - Unregulated but generally allowed
const initialUtahData: LocationData = {
  id: 'utah',
  name: 'Utah',
  country: 'United States',
  state: 'UT',
  type: 'state',
  status: 'research',
  notes: 'Utah is unregulated but generally allowed for fantasy sports. All major providers operate in Utah without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: false,
        onlineGambling: false,
        sportsBetting: false,
        onlineSportsBetting: false,
        restrictions: ['Gambling generally prohibited'],
        notes: 'Utah generally prohibits gambling but does not regulate fantasy contests.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Utah does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Utah Code'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Utah does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};

// Wisconsin - Unregulated but generally allowed
const initialWisconsinData: LocationData = {
  id: 'wisconsin',
  name: 'Wisconsin',
  country: 'United States',
  state: 'WI',
  type: 'state',
  status: 'research',
  notes: 'Wisconsin is unregulated but generally allowed for fantasy sports. All major providers operate in Wisconsin without formal regulation.',
  compliance: {
    gambling: {
      generalGambling: {
        legal: true,
        onlineGambling: true,
        sportsBetting: true,
        onlineSportsBetting: true,
        restrictions: ['Must be 21+'],
        notes: 'Wisconsin has comprehensive gambling laws including sports betting.'
      },
      fantasySports: {
        seasonLong: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Season-long fantasy sports are legal without licensing requirements.'
        },
        dailyFantasy: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Daily fantasy sports are legal without licensing requirements.'
        },
        bestBall: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Best ball formats are legal without licensing requirements.'
        },
        otherFormats: {
          legal: true,
          classification: 'game_of_skill',
          requiresLicensing: false,
          requiresRegistration: false,
          restrictions: ['Must be 18+'],
          notes: 'Other fantasy sports formats are legal without licensing requirements.'
        }
      },
      regulatoryFramework: {
        primaryRegulator: 'none',
        regulatoryLevel: 'none',
        enforcementLevel: 'none',
        complianceRequirements: ['None required'],
        licensingFees: 0,
        annualFees: 0,
        reportingRequirements: ['None required'],
        notes: 'Wisconsin does not formally regulate fantasy contest operations.'
      },
      taxation: {
        requiresTaxInfo: false,
        taxRate: 0,
        withholdingRequirements: false,
        reportingFrequency: 'none',
        notes: 'No specific fantasy sports taxation requirements.'
      },
      documentation: {
        requiresDocumentation: false,
        requiredDocuments: [],
        verificationProcess: 'None required',
        renewalFrequency: 'none',
        notes: 'No licensing or registration documentation required.'
      }
    },
    legalFramework: {
      primaryLaws: [
        'Wisconsin Statutes'
      ],
      recentChanges: [],
      pendingLegislation: [],
      courtCases: [],
      legalPrecedents: [
        'Fantasy sports classified as skill-based games',
        'No formal regulation of fantasy contest operations'
      ],
      notes: 'Wisconsin does not formally regulate fantasy contest operations. All major operators offer contests without regulation.',
      officialDocuments: {
        regulations: []
      }
    }
  }
};


// Export all state data
export {
  initialNevadaData,
  initialWashingtonData,
  initialMontanaData,
  initialIdahoData,
  initialOregonData,
  initialArizonaData,
  initialDelawareData,
  initialIllinoisData,
  initialIndianaData,
  initialIowaData,
  initialLouisianaData,
  initialMichiganData,
  initialMississippiData,
  initialNewYorkData,
  initialTennesseeData,
  initialTexasData,
  initialCaliforniaData,
  initialColoradoData,
  initialConnecticutData,
  initialFloridaData,
  initialMassachusettsData,
  initialNewJerseyData,
  initialPennsylvaniaData,
  initialMarylandData,
  initialAlaskaData,
  initialGeorgiaData,
  initialKentuckyData,
  initialMinnesotaData,
  initialNebraskaData,
  initialNewMexicoData,
  initialNorthCarolinaData,
  initialNorthDakotaData,
  initialOklahomaData,
  initialRhodeIslandData,
  initialSouthCarolinaData,
  initialSouthDakotaData,
  initialUtahData,
  initialWisconsinData,
};

// Default list of all states for initial load
export const allStatesData: LocationData[] = [
  initialAlaskaData,
  initialArizonaData,
  initialCaliforniaData,
  initialColoradoData,
  initialConnecticutData,
  initialDelawareData,
  initialFloridaData,
  initialGeorgiaData,
  initialIdahoData,
  initialIllinoisData,
  initialIndianaData,
  initialIowaData,
  initialKentuckyData,
  initialLouisianaData,
  initialMassachusettsData,
  initialMichiganData,
  initialMinnesotaData,
  initialMississippiData,
  initialMontanaData,
  initialNebraskaData,
  initialNevadaData,
  initialNewJerseyData,
  initialNewMexicoData,
  initialNewYorkData,
  initialNorthCarolinaData,
  initialNorthDakotaData,
  initialOklahomaData,
  initialOregonData,
  initialPennsylvaniaData,
  initialRhodeIslandData,
  initialSouthCarolinaData,
  initialSouthDakotaData,
  initialTennesseeData,
  initialTexasData,
  initialUtahData,
  initialWashingtonData,
  initialWisconsinData,
];
