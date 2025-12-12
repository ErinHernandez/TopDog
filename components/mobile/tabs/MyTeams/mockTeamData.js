/**
 * Mock Team Data for MyTeamsTab
 * 
 * This will be replaced with real data from Firebase.
 * Extracted for maintainability and easier testing.
 */

export const MOCK_TEAMS = [
  {
    id: 'the-topdog-1',
    name: 'The TopDog (1)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 42.8, pick: 48 },
        { name: 'Joe Burrow', team: 'CIN', bye: 10, adp: 53.9, pick: 72 }
      ],
      RB: [
        { name: 'Jordan Mason', team: 'MIN', bye: 6, adp: 105.2, pick: 96 },
        { name: 'Bhayshul Tuten', team: 'JAX', bye: 8, adp: 116.6, pick: 97 },
        { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 157.8, pick: 121 },
        { name: 'Jarquez Hunter', team: 'LAR', bye: 8, adp: 198.2, pick: 169 },
        { name: 'B. Croskey-Merritt', team: 'WAS', bye: 12, adp: 215.2, pick: 192 },
        { name: 'Brashard Smith', team: 'KC', bye: 10, adp: 208.8, pick: 193 },
        { name: 'Jerome Ford', team: 'CLE', bye: 9, adp: 207.0, pick: 216 }
      ],
      WR: [
        { name: 'Ja\'Marr Chase', team: 'CIN', bye: 10, adp: 1.1, pick: 1 },
        { name: 'Terry McLaurin', team: 'WAS', bye: 12, adp: 27.8, pick: 24 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 29.7, pick: 25 },
        { name: 'Jerry Jeudy', team: 'CLE', bye: 9, adp: 67.4, pick: 73 },
        { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 115.7, pick: 120 },
        { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 170.8, pick: 168 }
      ],
      TE: [
        { name: 'George Kittle', team: 'SF', bye: 14, adp: 51.6, pick: 49 },
        { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 166.2, pick: 144 },
        { name: 'Mike Gesicki', team: 'CIN', bye: 10, adp: 172.3, pick: 145 }
      ]
    }
  },
  {
    id: 'the-topdog-2',
    name: 'The TopDog (2)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.4, pick: 94 },
        { name: 'Jared Goff', team: 'DET', bye: 8, adp: 116.7, pick: 118 },
        { name: 'J.J. McCarthy', team: 'MIN', bye: 6, adp: 133.1, pick: 123 }
      ],
      RB: [
        { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 28.3, pick: 22 },
        { name: 'Chuba Hubbard', team: 'CAR', bye: 14, adp: 55.3, pick: 51 },
        { name: 'James Conner', team: 'ARI', bye: 8, adp: 65.8, pick: 70 },
        { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 156.6, pick: 147 },
        { name: 'Keaton Mitchell', team: 'BAL', bye: 7, adp: 209.2, pick: 195 },
        { name: 'B. Croskey-Merritt', team: 'WAS', bye: 12, adp: 214.9, pick: 214 }
      ],
      WR: [
        { name: 'Justin Jefferson', team: 'MIN', bye: 6, adp: 3.1, pick: 3 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.9, pick: 27 },
        { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 43.3, pick: 46 },
        { name: 'Darnell Mooney', team: 'ATL', bye: 5, adp: 85.1, pick: 75 },
        { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 111.7, pick: 99 }
      ],
      TE: [
        { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 144.9, pick: 142 },
        { name: 'Dallas Goedert', team: 'PHI', bye: 9, adp: 142.1, pick: 166 },
        { name: 'Brenton Strange', team: 'JAX', bye: 8, adp: 161.4, pick: 171 },
        { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 173.2, pick: 190 }
      ]
    }
  },
  {
    id: 'the-topdog-3',
    name: 'The TopDog (3)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Jaxson Dart', team: 'NYG', bye: 14, adp: 90.3, pick: 78 },
        { name: 'Aaron Rodgers', team: 'PIT', bye: 5, adp: 103.0, pick: 91 },
        { name: 'Daniel Jones', team: 'IND', bye: 11, adp: 114.8, pick: 102 },
        { name: 'Joe Flacco', team: 'CLE', bye: 9, adp: 163.0, pick: 139 }
      ],
      RB: [
        { name: 'Saquon Barkley', team: 'PHI', bye: 9, adp: 7.5, pick: 6 },
        { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 45.2, pick: 54 },
        { name: 'Cam Skattebo', team: 'NYG', bye: 14, adp: 113.6, pick: 115 },
        { name: 'Brashard Smith', team: 'KC', bye: 10, adp: 217.2, pick: 211 },
        { name: 'B. Croskey-Merritt', team: 'WAS', bye: 12, adp: 234.0, pick: 222 }
      ],
      WR: [
        { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 21.8, pick: 19 },
        { name: 'Nico Collins', team: 'HOU', bye: 6, adp: 25.9, pick: 30 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 56.4, pick: 43 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 63.2, pick: 67 },
        { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 184.4, pick: 187 },
        { name: 'Calvin Austin III', team: 'PIT', bye: 5, adp: 220.3, pick: 235 }
      ],
      TE: [
        { name: 'Jonnu Smith', team: 'PIT', bye: 5, adp: 120.1, pick: 126 },
        { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 171.7, pick: 150 },
        { name: 'Brenton Strange', team: 'JAX', bye: 8, adp: 166.7, pick: 163 },
        { name: 'Pat Freiermuth', team: 'PIT', bye: 5, adp: 173.3, pick: 174 },
        { name: 'Theo Johnson', team: 'NYG', bye: 14, adp: 214.2, pick: 198 }
      ]
    }
  },
  {
    id: 'the-topdog-4',
    name: 'The TopDog (4)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.0, pick: 88 },
        { name: 'Bryce Young', team: 'CAR', bye: 14, adp: 157.7, pick: 160 }
      ],
      RB: [
        { name: 'RJ Harvey', team: 'DEN', bye: 12, adp: 54.1, pick: 57 },
        { name: 'David Montgomery', team: 'DET', bye: 8, adp: 70.5, pick: 64 },
        { name: 'Kaleb Johnson', team: 'PIT', bye: 5, adp: 75.3, pick: 81 },
        { name: 'Cam Skattebo', team: 'NYG', bye: 14, adp: 100.2, pick: 105 },
        { name: 'B. Croskey-Merritt', team: 'WAS', bye: 12, adp: 215.0, pick: 208 }
      ],
      WR: [
        { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 9.3, pick: 1.09 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 27.7, pick: 16 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.7, pick: 33 },
        { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 45.0, pick: 40 },
        { name: 'Kyle Williams', team: 'NE', bye: 14, adp: 118.0, pick: 112 },
        { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 169.9, pick: 153 },
        { name: 'Jalen Coker', team: 'CAR', bye: 14, adp: 198.4, pick: 184 }
      ],
      TE: [
        { name: 'Jake Ferguson', team: 'DAL', bye: 10, adp: 142.1, pick: 129 },
        { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 148.9, pick: 136 },
        { name: 'Cade Otton', team: 'TB', bye: 9, adp: 183.6, pick: 177 },
        { name: 'Theo Johnson', team: 'NYG', bye: 14, adp: 211.0, pick: 201 }
      ]
    }
  }
];

/**
 * Get total player count for a team
 */
export function getTotalPlayers(team) {
  return Object.values(team.players).reduce((total, positionPlayers) => total + positionPlayers.length, 0);
}

