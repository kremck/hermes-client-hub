function renderDashboard()
{
    const list = document.getElementById('alertList');

    if (!list)
        return;

    let renewals = 0;
    let keydates = 0;
    let followups = 0;
    const alerts = [];

    visibleClients().forEach((client) =>
    {
        (client.keyDates || []).forEach((keyDate) =>
        {
            const days = daysUntil(keyDate.date);

            if (days !== null && days <= 30 && days >= 0)
            {
                keydates++;
                alerts.push({
                    tag: days <= 7 ? 'due' : 'upcoming',
                    who: client.business,
                    what: keyDate.label,
                    when: formatWhen(days),
                    sortDays: days,
                    clientId: client.id
                });

                if (keyDate.label.toLowerCase().includes('renewal') || keyDate.label.toLowerCase().includes('campaign end'))
                {
                    renewals++;
                }
            }
        });

        if (client.followup)
        {
            const days = daysUntil(client.followup);

            if (days !== null && days <= 14)
            {
                followups++;
                alerts.push({
                    tag: 'followup',
                    who: client.business,
                    what: `Follow up: ${client.note || 'lead follow-up'}`,
                    when: formatWhen(days),
                    sortDays: days,
                    clientId: client.id
                });
            }
        }
    });

    document.getElementById('stat-renewals').textContent = renewals;
    document.getElementById('stat-keydates').textContent = keydates;
    document.getElementById('stat-followups').textContent = followups;
    document.getElementById('stat-total').textContent = visibleClients().length;

    alerts.sort((left, right) => left.sortDays - right.sortDays);
    list.innerHTML = '';

    if (alerts.length === 0)
    {
        list.innerHTML = '<div class="empty">Nothing needs attention right now.</div>';
        return;
    }

    alerts.forEach((alert) =>
    {
        const row = document.createElement('div');
        row.className = 'alert-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <span class="tag ${alert.tag}">${alert.tag === 'due' ? 'Due soon' : alert.tag === 'upcoming' ? 'Upcoming' : 'Follow up'}</span>
            <span class="who">${escapeHtml(alert.who)}</span>
            <span class="what">${escapeHtml(alert.what)}</span>
            <span class="when">${alert.when}</span>
        `;
        row.addEventListener('click', () => goToClient(alert.clientId));
        list.appendChild(row);
    });
}

function buildAlerts()
{
    renderDashboard();
}

function updateStatistics()
{
    renderDashboard();
}