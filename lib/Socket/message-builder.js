import crypto from 'crypto';
import { proto } from '../../WAProto/index.js';
import { generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/index.js';

export const makeMessageBuilderSocket = (sock) => {
    const { relayMessage, sendMessage, waUploadToServer } = sock;

    // per-socket-instance poll state: id -> [{ vote, action }]
    const pollActionStore = new Map();

    /**
     * Relay an arbitrary raw message content object, bypassing the normal
     * content-type detection in sendMessage(). Useful when you've already
     * built a proto-shaped message (e.g. from generateWAMessageFromContent)
     * and just need it sent as-is.
     */
    const sendJsonMessage = async (jid, content = {}, options = {}) => {
        const msg = generateWAMessageFromContent(jid, content, {});
        return relayMessage(jid, msg.message, { messageId: msg.key.id, ...options });
    };

    /**
     * Sends an HTML GenAI primitive rich response message.
     * html: string template/raw HTML markup to be rendered.
     */
    const sendHtml = async (jid, html = '', options = {}) => {
        const payloadData = Buffer.from(
            JSON.stringify({
                __typename: "GenAIUnifiedResponse",
                response_id: crypto.randomUUID(),
                sections: [
                    {
                        __typename: "GenAIUnifiedResponseSection",
                        view_model: {
                            __typename: "GenAISingleLayoutViewModel",
                            primitive: {
                                __typename: "FOAHtmlPrimitiveDemoDONOTUSE",
                                trusted_sources: [],
                                payload: String(html).trim()
                            }
                        }
                    }
                ]
            })
        ).toString("base64");

        const messageContent = {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        unifiedResponse: {
                            data: payloadData
                        },
                        contextInfo: {
                            isForwarded: true,
                            forwardOrigin: 4
                        }
                    }
                }
            }
        };

        return sendJsonMessage(jid, messageContent, options);
    };

    /**
     * Sends a WA poll and remembers which "action" each option maps to.
     */
    const sendActionPoll = async (jid, name = '', pollOptions = [], options = {}) => {
        const values = pollOptions.map(o => o.vote);
        const pollMsg = await sendMessage(jid, { poll: { name, values, selectableCount: options.selectableCount || 1 } }, options);
        pollActionStore.set(pollMsg.key.id, pollOptions);
        return pollMsg;
    };

    /**
     * Resolves selected poll option action.
     */
    const resolvePollAction = (pollMessageId, selectedVoteLabel) => {
        const options = pollActionStore.get(pollMessageId);
        return options?.find(o => o.vote === selectedVoteLabel)?.action;
    };

    /**
     * Sends a set of media files as a single WA album.
     */
    const sendAlbumMessage = async (jid, media = [], contextInfo = {}) => {
        const albumMsg = generateWAMessageFromContent(jid, proto.Message.fromObject({
            albumMessage: {
                expectedImageCount: media.filter(m => !/\.mp4$/i.test(m)).length,
                expectedVideoCount: media.filter(m => /\.mp4$/i.test(m)).length,
                contextInfo
            }
        }), {});

        const albumKey = {
            id: await relayMessage(jid, albumMsg.message, { messageId: albumMsg.key.id }),
            remoteJid: jid,
            fromMe: true
        };

        const keys = { album: albumKey };
        let i = 1;

        const mimetypes = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4'
        };
        const messagetypes = {
            jpg: 'imageMessage', jpeg: 'imageMessage', png: 'imageMessage',
            gif: 'imageMessage', webp: 'imageMessage', mp4: 'videoMessage'
        };

        for (const source of media) {
            const ext = source.split('.').pop().toLowerCase();
            const mimetype = mimetypes[ext];
            const type = messagetypes[ext];

            if (!mimetype || !type) {
                continue;
            }

            const msg = await prepareWAMessageMedia(
                { [type.startsWith('image') ? 'image' : 'video']: { url: source }, mimetype },
                { upload: waUploadToServer }
            );

            const mediaMessage = generateWAMessageFromContent(jid, proto.Message.fromObject({
                associatedChildMessage: {
                    message: {
                        messageContextInfo: {
                            messageSecret: crypto.randomBytes(32),
                            messageAssociation: {
                                associationType: 'MEDIA_ALBUM',
                                parentMessageKey: albumKey
                            }
                        },
                        [type]: { ...msg[type] }
                    }
                }
            }), {});

            keys[`media_${i++}`] = {
                id: await relayMessage(jid, mediaMessage.message, { messageId: mediaMessage.key.id }),
                fromMe: true,
                remoteJid: jid
            };
        }

        return keys;
    };

    /**
     * Posts status mention.
     */
    const sendStatusMention = async (jid, content) => {
        const media = generateWAMessageFromContent('status@broadcast', content, {});

        const additionalNodes = [
            {
                tag: 'meta',
                attrs: {},
                content: [
                    {
                        tag: 'mentioned_users',
                        attrs: {},
                        content: [{ tag: 'to', attrs: { jid }, content: undefined }]
                    }
                ]
            }
        ];

        await relayMessage('status@broadcast', media.message, {
            messageId: media.key.id,
            statusJidList: [jid, sock.user?.id],
            additionalNodes
        });

        return media;
    };

    /**
     * Builds and sends a "rich response" menu card (WA GenAI style).
     * renamed to sendRich / richMenu.
     */
    const sendRich = async (jid, content = {}) => {
        let header = content?.header;
        let body = content?.body;
        let footer = content?.footer;
        let contextInfoExtra = {};
        let sections = [];

        const randomToolId = () => crypto.randomBytes(8).toString('hex');

        if (header) {
            const { disclaimer = false, disclaimerText = ' ', image = { inline: false }, title = '' } = header ?? {};

            if (disclaimer) {
                contextInfoExtra = {
                    messageContextInfo: {
                        botMetadata: {
                            messageDisclaimerText: disclaimerText
                        }
                    }
                };
            }

            if (title) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        __typename: 'GenAISingleLayoutViewModel',
                        primitive: {
                            __typename: 'FOATextPrimitive',
                            text: '# ' + title
                        }
                    }
                });
            }

            if (image?.url) {
                if (image?.inline) {
                    sections.push({
                        __typename: 'GenAIUnifiedResponseSection',
                        view_model: {
                            __typename: 'GenAISingleLayoutViewModel',
                            primitive: {
                                __typename: 'GenAIMarkdownTextUXPrimitive',
                                text: '{{header}}.{{/header}}',
                                inline_entities: [{
                                    __typename: 'GenAITextInlineEntity',
                                    key: 'header',
                                    metadata: {
                                        __typename: 'GenAILatexItem',
                                        latex_expression: '.',
                                        font_height: 24,
                                        padding: 4,
                                        latex_image: {
                                            __typename: 'GenAIMediaItem',
                                            mime_type: image.mime_type || 'image/png',
                                            url: image.url,
                                            url_fallback: image.url,
                                            width: image.width || 500,
                                            height: image.height || 500,
                                            expiration_timestamp_ms: Date.now() + 86400000
                                        }
                                    }
                                }]
                            }
                        }
                    });
                } else {
                    sections.push({
                        __typename: 'GenAIUnifiedResponseSection',
                        view_model: {
                            __typename: 'GenAISingleLayoutViewModel',
                            primitive: {
                                __typename: 'GenAIImagePrimitive',
                                preview_image: {
                                    __typename: 'GenAIMediaItem',
                                    mime_type: image.mime_type || 'image/png',
                                    url: image.url
                                },
                                full_image: {
                                    __typename: 'GenAIMediaItem',
                                    mime_type: image.mime_type || 'image/png',
                                    url: image.url
                                }
                            }
                        }
                    });
                }
            }
        }

        if (body) {
            const { cards = null, buttons = null, title = '', toast = '', carousel = false, row = false } = body ?? {};

            if ((carousel || row) && cards?.length >= 1) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        primitives: cards.map((card) => ({
                            __typename: 'GenAI3PExtWidgetPrimitive',
                            header: {
                                __typename: 'GenAI3PExtWidgetStandardHeader',
                                title: card?.title || ''
                            },
                            body: {
                                __typename: 'GenAI3PExtCalendarEventList',
                                ctas: (card?.buttons || []).map((text) => ({
                                    label: text,
                                    state: 'PENDING',
                                    kind: 'OTHER',
                                    tool_call_id: randomToolId(),
                                    toast: {
                                        label: card?.toast || '',
                                        __typename: 'GenAI3PExtWidgetToast'
                                    },
                                    __typename: 'GenAI3PExtWidgetCTA'
                                })),
                                sections: []
                            }
                        })),
                        __typename: carousel ? 'GenAIHScrollLayoutViewModel' : 'GenAIActionRowLayoutViewModel'
                    }
                });
            } else if (buttons?.length) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        primitive: {
                            __typename: 'GenAI3PExtWidgetPrimitive',
                            header: {
                                __typename: 'GenAI3PExtWidgetStandardHeader',
                                title: title || ''
                            },
                            body: {
                                __typename: 'GenAI3PExtCalendarEventList',
                                ctas: buttons.map((text) => ({
                                    label: text,
                                    state: 'PENDING',
                                    kind: 'OTHER',
                                    tool_call_id: randomToolId(),
                                    toast: {
                                        label: toast,
                                        __typename: 'GenAI3PExtWidgetToast'
                                    },
                                    __typename: 'GenAI3PExtWidgetCTA'
                                })),
                                sections: []
                            }
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                });
            }
        }

        if (footer) {
            const { text = '', url = '', image = {} } = footer ?? {};
            let img = [];
            if (image?.url) {
                img.push({
                    __typename: 'GenAIMarkdownTextUXPrimitive',
                    text: '{{header}}.{{/header}}',
                    inline_entities: [{
                        __typename: 'GenAITextInlineEntity',
                        key: 'header',
                        metadata: {
                            __typename: 'GenAILatexItem',
                            latex_expression: '.',
                            font_height: 24,
                            padding: -5,
                            latex_image: {
                                __typename: 'GenAIMediaItem',
                                mime_type: image.mime_type || 'image/png',
                                url: image.url,
                                url_fallback: image.url,
                                width: image.width || 100,
                                height: image.height || 100,
                                expiration_timestamp_ms: Date.now() + 86400000
                            }
                        }
                    }]
                });
            }
            sections.push({
                view_model: {
                    primitives: [
                        {
                            cta_text: text || 'Link',
                            cta_type: 'OPEN_URL',
                            cta_url: url || '',
                            __typename: 'GenAIFooterActionPrimitive'
                        },
                        ...img
                    ],
                    __typename: 'GenAIActionRowLayoutViewModel'
                }
            });
        }

        const waMsg = generateWAMessageFromContent(jid, {
            ...contextInfoExtra,
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify({ sections })).toString('base64')
                        },
                        contextInfo: {
                            isForwarded: true,
                            forwardOrigin: 4,
                            ...(content?.contextInfo ?? {})
                        }
                    }
                }
            }
        }, {});

        await relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
        return waMsg;
    };

    /**
     * Native quick-reply buttons.
     */
    const sendButtonsMessage = async (jid, { text = '', footer = '', buttons = [] } = {}, options = {}) => {
        const interactiveMessage = {
            body: { text },
            ...(footer ? { footer: { text: footer } } : {}),
            nativeFlowMessage: {
                buttons: buttons.map(b => ({
                    name: b.name || 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
                }))
            }
        };
        return sendJsonMessage(jid, { viewOnceMessage: { message: { interactiveMessage } } }, options);
    };

    /**
     * Native single-select list.
     */
    const sendListMessage = async (jid, { text = '', footer = '', buttonText = 'Menu', sections = [] } = {}, options = {}) => {
        const interactiveMessage = {
            body: { text },
            ...(footer ? { footer: { text: footer } } : {}),
            nativeFlowMessage: {
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({ title: buttonText, sections })
                }]
            }
        };
        return sendJsonMessage(jid, { viewOnceMessage: { message: { interactiveMessage } } }, options);
    };

    /**
     * Native carousel.
     */
    const sendCarouselMessage = async (jid, { text = '', footer = '', cards = [] } = {}, options = {}) => {
        const cardMessages = [];

        for (const card of cards) {
            let headerMedia = {};
            if (card.image) {
                const uploaded = await prepareWAMessageMedia(
                    { image: { url: card.image }, mimetype: card.mimetype || 'image/jpeg' },
                    { upload: waUploadToServer }
                );
                headerMedia = { imageMessage: uploaded.imageMessage };
            }

            cardMessages.push({
                header: { title: card.title || '', hasMediaAttachment: !!card.image, ...headerMedia },
                body: { text: card.body || '' },
                nativeFlowMessage: {
                    buttons: (card.buttons || []).map(b => ({
                        name: b.name || 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
                    }))
                }
            });
        }

        const message = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text },
                        ...(footer ? { footer: { text: footer } } : {}),
                        carouselMessage: { cards: cardMessages, messageVersion: 1 }
                    }
                }
            }
        };
        return sendJsonMessage(jid, message, options);
    };

    /**
     * Forward message.
     */
    const forwardMessage = async (jid, message, options = {}) => {
        return sendMessage(jid, { forward: message, force: options.force }, options);
    };

    /**
     * Send vCard contact.
     */
    const sendVCard = async (jid, contacts, options = {}) => {
        const list = Array.isArray(contacts) ? contacts : [contacts];
        const built = list.map(c => {
            const waid = c.waid || c.phone;
            const vcard = 'BEGIN:VCARD\n'
                + 'VERSION:3.0\n'
                + `FN:${c.name || 'Unknown'}\n`
                + (c.organization ? `ORG:${c.organization};\n` : '')
                + `TEL;type=CELL;type=VOICE;waid=${waid}:+${c.phone}\n`
                + 'END:VCARD';
            return { displayName: c.name || 'Unknown', vcard };
        });

        if (built.length === 1) {
            return sendMessage(jid, { contacts: { contacts: built } }, options);
        }
        return sendMessage(jid, { contacts: { displayName: `${built.length} contacts`, contacts: built } }, options);
    };

    /**
     * Broadcast message.
     */
    const broadcastMessage = async (jids, content, options = {}) => {
        const { delayMs = 0, ...sendOptions } = options;
        const results = [];
        for (const jid of jids) {
            try {
                const result = await sendMessage(jid, content, sendOptions);
                results.push({ jid, ok: true, result });
            } catch (error) {
                results.push({ jid, ok: false, error });
            }
            if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return results;
    };

    return {
        ...sock,
        sendJsonMessage,
        sendActionPoll,
        resolvePollAction,
        sendAlbumMessage,
        sendStatusMention,
        sendRich,
        richMenu: sendRich,
        sendButtonsMessage,
        sendListMessage,
        sendCarouselMessage,
        sendHtml,
        forwardMessage,
        sendVCard,
        broadcastMessage
    };
};