const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();
const port = 3000;

const client = new Client({
    authStrategy: new LocalAuth(),
});

let qrCodeData = null;

client.on('qr', async (qr) => {
    console.log('QR Code tersedia.');
    qrCodeData = await qrcode.toDataURL(qr);
});

client.on('ready', () => {
    console.log('WhatsApp bot berhasil terhubung!');
    qrCodeData = null;
});

// Ketika sesi terputus
client.on('disconnected', (reason) => {
    console.log('WhatsApp bot terputus:', reason);
    client.initialize();
});

// Event untuk menerima pesan
client.on('message', async (message) => {
    console.log('Pesan diterima dari:', message.from);
    console.log('Isi pesan:', message.body);
    console.log('Waktu pesan:', message.timestamp);

    // Jika pesan berisi media dan command /sticker
    if (message.body.startsWith('/sticker') && message.hasMedia) {
        const media = await message.downloadMedia();

        // Mengonversi media menjadi stiker
        if (media && media.mimetype.startsWith('image')) {
            try {
                // Kirimkan stiker ke pengirim
                const sticker = await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
                console.log('Stiker berhasil dikirim ke:', message.from);
            } catch (error) {
                console.error('Error saat mengirim stiker:', error);
                message.reply('Terjadi kesalahan saat membuat stiker.');
            }
        } else {
            message.reply('Silakan kirim gambar setelah menggunakan command /sticker.');
        }
    }
});

app.get('/api/qrcode', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.json({ qr: null, message: 'Bot sudah terhubung!' });
    }
});

app.post('/api/delete-session', async (req, res) => {
    try {
        const sessionPath = path.join(__dirname, '.wwebjs_auth');
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('Sesi berhasil dihapus.');
            qrCodeData = null;
            client.destroy();
            client.initialize();
            res.json({ success: true, message: 'Sesi berhasil dihapus. Silakan scan ulang QR Code.' });
        } else {
            res.json({ success: false, message: 'Tidak ada sesi yang ditemukan.' });
        }
    } catch (error) {
        console.error('Error saat menghapus sesi:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus sesi.' });
    }
});

app.listen(port, () => {
    console.log(`Bot berjalan di http://localhost:${port}`);
});

client.initialize();
