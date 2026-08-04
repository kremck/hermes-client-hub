/* ===========================
   Dashboard Functions (js/dashboard.js)
   =========================== */

let calendarViewDate = new Date();
let selectedCalendarDate = null;

function toLocalDateKey(date)
{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

const keyDateTagRules = {
    overdue: (days) => days < 0,
    due: (days) => days <= 7,
    upcoming: (days) => days <= 30
};

function getKeyDateTag(days)
{
    return Object.keys(keyDateTagRules).find((tag) => keyDateTagRules[tag](days)) || 'upcoming';
}

function collectReminderEvents()
{
    const events = [];
    const clients = visibleClients();

    clients.forEach((client) =>
    {
        (client.keyDates || []).forEach((keyDate) =>
        {
            const days = daysUntil(keyDate.date);

            if (days !== null && days <= 30)
            {
                events.push({
                    tag: getKeyDateTag(days),
                    who: client.business,
                    what: keyDate.label,
                    when: formatWhen(days),
                    sortDays: days,
                    clientId: client.id,
                    date: keyDate.date,
                    label: `${keyDate.label} • ${client.business}`
                });
            }
        });

        if (client.followup)
        {
            const days = daysUntil(client.followup);

            if (days !== null && days <= 14)
            {
                events.push({
                    tag: 'followup',
                    who: client.business,
                    what: `Follow up: ${client.note || 'lead follow-up'}`,
                    when: formatWhen(days),
                    sortDays: days,
                    clientId: client.id,
                    date: client.followup,
                    label: `Follow up • ${client.business}`
                });
            }
        }
    });

    events.sort((left, right) => left.sortDays - right.sortDays);

    return events;
}

function daysAgo(dateStr)
{
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return Math.round((today - target) / 86400000);
}

/*Added color coding for different statuses.  I need to change it if it is completed */

function statusColorFor(dateStr)
{
    const diff = daysAgo(dateStr);
    if (diff === null) return 'gray';
    if (diff >= 7) return 'red';
    if (diff >= -6) return 'yellow';
    return 'green';
}

function collectStatusEvents()
{
    const events = [];
    const clients = visibleClients();

    clients.forEach((client) =>
    {
        (client.ads || []).forEach((ad) =>
        {
            (ad.statusHistory || []).forEach((entry) =>
            {
                if (!entry.occurredAt) return;

                events.push({
                    tag: 'status',
                    color: statusColorFor(entry.occurredAt),
                    who: client.business,
                    what: `${statusName(entry.statusId)} — ${ad.title}`,
                    when: entry.occurredAt,
                    clientId: client.id,
                    adId: ad.id,
                    date: entry.occurredAt,
                    label: `${statusName(entry.statusId)} • ${ad.title}`
                });
            });
        });
    });

    return events;
}

function renderCalendar(events)
{
    const calendarGrid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonthLabel');
    const dayList = document.getElementById('calendarDayList');
    const prevButton = document.getElementById('calendarPrev');
    const nextButton = document.getElementById('calendarNext');

    if (!calendarGrid || !monthLabel || !dayList)
        return;

    if (!selectedCalendarDate)
    {
        selectedCalendarDate = new Date();
    }

    if (selectedCalendarDate.getFullYear() !== calendarViewDate.getFullYear() || selectedCalendarDate.getMonth() !== calendarViewDate.getMonth())
    {
        selectedCalendarDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
    }

    if (prevButton)
    {
        prevButton.onclick = () =>
        {
            calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
            selectedCalendarDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
            renderDashboard();
        };
    }

    if (nextButton)
    {
        nextButton.onclick = () =>
        {
            calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
            selectedCalendarDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
            renderDashboard();
        };
    }

    monthLabel.textContent = calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstOfMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
    const lastOfMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0);
    const dayCount = lastOfMonth.getDate();
    const startOffset = firstOfMonth.getDay();

    const eventsByDate = {};

    events.forEach((event) =>
    {
        const key = event.date;

        if (!eventsByDate[key])
            eventsByDate[key] = [];

        eventsByDate[key].push(event);
    });

    calendarGrid.innerHTML = '';

    weekdays.forEach((weekday) =>
    {
        const label = document.createElement('div');
        label.className = 'calendar-weekday';
        label.textContent = weekday;
        calendarGrid.appendChild(label);
    });

    for (let index = 0; index < startOffset; index++)
    {
        const spacer = document.createElement('div');
        spacer.className = 'calendar-empty';
        calendarGrid.appendChild(spacer);
    }

    for (let dayIndex = 1; dayIndex <= dayCount; dayIndex++)
    {
        const dayDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), dayIndex);
        const dayKey = toLocalDateKey(dayDate);
        const dayEvents = eventsByDate[dayKey] || [];
        const statusColors = [...new Set(dayEvents.filter((e) => e.tag === 'status').map((e) => e.color))];
        const button = document.createElement('button');
        const isSelected = selectedCalendarDate && toLocalDateKey(selectedCalendarDate) === dayKey;
        const isToday = toLocalDateKey(new Date()) === dayKey;

        button.type = 'button';
        button.className = 'calendar-day';

        if (isSelected)
            button.classList.add('selected');

        if (isToday)
            button.classList.add('today');

        if (dayEvents.length > 0)
            button.classList.add('has-events');

        button.innerHTML = `
            <span class="calendar-day-number">${dayIndex}</span>
            ${dayEvents.length > 0 ? `<span class="calendar-day-badge">${dayEvents.length}</span>` : ''}
            ${statusColors.length > 0 ? `<span class="calendar-day-dots">${statusColors.map((c) => `<span class="status-dot" style="background:${c}"></span>`).join('')}</span>` : ''}
        `;

        button.addEventListener('click', () =>
        {
            selectedCalendarDate = dayDate;
            renderDashboard();
        });

        calendarGrid.appendChild(button);
    }

    const selectedKey = selectedCalendarDate ? toLocalDateKey(selectedCalendarDate) : null;
    const dayEvents = selectedKey && eventsByDate[selectedKey] ? eventsByDate[selectedKey] : [];

    if (dayEvents.length === 0)
    {
        dayList.innerHTML = '<div class="calendar-day-empty">No reminders for this day.</div>';
        return;
    }

    dayList.innerHTML = '';

    dayEvents.forEach((event) =>
    {
        const item = document.createElement('div');
        item.className = 'calendar-event-item';
        item.style.cursor = 'pointer';

        if (event.tag === 'status') {
            item.classList.add('status-' + event.color);
        }

        item.innerHTML = `
            <div><strong>${escapeHtml(event.who)}</strong></div>
            <div>${escapeHtml(event.what)}</div>
            <div class="detail-sub">${escapeHtml(event.when)}</div>
        `;
        item.addEventListener('click', () => {
            if (event.adId) { currentClientId = event.clientId; openAdDetail(event.adId); }
            else { goToClient(event.clientId); }
        });
        dayList.appendChild(item);
    });
}

