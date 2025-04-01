import { bleachBrands } from '../data/bleach.js';

export class BleachGame {
    constructor() {
        this.chosenBleach = null;
        this.guessHistory = [];
        this.setupGame();
        this.setupEventListeners();
    }

    setupGame() {
        const brands = Object.keys(bleachBrands);
        const randomIndex = Math.floor(Math.random() * brands.length);
        this.chosenBleach = {
            name: brands[randomIndex],
            ph: bleachBrands[brands[randomIndex]][0]
        };
    }

    setupEventListeners() {
        const guessButton = document.getElementById('bleach-guess-button');
        const guessInput = document.getElementById('bleach-guess-input');
        const floatingMenuButton = document.getElementById('floating-menu-button');
        const menuDialog = document.getElementById('menu-dialog');
        const closeMenuButton = document.getElementById('close-menu');

        if (guessButton) {
            guessButton.addEventListener('click', () => this.makeGuess());
        }

        if (guessInput) {
            guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.makeGuess();
                }
            });

            this.setupAutocomplete(guessInput);
        }

        // Menu button handlers
        if (floatingMenuButton) {
            floatingMenuButton.addEventListener('click', () => {
                menuDialog.classList.toggle('hidden');
            });
        }

        if (closeMenuButton) {
            closeMenuButton.addEventListener('click', () => {
                menuDialog.classList.add('hidden');
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuDialog.contains(e.target) && 
                !floatingMenuButton.contains(e.target) && 
                !menuDialog.classList.contains('hidden')) {
                menuDialog.classList.add('hidden');
            }
        });
    }

    setupAutocomplete(inputElement) {
        const brands = Object.keys(bleachBrands);
        
        inputElement.addEventListener('input', (e) => {
            const input = e.target.value.toLowerCase();
            const matches = brands.filter(brand => 
                brand.toLowerCase().includes(input)
            );

            let list = inputElement.parentElement.querySelector('.autocomplete-list');
            if (!list) {
                list = document.createElement('ul');
                list.className = 'autocomplete-list';
                inputElement.parentElement.appendChild(list);
            }

            list.innerHTML = '';
            
            if (input.length >= 2) {
                matches.forEach(match => {
                    const li = document.createElement('li');
                    li.textContent = match;
                    li.addEventListener('click', () => {
                        inputElement.value = match;
                        list.innerHTML = '';
                    });
                    list.appendChild(li);
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target)) {
                const list = inputElement.parentElement.querySelector('.autocomplete-list');
                if (list) {
                    list.innerHTML = '';
                }
            }
        });
    }

    makeGuess() {
        const guessInput = document.getElementById('bleach-guess-input');
        const guess = guessInput.value;

        if (!bleachBrands[guess]) {
            alert('Invalid bleach brand! Please select from the autocomplete list.');
            return;
        }

        const isCorrect = guess === this.chosenBleach.name;
        this.displayResult(guess, isCorrect);
        guessInput.value = '';

        if (isCorrect) {
            setTimeout(() => {
                alert(`Congratulations! You found the correct bleach brand!\nIt was ${this.chosenBleach.name} with pH ${this.chosenBleach.ph}`);
                this.resetGame();
            }, 500);
        }
    }

    displayResult(guess, isCorrect) {
        const tbody = document.getElementById('bleach-results-table').querySelector('tbody');
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = guess;
        row.appendChild(nameCell);
        
        const phCell = document.createElement('td');
        phCell.textContent = bleachBrands[guess][0];
        phCell.classList.add(isCorrect ? 'match' : 'error');
        row.appendChild(phCell);
        
        tbody.insertBefore(row, tbody.firstChild);
    }

    resetGame() {
        const tbody = document.getElementById('bleach-results-table').querySelector('tbody');
        tbody.innerHTML = '';
        this.guessHistory = [];
        this.setupGame();
    }
}