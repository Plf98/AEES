/* ============================================
   AEES — Amicale des Élèves et Étudiants de Sangharé
   Logique principale : commandes, admin, notifications
   ============================================ */

const POLO_PRICE = 5000;
const ADMIN_CODE = "aees123";
const STORAGE_KEY = "aees_orders_v2";

let orders        = [];
let notifications = [];
let adminLogged   = false;
let monitorInterval = null;

/* ──────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────── */
function showSection(section) {
    ["accueil", "polo", "commande", "admin"].forEach(s => {
        document.getElementById(s + "Section").style.display = "none";
    });
    document.getElementById(section + "Section").style.display = "block";

    if (section === "admin" && adminLogged) {
        renderAdminTable();
        updateStats();
    }
}

/* ──────────────────────────────────────────
   PERSISTANCE LOCALE
────────────────────────────────────────── */
function loadOrders() {
    const stored = localStorage.getItem(STORAGE_KEY);
    orders = stored ? JSON.parse(stored) : [];
    renderNotifications();
}

function saveToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/* ──────────────────────────────────────────
   COMMANDES
────────────────────────────────────────── */
function addOrder(data) {
    const id = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
    const order = {
        id,
        ...data,
        total: data.quantity * POLO_PRICE,
        date: new Date().toLocaleString()
    };
    orders.push(order);
    saveToLocal();
    addNotification(order);
    if (adminLogged) {
        renderAdminTable();
        updateStats();
    }
}

function deleteOrder(id) {
    if (!confirm("Supprimer cette commande ?")) return;
    orders = orders.filter(o => o.id !== id);
    saveToLocal();
    renderAdminTable();
    updateStats();
    showToast("Commande supprimée");
}

function editOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const newQty = prompt("Nouvelle quantité :", order.quantity);
    if (newQty && parseInt(newQty) > 0) {
        order.quantity = parseInt(newQty);
        order.total    = order.quantity * POLO_PRICE;
        saveToLocal();
        renderAdminTable();
        updateStats();
        showToast("Quantité modifiée");
    }
}

/* ──────────────────────────────────────────
   NOTIFICATIONS
────────────────────────────────────────── */
function addNotification(order) {
    notifications.unshift({
        id: order.id,
        message: `🆕 Commande #${order.id} — ${order.fullname} (${order.quantity}x polo)`,
        timestamp: new Date().toLocaleTimeString(),
        isNew: true
    });
    if (notifications.length > 20) notifications.pop();

    renderNotifications();
    updateMenuBadge();

    if (adminLogged) showToast("🔔 Nouvelle commande de " + order.fullname);
    if (navigator.vibrate) navigator.vibrate(200);
}

function renderNotifications() {
    const container  = document.getElementById("notificationList");
    const countSpan  = document.getElementById("notifCount");
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#888;">Aucune notification pour le moment</div>';
        if (countSpan) countSpan.innerText = "0";
        return;
    }

    container.innerHTML = "";
    notifications.forEach(n => {
        const div = document.createElement("div");
        div.className = "notification-item" + (n.isNew ? " new" : "");
        div.innerHTML = `<strong>⏰ ${n.timestamp}</strong><br>${n.message}`;
        container.appendChild(div);
        setTimeout(() => { n.isNew = false; }, 3000);
    });

    if (countSpan) countSpan.innerText = notifications.length;
}

function updateMenuBadge() {
    const link = document.getElementById("adminMenuLink");
    if (!link) return;
    if (notifications.length > 0) {
        link.innerHTML = `📊 Admin <span class="badge" style="background:#ff9800;">${notifications.length}</span>`;
    } else {
        link.innerHTML = "📊 Admin (Supervision)";
    }
}

/* ──────────────────────────────────────────
   TABLEAU ADMIN
────────────────────────────────────────── */
function renderAdminTable() {
    const tbody = document.querySelector("#ordersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9' style='text-align:center'>Aucune commande enregistrée</td></tr>";
        return;
    }

    [...orders].reverse().forEach(o => {
        const row = tbody.insertRow();
        [o.id, o.fullname, o.whatsapp, o.address || "—", o.size, o.quantity,
            (o.quantity * POLO_PRICE).toLocaleString() + " FCFA", o.date
        ].forEach((v, i) => row.insertCell(i).innerText = v);

        const cell  = row.insertCell(8);
        const editB = document.createElement("button");
        editB.innerText = "Qty";
        editB.className = "action-btn edit-btn";
        editB.onclick   = () => editOrder(o.id);

        const delB  = document.createElement("button");
        delB.innerText = "Suppr";
        delB.className = "action-btn";
        delB.onclick   = () => deleteOrder(o.id);

        cell.appendChild(editB);
        cell.appendChild(delB);
    });
}