function renderDashboard()
{
    const list = document.getElementById('alertList');

    if (!list)
        return;

    let renewals = 0;
    let keydates = 0;
    let followups = 0;
    const alerts = collectReminderEvents();
    const clients = visibleClients();

    clients.forEach((client) =>
    {
        (client.keyDates || []).forEach((keyDate) =>
        {
            const days = daysUntil(keyDate.date);

            if (days !== null && days <= 30 && days >= 0)
            {
                keydates++;

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
            }
        }
    });

    document.getElementById('stat-renewals').textContent = renewals;
    document.getElementById('stat-keydates').textContent = keydates;
    document.getElementById('stat-followups').textContent = followups;
    document.getElementById('stat-total').textContent = clients.length;

    list.innerHTML = '';

    if (alerts.length === 0)
    {
        list.innerHTML = '<div class="empty">Nothing needs attention right now.</div>';
    }
    else
    {
        alerts.forEach((alert) =>
        {
            const row = document.createElement('div');
            row.className = 'alert-row';
            row.style.cursor = 'pointer';

            const client = data.clients.find((c) => c.id === alert.clientId);
            const adRows = (client?.ads || []).map((ad) => {
                const latest = ad.statusHistory && ad.statusHistory.length
                    ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0]
                    : null;
                const statusText = latest ? statusName(latest.statusId) : 'No status yet';
                const ageText = latest && latest.occurredAt ? ` · ${formatWhen(daysUntil(latest.occurredAt))}` : '';
                return `<div class="datefield"><span>${escapeHtml(ad.title)}</span><span class="utility">${escapeHtml(statusText + ageText)}</span></div>`;
            }).join('');

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:14px; flex:1 1 100%;">
                    <span class="tag ${alert.tag}">${alert.tag === 'due' ? 'Due soon' : alert.tag === 'upcoming' ? 'Upcoming' : alert.tag === 'overdue' ? 'Overdue' : 'Follow up'}</span>
                    <span class="who">${escapeHtml(alert.who)}</span>
                    <span class="what">${escapeHtml(alert.what)}</span>
                    
                </div>
                ${adRows ? `<details class="add-inline" open onclick="event.stopPropagation()" style="flex:1 1 100%;"><summary>Ad statuses</summary>${adRows}</details>` : ''}
            `;
            row.addEventListener('click', () => goToClient(alert.clientId));
            list.appendChild(row);
        });
    }

    renderCalendar([...alerts, ...collectStatusEvents()]);
}

/*removed this line from the row.innerHTML above:

<span class="when">${alert.when}</span>

*/

function buildAlerts()
{
    renderDashboard();
}

function updateStatistics()
{
    renderDashboard();
}