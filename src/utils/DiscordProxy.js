/**
 * Discord Proxy Utility for handling external requests in Discord activities
 * Uses Discord's built-in proxy system to bypass CSP restrictions
 */
export class DiscordProxy {
    constructor(discordSDK) {
        this.discordSDK = discordSDK;
        this.isDiscordActivity = this.detectDiscordEnvironment();
        this.discordAppId = '1351722811718373447';
        this.proxyBaseUrl = `https://${this.discordAppId}.discordsays.com`;
        
        console.log('DiscordProxy initialized:', {
            isDiscordActivity: this.isDiscordActivity,
            hasSDK: !!this.discordSDK,
            proxyBaseUrl: this.proxyBaseUrl
        });
    }

    /**
     * Detect if we're running in Discord's activity environment
     */
    detectDiscordEnvironment() {
        const hostname = window.location.hostname;
        const isDiscordDomain = hostname.includes('discordsays.com');
        const hasDiscordParent = window.parent !== window;
        const hasDiscordUserAgent = navigator.userAgent.includes('Discord');
        
        console.log('Discord environment detection:', {
            hostname,
            isDiscordDomain,
            hasDiscordParent,
            hasDiscordUserAgent
        });
        
        return isDiscordDomain || hasDiscordParent || hasDiscordUserAgent;
    }

    /**
     * Main fetch method that routes through Discord proxy
     */
    async fetch(url, options = {}) {
        if (!this.isDiscordActivity) {
            console.log('Not in Discord, using regular fetch');
            return fetch(url, options);
        }

        console.log('Discord proxy fetch requested for:', url);

        // Try multiple proxy methods in order of preference
        const methods = [
            () => this.fetchViaSDKCommands(url, options),
            () => this.fetchViaProxyEndpoint(url, options),
            () => this.fetchViaDirectProxy(url, options)
        ];

        let lastError;
        for (const method of methods) {
            try {
                const response = await method();
                console.log('Proxy method succeeded:', response.status);
                return response;
            } catch (error) {
                console.warn('Proxy method failed, trying next:', error.message);
                lastError = error;
            }
        }

        // All proxy methods failed
        console.error('All proxy methods failed, last error:', lastError);
        throw new Error(`Discord proxy failed: ${lastError.message}`);
    }

    /**
     * Method 1: Use Discord SDK commands.fetch if available
     */
    async fetchViaSDKCommands(url, options) {
        if (!this.discordSDK?.commands?.fetch) {
            throw new Error('Discord SDK commands.fetch not available');
        }

        console.log('Trying Discord SDK commands.fetch');
        return await this.discordSDK.commands.fetch(url, options);
    }

    /**
     * Method 2: Use Discord's .proxy/ endpoint
     */
    async fetchViaProxyEndpoint(url, options) {
        console.log('Trying Discord proxy endpoint');
        
        // Convert URL to proxy format
        const proxyUrl = this.convertToProxyUrl(url);
        console.log('Proxy URL:', proxyUrl);

        const proxyOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-Discord-Proxy': 'true',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return await fetch(proxyUrl, proxyOptions);
    }

    /**
     * Method 3: Direct proxy with different URL encoding
     */
    async fetchViaDirectProxy(url, options) {
        console.log('Trying direct proxy method');
        
        // Try alternative proxy URL format
        const alternativeProxyUrl = this.convertToAlternativeProxyUrl(url);
        console.log('Alternative proxy URL:', alternativeProxyUrl);

        return await fetch(alternativeProxyUrl, {
            ...options,
            mode: 'cors',
            credentials: 'omit'
        });
    }

    /**
     * Convert URL to Discord proxy format
     * Format: https://[app-id].discordsays.com/.proxy/[encoded-url]
     */
    convertToProxyUrl(originalUrl) {
        try {
            // Remove protocol and encode
            const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
            
            // Use base64 encoding
            const encodedUrl = btoa(urlWithoutProtocol);
            
            return `${this.proxyBaseUrl}/.proxy/${encodedUrl}`;
        } catch (error) {
            console.error('Failed to convert to proxy URL:', error);
            return originalUrl;
        }
    }

    /**
     * Alternative proxy URL format
     */
    convertToAlternativeProxyUrl(originalUrl) {
        try {
            // Try URL encoding instead of base64
            const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
            const encodedUrl = encodeURIComponent(urlWithoutProtocol);
            
            return `${this.proxyBaseUrl}/proxy/${encodedUrl}`;
        } catch (error) {
            console.error('Failed to convert to alternative proxy URL:', error);
            return originalUrl;
        }
    }

    /**
     * Check if we're in Discord environment
     */
    isInDiscord() {
        return this.isDiscordActivity;
    }

    /**
     * Get proxy status for debugging
     */
    getProxyStatus() {
        return {
            isDiscordActivity: this.isDiscordActivity,
            hasSDK: !!this.discordSDK,
            hasSDKFetch: !!(this.discordSDK?.commands?.fetch),
            proxyBaseUrl: this.proxyBaseUrl,
            currentUrl: window.location.href
        };
    }
}