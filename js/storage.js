/* ===========================
   Client Data Storage (js/storage.js)
   =========================== */

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.projects)) {
            parsed.projects = [];
        }

        // Migrate legacy `category` -> `relationship` / `businessType`
        if (Array.isArray(parsed.clients)) {
            parsed.clients.forEach((client) => {
                if (!client) return;
                // If relationship already present, skip
                if (!client.relationship) {
                    if (client.category === 'Lead' || client.category === 'Business Partner') {
                        client.relationship = client.category;
                        client.businessType = client.businessType || '';
                    } else if (client.category) {
                        client.relationship = 'Customer';
                        client.businessType = client.category;
                    } else {
                        client.relationship = client.relationship || 'Customer';
                        client.businessType = client.businessType || '';
                    }
                }

                // Ensure fields exist
                client.relationship = client.relationship || 'Customer';
                client.businessType = client.businessType || '';

                // Remove legacy category to keep data normalized
                if (client.hasOwnProperty('category'))
                    delete client.category;
            });
        }

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
                relationship: "Customer",
                businessType: "Antiques/Thrift",
                contact: "Andrew Smith",
                info: "(555) 019-2231 · stacy@oldstuffcoop.com",
                note: "Runs seasonal ad each quarterly issue.",
                followup: "",
                owner: "Stacy",
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
                            { id: "h1", statusId: "s1", note: "Talked to Stacy about renewal", occurredAt: pastDate(220), createdBy: "Stacy" },
                            { id: "h2", statusId: "s3", note: "", occurredAt: pastDate(215), createdBy: "Stacy" },
                            { id: "h3", statusId: "s7", note: "Ran fine, client confirmed", occurredAt: pastDate(210), createdBy: "Stacy" }
                        ]
                    }
                ]
            },
            {
                id: "c2",
                business: "Riverside Thrift & Vintage",
                relationship: "Customer",
                businessType: "Antiques/Thrift",
                contact: "Marcus Lee",
                info: "(555) 774-1120",
                note: "New lead.",
                followup: futureDate(3),
                owner: "Stacy",
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
            name: "Christy",
            role: "sales"
        },

        {
            name: "Stacy",
            role: "sales"
        },

        {
            name: "Kathie",
            role: "sales"
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