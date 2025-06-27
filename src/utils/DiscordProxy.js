/**
 * Discord Proxy Utility for handling Supabase requests in Discord activities
 * Routes requests through Discord's proxy to bypass CSP restrictions
 */
export class DiscordProxy {
    constructor(discordSDK) {
        this.discordSDK = discordSDK;
        this.isDiscordActivity = window.location.href.includes('discordsays.com');
        this.discordAppId = '1351722811718373447';
    }

    /**
     * Make a proxied request through Discord's proxy system
     */
    async fetch(url, options = {}) {
        if (!this.isDiscordActivity || !this.discordSDK) {
            // Not in Discord, use regular fetch
            return fetch(url, options);
        }

        try {
            // Convert URL to Discord proxy format
            const proxyUrl = this.getProxyUrl(url);
            console.log('Making proxied request:', {
                original: url,
                proxied: proxyUrl
            });
            
            // Make the request through Discord's proxy
            const response = await fetch(proxyUrl, {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Discord-Proxy': 'true'
                }
            });

            console.log('Proxy response:', response.status, response.statusText);
            return response;
        } catch (error) {
            console.error('Discord proxy request failed:', error);
            throw error;
        }
    }

    /**
     * Convert a regular URL to a Discord proxy URL
     */
    getProxyUrl(originalUrl) {
        // Discord proxy format: https://[app-id].discordsays.com/.proxy/[encoded-url]
        const encodedUrl = encodeURIComponent(originalUrl);
        return `https://${this.discordAppId}.discordsays.com/.proxy/${encodedUrl}`;
    }

    /**
     * Check if we're in a Discord activity environment
     */
    isInDiscord() {
        return this.isDiscordActivity;
    }
}