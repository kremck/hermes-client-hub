function setupNavigation()
{
    document.querySelectorAll('.nav-btn').forEach((btn) =>
    {
        btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    const backButton = document.getElementById('backToDirectory');

    if (backButton)
    {
        backButton.addEventListener('click', backToDirectory);
    }
}

function showView(name = 'dashboard')
{
    const targetView = document.getElementById(`view-${name}`);

    if (!targetView)
        return;

    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));

    targetView.classList.add('active');

    const navButton = document.querySelector(`.nav-btn[data-view="${name}"]`);

    if (navButton)
    {
        navButton.classList.add('active');
    }

    if (name === 'dashboard' && typeof renderDashboard === 'function')
    {
        renderDashboard();
    }
    else if (name === 'directory' && typeof renderDirectory === 'function')
    {
        renderDirectory();
    }
    else if (name === 'users' && typeof renderUsersList === 'function')
    {
        renderUsersList();
    }
}

function openDashboard()
{
    showView('dashboard');
}

function openDirectory()
{
    showView('directory');
}

function openDetail(id)
{
    if (id !== undefined && id !== null)
    {
        currentClientId = id;
    }

    const detailView = document.getElementById('view-detail');

    if (!detailView)
        return;

    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    detailView.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));

    const clientsNavButton = document.querySelector('.nav-btn[data-view="directory"]');

    if (clientsNavButton)
    {
        clientsNavButton.classList.add('active');
    }

    const breadcrumb = document.getElementById('d-breadcrumb');

    if (breadcrumb && data && Array.isArray(data.clients) && currentClientId !== null)
    {
        const client = data.clients.find((entry) => entry.id === currentClientId);

        if (client)
        {
            breadcrumb.textContent = `Clients > ${client.business || 'Client'}`;
        }
    }

    if (typeof renderDetail === 'function')
    {
        renderDetail(currentClientId);
    }
}

function backToDirectory()
{
    showView('directory');
}

setupNavigation();

window.addEventListener('load', () =>
{
    showView('dashboard');
});