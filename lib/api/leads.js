const Trampoline = require('../trampoline');

async function fetchLeads(client, scroll = null) {
    const json = await client.fetch(`/contacts/scroll${scroll ? `?scroll_param=${scroll}` : ''}`);

    if (json.contacts.length === 0) {
        return [null, null];
    }

    return [
        () => fetchLeads(client, json.scroll_param),
        json.contacts,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchLeads(client)),
};
