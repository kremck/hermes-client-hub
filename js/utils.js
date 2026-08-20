/* ===========================
   Date Utilities (js/utils.js)
   =========================== */

function futureDate(daysAhead)
{
    const d = new Date();

    d.setDate(d.getDate() + daysAhead);

    return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo)
{
    const d = new Date();

    d.setDate(d.getDate() - daysAgo);

    return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr)
{
    if (window.dateUtils && typeof dateUtils.daysUntilSafe === 'function') {
        return dateUtils.daysUntilSafe(dateStr);
    }

    if (!dateStr)
        return null;

    const target = new Date(dateStr + "T00:00:00");
    if (isNaN(target))
        return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    return Math.round(
        (target - today) / (1000 * 60 * 60 * 24)
    );
}

function formatWhen(days)
{
    if (days < 0)
        return `${Math.abs(days)}d overdue`;

    if (days === 0)
        return "Today";

    return `in ${days}d`;
}

/* ===========================
   HTML Escaping
   =========================== */

function escapeHtml(str)
{
    return String(str).replace(/[&<>"']/g, function (s)
    {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[s];
    });
}

function getClientActionInfo(clientId)
{
    if (!clientId || !data || !Array.isArray(data.clients)) return { nextAction: null, completedCount: 0 };
    const client = data.clients.find((c) => c.id === clientId);
    if (!client) return { nextAction: null, completedCount: 0 };
    const ads = client.ads || [];

    let completedCount = 0;

    ads.forEach((ad) => {
        const latest = ad.statusHistory && ad.statusHistory.length
            ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0))[0]
            : null;
        if (!latest) return;
        const status = STATUSES.find((s) => s.id === latest.statusId);
        if (!status) return;

        // Count as completed only if latest is Completed and there is NOT an Exported later
        if (status.name.toLowerCase() === 'completed') {
            const hasExported = (ad.statusHistory || []).some((h) => {
                const s = STATUSES.find((st) => st.id === h.statusId);
                return s && s.name.toLowerCase() === 'exported';
            });
            if (!hasExported) completedCount++;
        }
    });

    // Determine nextAction using the existing first-ad logic
    let nextAction = null;
    if (ads.length) {
        const firstAd = [...ads].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
        const latest = firstAd.statusHistory && firstAd.statusHistory.length
            ? [...firstAd.statusHistory].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0))[0]
            : null;
        if (!latest) {
            const initial = STATUSES.find((s) => s.name.toLowerCase() === 'initial contact') || STATUSES[0];
            const next = STATUSES.find((s) => s.sortOrder === (initial.sortOrder || 0) + 1);
            nextAction = next ? next.name : null;
        } else {
            const current = STATUSES.find((s) => s.id === latest.statusId);
            if (current) {
                const nextStatus = STATUSES.find((s) => s.sortOrder === current.sortOrder + 1);
                nextAction = nextStatus ? nextStatus.name : null;
            }
        }
    }

    return { nextAction, completedCount };
}

function getAdNextAction(ad)
{
    if (!ad) return null;
    const latest = ad.statusHistory && ad.statusHistory.length
        ? [...ad.statusHistory].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0))[0]
        : null;

    if (!latest) {
        const initial = STATUSES.find((s) => s.name.toLowerCase() === 'initial contact') || STATUSES[0];
        const next = STATUSES.find((s) => s.sortOrder === (initial.sortOrder || 0) + 1);
        return next ? next.name : null;
    }

    const current = STATUSES.find((s) => s.id === latest.statusId);
    if (!current) return null;
    const currentName = current.name.toLowerCase();
    if (currentName === 'completed' || currentName === 'exported') return null;

    const nextStatus = STATUSES.find((s) => s.sortOrder === current.sortOrder + 1);
    return nextStatus ? nextStatus.name : null;
}