import { names } from '../data/characters.js';

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
            const matches = Object.keys(names).filter(name => 
                name.toLowerCase().startsWith(input)
            );
            
            matches.forEach(match => this.createSuggestion(match, event.target, autocompleteList));
        }
    }

    handleClickOutside(event, input, list) {
        if (!input.contains(event.target)) {
            list.innerHTML = '';
        }
    }

    createSuggestion(match, input, list) {
        const li = document.createElement('li');
        li.textContent = match;
        li.addEventListener('click', () => {
            input.value = match;
            list.innerHTML = '';
        });
        list.appendChild(li);
    }
}