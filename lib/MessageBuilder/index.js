/**
 * Do not remove this watermark.
 *
 * NIXCODE - Advanced WhatsApp Interactive Message Builder
 * Built for creating buttons, carousels, native flows,
 * and AI rich response payloads using Baileys with
 * fluent chaining, flexible payload customization,
 * and scalable architecture for modern bot development.
 *
 * Runtime:
 * - Baileys: @whiskeysockets/baileys (latest)
 *
 * Created by Nixel
 * Contributors: ~ Ahmad tumbuh kembang
 *
 * WhatsApp: wa.me/6285188349341
 * Channel: https://whatsapp.com/channel/0029VbCV1ck8fewpdNb2TY2k
 *
 * Copyright (c) 2026 Nixel
 *
 * Permission is granted to use and modify this library
 * for personal or commercial projects.
 *
 * Reuploading, reselling, relicensing, or redistributing
 * this library as a standalone product is prohibited.
 *
 * Do not claim this project as your own original work.
 */

"use strict";

const VERSION = "4.7";

import { prepareWAMessageMedia } from '../Utils/index.js';
import { Toolkit } from './Toolkit.js';
import { BaseBuilder } from './BaseBuilder.js';
import { Button } from './Button.js';
import { ButtonV2 } from './ButtonV2.js';
import { Carousel } from './Carousel.js';
import { AIRich } from './AIRich.js';
export { AIRichError, ItemNotFoundError, DuplicateIdError, InvalidTargetError, ContentValidationError } from './errors.js';
export { extractIE } from './extract-ie.js';
export { BaseBuilder };

function bind(client) {
  if (!client) {
    throw new Error("Socket is required");
  }
  let sock = Object.defineProperties(client, {
    sendLinkPreview: {
      configurable: true,
      writable: true,
      async value(
        jid,
        text,
        link,
        title,
        description,
        thumbnail,
        options = {},
      ) {
        if (typeof jid !== "string") {
          throw new TypeError("jid is not string");
        }
        if (typeof text !== "string") {
          throw new TypeError("text is not string");
        }
        if (typeof link !== "string") {
          throw new TypeError("link is not string");
        }
        if (typeof title !== "string") {
          throw new TypeError("title is not string");
        }
        if (description && typeof description !== "string") {
          throw new TypeError("description is not string");
        }
        if (
          thumbnail &&
          !Buffer.isBuffer(thumbnail) &&
          typeof thumbnail.url !== "string"
        ) {
          throw new TypeError(
            "thumbnail must be Buffer or object with url key",
          );
        }
        const image = thumbnail
          ? await prepareWAMessageMedia(
              {
                image: thumbnail,
              },
              {
                upload: client.waUploadToServer,
                mediaTypeOverride: "thumbnail-link",
              },
            ).then((v) => v.imageMessage)
          : undefined;
        text = text.includes(link) ? text : `${link}\n${text}`;
        return await client.sendMessage(
          jid,
          {
            text,
            linkPreview: {
              "matched-text": link,
              title,
              description,
              jpegThumbnail: image?.jpegThumbnail,
              highQualityThumbnail: image,
            },
          },
          options,
        );
      },
    },
  });
  return (client = sock);
}

export { VERSION, Button, ButtonV2, Carousel, AIRich, Toolkit, bind };
export default { VERSION, Button, ButtonV2, Carousel, AIRich, Toolkit, bind };
