const Trampoline = require('../trampoline');

async function fetchConversations(client, page = 1) {
    const json = await client.fetch(`/conversations?page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.conversations];
    }

    return [
        () => fetchConversations(client, page + 1),
        json.conversations,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchConversations(client)),
};
