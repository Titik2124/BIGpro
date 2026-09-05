<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Kuna Kopi | Reservasi & Pemesanan</title>
    <link rel="stylesheet" href="{{ asset('styles.css') }}">
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="#beranda" aria-label="Kuna Kopi">
        <span class="brand-mark"><img src="images/logo.jpeg" alt="Kuna Kopi Logo"></span>
        <span>Kuna Kopi</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Buka navigasi">☰</button>
      <nav class="nav" id="nav">
        <a href="#menu">Menu</a>
        <a href="#promo">Promo</a>
        <a href="#reservasi">Reservasi</a>
        <a href="#riwayat">Cek Reservasi</a>
        <a href="#kontak">Kontak</a>
        <button class="ghost small" id="adminOpen">Admin</button>
        <button class="primary small" id="authOpen">Masuk</button>
      </nav>
    </header>

    <main id="customerPage">
      <section class="hero" id="beranda">
        <div class="hero-media" role="img" aria-label="Suasana meja kopi di Kuna Kopi"></div>
        <div class="hero-content">
          <p class="eyebrow">Reservasi online dan menu siap saji</p>
          <h1>Kuna Kopi</h1>
          <p>
            Pesan kopi, pilih meja, dan datang saat semuanya sudah siap. Admin dapat
            memantau reservasi, menu, promo, galeri, dan statistik operasional dalam satu tempat.
          </p>
          <div class="hero-actions">
            <a class="primary" href="#reservasi">Buat Reservasi</a>
            <a class="secondary" href="#menu">Lihat Menu</a>
          </div>
        </div>
      </section>

      <section class="section intro-grid" id="tentang">
        <div>
          <p class="eyebrow">Tentang Kami</p>
          <h2>Tempat ngopi hangat dengan rasa tempo dulu.</h2>
          <p>
            Kuna Kopi menghadirkan suasana klasik yang nyaman, menu khas,
            dan pelayanan yang tetap praktis untuk pelanggan masa kini.
          </p>
        </div>
        <div class="mission about-points">
          <div class="about-point">
            <strong>Nuansa klasik</strong>
            <span>Nama menu, interior, dan suasana dibuat dekat dengan kesan kuno.</span>
          </div>
          <div class="about-point">
            <strong>Pengalaman unik</strong>
            <span>Bukan hanya minum kopi, tapi menikmati tempat yang punya karakter.</span>
          </div>
          <div class="about-point">
            <strong>Tetap praktis</strong>
            <span>Reservasi, menu, dan transaksi dibantu sistem agar lebih rapi.</span>
          </div>
        </div>
      </section>

      <section class="section" id="menu">
        <div class="section-head">
          <div>
            <p class="eyebrow">Daftar Menu</p>
            <h2>Pilih favorit sebelum datang</h2>
          </div>
          <div class="filter-row" id="categoryFilters"></div>
        </div>
        <div class="menu-grid" id="menuGrid">
    @foreach ($semuaMenu as $menu)
        <div class="card-menu">
            <img src="{{ asset('images/' . $menu->foto) }}" alt="{{ $menu->nama_menu }}">
            <h3>{{ $menu->nama_menu }}</h3>
            <p>Rp {{ number_format($menu->harga, 0, ',', '.') }}</p>
        </div>
    @endforeach
