const Trampoline = require('../trampoline');

async function fetchConversations(client, page = 1) {
    const json = await client.fetch(`/conversations?page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.saveConversations];
    }

    return [
        () => fetchConversations(client, page + 1),
        json.saveConversations,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchConversations(client)),
};
