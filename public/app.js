const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const STORAGE_KEY = "kunaKopiApp";
const SESSION_KEY = "kunaKopiSession";
const SESSION_LIMIT = 30 * 60 * 1000;
const DATA_VERSION = 6;
const DEFAULT_STOCK = 20;
const DEFAULT_MENU_IMAGE = "images/logo.jpeg";
const DEFAULT_GALLERY_IMAGE = "images/galeri.jpeg";
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || "";

const seed = {
  version: DATA_VERSION,
  users: [
    {
      id: "USR-001",
      name: "Pelanggan Demo",
      phone: "081234567890",
      email: "demo@kunakopi.test",
      passwordHash: "demo",
      loginAttempts: 0,
      lockedUntil: 0,
    },
  ],
  menus: [
    {
      id: "M-001",
      name: "Prabu",
      category: "Kopi",
      price: 15000,
      stock: 30,
      desc: "Menu Prabu dari Kuna Kopi.",
      image: "images/prabu.jpeg",
    },
    {
      id: "M-002",
      name: "Sedayu",
      category: "Kopi",
      price: 15000,
      stock: 30,
      desc: "Menu Sedayu dari Kuna Kopi.",
      image: "images/sedayu.jpeg",
    },
    {
      id: "M-003",
      name: "Sanbow",
      category: "Kopi",
      price: 12000,
      stock: 25,
      desc: "Menu Sanbow dari Kuna Kopi.",
      image: "images/sanbow.jpeg",
    },
    {
      id: "M-004",
      name: "Blackforest",
      category: "Dessert",
      price: 12000,
      stock: 18,
      desc: "Blackforest lembut untuk teman nongkrong.",
      image: "images/blacforest.jpeg",
    },
    {
      id: "M-005",
      name: "Cheesecake",
      category: "Dessert",
      price: 15000,
      stock: 18,
      desc: "Cheesecake creamy dengan rasa manis seimbang.",
      image: "images/chessecake.jpeg",
    },
    {
      id: "M-006",
      name: "Mix",
      category: "Snack",
      price: 25000,
      stock: 15,
      desc: "Menu mix untuk dinikmati bareng.",
      image: "images/paket mix.jpeg",
    },
    {
      id: "M-007",
      name: "Paket Cireng Kentang",
      category: "Snack",
      price: 20000,
      stock: 15,
      desc: "Paket cireng dan kentang untuk camilan rame-rame.",
      image: "images/cireng kentang.jpeg",
    },
  ],
  promos: [
    { id: "P-001", title: "Bundling Pagi", desc: "Kopi susu + croissant Rp49.000 sampai pukul 11.00.", discount: "Hemat 15%" },
    { id: "P-002", title: "Reservasi Berempat", desc: "Gratis satu snack untuk reservasi minimal 4 orang.", discount: "Bonus Snack" },
  ],
  gallery: [
    {
      id: "G-001",
      title: "Vibes Kuna Kopi",
      image: "images/galeri.jpeg",
    },
    {
      id: "G-002",
      title: "Sudut Kuna Kopi",
      image: "images/galerii.jpeg",
    },
    {
      id: "G-003",
      title: "Suasana Kuna Kopi",
      image: "images/galeriii.jpeg",
    },
  ],
  reservations: [],
  audit: [],
};

let state = loadState();
let session = loadSession();
let category = "Semua";
let authMode = "login";
let adminTab = "reservations";
let adminReservationSearch = "";
let customerReservationSearch = "";

const $ = (selector) => document.querySelector(selector);

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": CSRF_TOKEN,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Gagal menghubungi server.");
  }

  if (response.status === 204) return null;
  return response.json();
}

function normalizeReservation(item) {
  return {
    ...item,
    userId: item.userId ?? item.user_id ?? null,
    source: item.source || "online",
    items: Array.isArray(item.items) ? item.items : [],
    total: Number(item.total) || 0,
    people: Number(item.people) || 1,
  };
}

async function saveReservationToServer(reservation) {
  return normalizeReservation(
    await apiRequest("/reservations", {
      method: "POST",
      body: JSON.stringify(reservation),
    }),
  );
}

async function syncLocalReservationsToServer() {
  const localReservations = Array.isArray(state.reservations) ? state.reservations : [];
  if (!localReservations.length) return;

  await Promise.all(
    localReservations.map((reservation) =>
      saveReservationToServer(normalizeReservation(reservation)).catch(() => null),
    ),
  );
}

async function loadServerReservations() {
  const reservations = await apiRequest("/reservations");
  state.reservations = reservations.map(normalizeReservation);
  saveState();
}

