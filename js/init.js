document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString(...);

data = loadData();

users = loadUsers();

tryRestoreSession();