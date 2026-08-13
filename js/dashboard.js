/* ===========================
   Dashboard Functions (js/dashboard.js)
   =========================== */

let calendarViewDate = new Date();
let selectedCalendarDate = null;

function toLocalDateKey(date)
{
    if (window.dateUtils && typeof dateUtils.toLocalDateKey === 'function') {
        return dateUtils.toLocalDateKey(date);
    }

    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    d.setHours(0,0,0,0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

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

function getLatestStatusEntry(ad)
{
    if (!ad?.statusHistory?.length) return null;
    return [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0];
}

function getAdTagInfo(latest)
{
    const days = latest && latest.occurredAt ? daysUntil(latest.occurredAt) : null;
    const tag = days !== null ? getKeyDateTag(days) : null;
    const text = days === null
        ? ''
        : days === 0
            ? 'Today'
            : days < 0
                ? `${Math.abs(days)} days past`
                : `${days} days coming up`;
    const className = days === 0 ? 'followup' : tag;
    const title = days === null ? '' : getAlertTagTitle({ tag, sortDays: days });

    return { tag, text, className, title };
}

function getAlertTagTitle(alert)
{
    const days = Number.isFinite(alert?.sortDays) ? alert.sortDays : null;

    if (alert?.tag === 'overdue')
    {
        return days === null ? 'Overdue' : `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    }

    if (alert?.tag === 'due')
    {
        return days === null ? 'Due soon' : `Due in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (alert?.tag === 'upcoming')
    {
        return days === null ? 'Upcoming' : `Upcoming in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (alert?.tag === 'followup')
    {
        if (days === null) return 'Follow up';
        return days < 0
            ? `Follow up overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
            : `Follow up in ${days} day${days === 1 ? '' : 's'}`;
    }

    return 'Alert';
}

function getReminderCounts(clients)
{
    let renewals = 0;
    let keydates = 0;
    let followups = 0;

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

    return { renewals, keydates, followups };
}

function createAdRowHtml(ad)
{
    const latest = getLatestStatusEntry(ad);
    const statusText = latest ? statusName(latest.statusId) : 'No status yet';
    const ageText = latest && latest.occurredAt ? ` · ${formatWhen(daysUntil(latest.occurredAt))}` : '';
    const nextAction = (typeof getAdNextAction === 'function') ? getAdNextAction(ad) : null;
    const nextText = nextAction ? ` <span class="next-action">Next: ${escapeHtml(nextAction)}</span>` : '';
    const tagInfo = getAdTagInfo(latest);

    return `<div class="datefield">
                <span class="ad-line">
                    <span class="ad-title">${escapeHtml(ad.title)}</span>
                    ${tagInfo.tag ? `<span class="ad-tag ${escapeHtml(tagInfo.className)}" title="${escapeHtml(tagInfo.title)}">${escapeHtml(tagInfo.text)}</span>` : ''}
                </span>
                <span class="utility">${escapeHtml(statusText + ageText)}${nextText}</span>
            </div>`;
}

function groupEventsByDate(events)
{
    return events.reduce((map, event) => {
        const key = event.date;
        if (!map[key]) map[key] = [];
        map[key].push(event);
        return map;
    }, {});
}

function createCalendarDayButton(dayDate, dayIndex, dayEvents)
{
    const dayKey = toLocalDateKey(dayDate);
    const statusColors = [...new Set(dayEvents.filter((e) => e.tag === 'status').map((e) => e.color))];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';

    if (selectedCalendarDate && toLocalDateKey(selectedCalendarDate) === dayKey)
        button.classList.add('selected');

    if (toLocalDateKey(new Date()) === dayKey)
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

    return button;
}

function createCalendarEventItem(event)
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

    return item;
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
                    source: 'keydate',
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
    if (window.dateUtils && typeof dateUtils.daysAgoSafe === 'function') {
        return dateUtils.daysAgoSafe(dateStr);
    }

    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target)) return null;
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

    const eventsByDate = groupEventsByDate(events);
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
        calendarGrid.appendChild(createCalendarDayButton(dayDate, dayIndex, dayEvents));
    }

    const selectedKey = selectedCalendarDate ? toLocalDateKey(selectedCalendarDate) : null;
    const dayEvents = selectedKey && eventsByDate[selectedKey] ? eventsByDate[selectedKey] : [];

    if (dayEvents.length === 0)
    {
        dayList.innerHTML = '<div class="calendar-day-empty">No reminders for this day.</div>';
        return;
    }

    dayList.innerHTML = '';

    dayEvents.forEach((event) => dayList.appendChild(createCalendarEventItem(event)));
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
    const counts = getReminderCounts(clients);

    document.getElementById('stat-renewals').textContent = counts.renewals;
    document.getElementById('stat-keydates').textContent = counts.keydates;
    document.getElementById('stat-followups').textContent = counts.followups;
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
            const node = document.createElement('li');
            node.className = `alert-node${alert.source === 'keydate' ? ' keydate' : ''}`;

            const row = document.createElement('div');
            row.className = 'alert-row';
            row.style.cursor = 'pointer';

            const client = data.clients.find((c) => c.id === alert.clientId);

            const adRows = (client?.ads || []).map(createAdRowHtml).join('');

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:14px; flex:1 1 100%;">
                    <span class="who">${escapeHtml(alert.who)}</span>
                    <span class="what">${escapeHtml(alert.what)}</span>
                </div>
                ${adRows ? `<details class="add-inline" open onclick="event.stopPropagation()" style="flex:1 1 100%;"><summary>Ad statuses</summary>${adRows}</details>` : ''}
            `;
            row.addEventListener('click', () => goToClient(alert.clientId));
            node.appendChild(row);
            list.appendChild(node);
        });
    }

    renderCalendar([...alerts, ...collectStatusEvents()]);
}

/*removed this line from the row.innerHTML above:

<span class="when">${alert.when}</span>

*/

