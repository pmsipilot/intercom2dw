const Trampoline = require('../trampoline');

async function fetchEvents(client, user, url = null) {
    const json = await client.fetch(url || `/events?type=user&intercom_user_id=${user}`);

    if (!json.pages || !json.pages.next) {
        return [null, json.events];
    }

    return [
        () => fetchEvents(client, user, json.pages.next),
        json.events,
    ];
}

module.exports = {
    fetch: (client, user) => new Trampoline(() => fetchEvents(client, user)),
};
