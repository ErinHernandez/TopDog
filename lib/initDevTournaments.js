// Script to initialize development tournaments in the database
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { devTournamentTemplates } from './tournamentConfig';

export const initializeDevTournaments = async () => {
  try {
    console.log('Initializing development tournaments...');
    
    // Check if tournaments already exist
    const existingTournaments = await getDocs(collection(db, 'devTournaments'));
    
    if (existingTournaments.empty) {
      // Add development tournament templates
      for (const [key, template] of Object.entries(devTournamentTemplates)) {
        const tournament = {
          ...template,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          id: `${key}-dev`
        };
        
        await addDoc(collection(db, 'devTournaments'), tournament);
        console.log(`${template.name} tournament added to development`);
      }
      
      console.log('All development tournaments initialized successfully');
    } else {
      console.log('Development tournaments already exist');
    }
  } catch (error) {
    console.error('Error initializing development tournaments:', error);
  }
};

// Function to add a specific tournament to development
export const addTournamentToDevelopment = async (tournamentKey) => {
  try {
    const template = devTournamentTemplates[tournamentKey];
    if (!template) {
      throw new Error(`Tournament template '${tournamentKey}' not found`);
    }
    
    const tournament = {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      id: `${tournamentKey}-dev`
    };
    
    await addDoc(collection(db, 'devTournaments'), tournament);
    console.log(`${template.name} tournament added to development`);
    
    return tournament;
  } catch (error) {
    console.error('Error adding tournament to development:', error);
    throw error;
  }
}; 