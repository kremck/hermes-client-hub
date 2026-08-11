/* ===========================
   Directory Functions (js/directory.js)
   =========================== */



   
function createClientCard(client)
{
    const card = document.createElement('div');
    card.className = 'client-card card shadow';

    const info = (typeof getClientActionInfo === 'function') ? getClientActionInfo(client.id) : { nextAction: null, completedCount: 0 };
    const tagParts = [];
    if (info.completedCount && info.completedCount > 0) tagParts.push(`Completed ${info.completedCount}`);
    if (info.nextAction) tagParts.push(`Next: ${info.nextAction}`);
    const actionTag = tagParts.length ? tagParts.join(' · ') : null;
    const actionClass = info.nextAction ? String(info.nextAction).toLowerCase().replace(/\s+/g, '') : (info.completedCount ? 'completed' : '');

    const adRows = (client.ads || []).map((ad) => {
        const latest = ad.statusHistory && ad.statusHistory.length
            ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
            : null;
        return `<div class="datefield"><span>${escapeHtml(ad.title)}</span><span class="utility">${latest ? escapeHtml(statusName(latest.statusId)) : 'No status yet'}</span></div>`;
    }).join('');

    card.innerHTML = `
        <span class="cat">${escapeHtml(client.relationship || client.businessType || 'Client')}</span>
        <div class="biz">${escapeHtml(client.business)}${actionTag ? `<span class="action-tag tag ${escapeHtml(actionClass)}">${escapeHtml(actionTag)}</span>` : ''}</div>
        <div class="contact">${escapeHtml(client.contact || ', ')}</div>
        <div class="contact" style="font-style:italic;">Rep: ${escapeHtml(client.owner || 'Unassigned')}</div>
        <div class="meta"><span>${(client.ads || []).length} project(s)</span><span>${(client.keyDates || []).length} key date(s)</span></div>
        ${adRows ? `<details class="add-inline" onclick="event.stopPropagation()"><summary>Ad statuses</summary>${adRows}</details>` : ''}
    `;
    card.addEventListener('click', () => openDetail(client.id));
    return card;
}

/* renderDirectory() and search() unchanged */

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