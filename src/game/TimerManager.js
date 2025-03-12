/**
 * Manages game timing functionality.
 * Handles starting, stopping, and resetting the game timer.
 */
export class TimerManager {
    constructor() {
        this.startTime = null;    // Start time timestamp
        this.interval = null;     // Timer interval reference
    }

    /**
     * Starts the game timer and updates the display.
     * Updates timer display every second.
     */
    startTimer() {
        this.startTime = Date.now();
        const elapsedTimer = document.getElementById('elapsed-timer');
        
        // Clear any existing timer
        if (this.interval) {
            clearInterval(this.interval);
        }

        // Update timer display every second
        this.interval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            elapsedTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Stops the timer and displays final time.
     */
    stopTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Calculate and display final time
        if (this.startTime) {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('final-time').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Resets the timer to initial state.
     */
    reset() {
        this.stopTimer();
        this.startTime = null;
        document.getElementById('elapsed-timer').textContent = '0:00';
    }
}