function confirmDelete(label) {
  return window.confirm(`Yakin ingin menghapus ${label}? Data yang sudah dihapus tidak bisa dikembalikan.`);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }
  const parsed = JSON.parse(saved);
  // Memulihkan menu bawaan yang sempat tertimpa respons API lama (M-1, M-2, dst.).
  // Kondisi ini hanya cocok dengan format data sementara tersebut, bukan menu normal aplikasi.
  if (
    Array.isArray(parsed.menus) &&
    parsed.menus.length > 0 &&
    parsed.menus.length < seed.menus.length &&
    parsed.menus.every((menu) => /^M-\d{1,2}$/.test(menu.id))
  ) {
    parsed.menus = JSON.parse(JSON.stringify(seed.menus));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  if ((parsed.version || 1) < DATA_VERSION) {
    const migrated = {
      ...parsed,
      version: DATA_VERSION,
      menus: normalizeMenus(parsed.menus || seed.menus),
      gallery: JSON.parse(JSON.stringify(seed.gallery)),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  parsed.menus = normalizeMenus(parsed.menus || []);
  return parsed;
}

function normalizeMenus(menus) {
  return menus.map((menu) => ({
    ...menu,
    stock: Number.isFinite(Number(menu.stock)) ? Math.max(Number(menu.stock), 0) : DEFAULT_STOCK,
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSession() {
  const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  if (!saved || Date.now() - saved.lastActive > SESSION_LIMIT) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  saved.lastActive = Date.now();
  localStorage.setItem(SESSION_KEY, JSON.stringify(saved));
  return saved;
}

function saveSession(nextSession) {
  session = nextSession ? { ...nextSession, lastActive: Date.now() } : null;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function hashPassword(value) {
  if (value === "demo") return "demo";
  if (!window.crypto?.subtle) {
    return btoa(unescape(encodeURIComponent(value))).split("").reverse().join("");
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function currentUser() {
  return state.users.find((user) => user.id === session?.userId) || null;
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

function addAudit(action) {
  state.audit.unshift({
    id: `LOG-${Date.now()}`,
    action,
    at: new Date().toLocaleString("id-ID"),
  });
  saveState();
}

function clampInputToStock(input) {
  const menu = state.menus.find((item) => item.id === input.dataset.menuId || item.id === input.dataset.adminOrderMenuId);
  if (!menu) return;
  const qty = Math.max(Number(input.value) || 0, 0);
  input.value = Math.min(qty, menu.stock);
}

function validateStock(items) {
  return items.find((item) => {
    const menu = state.menus.find((menuItem) => menuItem.id === item.menuId);
    return !menu || item.qty > menu.stock;
  });
}

function reduceStock(items) {
  items.forEach((item) => {
    const menu = state.menus.find((menuItem) => menuItem.id === item.menuId);
    if (menu) menu.stock = Math.max(menu.stock - item.qty, 0);
  });
}

function renderAll() {
  renderNav();
  renderMenu();
  renderPromos();
  renderGallery();
  renderOrderList();
  renderReservationIdentity();
  renderHistory();
  renderAdmin();
}

function showCustomerPage() {
  document.body.classList.remove("admin-mode");
  $("#customerPage").hidden = false;
  $("#adminPage").hidden = true;
}

function showAdminPage() {
  document.body.classList.add("admin-mode");
  $("#customerPage").hidden = true;
  $("#adminPage").hidden = false;
  loadServerReservations().then(renderAdmin).catch(() => toast("Data server belum bisa dimuat."));
  renderAdmin();
}

function syncPageFromHash() {
  if (window.location.hash === "#admin") showAdminPage();
  else showCustomerPage();
}

function renderNav() {
  const user = currentUser();
  $("#authOpen").textContent = user ? `Logout (${user.name.split(" ")[0]})` : "Masuk";
}

function renderMenu() {
  const categories = ["Semua", ...new Set(state.menus.map((item) => item.category))];
  $("#categoryFilters").innerHTML = categories
    .map((item) => `<button class="${item === category ? "active" : ""}" data-category="${item}">${item}</button>`)
    .join("");

  const menus = category === "Semua" ? state.menus : state.menus.filter((item) => item.category === category);
  $("#menuGrid").innerHTML = menus
    .map(
      (item) => `
        <article class="menu-card">
          <img src="${item.image}" alt="${item.name}" />
          <div>
            <p class="eyebrow">${item.category}</p>
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <span class="price"><small>Harga:</small> ${rupiah.format(item.price)}</span>
            <span class="price"><small>Stok:</small> ${item.stock > 0 ? `${item.stock} tersedia` : "Habis"}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPromos() {
  $("#promoList").innerHTML = state.promos
    .map(
      (promo) => `
        <article class="promo-card">
          <p class="eyebrow">${promo.discount}</p>
          <h3>${promo.title}</h3>
          <p>${promo.desc}</p>
        </article>
      `,
    )
    .join("");
}

function renderGallery() {
  $("#galleryGrid").innerHTML = state.gallery
    .map(
      (item) => `
        <article class="gallery-card">
          <img src="${item.image}" alt="${item.title}" />
          <div><strong>${item.title}</strong></div>
        </article>
      `,
    )
    .join("");
}

function renderOrderList() {
  $("#orderList").innerHTML = state.menus
    .map(
      (item) => `
        <div class="order-item">
          <div>
            <strong>${item.name}</strong>
            <span>Harga: ${rupiah.format(item.price)} · Stok: ${item.stock}</span>
          </div>
          <input type="number" min="0" max="${item.stock}" value="0" data-menu-id="${item.id}" aria-label="Jumlah ${item.name}" ${item.stock <= 0 ? "disabled" : ""} />
        </div>
      `,
    )
    .join("");
  calculateOrderTotal();
}

function renderReservationIdentity() {
  const user = currentUser();
  $("#resName").value = user?.name || "";
  $("#resPhone").value = user?.phone || "";
  $("#reservationHint").textContent = user ? "" : "Silakan login pelanggan untuk mengirim reservasi.";
  const today = new Date().toISOString().slice(0, 10);
  $("#resDate").min = today;
  if (!$("#resDate").value) $("#resDate").value = today;
}

function calculateOrderTotal() {
  let total = 0;
  document.querySelectorAll("[data-menu-id]").forEach((input) => {
    clampInputToStock(input);
    const item = state.menus.find((menu) => menu.id === input.dataset.menuId);
    total += (Number(input.value) || 0) * item.price;
  });
  $("#orderTotal").textContent = rupiah.format(total);
  return total;
}

function renderHistory() {
  const user = currentUser();
  const query = customerReservationSearch.trim().toLowerCase();
  let rows = [];
  if (query) {
    rows = state.reservations.filter((item) =>
      [item.id, item.name, item.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)),
    );
  } else if (user) {
    rows = state.reservations.filter((item) => item.userId === user.id);
  }
  $("#historyTable").innerHTML = rows.length
    ? rows
        .map(
          (item) => `
          <tr>
            <td>${item.id}</td>
            <td>${item.date} ${item.time}<br>${item.table || "Meja fleksibel"}</td>
            <td>${item.name}</td>
            <td><span class="status-pill">${item.status}</span></td>
            <td><button class="secondary small" data-code="${item.id}">Bukti Pesan</button></td>
          </tr>
        `,
        )
        .join("")
    : `<tr><td colspan="5">${
        query
          ? "Reservasi tidak ditemukan. Periksa kembali kode, nama, atau nomor HP."
          : "Masukkan kode reservasi, nama, atau nomor HP untuk cek status."
      }</td></tr>`;
}

function setAuthMode(nextMode) {
  authMode = nextMode;
  $("#authTitle").textContent = authMode === "login" ? "Masuk" : "Registrasi";
  $("#authHint").textContent = authMode === "login" ? "Masukkan akun pelanggan yang sudah terdaftar." : "";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === authMode);
  });
  document.querySelectorAll(".register-only").forEach((el) => {
    el.style.display = authMode === "register" ? "grid" : "none";
  });
  document.querySelectorAll(".login-only").forEach((el) => {
    el.style.display = authMode === "login" ? "flex" : "none";
  });
}

async function handleAuth(event) {
  event.preventDefault();
  const identity = $("#authIdentity").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const hint = $("#authHint");

  if (authMode === "register") {
    const name = $("#authName").value.trim();
    const phone = $("#authPhone").value.trim();
    const confirm = $("#authPasswordConfirm").value;
    if (!name || !/^08\d{8,13}$/.test(phone) || !identity.includes("@")) {
      hint.textContent = "Isi nama, email valid, dan WhatsApp format 08xxxxxxxxxx.";
      return;
    }
    if (password.length < 6 || password !== confirm) {
      hint.textContent = "Password minimal 6 karakter dan konfirmasi harus sama.";
      return;
    }
    if (state.users.some((user) => user.email === identity || user.phone === phone)) {
      hint.textContent = "Email atau WhatsApp sudah terdaftar.";
      return;
    }
    const user = {
      id: `USR-${Date.now()}`,
      name,
      phone,
      email: identity,
      passwordHash: await hashPassword(password),
      loginAttempts: 0,
      lockedUntil: 0,
    };
    state.users.push(user);
    saveState();
    saveSession({ userId: user.id, role: "customer" });
    $("#authModal").close();
    toast("Registrasi berhasil. Akun sudah aktif.");
    renderAll();
    return;
  }

  const user = state.users.find((item) => item.email === identity || item.phone === identity);
  if (!user) {
    hint.textContent = "Akun tidak ditemukan.";
    return;
  }
  if (user.lockedUntil > Date.now()) {
    hint.textContent = "Akun terkunci sementara selama 15 menit.";
    return;
  }
  const hash = await hashPassword(password);
  if (user.passwordHash !== hash) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) user.lockedUntil = Date.now() + 15 * 60 * 1000;
    saveState();
    hint.textContent = "Password salah.";
    return;
  }
  user.loginAttempts = 0;
  user.lockedUntil = 0;
  saveState();
  saveSession({ userId: user.id, role: "customer", remember: $("#rememberMe").checked });
  $("#authModal").close();
  toast("Login berhasil.");
  renderAll();
}

async function handleReservation(event) {
  event.preventDefault();
  const user = currentUser();
  const hint = $("#reservationHint");
  if (!user) {
    $("#authModal").showModal();
    hint.textContent = "Login dulu sebelum membuat reservasi.";
    return;
  }

  const date = $("#resDate").value;
  const time = $("#resTime").value;
  const people = Number($("#resPeople").value);
  const today = new Date().toISOString().slice(0, 10);
  const items = [...document.querySelectorAll("[data-menu-id]")]
    .map((input) => {
      const menu = state.menus.find((item) => item.id === input.dataset.menuId);
      return { menuId: menu.id, name: menu.name, qty: Number(input.value) || 0, price: menu.price };
    })
    .filter((item) => item.qty > 0);

  if (!date || date < today || !time || people < 1 || items.length === 0) {
    hint.textContent = "Lengkapi tanggal, jam, jumlah orang, dan minimal satu menu.";
    return;
  }

  const unavailable = validateStock(items);
  if (unavailable) {
    const menu = state.menus.find((item) => item.id === unavailable.menuId);
    hint.textContent = `Stok ${unavailable.name} tersisa ${menu?.stock || 0}. Kurangi jumlah pesanan.`;
    return;
  }

  const reservation = {
    id: `RSV-${String(Date.now()).slice(-6)}`,
    userId: user.id,
    name: user.name,
    phone: user.phone,
    date,
    time,
    people,
    table: $("#resTable").value,
    note: $("#resNote").value.trim(),
    items,
    total: items.reduce((sum, item) => sum + item.qty * item.price, 0),
    status: "Menunggu Konfirmasi",
    createdAt: new Date().toISOString(),
  };
  try {
    const savedReservation = await saveReservationToServer(reservation);
    reduceStock(items);
    state.reservations = [savedReservation, ...state.reservations.filter((item) => item.id !== savedReservation.id)];
    addAudit(`Reservasi baru ${savedReservation.id} dari ${user.name}`);
    saveState();
    event.target.reset();
    renderAll();
    toast("Reservasi berhasil dikirim ke admin.");
    openReservationCode(savedReservation.id);
  } catch (error) {
    hint.textContent = error.message;
  }
}

function reservationCodeTemplate(item) {
  return `
    <section class="receipt-card">
      <div class="receipt-head">
        <img src="images/logo.jpeg" alt="Logo Kuna Kopi" />
        <div>
          <p class="eyebrow">Bukti Pesan</p>
          <h2>Kuna Kopi</h2>
          <span>Simpan bukti ini untuk pengecekan admin saat datang.</span>
        </div>
      </div>
      <div class="receipt-code">
        <span>Kode Pesan</span>
        <strong>${item.id}</strong>
      </div>
      <div class="receipt-grid">
        <div><span>Nama</span><strong>${item.name}</strong></div>
        <div><span>WhatsApp</span><strong>${item.phone}</strong></div>
        <div><span>Tanggal</span><strong>${item.date}</strong></div>
        <div><span>Jam</span><strong>${item.time}</strong></div>
        <div><span>Status</span><strong>${item.status}</strong></div>
        <div><span>Meja</span><strong>${item.table || "Dicek admin"}</strong></div>
      </div>
      <p class="receipt-hint">Saat tiba, cukup sebutkan kode pesan, nama, atau nomor HP ke admin.</p>
    </section>
  `;
}

function orderDetailTemplate(item) {
  return `
    <section class="receipt-card">
      <div class="receipt-head">
        <img src="images/logo.jpeg" alt="Logo Kuna Kopi" />
        <div>
          <p class="eyebrow">Detail Pesanan Admin</p>
          <h2>${item.source === "walk-in" ? "Pesanan Langsung" : "Reservasi Pelanggan"}</h2>
          <span>Dashboard admin Kuna Kopi</span>
        </div>
      </div>
      <div class="receipt-code">
        <span>${item.source === "walk-in" ? "Kode Pesanan" : "Kode Reservasi"}</span>
        <strong>${item.id}</strong>
      </div>
      <div class="receipt-grid">
        <div><span>Nama</span><strong>${item.name}</strong></div>
        <div><span>WhatsApp</span><strong>${item.phone || "-"}</strong></div>
        <div><span>Tanggal</span><strong>${item.date}</strong></div>
        <div><span>Jam</span><strong>${item.time}</strong></div>
        <div><span>Jumlah Orang</span><strong>${item.people}</strong></div>
        <div><span>Meja</span><strong>${item.table || "Meja fleksibel"}</strong></div>
        <div><span>Status</span><strong>${item.status}</strong></div>
        <div><span>Total</span><strong>${rupiah.format(item.total)}</strong></div>
      </div>
      <div class="receipt-items">
        <span>Pesanan</span>
        ${item.items
          .map(
            (order) => `
              <div>
                <strong>${order.name} x${order.qty}</strong>
                <span>${rupiah.format(order.qty * order.price)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="receipt-note">
        <span>Catatan</span>
        <p>${item.note || "Tidak ada catatan tambahan."}</p>
      </div>
    </section>
  `;
}

function purchaseReceiptTemplate(item) {
  const paid = item.paid || item.total;
  const change = Math.max(paid - item.total, 0);
  return `
    <section class="receipt-card receipt-roll">
      <div class="roll-head">
        <img src="images/logo.jpeg" alt="Logo Kuna Kopi" />
        <h2>Kuna Kopi</h2>
        <p>Dusun I, Makam, Rembang, Purbalingga</p>
        <p>WA 0882-2134-5896</p>
      </div>
      <div class="roll-line"></div>
      <div class="roll-meta">
        <span>No</span><strong>${item.id}</strong>
        <span>Tgl</span><strong>${item.date} ${item.time}</strong>
        <span>Kasir</span><strong>Admin</strong>
        <span>Nama</span><strong>${item.name}</strong>
        <span>Meja</span><strong>${item.table || "-"}</strong>
      </div>
      <div class="roll-line"></div>
      <div class="roll-items">
        ${item.items
          .map(
            (order) => `
              <div>
                <strong>${order.name}</strong>
                <span>${order.qty} x ${rupiah.format(order.price)}</span>
                <b>${rupiah.format(order.qty * order.price)}</b>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="roll-line"></div>
      <div class="roll-total">
        <span>Total</span><strong>${rupiah.format(item.total)}</strong>
        <span>Bayar</span><strong>${rupiah.format(paid)}</strong>
        <span>Kembali</span><strong>${rupiah.format(change)}</strong>
      </div>
      ${item.note ? `<p class="roll-note">Catatan: ${item.note}</p>` : ""}
      <div class="roll-line"></div>
      <p class="roll-thanks">Terima kasih sudah berkunjung.</p>
    </section>
  `;
}

function openReservationCode(id) {
  const item = state.reservations.find((res) => res.id === id);
  if (!item) return;
  $("#receiptContent").innerHTML = reservationCodeTemplate(item);
  $("#receiptPrint").hidden = true;
  $("#receiptPrint").disabled = true;
  $("#receiptPrint").textContent = "";
  $("#receiptModal").showModal();
}

function openOrderDetail(id) {
  const item = state.reservations.find((res) => res.id === id);
  if (!item) return;
  $("#receiptContent").innerHTML = orderDetailTemplate(item);
  $("#receiptPrint").hidden = false;
  $("#receiptPrint").disabled = false;
  $("#receiptPrint").textContent = "Cetak Detail Admin";
  $("#receiptModal").showModal();
}

function openPurchaseReceipt(id) {
  const item = state.reservations.find((res) => res.id === id);
  if (!item) return;
  $("#receiptContent").innerHTML = purchaseReceiptTemplate(item);
  $("#receiptPrint").hidden = false;
  $("#receiptPrint").disabled = false;
  $("#receiptPrint").textContent = "Cetak Struk Pembelian";
  $("#receiptModal").showModal();
}

function renderAdmin() {
  if ($("#adminDashboard").hidden) return;
  const today = new Date().toISOString().slice(0, 10);
  const done = state.reservations.filter((item) => item.status === "Selesai").length;
  const totalStock = state.menus.reduce((sum, item) => sum + item.stock, 0);
  const stats = [
    { label: "Total Menu", value: state.menus.length },
    { label: "Total Stok", value: totalStock },
    { label: "Stok Habis", value: state.menus.filter((item) => item.stock <= 0).length },
    { label: "Total Promo", value: state.promos.length },
    { label: "Total Reservasi", value: state.reservations.length },
    { label: "Reservasi Hari Ini", value: state.reservations.filter((item) => item.date === today).length },
    { label: "Pesanan Diproses", value: state.reservations.filter((item) => item.status === "Diproses").length },
    { label: "Pesanan Selesai", value: done },
    { label: "Jumlah Pelanggan", value: state.users.length },
  ];
  const maxValue = Math.max(...stats.map((item) => item.value), 1);
  const donePercent = state.reservations.length ? Math.round((done / state.reservations.length) * 100) : 0;
  $("#statGrid").innerHTML = `
    <div class="chart-panel">
      <div class="chart-head">
        <div>
          <p class="eyebrow">Statistik</p>
          <h3>Diagram Batang Operasional</h3>
        </div>
        <div class="completion-badge">${donePercent}% selesai</div>
      </div>
      <div class="bar-chart">
        ${stats
          .map((item) => {
            const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 2);
            return `
              <div class="bar-item">
                <div class="bar-value">${item.value}</div>
                <div class="bar-track">
                  <div class="bar-fill" style="height: ${height}%"></div>
                </div>
                <div class="bar-label">${item.label}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
  renderAdminContent();
}

function renderAdminContent() {
  const content = $("#adminContent");
  if (adminTab === "reservations") {
    const query = adminReservationSearch.trim().toLowerCase();
    const reservations = query
      ? state.reservations.filter((item) =>
          [item.id, item.name, item.phone, item.table, item.status]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)),
        )
      : state.reservations;
    content.innerHTML = `
      <div class="admin-flow">
        <section class="admin-panel">
          <p class="eyebrow">Cek Reservasi</p>
          <h3>Cari dari kode, nama, atau nomor HP</h3>
          <input id="adminReservationSearch" type="search" value="${adminReservationSearch}" placeholder="Contoh: RSV-123456 / Budi / 08..." />
        </section>
        <form class="admin-panel admin-order-form" id="walkInOrderForm">
          <p class="eyebrow">Tanpa Reservasi</p>
          <h3>Buat pesanan langsung</h3>
          <div class="form-row">
            <input id="walkInName" type="text" placeholder="Nama pelanggan" required />
            <input id="walkInPhone" type="tel" placeholder="Nomor HP (opsional)" />
          </div>
          <div class="form-row">
            <input id="walkInPeople" type="number" min="1" value="1" aria-label="Jumlah orang" required />
            <select id="walkInTable">
              <option value="">Pilih meja</option>
              <option>Meja 1</option>
              <option>Meja 2</option>
              <option>Meja 3</option>
              <option>Meja 4</option>
              <option>Meja Teras</option>
            </select>
          </div>
          <div class="order-list admin-order-list">
            ${state.menus
              .map(
                (item) => `
                  <div class="order-item">
                    <div>
                      <strong>${item.name}</strong>
                      <span>Harga: ${rupiah.format(item.price)} · Stok: ${item.stock}</span>
                    </div>
                    <input type="number" min="0" max="${item.stock}" value="0" data-admin-order-menu-id="${item.id}" aria-label="Jumlah ${item.name}" ${item.stock <= 0 ? "disabled" : ""} />
                  </div>
                `,
              )
              .join("")}
          </div>
          <textarea id="walkInNote" rows="2" placeholder="Catatan pesanan"></textarea>
          <div class="total-line"><span>Total sementara</span><strong id="walkInTotal">${rupiah.format(0)}</strong></div>
          <button class="primary small" type="submit">Simpan Pesanan</button>
          <p class="form-hint" id="walkInHint"></p>
        </form>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Pelanggan</th><th>Reservasi/Pesanan</th><th>Status</th><th>Aksi Admin</th></tr></thead>
          <tbody>
            ${reservations
              .map(
                (item) => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.name}<br>${item.phone || "-"}</td>
                  <td>
                    ${item.source === "walk-in" ? "Pesanan langsung" : "Reservasi"} · ${item.date} ${item.time}<br>
                    ${item.people} orang · ${item.table || "Meja fleksibel"}<br>
                    <strong>${rupiah.format(item.total)}</strong>
                  </td>
                  <td>
                    <select data-status="${item.id}">
                      ${["Menunggu Konfirmasi", "Diproses", "Siap Disajikan", "Selesai", "Dibatalkan"]
                        .map((status) => `<option ${status === item.status ? "selected" : ""}>${status}</option>`)
                        .join("")}
                    </select>
                  </td>
                  <td>
                    <button class="secondary small" data-detail="${item.id}">Detail</button>
                    <button class="secondary small" data-print="${item.id}">Struk</button>
                    <button class="ghost small" data-delete-res="${item.id}">Hapus</button>
                  </td>
                </tr>
              `,
              )
              .join("") || `<tr><td colspan="5">Data tidak ditemukan.</td></tr>`}
          </tbody>
        </table>
      </div>`;
    return;
  }

  if (adminTab === "menus") {
    content.innerHTML = crudTemplate("menu", ["Nama", "Kategori", "Harga", "Stok", "Deskripsi"], state.menus);
    return;
  }

  if (adminTab === "promos") {
    content.innerHTML = crudTemplate("promo", ["Judul", "Label", "Deskripsi"], state.promos);
    return;
  }

  if (adminTab === "gallery") {
    content.innerHTML = crudTemplate("gallery", ["Judul"], state.gallery);
    return;
  }

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Waktu</th><th>Aktivitas</th></tr></thead>
        <tbody>${state.audit.map((log) => `<tr><td>${log.at}</td><td>${log.action}</td></tr>`).join("") || `<tr><td colspan="2">Audit log kosong.</td></tr>`}</tbody>
      </table>
    </div>`;
}

function crudTemplate(type, fields, rows) {
  const isMenu = type === "menu";
  return `
    <form class="admin-form" data-crud="${type}">
      ${fields
        .map((field) => {
          const numeric = ["Harga", "Stok"].includes(field);
          return `<input ${numeric ? 'type="number" min="0"' : 'type="text"'} placeholder="${field}" aria-label="${field}" required />`;
        })
        .join("")}
      <button class="primary small" type="submit">Tambah</button>
    </form>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Data</th>${isMenu ? "<th>Edit Stok</th>" : ""}<th>Aksi</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `
              <tr>
                <td>${row.id}</td>
                <td>${Object.entries(row)
                  .filter(([key]) => key !== "id" && key !== "image" && (!isMenu || key !== "stock"))
                  .map(([, value]) => value)
                  .join(" · ")}</td>
                ${
                  isMenu
                    ? `<td>
                        <div class="stock-editor">
                          <input type="number" min="0" value="${row.stock}" data-edit-stock="${row.id}" aria-label="Stok ${row.name}" />
                          <button class="secondary small" data-save-stock="${row.id}">Simpan</button>
                        </div>
                      </td>`
                    : ""
                }
                <td><button class="ghost small" data-delete-${type}="${row.id}">Hapus</button></td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function calculateAdminOrderTotal() {
  let total = 0;
  document.querySelectorAll("[data-admin-order-menu-id]").forEach((input) => {
    clampInputToStock(input);
    const item = state.menus.find((menu) => menu.id === input.dataset.adminOrderMenuId);
    if (!item) return;
    total += (Number(input.value) || 0) * item.price;
  });
  return total;
}

function updateAdminOrderTotal() {
  const totalEl = $("#walkInTotal");
  if (totalEl) totalEl.textContent = rupiah.format(calculateAdminOrderTotal());
}

async function handleWalkInOrder(event) {
  const form = event.target.closest("#walkInOrderForm");
  if (!form) return false;
  event.preventDefault();
  const hint = $("#walkInHint");
  const items = [...document.querySelectorAll("[data-admin-order-menu-id]")]
    .map((input) => {
      const menu = state.menus.find((item) => item.id === input.dataset.adminOrderMenuId);
      return menu ? { menuId: menu.id, name: menu.name, qty: Number(input.value) || 0, price: menu.price } : null;
    })
    .filter((item) => item && item.qty > 0);

  if (!items.length) {
    hint.textContent = "Pilih minimal satu menu.";
    return true;
  }

  const unavailable = validateStock(items);
  if (unavailable) {
    const menu = state.menus.find((item) => item.id === unavailable.menuId);
    hint.textContent = `Stok ${unavailable.name} tersisa ${menu?.stock || 0}. Kurangi jumlah pesanan.`;
    return true;
  }

  const now = new Date();
  const reservation = {
    id: `ORD-${String(Date.now()).slice(-6)}`,
    source: "walk-in",
    userId: null,
    name: $("#walkInName").value.trim(),
    phone: $("#walkInPhone").value.trim(),
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    people: Number($("#walkInPeople").value) || 1,
    table: $("#walkInTable").value,
    note: $("#walkInNote").value.trim(),
    items,
    total: items.reduce((sum, item) => sum + item.qty * item.price, 0),
    status: "Diproses",
    createdAt: now.toISOString(),
  };
  try {
    const savedReservation = await saveReservationToServer(reservation);
    reduceStock(items);
    state.reservations = [savedReservation, ...state.reservations.filter((item) => item.id !== savedReservation.id)];
    addAudit(`Admin membuat pesanan langsung ${savedReservation.id}`);
    saveState();
    form.reset();
    renderAll();
    toast("Pesanan langsung tersimpan.");
    openOrderDetail(savedReservation.id);
  } catch (error) {
    hint.textContent = error.message;
  }
  return true;
}

async function handleAdminCrud(event) {
  if (await handleWalkInOrder(event)) return;
  const form = event.target.closest("[data-crud]");
  if (!form) return;
  event.preventDefault();
  const values = [...form.querySelectorAll("input")].map((input) => input.value.trim());
  if (values.some((value) => !value)) return;
  const type = form.dataset.crud;
  if (type === "menu") {
    state.menus.push({
      id: `M-${Date.now()}`,
      name: values[0],
      category: values[1],
      price: Number(values[2]) || 0,
      stock: Number(values[3]) || 0,
      desc: values[4],
      image: DEFAULT_MENU_IMAGE,
    });
  }
  if (type === "promo") {
    state.promos.push({ id: `P-${Date.now()}`, title: values[0], discount: values[1], desc: values[2] });
  }
  if (type === "gallery") {
    state.gallery.push({ id: `G-${Date.now()}`, title: values[0], image: DEFAULT_GALLERY_IMAGE });
  }
  addAudit(`Admin menambah ${type}`);
  saveState();
  renderAll();
}

document.addEventListener("click", async (event) => {
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    category = categoryButton.dataset.category;
    renderMenu();
  }

  const authModeButton = event.target.closest("[data-auth-mode]");
  if (authModeButton) setAuthMode(authModeButton.dataset.authMode);

  const adminTabButton = event.target.closest("[data-admin-tab]");
  if (adminTabButton) {
    adminTab = adminTabButton.dataset.adminTab;
    document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button === adminTabButton));
    renderAdminContent();
  }

  const deleteReservation = event.target.closest("[data-delete-res]");
  if (deleteReservation) {
    const id = deleteReservation.dataset.deleteRes;
    if (!confirmDelete(`reservasi ${id}`)) return;
    try {
      await apiRequest(`/reservations/${encodeURIComponent(id)}`, { method: "DELETE" });
      state.reservations = state.reservations.filter((item) => item.id !== id);
      addAudit(`Admin menghapus reservasi ${id}`);
      saveState();
      renderAll();
    } catch (error) {
      toast(error.message);
    }
  }

  const printReservation = event.target.closest("[data-print]");
  if (printReservation) {
    openPurchaseReceipt(printReservation.dataset.print);
  }

  const detailReservation = event.target.closest("[data-detail]");
  if (detailReservation) {
    openOrderDetail(detailReservation.dataset.detail);
  }

  const customerCode = event.target.closest("[data-code]");
  if (customerCode) {
    openReservationCode(customerCode.dataset.code);
  }

  const saveStock = event.target.closest("[data-save-stock]");
  if (saveStock) {
    const menu = state.menus.find((item) => item.id === saveStock.dataset.saveStock);
    const input = document.querySelector(`[data-edit-stock="${saveStock.dataset.saveStock}"]`);
    if (!menu || !input) return;
    const nextStock = Math.max(Number(input.value) || 0, 0);
    menu.stock = nextStock;
    addAudit(`Admin mengubah stok ${menu.name} menjadi ${menu.stock}`);
    saveState();
    renderAll();
    toast(`Stok ${menu.name} diperbarui.`);
  }

  ["menu", "promo", "gallery"].forEach((type) => {
    const button = event.target.closest(`[data-delete-${type}]`);
    if (!button) return;
    const id = button.dataset[`delete${type[0].toUpperCase()}${type.slice(1)}`];
    const labels = { menu: "menu", promo: "promo", gallery: "galeri" };
    if (!confirmDelete(`${labels[type]} ${id}`)) return;
    const collection = type === "gallery" ? "gallery" : `${type}s`;
    state[collection] = state[collection].filter((item) => item.id !== id);
    addAudit(`Admin menghapus ${type} ${id}`);
    saveState();
    renderAll();
  });
});

document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-menu-id]")) calculateOrderTotal();
  if (event.target.matches("[data-admin-order-menu-id]")) updateAdminOrderTotal();
  if (event.target.matches("[data-status]")) {
    const reservation = state.reservations.find((item) => item.id === event.target.dataset.status);
    if (!reservation) return;
    const previousStatus = reservation.status;
    reservation.status = event.target.value;
    try {
      const savedReservation = await apiRequest(`/reservations/${encodeURIComponent(reservation.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: reservation.status }),
      });
      Object.assign(reservation, normalizeReservation(savedReservation));
      addAudit(`Admin mengubah status ${reservation.id} menjadi ${reservation.status}`);
      saveState();
      renderAll();
    } catch (error) {
      reservation.status = previousStatus;
      renderAll();
      toast(error.message);
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#reservationLookup")) {
    customerReservationSearch = event.target.value;
    renderHistory();
  }
  if (event.target.matches("#adminReservationSearch")) {
    adminReservationSearch = event.target.value;
    renderAdminContent();
    const search = $("#adminReservationSearch");
    search?.focus();
    search?.setSelectionRange(adminReservationSearch.length, adminReservationSearch.length);
  }
  if (event.target.matches("[data-menu-id]")) calculateOrderTotal();
  if (event.target.matches("[data-admin-order-menu-id]")) updateAdminOrderTotal();
});

$("#navToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
$("#authOpen").addEventListener("click", () => {
  if (currentUser()) {
    saveSession(null);
    toast("Logout berhasil.");
    renderAll();
    return;
  }
  setAuthMode("login");
  $("#authModal").showModal();
});
$("#adminOpen").addEventListener("click", () => {
  window.location.hash = "admin";
  showAdminPage();
});
$("#authClose").addEventListener("click", () => $("#authModal").close());
$("#adminBack").addEventListener("click", () => {
  history.pushState("", document.title, window.location.pathname + window.location.search);
  showCustomerPage();
});
$("#receiptClose").addEventListener("click", () => $("#receiptModal").close());
$("#receiptPrint").addEventListener("click", () => window.print());
$("#forgotPassword").addEventListener("click", () => {
  $("#authHint").textContent = "Reset password: hubungi admin Kuna Kopi untuk verifikasi akun.";
});
$("#refreshHistory").addEventListener("click", async () => {
  try {
    await loadServerReservations();
    renderHistory();
    toast("Data reservasi diperbarui.");
  } catch (error) {
    toast(error.message);
  }
});
$("#authForm").addEventListener("submit", handleAuth);
$("#reservationForm").addEventListener("submit", handleReservation);
$("#adminLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if ($("#adminUser").value === "admin" && $("#adminPass").value === "admin123") {
    $("#adminLogin").hidden = true;
    $("#adminDashboard").hidden = false;
    addAudit("Admin login");
    renderAdmin();
  }
});
$("#adminLogout").addEventListener("click", () => {
  $("#adminLogin").hidden = false;
  $("#adminDashboard").hidden = true;
  addAudit("Admin logout");
  history.pushState("", document.title, window.location.pathname + window.location.search);
  showCustomerPage();
});
$("#adminContent").addEventListener("submit", handleAdminCrud);
window.addEventListener("hashchange", syncPageFromHash);

setAuthMode("login");
renderAll();
syncLocalReservationsToServer()
  .then(loadServerReservations)
  .then(renderAll)
  .catch(() => toast("Data server belum bisa dimuat. Jalankan migrasi/server Laravel dulu."));
syncPageFromHash();
