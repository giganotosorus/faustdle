export class ResultsManager {
    displayResults(guessName, results) {
        console.log('Displaying results for guess', guessName);
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

    generateEmojiGrid(guessHistory) {
        return [...guessHistory].reverse().map(guess => {
            return guess.map(result => {
                if (result.match) {
                    return '🟩';
                } else if (result.direction === 'up') {
                    return '⬆️';
                } else if (result.direction === 'down') {
                    return '⬇️';
                } else {
                    return '🟥';
                }
            }).join('');
        }).join('\n');
    }

    copyResultsTable() {
        const originalTable = document.getElementById('results-table');
        const finalTable = document.getElementById('results-table-final');
        const tbody = finalTable.querySelector('tbody');
        tbody.innerHTML = originalTable.querySelector('tbody').innerHTML;
    }

    clearResults() {
        document.getElementById('results-table').querySelector('tbody').innerHTML = '';
        document.getElementById('results-table-final').querySelector('tbody').innerHTML = '';
        document.getElementById('emoji-grid').textContent = '';
    }
}