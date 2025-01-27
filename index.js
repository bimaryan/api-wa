const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');

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

client.on('message', (message) => {
    console.log(`Pesan diterima: ${message.body}`);
    message.reply('Halo! Ini adalah bot WhatsApp.');
});

app.get('/api/qrcode', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.json({ qr: null, message: 'Bot sudah terhubung!' });
    }
});

app.listen(port, () => {
    console.log(`Bot berjalan di http://localhost:${port}`);
});

client.initialize();
