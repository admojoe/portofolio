**Image optimization & responsive variants**

1) Prasyarat
   - Node.js >= 16
   - `npm install` di folder proyek

2) Install deps

```bash
npm install
```

3) Jalankan optimasi (akan membuat `-500.webp` dan `-1000.webp` untuk setiap file yang tercantum di `image-optimize.js`):

```bash
npm run optimize
```

4) Hasil
   - File baru akan dibuat di `assets/images/` seperti `commercial-500.webp`, `commercial-1000.webp`, dll.

Notes:
- Quality diatur ke 75 (WebP). Sesuaikan `image-optimize.js` bila perlu.
- Jika Anda ingin menggunakan ImageMagick atau cwebp, gunakan alternatif di dokumen ini.
