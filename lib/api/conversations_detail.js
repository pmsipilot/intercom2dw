const Trampoline = require('../trampoline');

async function fetchConversationsDetail(client, id, logger = null) {
    try {
        const json = await client.fetch(`/conversations/${id}`);

        return [
            null,
            json,
        ];
    } catch (err) {
        if (logger) {
            logger.log('error', `Could not fetch conversation details for ${id}: ${err}`);
        }

        return [
            null,
            {},
        ];
    }
}

module.exports = {
    fetch: (client, conversation, logger = null) => new Trampoline(
        () => fetchConversationsDetail(client, conversation, logger),
    ),
};
