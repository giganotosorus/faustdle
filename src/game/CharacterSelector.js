import { names } from '../data/characters.js';

export class CharacterSelector {
    selectRandomCharacter(mode, seed) {
        console.log('Selecting random character in mode:', mode);
        try {
            const rng = new Math.seedrandom(seed);
            const characterNames = Object.keys(names);
            let selectedName;
            let selectedTraits;
            let attempts = 0;
            const maxAttempts = 1000;
            
            do {
                const index = Math.floor(rng() * characterNames.length);
                selectedName = characterNames[index];
                selectedTraits = names[selectedName];
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Could not find a valid character for the selected mode');
                }
            } while (!this.isValidCharacterForMode(selectedTraits[9], mode));
            
            return { name: selectedName, traits: selectedTraits };
        } catch (error) {
            console.warn('Error selecting random character:', error);
            throw error;
        }
    }

    isValidCharacterForMode(difficulty, mode) {
        switch(mode) {
            case 'normal':
                return difficulty === 'E';
            case 'hard':
                return difficulty === 'E' || difficulty === 'H';
            case 'filler':
                return true;
            default:
                return difficulty === 'E';
        }
    }

    findCharacterName(input) {
        const lowerInput = input.toLowerCase();
        return Object.keys(names).find(name => 
            name.toLowerCase() === lowerInput
        ) || null;
    }
}