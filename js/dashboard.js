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

function collectReminderEvents()
{
    const events = [];
    const clients = visibleClients();

    clients.forEach((client) =>
    {
        (client.keyDates || []).forEach((keyDate) =>
        {
            const days = daysUntil(keyDate.date);

            if (days !== null && days <= 30 && days >= 0)
            {
                events.push({
                    tag: days <= 7 ? 'due' : 'upcoming',
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
        item.innerHTML = `
            <div><strong>${escapeHtml(event.who)}</strong></div>
            <div>${escapeHtml(event.what)}</div>
            <div class="detail-sub">${escapeHtml(event.when)}</div>
        `;
        item.addEventListener('click', () => goToClient(event.clientId));
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

    renderCalendar(alerts);
}

function buildAlerts()
{
    renderDashboard();
}

function updateStatistics()
{
    renderDashboard();
}