module.exports = {
    delayUntilLimitReset: async (response) => {
        return new Promise((resolve) => {
            if (response.headers.get('X-RateLimit-Remaining') > 0) {
                resolve();
            } else {
                console.log('Delaying until rate limit resets');
                setTimeout(resolve, (response.headers.get('X-RateLimit-Reset') * 1000) - Date.now());
            }
        });
    },

    bounce: async (trampoline) => {
        let current = await trampoline();

        while (typeof current === 'function') {
            current = await current();
        }

        return current;
    }
};
