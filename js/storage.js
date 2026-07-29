/* ===========================
   Client Data Storage (js/storage.js)
   =========================== */

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.projects)) parsed.projects = [];
        return parsed;
    }

    const seed = {
        projects: [
            { id: "p1", name: "Best of Mac 2026", note: "", endDate: futureDate(60), createdAt: pastDate(10) }
        ],
        clients: [
            {
                id: "c1",
                business: "Old Stuff Antiques Co-op",
                category: "Antiques/Thrift",
                contact: "Stacy Martin",
                info: "(555) 019-2231 · stacy@oldstuffcoop.com",
                note: "Runs seasonal ad each quarterly issue.",
                followup: "",
                owner: "Jordan Reyes",
                keyDates: [
                    { label: "Fall issue renewal", date: futureDate(18) },
                    { label: "Anniversary sale", date: futureDate(70) }
                ],
                ads: [
                    {
                        id: "a1",
                        projectId: "p1",
                        title: "Half-page ad, Spring Issue",
                        proof: "OldStuff_2026_Spring.pdf",
                        createdAt: pastDate(210),
                        statusHistory: [
                            { id: "h1", statusId: "s1", note: "Talked to Stacy about renewal", occurredAt: pastDate(220), createdBy: "Jordan Reyes" },
                            { id: "h2", statusId: "s3", note: "", occurredAt: pastDate(215), createdBy: "Jordan Reyes" },
                            { id: "h3", statusId: "s7", note: "Ran fine, client confirmed", occurredAt: pastDate(210), createdBy: "Jordan Reyes" }
                        ]
                    }
                ]
            },
            {
                id: "c2",
                business: "Riverside Thrift & Vintage",
                category: "Antiques/Thrift",
                contact: "Marcus Lee",
                info: "(555) 774-1120",
                note: "New lead.",
                followup: futureDate(3),
                owner: "Jordan Reyes",
                keyDates: [],
                ads: []
            }
        ]
    };

    saveData(seed);
    return seed;
}

function saveData(dataObject) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObject));
}

/* User storage functions unchanged — leave as-is */

/* ===========================
   User Storage
   =========================== */

function loadUsers() {

    const raw = localStorage.getItem(USERS_KEY);

    if (raw)
        return JSON.parse(raw);

    const seed = [

        {
            name: "Jordan Reyes",
            role: "sales"
        },

        {
            name: "Taylor Brooks",
            role: "sales"
        },

        {
            name: "Casey Lin",
            role: "graphics"
        }

    ];

    saveUsers(seed);

    return seed;
}

function saveUsers(userArray) {

    localStorage.setItem(

        USERS_KEY,

        JSON.stringify(userArray)

    );

}