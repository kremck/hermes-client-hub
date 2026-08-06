/* ===========================
   Navigation (js/navigation.js)
   =========================== */

function showView(name = 'dashboard')
{
    const targetView = document.getElementById(`view-${name}`);
    if (!targetView) return;

    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));

    targetView.classList.add('active');

    const navButton = document.querySelector(`.nav-btn[data-view="${name}"]`);
    if (navButton) navButton.classList.add('active');

    if (name === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    else if (name === 'directory' && typeof renderDirectory === 'function') renderDirectory();
    else if (name === 'users' && typeof renderUsersList === 'function') renderUsersList();
    else if (name === 'projects' && typeof renderProjectsList === 'function') renderProjectsList();
}

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

    const backToClientButton = document.getElementById('backToClientDetail');
    if (backToClientButton)
    {
        backToClientButton.addEventListener('click', () => backToClientDetail());
    }

    const backToProjectsButton = document.getElementById('backToProjects');
    if (backToProjectsButton)
    {
        backToProjectsButton.addEventListener('click', backToProjects);
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