const Trampoline = require('../trampoline');

async function fetchConversations(client, id) {
    const json = await client.fetch(`/conversations/${id}`);

    if (!json.conversation_parts || json.conversation_parts.length === 0) {
        return [null, null];
    }

    return [
        null,
        json.conversation_parts.conversation_parts,
    ];
}

module.exports = {
    fetch: (client, conversation) => new Trampoline(() => fetchConversations(client, conversation)),
};
