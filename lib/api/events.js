const Trampoline = require('../trampoline');

async function fetchEvents(client, user, page = 1) {
    const json = await client.fetch(`/events?type=user&intercom_user_id=${user}&page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.saveEvents];
    }

    return [
        () => fetchEvents(client, user, page + 1),
        json.saveEvents,
    ];
}

module.exports = {
    fetch: (client, user) => new Trampoline(() => fetchEvents(client, user)),
};