</div>
      </section>

      <section class="section split" id="promo">
        <div>
          <p class="eyebrow">Promo</p>
          <h2>Penawaran terbaru</h2>
          <div class="promo-list" id="promoList"></div>
        </div>
        <div>
          <p class="eyebrow">Galeri</p>
          <h2>Suasana Kuna Kopi</h2>
          <div class="gallery-grid" id="galleryGrid"></div>
        </div>
      </section>

      <section class="section reservation-layout" id="reservasi">
        <div class="reservation-copy">
          <p class="eyebrow">Reservasi / Pemesanan</p>
          <h2>Datang, duduk, pesanan meluncur ke meja.</h2>
          <p>
            Fitur reservasi hanya aktif untuk pelanggan yang sudah login. Data nama dan
            WhatsApp otomatis mengikuti akun pelanggan.
          </p>
          <div class="status-strip">
            <span>Menunggu Konfirmasi</span>
            <span>Diproses</span>
            <span>Siap Disajikan</span>
            <span>Selesai</span>
          </div>
        </div>
        <form class="panel form" id="reservationForm">
          <div class="form-row">
            <label>
              Nama
              <input id="resName" type="text" disabled />
            </label>
            <label>
              WhatsApp
              <input id="resPhone" type="text" disabled />
            </label>
          </div>
          <div class="form-row">
            <label>
              Tanggal
              <input id="resDate" type="date" required />
            </label>
            <label>
              Jam
              <input id="resTime" type="time" required />
            </label>
          </div>
          <div class="form-row">
            <label>
              Jumlah Orang
              <input id="resPeople" type="number" min="1" value="2" required />
            </label>
            <label>
              Nomor Meja
              <select id="resTable">
                <option value="">Pilih meja</option>
                <option>Meja 1</option>
                <option>Meja 2</option>
                <option>Meja 3</option>
                <option>Meja 4</option>
                <option>Meja Teras</option>
              </select>
            </label>
          </div>
          <label>
            Pilihan Menu
            <div class="order-list" id="orderList"></div>
          </label>
          <label>
            Catatan Tambahan
            <textarea id="resNote" rows="3" placeholder="Contoh: less sugar, meja dekat jendela"></textarea>
          </label>
          <div class="total-line">
            <span>Total</span>
            <strong id="orderTotal">Rp0</strong>
          </div>
          <button class="primary wide" type="submit">Kirim Reservasi</button>
          <p class="form-hint" id="reservationHint"></p>
        </form>
      </section>

      <section class="section" id="riwayat">
        <div class="section-head">
          <div>
            <p class="eyebrow">Cek Reservasi</p>
            <h2>Cukup sebutkan kode, nama, atau nomor HP.</h2>
          </div>
          <div class="lookup-actions">
            <input id="reservationLookup" type="search" placeholder="Kode / nama / nomor HP" />
            <button class="secondary small" id="refreshHistory">Perbarui</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tanggal</th>
                <th>Nama</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="historyTable"></tbody>
          </table>
        </div>
      </section>

      <section class="section contact-band" id="kontak">
        <div>
          <p class="eyebrow">Kontak & Lokasi</p>
          <h2>Kuna Kopi Jum'at libur lurrr</h2>
          <p>Dusun I, Makam, Kec.Rembang, Kabupaten Purbalingga</p>
          <div class="map-actions">
            <a class="primary small" href="https://maps.app.goo.gl/hCqmTmuS1JuP8oCT8?g_st=ac" target="_blank" rel="noopener">Buka Maps</a>
            <a class="secondary small" href="https://maps.app.goo.gl/hCqmTmuS1JuP8oCT8?g_st=ac" target="_blank" rel="noopener">Rute ke Cafe</a>
          </div>
        </div>
        <div class="contact-list">
          <span>WhatsApp: 0882-1565-2061</span>
          <span>Jam: 15.30 - kamu kembali lagi</span>
          <span>Instagram: @kunakopi_</span>
        </div>
        <iframe
          title="Peta lokasi Kuna Kopi"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Dusun%20I%2C%20Makam%2C%20Rembang%2C%20Purbalingga%2C%20Jawa%20Tengah&output=embed"
        ></iframe>
      </section>
    </main>

    <dialog class="modal" id="authModal">
      <form class="modal-box" id="authForm">
        <button class="icon-close" id="authClose" type="button" aria-label="Tutup">×</button>
        <p class="eyebrow">Akun Pelanggan</p>
        <h2 id="authTitle">Masuk</h2>
        <div class="tabs">
          <button type="button" class="tab active" data-auth-mode="login">Login</button>
          <button type="button" class="tab" data-auth-mode="register">Registrasi</button>
        </div>
        <div class="register-only">
          <label>Nama Lengkap <input id="authName" type="text" /></label>
          <label>Nomor WhatsApp <input id="authPhone" type="tel" placeholder="08xxxxxxxxxx" /></label>
        </div>
        <label>Email atau WhatsApp <input id="authIdentity" type="text" required /></label>
        <label>Password <input id="authPassword" type="password" required /></label>
        <label class="register-only">Konfirmasi Password <input id="authPasswordConfirm" type="password" /></label>
        <label class="checkbox-line login-only">
          <input id="rememberMe" type="checkbox" />
          Remember me
        </label>
        <button class="primary wide" type="submit">Lanjutkan</button>
        <button class="link-button login-only" type="button" id="forgotPassword">Lupa password?</button>
        <p class="form-hint" id="authHint">Masukkan akun pelanggan yang sudah terdaftar.</p>
      </form>
    </dialog>

    <section class="admin-page" id="adminPage" hidden>
      <div class="admin-shell">
        <div class="admin-box">
        <div id="adminLogin">
          <div class="admin-head">
            <div>
              <p class="eyebrow">Admin</p>
              <h2>Masuk Dashboard</h2>
            </div>
            <button class="secondary small" id="adminBack" type="button">Halaman Pelanggan</button>
          </div>
          <form class="form" id="adminLoginForm">
            <label>Username <input id="adminUser" type="text" value="admin" required /></label>
            <label>Password <input id="adminPass" type="password" required /></label>
            <button class="primary wide" type="submit">Masuk Admin</button>
            <p class="form-hint">Masukkan username dan password admin.</p>
          </form>
        </div>

        <div id="adminDashboard" hidden>
          <div class="admin-head">
            <div>
              <p class="eyebrow">Dashboard Admin</p>
              <h2>Operasional Kuna Kopi</h2>
            </div>
            <button class="secondary small" id="adminLogout">Logout</button>
          </div>
          <div class="stat-grid" id="statGrid"></div>
          <div class="admin-tabs" id="adminTabs">
            <button class="tab active" data-admin-tab="reservations">Reservasi</button>
            <button class="tab" data-admin-tab="menus">Menu</button>
            <button class="tab" data-admin-tab="promos">Promo</button>
            <button class="tab" data-admin-tab="gallery">Galeri</button>
            <button class="tab" data-admin-tab="audit">Log Aktivitas</button>
          </div>
          <div class="admin-content" id="adminContent"></div>
        </div>
      </div>
      </div>
    </section>

    <dialog class="modal receipt-modal" id="receiptModal">
      <div class="modal-box receipt-shell">
        <button class="icon-close no-print" id="receiptClose" type="button" aria-label="Tutup">×</button>
        <div id="receiptContent"></div>
        <button class="primary wide no-print" id="receiptPrint" type="button" hidden></button>
      </div>
    </dialog>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <script src="{{ asset('app.js') }}"></script>
  </body>
</html>
