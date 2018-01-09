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

async function fetchUserConversations(client, user, page = 1) {
    const json = await client.fetch(`/conversations?user_id=${user}&page=${page}&type=user`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.conversations];
    }

    return [
        () => fetchUserConversations(client, user, page + 1),
        json.conversations,
    ];
}

async function fetchUsersConversations(client, users) {
    if (users.length === 0) {
        return [null, null];
    }

    let json = [];

    await new Trampoline(() => fetchUserConversations(client, users.shift()))
        .onBounce((conversations) => {
            json = json.concat(conversations);
        })
        .jump();

    return [
        () => fetchUsersConversations(client, users),
        json,
    ];
}


module.exports = {
    fetch: (client, users = []) => {
        if (users.length) {
            return new Trampoline(() => fetchUsersConversations(client, [...users]));
        }

        return new Trampoline(() => fetchConversations(client));
    },
};
