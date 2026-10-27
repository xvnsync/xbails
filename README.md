<p align="center">
  <img src="https://e.top4top.io/p_38721hu6c1.jpg" width="250"/>
</p>

<h1 align="center">WhatsApp Baileys</h1>

<p align="center">
  Open-source library for building fast, stable WhatsApp automation and integrations over WebSocket — no browser required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/multi--device-supported-success" />
</p>

> [!NOTE]
> `"@whiskeysockets/baileys": "github:xvnsync/xbails"` is an unofficial WhatsApp Web API library. Not affiliated, not authorized, not maintained, not sponsored, and not endorsed by WhatsApp or Meta.
>
> Use Baileys responsibly, and comply with the WhatsApp Terms of Service and applicable laws.

---

# Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Import](#import)
- [Quick Start](#quick-start)
  - [With QR Code](#with-qr-code)
  - [With Pairing Code](#with-pairing-code)
- [Sending Message](#sending-message)
  - [Generic Send / Relay](#generic-send--relay)
  - [sPR](#spr)
  - [Simple Senders](#simple-senders)
  - [Ban Checker](#ban-checker)
  - [Send Message with Participant](#sending-message-with-participant)
  - [Rich Menu](#rich-menu)
- [Message Builder](#message-builder)
  - [Import](#import-1)
  - [Example](#example)
- [Button](#button)
  - [Quick Reply + URL + Copy](#quick-reply--url--copy)
- [ButtonV2](#buttonv2)
- [Carousel](#carousel)
- [Why Choose WhatsApp Baileys?](#why-choose-whatsapp-baileys)
- [Contributors](#contributors)
- [Contact & Support](#contact--support)

---

# Requirements

- Node.js **>= 20**
- Optional peer dependencies depending on the features you use:
  - `sharp` or `jimp` for image processing
  - `link-preview-js` for link previews
  - `audio-decode` for audio waveform handling
  - `fluent-ffmpeg` for frame preview video, MessageBuilder Toolkit.getMp4Preview

---

# Installation

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

# Import

```javascript
const {
  default: makeWASocket,
  // Other Options
} = require('@whiskeysockets/baileys');
```

---

# Quick Start

## With QR Code

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

## With Pairing Code

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

# Sending Message

## Generic Send / Relay

```javascript
// relayMessage — sends a raw message object
(async () => {
	await client.relayMessage(m.chat, {
		conversation: 'XvnSynC'
	});
})();

// sendMessage — the standard way to send a message
(async () => {
	await client.sendMessage(m.chat, {
		text: 'XvnSynC'
	});
})();
```



## sPR

This build includes the `sPR` helper adapted to this Baileys fork. It exposes a named export and uses the fork's local utility modules instead of importing a separate package named `baileys`.

### Import

```javascript
import { sPR } from '@whiskeysockets/baileys';
```

### Basic usage

```javascript
const messageId = await sPR(
  sock,
  '6281234567890@s.whatsapp.net',
  { conversation: 'Hello from sPR' }
);

console.log('Message ID:', messageId);
```

### Options

```javascript
await sPR(
    client,
    "120363000000000000@g.us",
    {
        conversation: "Hello, group!"
    },
    {
        mode: "include",
        target: [
            "6281234567890@s.whatsapp.net",
            "628000000000@s.whatsapp.net"
        ],
        deviceMode: 'all'
    }
);
```

Available options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `messageId` | `string` | Generated automatically | Custom message ID |
| `additionalAttributes` | `object` | `{}` | Extra message stanza attributes |
| `useUserDevicesCache` | `boolean` | `true` | Use the device cache during recipient resolution |
| `useCachedGroupMetadata` | `boolean` | `true` | Use cached group metadata when available |
| `statusJidList` | `string[]` | — | Additional status recipients |
| `additionalNodes` | `object[]` | — | Extra stanza nodes |
| `targetMe` | `boolean` | — | Override filtering for the sender's own devices |
| `mode` | `'include' \| 'exclude'` | `'exclude'` | Select matching or non-matching devices |
| `target` | `string[]` | `[]` | Recipient JIDs, optionally including a device ID |
| `hideDecryptFail` | `boolean` | `true` | Add the `decrypt-fail="hide"` attribute where applicable |
| `deviceMode` | `'all' \| 'primary' \| 'secondary'` | `'all'` | Filter by primary or secondary device ID |

### Important compatibility notes

- `sPR` uses internal Baileys connection methods. Keep this helper aligned with the version of this fork and retest it after updating the library.
- A returned message ID means the stanza was sent to the connection; it does not confirm that every intended recipient received or displayed it.
- Recipient and device filtering does not guarantee a particular visibility outcome. Test with accounts and devices you control, and use it transparently and responsibly.
- The helper supports text and message payloads that are compatible with the underlying Baileys encoders. Some message types or WhatsApp protocol changes may require further adaptation.


## Simple Senders

### Send Text

```javascript
(async () => {
	await client.sendText(m.chat, 'Hi!', {
		contextInfo: {
			mentionedJid: [jid]
		}
	});
})();
```

### Send Image

```javascript
(async () => {
	await client.sendImage(m.chat, { url: './photo.jpg' }, 'image caption');
})();
```

### Send Video

```javascript
(async () => {
	await client.sendVideo(m.chat, { url: './clip.mp4' }, 'video caption');
})();
```

### Send Audio

```javascript
(async () => {
	await client.sendAudio(m.chat, { url: './clip.mp3' });
})();
```

### Send Location

```javascript
(async () => {
	await client.sendLocation(m.chat, 'Location name', -6.2, 106.8, 'https://maps.example', '1234567890');
})();
```

### Send Poll

```javascript
(async () => {
	await client.sendPoll(m.chat, 'Pick one', ['Option 1', 'Option 2', 'Option 3'], true);
})();
```

### Send Quiz

```javascript
(async () => {
	await client.sendQuiz(m.chat, 'Correct answer?', ['1', '2', '3'], '2');
})();
```

## Ban Checker

`checkBan` allows you to check the WhatsApp ban status of a phone number using an external API.

### Example

```javascript
(async () => {
	try {
		const number = '6281234567890';
		const result = await checkBan(number);

		await client.sendMessage(m.chat, {
			text: JSON.stringify(result, null, 2)
		});
	} catch (error) {
		console.error('Ban Checker Error:', error.message);
	}
})();
```

### Usage

- Replace `6281234567890` with the phone number you want to check.
- `checkBan` must already be defined in your bot's environment.

> [!NOTE]
> Ban Checker relies on an external API. Its availability and accuracy depend on the API provider. Results are not an official confirmation of a WhatsApp account's ban status.

# Send Message with Participant

`relayMessage`:

```javascript
(async () => {
	await client.relayMessage(m.chat, {
		extendedTextMessage: {
			text: 'XvnSynC'
		}
	}, {
		ptcp: true
	});
})();
```

`sendMessage`:

```javascript
(async () => {
	await client.sendMessage(m.chat, {
		text: 'XvnSynC'
	}, {
		ptcp: true
	});
})();
```

## Rich Menu

`sendRich` sends a rich response with an optional header image, action buttons, carousel cards, and an open-URL footer:

```javascript
await client.sendRich(m.chat, {
  header: {
    disclaimer: true,
    disclaimerText: "t.me/luyatiem",
    title: "XvnSynC"
  },
  body: {
    title: "Select Option",
    buttons: ["Menu 1", "Menu 2"]
  },
  footer: {
    text: "Telegram Channel",
    url: "https://t.me/aboutvin7x"
  }
});
```

---

# Message Builder

MessageBuilder v4.7 is included directly in `"github:xvnsync/xbails"`.

## Import

```javascript
const {
  VERSION,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  bind,
  MB
} = require('@whiskeysockets/baileys');
```

> [!NOTE]
> MessageBuilder is integrated. You don't need to install `baileys-mbuilder` separately.

---

## Example

```javascript
const { MB } = require('@whiskeysockets/baileys')

const rich = new MB.AIRich(sock)
  .setTitle('XvnSynC')
  .setFooter('Dibuat dengan AIRich')
  .addText('Halo! Ini respons rich.')
  .addCode('javascript', `console.log('Halo Melvin')`)
  .addTable([
    ['Fitur', 'Status'],
    ['Button', 'Tersedia'],
    ['Carousel', 'Tersedia'],
    ['AIRich', 'Eksperimental']
  ])
  .addSuggest(['List Menu', 'Help', 'About Melvin'])

await rich.send(jid)
```

---

## Button

Builder `Button` is used for native-flow interactive messages.

### Quick Reply + URL + Copy

```js
const { MB } = require('@whiskeysockets/baileys')

const msg = new MB.Button(client)
  .setTitle('Select Menu')
  .setBody('Pilih salah satu di bawah.')
  .setFooter('t.me/luyatiem')
  .addReply('Ping', 'ping')
  .addUrl('Buka Website', 'https://example.com')
  .addCopy('Salin Kode', 'XVNSYNC')

await msg.send(m.chat)
```

---

## ButtonV2

`ButtonV2` provides a simpler classic button builder.

```javascript
const { MB } = require('@whiskeysockets/baileys')

const message = new MB.ButtonV2(client)
  .setTitle('XvnSynC')
  .setSubtitle('WhatsApp Bot')
  .setBody('Pilih satu tindakan.')
  .setFooter('Melvin Baileys')
  .setThumbnail('https://example.com/xxx.jpg')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')

await message.send(m.chat)
```

---

## Carousel

Carousel cards can be created from `Button.toCard()` and then submitted to `Carousel`.

```javascript
const { MB } = require('@whiskeysockets/baileys')

const card1 = await new MB.Button(client)
  .setImage('https://example.com/card1.jpg')
  .setBody('Kartu pertama')
  .addReply('Pilih', 'card_1')
  .toCard()

const card2 = await new MB.Button(client)
  .setImage('https://example.com/card2.jpg')
  .setBody('Kartu kedua')
  .addUrl('Buka', 'https://example.com')
  .toCard()

const carousel = new MB.Carousel(client)
  .setBody('Pilih salah satu kartu di bawah.')
  .setFooter('Melvin Carousel')
  .addCard([card1, card2])

await carousel.send(jid)
```

> [!IMPORTANT]
> Each carousel card must have an image or video media attachment in its header.

---

# Why Choose WhatsApp Baileys?

Because this library offers high stability, full features, and an actively improved pairing process. It is ideal for developers aiming to create professional and secure WhatsApp automation solutions. Support for the latest WhatsApp features ensures compatibility with platform updates.

---

# Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/xvnsync">
        <img src="https://github.com/xvnsync.png" width="80px;" style="border-radius:50%;" alt="Main contributor"/>
        <br /><sub><b>Melvin D Zephyrine</b></sub>
      </a>
    </td>
  </tr>
</table>

---

## Contact & Support

Have questions, suggestions, or need help with this project? Feel free to reach out through the channels below.

<p align="center">
  <a href="https://t.me/luyatiem">
    <img src="https://img.shields.io/badge/Telegram-Contact%20Developer-26A5E4?style=flat-square&logo=telegram&logoColor=white" alt="Telegram"/>
  </a>
  <a href="https://whatsapp.com/channel/0029VbDlfld4yltRwFKFL73X">
    <img src="https://img.shields.io/badge/WhatsApp-Official%20Channel-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp Channel"/>
  </a>
  <a href="https://t.me/aboutvin7x">
    <img src="https://img.shields.io/badge/Telegram-Updates-2CA5E0?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Channel"/>
  </a>
</p>

<p align="center">
  <sub>Developed and maintained by <a href="https://github.com/xvnsync">Melvin D Zephyrine</a>.</sub>
</p>
