export class TimerManager {
    constructor() {
        this.startTime = null;
        this.interval = null;
    }

    startTimer() {
        this.startTime = Date.now();
        const elapsedTimer = document.getElementById('elapsed-timer');
        
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            elapsedTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.startTime) {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('final-time').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    reset() {
        this.stopTimer();
        this.startTime = null;
        document.getElementById('elapsed-timer').textContent = '0:00';
    }
}