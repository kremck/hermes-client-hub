function createClientCard(client)
{
    const card = document.createElement('div');
    card.className = 'client-card card shadow';
    card.innerHTML = `
        <span class="cat">${escapeHtml(client.category || 'Client')}</span>
        <div class="biz">${escapeHtml(client.business)}</div>
        <div class="contact">${escapeHtml(client.contact || '—')}</div>
        ${currentUser && currentUser.role === 'graphics' ? `<div class="contact" style="font-style:italic;">Rep: ${escapeHtml(client.owner || 'Unassigned')}</div>` : ''}
        <div class="meta"><span>${(client.timeline || []).length} campaign(s)</span><span>${(client.keyDates || []).length} key date(s)</span></div>
    `;
    card.addEventListener('click', () => openDetail(client.id));
    return card;
}

function renderDirectory(filter = '')
{
    const grid = document.getElementById('clientGrid');

    if (!grid)
        return;

    grid.innerHTML = '';

    const searchValue = filter.toLowerCase();
    const filteredClients = visibleClients().filter((client) =>
        (client.business || '').toLowerCase().includes(searchValue) ||
        (client.contact || '').toLowerCase().includes(searchValue)
    );

    if (filteredClients.length === 0)
    {
        grid.innerHTML = '<div class="empty">No clients match your search.</div>';
        return;
    }

    filteredClients.forEach((client) =>
    {
        grid.appendChild(createClientCard(client));
    });
}

function search()
{
    const input = document.getElementById('searchInput');

    if (!input)
        return;

    input.addEventListener('input', (event) => renderDirectory(event.target.value));
}

search();