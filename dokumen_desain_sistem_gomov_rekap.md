# Dokumen Desain Sistem POS Kopi Keliling (GOMOV Rekap Update)

Dokumen ini berisi spesifikasi teknis dan fungsional untuk pembaruan sistem **GOMOV Rekap**, yang dirancang khusus untuk operasional bisnis kopi keliling dengan integrasi manajemen inventaris, resep, HPP otomatis, setoran kasir, piutang, dan penggajian karyawan berbasis *role*.

---

## 1. Arsitektur Multi-User & Hak Akses (Role-Based Access Control)
Sistem membagi hak akses ke dalam tiga peran utama untuk menjaga keamanan data finansial dan operasional:

1. **Owner / Pemilik:**
   * Akses penuh ke seluruh modul (Dashboard, Penjualan, Menu & Harga, Stok Bahan, Karyawan & Gaji, Operasional, Laporan, dan Audit Log).
   * Dapat mengatur komponen gaji, melihat rekap setoran seluruh kasir, dan memantau laba bersih perusahaan.
2. **Admin:**
   * Mengelola produk, resep, stok bahan baku, pembelian dari supplier, dan pencatatan operasional rutin.
3. **Barista / Kasir:**
   * Mengakses menu pencatatan penjualan harian (POS), input setoran kasir, dan melihat profil serta **mengunduh slip gaji miliknya sendiri**. Karyawan lain tidak dapat melihat slip gaji sesama karyawan.

---

## 2. Rincian Fitur & Modul Sistem

### A. Dashboard Utama
Menampilkan ringkasan data real-time harian dan bulanan:
* Total Penjualan (Omset)
* Rincian Metode Pembayaran: $\text{Total Cash}$ vs $\text{Total QRIS}$
* Total Transaksi & Total Cup Terjual
* Total HPP & Estimasi Laba Kotor
* Total Piutang Aktif & Status Selisih Setoran Harian

### B. Modul Penjualan & Setoran Harian (Kasir)
* **Pencatatan Penjualan:** Transaksi dicatat per cup dengan pilihan metode pembayaran (Cash / QRIS) dan otomatis mengurangi stok bahan berdasarkan resep produk.
* **Rekap Setoran Harian:** 
  * Kasir memasukkan jumlah fisik uang *Cash* aktual di akhir shift.
  * Sistem menghitung otomatis total uang jualan: 
    $$\text{Setoran Sistem} = \text{Total Cash} + \text{Total QRIS}$$
  * Sistem menghitung selisih secara otomatis:
    $$\text{Selisih} = \text{Uang Cash Aktual} - \text{Total Cash Sistem}$$
  * Status otomatis: *Sesuai*, *Selisih Kecil*, atau *Ada Kekurangan*, dilengkapi kolom catatan alasan selisih.

### C. Modul Piutang Pelanggan
* Pencatatan transaksi piutang meliputi: Nama Pelanggan, Nomor HP, Tanggal Transaksi, Produk, Total Piutang, Pembayaran Awal, Sisa Piutang, dan Tanggal Jatuh Tempo.
* Dilengkapi fitur pelunasan piutang bertahap serta riwayat pelunasan pelanggan.

### D. Modul Menu, Resep, & HPP Dinamis
* **Master Bahan Baku:** Satuan pembelian (kg, ml, gram, pcs) dengan konversi harga otomatis ke satuan terkecil (contoh: Gula Rp20.000/kg $\rightarrow$ Rp20/gram).
* **Komposisi Resep per Cup:** Setiap menu (misal: *Es Kopi Gula Aren*) diatur resep bahannya (kopi, susu, gula aren, cup, sedotan).
* **HPP Otomatis:** Sistem menghitung HPP per cup berdasarkan harga bahan terbaru yang tersimpan secara dinamis (riwayat perubahan harga bahan tetap tercatat tanpa merusak data lampau).

### E. Modul Inventaris, Stok, & Waste
* **Pengurangan Stok Otomatis:** Stok bahan berkurang otomatis saat transaksi penjualan tercatat.
* **Notifikasi Stok Menipis:** Peringatan visual jika stok bahan di bawah batas minimum (*Min. Stock Alert*).
* **Pencatatan Waste (Barang Terbuang):** Mencatat bahan/produk yang rusak, tumpah, atau *expired* agar nilai kerugian tercatat di laporan.

### F. Modul Karyawan & Penggajian (Payroll)
* **Komponen Gaji:** Gaji Pokok, Uang Makan / Hari, Target Penjualan, Bonus Target, dan Potongan / Minus.
* **Slip Gaji Mandiri:** Karyawan dapat *login* menggunakan akun pribadi untuk melihat rincian gaji bulanan dan mengunduh (*download*) slip gaji dalam format PDF/cetak secara mandiri.
* **Privasi Ketat:** Filter sistem memastikan data gaji bersifat rahasia antar-karyawan.

### G. Modul Operasional & Laporan
* **Biaya Operasional:** Pencatatan pengeluaran rutin (sewa, listrik, WiFi, dll.) yang otomatis mengurangi laba bersih.
* **Laporan Lengkap:** Laporan penjualan, resep, HPP, laba-rugi, arus kas (Cash vs QRIS), piutang, dan log audit aktivitas sistem.

---

## 3. Alur Utama Sistem (Workflow)
$$\text{Penjualan (Cash / QRIS)} \rightarrow \text{Pengurangan Stok via Resep} \rightarrow \text{Hitung HPP & Laba} \rightarrow \text{Rekap Setoran Harian} \rightarrow \text{Laporan Keuangan & Gaji}$$