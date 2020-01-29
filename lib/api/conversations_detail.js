const Trampoline = require('../trampoline');

async function fetchConversations(client, id) {
    const json = await client.fetch(`/conversations/${id}`);

    return [
        null,
        json,
    ];
}

module.exports = {
    fetch: (client, conversation) => new Trampoline(() => fetchConversations(client, conversation)),
};
