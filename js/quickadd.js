function setupQuickAdd()
{
    const form = document.getElementById('quickAddForm');

    if (!form)
        return;

    form.addEventListener('submit', (event) =>
    {
        event.preventDefault();

        const business = document.getElementById('qa-business').value.trim();

        if (!business)
        {
            alert('Please enter a business name.');
            return;
        }

        const newClient = {
            id: `c${Date.now()}`,
            business,
            category: document.getElementById('qa-category').value,
            contact: document.getElementById('qa-contact').value.trim(),
            info: document.getElementById('qa-info').value.trim(),
            note: document.getElementById('qa-note').value.trim(),
            followup: document.getElementById('qa-followup').value,
            owner: currentUser ? currentUser.name : 'Unassigned',
            keyDates: [],
            timeline: []
        };

        if (!data || !Array.isArray(data.clients))
        {
            data = { clients: [] };
        }

        data.clients.unshift(newClient);
        saveData(data);

        event.target.reset();
        showView('directory');
    });
}

setupQuickAdd();