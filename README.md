<p align="center">
  <img src="https://e.top4top.io/p_38721hu6c1.jpg" width="250"/>
</p>

<h1 align="center">WhatsApp Baileys</h1>

<p align="center">
  Open-source library for building fast, stable WhatsApp automation and integrations over WebSocket — no browser required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/multi--device-supported-success" />
</p>

---

## 📑 Table of Contents 

- [About](#about)
- [Installation](#installation)
- [Import](#import)
- [How To Connect To WhatsApp](#how-to-connect-to-whatsapp)
  - [With QR Code](#with-qr-code)
  - [Connect With Pairing Code](#connect-with-pairing-code)
- [Usage Examples](#usage-examples)
  - [Sending a Message with Participant](#sending-a-message-with-participant)
- [Why Choose WhatsApp Baileys?](#why-choose-whatsapp-baileys)
- [Technical Notes](#technical-notes)
- [Contact Developer](#contact-developer)

---

## About

WhatsApp Baileys is an open-source library designed to help developers build automation solutions and integrations with WhatsApp efficiently and directly. Using WebSocket technology without the need for a browser, this library supports a wide range of features such as message management, chat handling, group administration, as well as interactive messages and action buttons for a more dynamic user experience.

Actively developed and maintained, Baileys continuously receives updates to enhance stability and performance. One of the main focuses is improving the pairing and authentication processes to be more stable and secure. Pairing features can be customized with your own codes, making the process more reliable and less prone to interruptions.

This library is highly suitable for building business bots, chat automation systems, customer service solutions, and various other communication automation applications that require high stability and comprehensive features. With a lightweight and modular design, Baileys is easy to integrate into different systems and platforms.

---

## Installation

```bash
npm install @whiskeysockets/baileys
```

Add it to your `package.json`:

```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "github:xvnsync/xbails"
  }
}
```

---

## Import

```javascript
const {
  default: makeWASocket,
  // Other Options
} = require('@whiskeysockets/baileys');
```

---

## How To Connect To WhatsApp

### With QR Code

```javascript
const {
  default: makeWASocket,
  Browsers
  // Other Options
} = require('@whiskeysockets/baileys');

const client = makeWASocket({
  browser: Browsers.ubuntu('Chrome'),
  printQRInTerminal: true
});
```

### Connect With Pairing Code

```javascript
const {
  default: makeWASocket,
  fetchLatestWAWebVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const client = makeWASocket({
  browser: Browsers.ubuntu('Chrome'),
  printQRInTerminal: false,
  version: fetchLatestWAWebVersion(),
  auth: state
});

const number = "628XXXXX";
const code = await client.requestPairingCode(number.trim()); // Use (number, "XXXXXXXX") for custom pairing

console.log("Ur pairing code : " + code);
```

---

## Usage Examples

### Sending a Message with Participant

```javascript
await client.sendMessage(m.chat, {
  text: "XvnSynC"
}, {
  ptcp: true
});
```

---

## Why Choose WhatsApp Baileys?

Because this library offers high stability, full features, and an actively improved pairing process. It is ideal for developers aiming to create professional and secure WhatsApp automation solutions. Support for the latest WhatsApp features ensures compatibility with platform updates.

---

## Technical Notes

- Supports custom pairing codes that are stable and secure
- Fixes previous issues related to pairing and authentication
- Features interactive messages and action buttons for dynamic menu creation
- Automatic and efficient session management for long-term stability
- Compatible with the latest multi-device features from WhatsApp
- Easy to integrate and customize based on your needs
- Perfect for developing bots, customer service automation, and other communication applications
- Has 1 newsletter follow, only the developer's WhatsApp channel: [WhatsApp Channel](https://whatsapp.com/channel/0029VbDlfld4yltRwFKFL73X)

---

For complete documentation, installation guides, and implementation examples, please visit the official repository and community forums. We continually update and improve this library to meet the needs of developers and users of modern WhatsApp automation solutions.

**Thank you for choosing WhatsApp Baileys as your WhatsApp automation solution!**

---

## Contact Developer

For questions, support, or collaboration, feel free to contact the developer:

- **Telegram**: [Telegram Contact](https://t.me/luyatiem)
- **Channel WhatsApp**: [Channel WhatsApp](https://whatsapp.com/channel/0029VbDlfld4yltRwFKFL73X)
- **Channel Telegram**: [Channel Telegram](https://t.me/aboutvin7x)