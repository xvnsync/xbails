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
  - [sendPrivateRelay](#sendprivaterelay)
  - [Simple Senders](#simple-senders)
  - [Ban Checker](#ban-checker)
- [Status](#status)
  - [sendStatus](#sendstatus)
  - [sendPrivateStatus](#sendprivatestatus)
  - [sendGroupStatus](#sendgroupstatus)
- [Report Flow](#report-flow)
- [Newsletter Status](#newsletter-status)
  - [sendNewsletterStatus](#sendnewsletterstatus)
  - [sendNewsletterStatusReaction](#sendnewsletterstatusreaction)
  - [revokeNewsletterStatus](#revokenewsletterstatus)
  - [getNewsletterStatuses](#getnewsletterstatuses)
  - [getNewsletterStatusUpdates](#getnewsletterstatusupdates)
- [Send Message with Participant](#sending-message-with-participant)
- [Rich Message](#rich-message)
  - [Send Rich](#send-rich)
  - [Edit Rich](#edit-rich)
  - [Send Html](#send-html)
- [Message Builder](#message-builder)
  - [Import](#import-1)
  - [Example](#example)
  - [sendEdit](#sendedit)
- [Split Payment](#split-payment)
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



## sendPrivateRelay

`sendPrivateRelay` is available directly on the socket client. It sends a message using the private relay helper and accepts the same message payload and relay options as the underlying implementation.

### Basic usage

```javascript
await client.sendPrivateRelay(m.chat, {
    conversation: "Hello!"
});
```

### Example with device filtering

**Include mode**
```javascript
(async () => {
    const target = "6281234567890@s.whatsapp.net"

    try {
        const result = await client.sendPrivateRelay(
            m.chat,
            {
                conversation: "XvnSynC"
            },
            {
                mode: "include",
                target: [target],
                deviceMode: "all",
                hideDecryptFail: true
            }
        )

        console.log("Private Relay sent:", result)
    } catch (error) {
        console.error("Private Relay failed:", error)
    }
})()
```

**Exclude mode**
```javascript
(async () => {
    const target = "6281234567890@s.whatsapp.net"

    try {
        const result = await client.sendPrivateRelay(
            m.chat,
            {
                conversation: "XvnSynC"
            },
            {
                mode: "exclude",
                target: [target],
                deviceMode: "all",
                hideDecryptFail: true
            }
        )

        console.log("Private Relay sent:", result)
    } catch (error) {
        console.error("Private Relay failed:", error)
    }
})()
```

### Available options

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

### Compatibility notes

- `sendPrivateRelay` is attached to each socket client, so call it as `client.sendPrivateRelay(jid, message, options)`.
- The returned message ID indicates that the stanza was sent to the connection; it does not confirm that every intended recipient received or displayed it.
- Recipient and device filtering does not guarantee a particular visibility outcome. Test with accounts and devices you control, and use it transparently and responsibly.
- The helper uses internal Baileys connection methods. Retest it after updating the library because WhatsApp protocol changes may affect compatibility.

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

### Send Image Poll

```javascript
(async () => {
	await client.sendImagePoll(m.chat, 'Pilih gambar favoritmu', [
		{ name: 'Option A', image: { url: './a.jpg' } },
		{ name: 'Option B', image: { url: './b.jpg' } },
		{ name: 'Option C', image: { url: './c.jpg' } }
	], true);
})();
```

### Send Quiz

```javascript
(async () => {
	await client.sendQuiz(m.chat, 'Correct answer?', ['1', '2', '3'], '2');
})();
```

### Send Audio Sticker

`client.sendAudioSticker(jid, content, options, quoted)` builds a sticker with an embedded voice/audio message — the recipient sees it as a sticker, but opening it plays the attached audio. Pass exactly one of `sticker` / `image` / `video` as the visual source, plus `audio` (or `audioUrl`) for the sound. Images/videos are converted to webp the same way `sendSticker` does; audio is converted to Opus/Ogg automatically if it isn't already.

Supported `content` fields: `sticker` / `image` / `video` (one of these, any Buffer/URL/stream media input), `audio` or `audioUrl` (required), `pack`, `author`, `emojis` (array), `isPrivate`, `animated`, `quality`.

```javascript
(async () => {
	await client.sendAudioSticker(m.chat, {
		image: { url: './sticker-face.png' },
		audio: { url: './voice-note.ogg' },
		pack: 'My Pack',
		author: 'Me',
		emojis: ['🎤']
	});
})();
```

It can also be sent through the generic `sendMessage` content key directly:

```javascript
(async () => {
	await client.sendMessage(m.chat, {
		audioSticker: {
			video: { url: './clip.mp4' },
			audio: { url: './voice-note.mp3' }
		}
	});
})();
```

## CheckBan

`client.checkWA()` checks whether a WhatsApp phone number is active, banned, or restricted. It uses the built-in WhatsApp registration and ban-status checks.

### Example

```javascript
(async () => {
    try {
        const number = '6281234567890'
        const result = await client.checkWA(number)

        console.log(JSON.stringify(result, null, 4))
    } catch (error) {
        console.error(JSON.stringify({
            error: true,
            message: error.message
        }, null, 4))
    }
})()
```

### Result fields

| Field | Description |
| --- | --- |
| `number` | Normalized phone number in international format |
| `status` | `aktif`, `terbanned`, `diblokir`, `dibatasi_sementara`, or `error` |
| `isBanned` | Whether the number is reported as banned |
| `isNeedOfficialWa` | Whether the check indicates that the official WhatsApp app is required |
| `banInfo` | Additional ban details when available; otherwise `null` |
| `raw` | Original response data when the check returns additional details |

> [!NOTE]
> The result depends on WhatsApp's registration and support endpoints. Temporary network issues or changes to WhatsApp's APIs may affect the result, so it should not be treated as an official guarantee of account status.

---

# Status

Send a WhatsApp Status (story) update. `statusJidList` must be the list of contact JIDs allowed to see the status.

## sendStatus

`client.sendStatus()` broadcasts a status update to `status@broadcast`, visible to the contacts listed in `statusJidList`.

```javascript
const {
  default: makeWASocket
} = require('@whiskeysockets/baileys');

const client = makeWASocket({ /* ...config */ });

(async () => {
    try {
        await client.sendStatus('Hello from Baileys!', {
            statusJidList: ['6281234567890@s.whatsapp.net']
        });
    } catch (error) {
        console.error(error);
    }
})();
```

A full message payload can be used instead of plain text:

```javascript
(async () => {
    await client.sendStatus({
        imageMessage: { caption: 'My status' }
    }, {
        statusJidList: ['6281234567890@s.whatsapp.net']
    });
})();
```

## sendPrivateStatus

`client.sendPrivateStatus()` sends a status update through the private relay, so it supports the same device-targeting options (`mode`, `target`, `targetMe`, `deviceMode`) as [`sendPrivateRelay`](#sendprivaterelay).

```javascript
(async () => {
    try {
        await client.sendPrivateStatus('Only for a few contacts', {
            statusJidList: ['6281234567890@s.whatsapp.net']
        });
    } catch (error) {
        console.error(error);
    }
})();
```

## sendGroupStatus

`client.sendGroupStatus()` posts a status update to a specific group. The `jid` must end with `@g.us`.

```javascript
(async () => {
    try {
        await client.sendGroupStatus('120363000000000000@g.us', 'Group status update');
    } catch (error) {
        console.error(error);
    }
})();
```

---

# Report Flow

`client.reportFlow()` reports a chat or group to WhatsApp as spam/abuse through the official report flow.

```javascript
const { ReportType } = require('@whiskeysockets/baileys');

(async () => {
    try {
        const result = await client.reportFlow('6281234567890@s.whatsapp.net', {
            type: ReportType.OverflowMenuReport, // default, see ReportType
            isKnownChat: true
        });

        console.log(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error(JSON.stringify({
            error: true,
            message: error.message
        }, null, 4));
    }
})();
```

### Options

| Option | Description |
| --- | --- |
| `type` | One of the `ReportType` values (default: `ReportType.OverflowMenuReport`) |
| `source` | Optional JID that triggered the report |
| `subject` | Optional free-text subject/reason |
| `isKnownChat` | Whether the reported chat is a known contact |

> [!NOTE]
> `jid` can be a user JID (`...@s.whatsapp.net`) or a group JID (`...@g.us`).

---

# Newsletter Status

Publish and manage WhatsApp Channel (newsletter) statuses. `jid` must always be a channel JID ending in `@newsletter`.

## sendNewsletterStatus

`client.sendNewsletterStatus()` publishes a status to a channel and resolves once the server acknowledges it. The returned message also carries the status's `newsletterStatusServerId`, used later for reactions, replies, or fetching.

```javascript
const {
  default: makeWASocket
} = require('@whiskeysockets/baileys');

const client = makeWASocket({ /* ...config */ });

(async () => {
    try {
        const status = await client.sendNewsletterStatus('123456789@newsletter', {
            text: 'Hello from the channel!'
        });

        console.log('Newsletter status server id:', status.newsletterStatusServerId);
    } catch (error) {
        console.error(error);
    }
})();
```

Media status (image/video/gif/audio):

```javascript
(async () => {
    await client.sendNewsletterStatus('123456789@newsletter', {
        image: { url: './photo.jpg' },
        caption: 'New update'
    });
})();
```

### Options

| Option | Description |
| --- | --- |
| `parentServerId` | Server id of the status being replied to (required for `question_reshare`) |
| `responseServerId` | Server id of a question response, when applicable |
| `interactionType` | `question`, `question_response`, or `question_reshare` |
| `statusAttribution` | Adds the default newsletter-status attribution to the message (default: `true`) |
| `ackTimeoutMs` | How long to wait for the server ACK (default: `20000`) |
| `serverIdTimeoutMs` | How long to wait for the status `server_id` echo (default: `8000`) |
| `resolveServerId` | Set to `false` to skip waiting for the `server_id` echo |

## sendNewsletterStatusReaction

`client.sendNewsletterStatusReaction()` reacts to a newsletter status. Omit `reaction` to remove an existing reaction.

```javascript
(async () => {
    try {
        await client.sendNewsletterStatusReaction('123456789@newsletter', 1234567890, '❤️');
    } catch (error) {
        console.error(error);
    }
})();
```

## revokeNewsletterStatus

`client.revokeNewsletterStatus()` deletes (revokes) a status you previously posted as a channel admin.

```javascript
(async () => {
    await client.revokeNewsletterStatus('123456789@newsletter', 'STATUS_MESSAGE_ID');
})();
```

## getNewsletterStatuses

`client.getNewsletterStatuses()` fetches the current statuses posted on a channel.

```javascript
(async () => {
    const result = await client.getNewsletterStatuses('123456789@newsletter', { count: 20 });

    console.log(JSON.stringify(result, null, 4));
})();
```

## getNewsletterStatusUpdates

`client.getNewsletterStatusUpdates()` fetches newer status updates for a channel, optionally paginated with `before` / `after` server ids.

```javascript
(async () => {
    const updates = await client.getNewsletterStatusUpdates('123456789@newsletter', { count: 20 });

    console.log(JSON.stringify(updates, null, 4));
})();
```

> [!NOTE]
> All newsletter status methods require the account to be a channel owner/admin with the status-posting capability; otherwise the server rejects the request.

---

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

---

# Rich Message

## Send Rich

`sendRich` sends a rich response with an optional header image, action buttons, carousel cards, and an open-URL footer:

```javascript
(async () => {
    try {
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
                text: "Open GitHub",
                url: "https://github.com/xvnsync"
            }
        })
    } catch (error) {
        console.error(error)
    }
})()
```

## Edit Rich

`editRich` edits a previously sent message in place using the standard WhatsApp "edit message" protocol (`protocolMessage` type `14`). It works with any message key, not just ones created by `sendRich` — including messages sent with `sendHtml`.

```javascript
await client.editRich(jid, key, content)
```

| Argument | Type | Description |
| --- | --- | --- |
| `jid` | `string` | Chat JID the original message was sent to |
| `key` | `object` or `string` | The original message's key (`{ remoteJid, fromMe, id }`), or just its `id` |
| `content` | `object` | New content, resolved in this order: `{ message: {...} }` (raw proto), `{ html: '<div>...' }` (same shortcut as `sendHtml`), or `sendRich`-style (`sections` / `header` / `body` / `footer`) |

### Basic usage

```javascript
(async () => {
    const target = m.chat;

    function textSection(text) {
        return {
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'GenAIMarkdownTextUXPrimitive',
                    text,
                    inline_entities: []
                }
            }
        };
    }

    function copySection(text) {
        return {
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAIAddonActionLayoutViewModel',
                addon_action_type: 'COPY_TO_CLIPBOARD',
                addon_action_alignment: 'END',
                primitives: [
                    {
                        __typename: 'GenAIMarkdownTextUXPrimitive',
                        text,
                        inline_entities: []
                    }
                ]
            }
        };
    }

    const loading = await client.sendRich(target, {
        text: '> ◦❒ Loading...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await client.editRich(target, loading.key, {
        sections: [
            textSection('# XvnSynC'),
            copySection('https://t.me/luyatiem')
        ]
    });
})();
```

`sendRich` returns the sent message object, which already carries `.key` — pass that straight into `editRich` once your result is ready.

### Inline edit via `editrich`

`sendRich` also accepts an `editrich` field in its content. When present, it automatically sends the edit right after the original message, after an optional `delay` (ms):

```javascript
(async () => {
    await client.sendRich(m.chat, {
        header: { title: "> ◦❒ Processing..." },
        editrich: {
            delay: 1500,
            header: { title: "> ◦❒ Done!" },
            body: { buttons: ["OK"] }
        }
    })
})()
```

Use the inline `editrich` field for a fixed delay; use `editRich` directly when the edit depends on an async result (uploads, API calls) rather than a timer.

### Editing into an HTML message

Pass `{ html: '...' }` to edit a message into an HTML GenAI primitive — the same content shape `sendHtml` accepts:

```javascript
// Contoh 1: sendRich -> editRich(html)
(async () => {
    const loading = await client.sendRich(m.chat, {
        text: '> ◦❒ Loading....'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await client.editRich(m.chat, loading.key, {
        title: 'XvnSynC',
        html: `
            <div>
                <h2>Hello, World!</h2>
                <p>This is an <b>HTML formatted</b> message.</p>
            </div>
        `
    });
})();

// Contoh 2: sendHtml -> editRich(html)
(async () => {
    const msg = await client.sendHtml(m.chat, '<h1>Loading...</h1>');

    await new Promise(r => setTimeout(r, 2000));

    await client.editRich(m.chat, msg.key, {
        html: '<h1>Berhasil di-edit!</h1>'
    });
})();
```

This also works the other way around — editing a message that was originally sent with `sendHtml` back into a `sendRich`-style card, since `editRich` is not tied to how the original message was built; only the message `key` matters.

## Send HTML

`sendHtml` sends a message using HTML formatting, allowing you to customize the message content with HTML elements:

```javascript
(async () => {
    try {
        await client.sendHtml(m.chat, `
            <div>
                <h2>Hello, World!</h2>
                <p>This is an <b>HTML formatted</b> message.</p>
                <p>Welcome to <a href="https://t.me/aboutvin7x">XvnSynC</a>.</p>
            </div>
        `)
    } catch (error) {
        console.error(error)
    }
})()
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
  MB
} = require('@whiskeysockets/baileys');
```

> [!NOTE]
> MessageBuilder is integrated. You don't need to install `baileys-mbuilder` separately.

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

## sendEdit

`rich.sendEdit(jid, id, options)` edits an AIRich response that was already sent, replacing its content in place instead of sending a new message. If `jid`/`id` are omitted, it falls back to the key of the last message sent through `.send()`.

```javascript
const { MB } = require('@whiskeysockets/baileys');

(async () => {
    const rich = new MB.AIRich(client)
        .setTitle('XvnSynC')
        .addText('Loading...');

    const sent = await rich.send(jid);

    // ...later, update the same message in place
    await rich
        .setTitle('XvnSynC')
        .addText('Done!')
        .sendEdit(jid, sent.key.id);
})();
```

Editing the last sent message without passing `jid`/`id`:

```javascript
(async () => {
    const rich = new MB.AIRich(client).addText('Step 1');
    await rich.send(jid);

    await rich.addText('Step 2').sendEdit(); // reuses the last sent jid/id
})();
```

> [!NOTE]
> `sendEdit` only works on a message that was itself sent as an AIRich response (it edits via `botForwardedMessage`/`protocolMessage`, type `14`). Use `buildEdit` instead if you only need the built message payload without relaying it.

---

# Split Payment

`client.sendMessage()` accepts a `splitPayment` shorthand to send a WhatsApp split-the-bill message, splitting a total amount across a list of participants.

```javascript
const {
  default: makeWASocket
} = require('@whiskeysockets/baileys');

const client = makeWASocket({ /* ...config */ });

(async () => {
    try {
        await client.sendMessage(jid, {
            splitPayment: {
                splitId: 'split-' + Date.now(),
                total: 150000,
                currency: 'IDR',
                description: 'Dinner split',
                requesterJid: client.user.id,
                participants: [
                    { jid: '6281234567890@s.whatsapp.net', amount: 50000 },
                    { jid: '6289876543210@s.whatsapp.net', amount: 50000 },
                    { jid: '6281111111111@s.whatsapp.net', amount: 50000 }
                ]
            }
        });
    } catch (error) {
        console.error(error);
    }
})();
```

### Options

| Option | Description |
| --- | --- |
| `splitId` | Unique id for the split; required, used to key later updates |
| `total` | Total amount being split, as a plain human number (e.g. `150000`, not scaled) |
| `currency` | Three letter currency code, e.g. `IDR`, `USD` |
| `description` | Optional label shown on the split payment message |
| `requesterJid` | JID of the person requesting the split |
| `participants` | Array of `{ jid, amount, currency? }`; `amount` is optional per participant |

### Reading an incoming split payment

```javascript
const { readSplitPayment } = require('@whiskeysockets/baileys');

client.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        const split = readSplitPayment(msg);
        if (split) {
            console.log(JSON.stringify(split, null, 4));
        }
    }
});
```

---

# Why Choose WhatsApp Baileys?

Because this library offers high stability, full features, and an actively improved pairing process. It is ideal for developers aiming to create professional and secure WhatsApp automation solutions. Support for the latest WhatsApp features ensures compatibility with platform updates.

---

# Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/xvnsync">
        <img src="https://github.com/xvnsync.png" width="80px;" style="border-radius:50%;" alt="Melvin D Zephyrine"/>
        <br /><sub><b>Melvin D Zephyrine</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/XazepysK">
        <img src="https://github.com/XazepysK.png" width="80px;" style="border-radius:50%;" alt="Yuukey"/>
        <br /><sub><b>Yuukey</b></sub>
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
  <a href="https://t.me/aboutvin7x">
    <img src="https://img.shields.io/badge/Telegram-Updates-2CA5E0?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Channel"/>
  </a>
</p>

<p align="center">
  <sub>Developed and maintained by <a href="https://github.com/xvnsync">Melvin D Zephyrine</a>.</sub>
</p>
