/* ===========================
   Date Utilities
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
    if (!dateStr)
        return null;

    const target = new Date(dateStr + "T00:00:00");

    const today = new Date();

    today.setHours(0, 0, 0, 0);

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