function updateStats() {
    const statsDiv = document.getElementById("statsDiv");
    if (!statsDiv) return;
    const totalQty     = orders.reduce((s, o) => s + o.quantity, 0);
    const totalRevenue = totalQty * POLO_PRICE;
    statsDiv.innerHTML = `
        <div class="stat">📦 Commandes : ${orders.length}</div>
        <div class="stat">👕 Polos : ${totalQty}</div>
        <div class="stat">💰 ${totalRevenue.toLocaleString()} FCFA</div>
        <div class="stat">🔔 Notifs : ${notifications.length}</div>
    `;
}

/* ──────────────────────────────────────────
   SURVEILLANCE EN TEMPS RÉEL
────────────────────────────────────────── */
function startRealTimeMonitoring() {
    if (monitorInterval) clearInterval(monitorInterval);
    monitorInterval = setInterval(() => {
        if (!adminLogged) return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const fresh = JSON.parse(stored);
        if (fresh.length > orders.length) {
            const newOnes = fresh.slice(orders.length);
            newOnes.forEach(o => addNotification(o));
            orders = fresh;
            renderAdminTable();
            updateStats();
            showToast(`📢 ${newOnes.length} nouvelle(s) commande(s) !`);
        } else {
            orders = fresh;
            if (adminLogged) { renderAdminTable(); updateStats(); }
        }
    }, 2000);
}

/* ──────────────────────────────────────────
   TOAST
────────────────────────────────────────── */
function showToast(msg) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* ──────────────────────────────────────────
   INITIALISATION AU CHARGEMENT DU DOM
────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {

    /* Total live */
    const qtyInput     = document.getElementById("quantity");
    const totalDisplay = document.getElementById("totalDisplay");

    function updateTotal() {
        const qty = parseInt(qtyInput.value) || 1;
        totalDisplay.value = (qty * POLO_PRICE).toLocaleString() + " FCFA";
    }
    if (qtyInput) {
        qtyInput.addEventListener("input", updateTotal);
        updateTotal();
    }

    /* Soumission commande */
    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
        orderForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const fullname = document.getElementById("fullname").value.trim();
            const whatsapp = document.getElementById("whatsapp").value.trim();
            if (!fullname || !whatsapp) {
                alert("Veuillez renseigner votre nom et numéro WhatsApp");
                return;
            }
            addOrder({
                fullname,
                whatsapp,
                address:  document.getElementById("address").value,
                size:     document.getElementById("size").value,
                quantity: parseInt(qtyInput.value) || 1,
                payment:  document.getElementById("payment").value,
                remarks:  document.getElementById("remarks").value
            });
            orderForm.reset();
            qtyInput.value = 1;
            updateTotal();
            showToast("✅ Commande envoyée ! L'équipe AEES vous contactera bientôt.");
        });
    }

    /* Login admin */
    const loginBtn   = document.getElementById("loginAdminBtn");
    const logoutBtn  = document.getElementById("logoutAdminBtn");
    const adminPwd   = document.getElementById("adminPassword");
    const adminBox   = document.getElementById("adminLoginBox");
    const adminCont  = document.getElementById("adminContent");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            if (adminPwd.value === ADMIN_CODE) {
                adminLogged       = true;
                adminCont.style.display = "block";
                adminBox.style.display  = "none";
                renderAdminTable();
                updateStats();
                renderNotifications();
                showToast("✅ Mode supervision activé — notifications en temps réel");
                startRealTimeMonitoring();
            } else {
                alert("Mot de passe incorrect");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            adminLogged             = false;
            adminCont.style.display = "none";
            adminBox.style.display  = "flex";
            adminPwd.value          = "";
            if (monitorInterval) clearInterval(monitorInterval);
            showToast("Déconnecté de la supervision");
        });
    }

    /* Démarrage */
    loadOrders();
    showSection("accueil");
});
