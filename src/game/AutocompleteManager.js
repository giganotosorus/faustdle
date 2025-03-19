import { names } from '../data/characters.js';
import { alternateNames } from '../data/alternateNames.js';

export class AutocompleteManager {
    setupAutocomplete(inputElement) {
        const autocompleteList = document.createElement('ul');
        autocompleteList.className = 'autocomplete-list';
        inputElement.parentNode.appendChild(autocompleteList);

        inputElement.addEventListener('input', (e) => this.handleInput(e, autocompleteList));
        document.addEventListener('click', (e) => this.handleClickOutside(e, inputElement, autocompleteList));
    }

    handleInput(event, autocompleteList) {
        const input = event.target.value.toLowerCase();
        autocompleteList.innerHTML = '';
        
        if (input.length >= 2) {
            // Get matches from original names
            const directMatches = Object.keys(names).filter(name => 
                name.toLowerCase().startsWith(input)
            );

            // Get matches from alternate names
            const alternateMatches = new Set();
            for (const [originalName, alternates] of Object.entries(alternateNames)) {
                // Add alternates that match the input
                alternates.forEach(alt => {
                    if (alt.toLowerCase().startsWith(input)) {
                        alternateMatches.add(originalName);
                    }
                });
            }

            // Combine and deduplicate matches
            const allMatches = new Set([...directMatches, ...alternateMatches]);
            
            // Create suggestions for all matches
            allMatches.forEach(match => {
                this.createSuggestion(match, event.target, autocompleteList);
                
                // Add alternate names as additional suggestions
                if (alternateNames[match]) {
                    alternateNames[match].forEach(alt => {
                        if (alt.toLowerCase().startsWith(input)) {
                            this.createSuggestion(alt, event.target, autocompleteList, match);
                        }
                    });
                }
            });
        }
    }

    handleClickOutside(event, input, list) {
        if (!input.contains(event.target)) {
            list.innerHTML = '';
        }
    }

    createSuggestion(match, input, list, originalName = null) {
        const li = document.createElement('li');
        li.textContent = match;
        
        if (originalName) {
            li.classList.add('alternate-name');
            li.title = `Alternative name for ${originalName}`;
        }
        
        li.addEventListener('click', () => {
            // If it's an alternate name, use the original name
            input.value = originalName || match;
            list.innerHTML = '';
        });
        
        list.appendChild(li);
    }
}