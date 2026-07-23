function populateLoginDropdown(){
    const select = document.getElementById('login-user');
    if (!select) return;
    const noUsersMsg = document.getElementById('noUsersMsg');
    const loginForm = document.getElementById('loginForm');
    select.innerHTML = '';
    if (!users || users.length === 0) {
        noUsersMsg && (noUsersMsg.style.display = 'block');
        loginForm && (loginForm.style.display = 'none');
        return;
    }
    noUsersMsg && (noUsersMsg.style.display = 'none');
    loginForm && (loginForm.style.display = 'block');
    users.forEach((user) => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = `${user.name} (${user.role === 'graphics' ? 'Graphics' : 'Sales'})`;
        select.appendChild(option);
    });
}

function renderUsersList(){
    const list = document.getElementById('usersList');
    if (!list) return;
    list.innerHTML = '';
    if (!users || users.length === 0) { list.innerHTML = '<div class="empty">No registered users yet.</div>'; return; }
    users.forEach((user, index) => {
        const row = document.createElement('div');
        row.className = 'alert-row';
        row.innerHTML = `
            <span class="tag ${user.role === 'graphics' ? 'followup' : 'upcoming'}">${user.role === 'graphics' ? 'Graphics' : 'Sales'}</span>
            <span class="who">${escapeHtml(user.name)}</span>
            <span class="what"></span>
            <button type="button" class="btn-secondary-outline btn-small" data-delete-user="${index}">Delete</button>
        `;
        list.appendChild(row);
    });
    list.querySelectorAll('[data-delete-user]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-delete-user'), 10);
            const selectedUser = users[index];
            if (selectedUser && confirm(`Remove ${selectedUser.name} from registered users? Their existing clients stay on file, just unassigned from a logged-in user.`)) {
                users.splice(index, 1); saveUsers(users); populateLoginDropdown(); renderUsersList();
            }
        });
    });
}

function registerUser(){
    document.getElementById('registerUserForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('ru-name').value.trim();
        const role = document.getElementById('ru-role').value;
        if (!name) return;
        if (users.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) { alert('That user is already registered.'); return; }
        users.push({ name, role }); saveUsers(users); populateLoginDropdown(); renderUsersList(); event.target.reset();
    });
}

function quickRegister(){
    document.getElementById('quickRegisterForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('qr-name').value.trim();
        const role = document.getElementById('qr-role').value;
        if (!name) return;
        if (users.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) { alert('That user is already registered.'); return; }
        users.push({ name, role }); saveUsers(users); populateLoginDropdown(); renderUsersList(); currentUser = { name, role }; sessionStorage.setItem('clientHubUser', JSON.stringify(currentUser)); enterApp(); event.target.reset();
    });
}

function deleteUser(index){ if (index === undefined || index === null) return; if (users[index]) { users.splice(index, 1); saveUsers(users); populateLoginDropdown(); renderUsersList(); }}

async function tryLoadUsersFromFile(){
    if (!USERS_FILE_PATH) return null;
    try { const response = await fetch(USERS_FILE_PATH); if (!response.ok) return null; const parsed = await response.json(); return Array.isArray(parsed) ? parsed : null; }
    catch (error) { console.warn('Could not load users file from USERS_FILE_PATH:', error); return null; }
}

populateLoginDropdown(); renderUsersList(); registerUser(); quickRegister();