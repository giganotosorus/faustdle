import { names, arcs, haki } from './data/characters.js';
import { compareTraits } from './utils/gameLogic.js';
import seedrandom from 'seedrandom';

let chosenCharacter = null;
let currentSeed = null;
let guessHistory = [];

// Get daily seed based on UTC date
function getDailySeed() {
    const date = new Date();
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

window.startDailyGame = () => {
    currentSeed = getDailySeed();
    document.getElementById('game-setup').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    // Force easy mode (false) for daily challenge
    chosenCharacter = selectRandomCharacter(false, currentSeed);
};

window.startGameWithSeed = () => {
    const seedInput = document.getElementById('seed-input');
    if (!seedInput.value) {
        alert('Please enter a seed value');
        return;
    }
    currentSeed = seedInput.value;
    document.getElementById('game-setup').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    chosenCharacter = selectRandomCharacter(false, currentSeed);
};

window.startGame = (hardMode) => {
    currentSeed = Math.floor(Math.random() * 1000000).toString();
    document.getElementById('game-setup').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');
    chosenCharacter = selectRandomCharacter(hardMode, currentSeed);
};

function generateEmojiGrid() {
    let grid = '';
    // Reverse the order of guessHistory for display
    [...guessHistory].reverse().forEach(guess => {
        guess.forEach(result => {
            if (result.match) {
                grid += '🟩';
            } else if (result.direction === 'up') {
                grid += '⬆️';
            } else if (result.direction === 'down') {
                grid += '⬇️';
            } else {
                grid += '🟥';
            }
        });
        grid += '\n';
    });
    return grid;
}

window.makeGuess = () => {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.toLowerCase();
    
    if (!names[guess]) {
        alert('Invalid name, try again.');
        return;
    }
    
    if (guess === chosenCharacter.name) {
        const results = compareTraits(names[guess], chosenCharacter.traits);
        guessHistory.push(results);
        
        document.getElementById('game-play').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-seed').textContent = currentSeed;
        document.getElementById('emoji-grid').textContent = generateEmojiGrid();
        return;
    }
    
    const results = compareTraits(names[guess], chosenCharacter.traits);
    guessHistory.push(results);
    displayResultsUI(guess, results);
    guessInput.value = '';
};

window.resetGame = () => {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-setup').classList.remove('hidden');
    document.getElementById('seed-input').value = '';
    document.getElementById('results-table').querySelector('tbody').innerHTML = '';
    document.getElementById('emoji-grid').textContent = '';
    chosenCharacter = null;
    currentSeed = null;
    guessHistory = [];
};

function selectRandomCharacter(hardMode, seed) {
    const rng = seedrandom(seed);
    const characterNames = Object.keys(names);
    let selectedName;
    let selectedTraits;
    
    do {
        const index = Math.floor(rng() * characterNames.length);
        selectedName = characterNames[index];
        selectedTraits = names[selectedName];
    } while (!hardMode && selectedTraits[9] === 'h');
    
    return { name: selectedName, traits: selectedTraits };
}

function displayResultsUI(guessName, results) {
    const tbody = document.getElementById('results-table').querySelector('tbody');
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = guessName;
    row.appendChild(nameCell);
    
    results.forEach(result => {
        const cell = document.createElement('td');
        cell.textContent = result.text;
        
        if (result.match) {
            cell.classList.add('match');
        } else if (result.direction) {
            cell.classList.add('error', `hint-${result.direction}`);
        } else {
            cell.classList.add('error');
        }
        
        row.appendChild(cell);
    });
    
    tbody.insertBefore(row, tbody.firstChild);
}

// Setup autocomplete
document.addEventListener('DOMContentLoaded', () => {
    const guessInput = document.getElementById('guess-input');
    const autocompleteList = document.createElement('ul');
    autocompleteList.className = 'autocomplete-list';
    guessInput.parentNode.appendChild(autocompleteList);

    guessInput.addEventListener('input', (e) => {
        const input = e.target.value.toLowerCase();
        autocompleteList.innerHTML = '';
        
        if (input.length >= 2) {
            const matches = Object.keys(names).filter(name => 
                name.toLowerCase().startsWith(input)
            );
            
            matches.forEach(match => {
                const li = document.createElement('li');
                li.textContent = match;
                li.addEventListener('click', () => {
                    guessInput.value = match;
                    autocompleteList.innerHTML = '';
                });
                autocompleteList.appendChild(li);
            });
        }
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!guessInput.contains(e.target)) {
            autocompleteList.innerHTML = '';
        }
    });
});