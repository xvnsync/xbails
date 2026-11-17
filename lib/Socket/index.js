import MB from './MessageBuilder.js';
import sendPrivateRelay from '../Utils/sendPrivateRelay.js';
import { Boom } from '@hapi/boom';
import { makeNewsletterStatusSender, makeNewsletterStatusReactionSender, makeNewsletterStatusRevokeSender, makeNewsletterStatusFetcher, makeNewsletterStatusUpdatesFetcher } from '../Utils/newsletter-status.js';
import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { makeInteropSocket } from './interop.js'
import { makePrivacySocket } from './privacy.js'
import { makeGraphQLSocket } from './graphql.js'
import { makeMessageBuilderSocket } from './message-builder.js'
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const satu = makeCommunitiesSocket(newConfig);
    const dua = makeInteropSocket(satu);
    const tiga = makePrivacySocket(dua);
    const empat = makeGraphQLSocket(tiga);
    const clientWithBuilder = makeMessageBuilderSocket(empat);
    clientWithBuilder.sendPrivateRelay = (jid, message, options) =>
        sendPrivateRelay(clientWithBuilder, jid, message, options);
    clientWithBuilder.sendNewsletterStatus = makeNewsletterStatusSender(clientWithBuilder, newConfig);
    clientWithBuilder.sendNewsletterStatusReaction = makeNewsletterStatusReactionSender(clientWithBuilder);
    clientWithBuilder.revokeNewsletterStatus = makeNewsletterStatusRevokeSender(clientWithBuilder);
    clientWithBuilder.getNewsletterStatuses = makeNewsletterStatusFetcher(clientWithBuilder);
    clientWithBuilder.getNewsletterStatusUpdates = makeNewsletterStatusUpdatesFetcher(clientWithBuilder);
    clientWithBuilder.sendStatus = async (message, options = {}) => {
        const statusJidList = options.statusJidList;
        if (!Array.isArray(statusJidList) || statusJidList.length === 0) {
            throw new Boom('statusJidList wajib diisi untuk mengirim status', { statusCode: 400 });
        }
        const content = typeof message === 'string'
            ? { extendedTextMessage: { text: message } }
            : message;
        if (!content || typeof content !== 'object') {
            throw new Boom('message status harus berupa string atau proto.IMessage', { statusCode: 400 });
        }
        return clientWithBuilder.relayMessage('status@broadcast', content, {
            ...options,
            statusJidList,
            additionalNodes: options.additionalNodes || []
        });
    };
    clientWithBuilder.sendPrivateStatus = async (message, options = {}) => {
        const statusJidList = options.statusJidList;
        if (!Array.isArray(statusJidList) || statusJidList.length === 0) {
            throw new Boom('statusJidList wajib diisi untuk private status', { statusCode: 400 });
        }
        const content = typeof message === 'string'
            ? { extendedTextMessage: { text: message } }
            : message;
        if (!content || typeof content !== 'object') {
            throw new Boom('message private status harus berupa string atau proto.IMessage', { statusCode: 400 });
        }
        return clientWithBuilder.sendPrivateRelay('status@broadcast', content, {
            ...options,
            statusJidList
        });
    };
    clientWithBuilder.sendGroupStatus = async (jid, message, options = {}) => {
        if (typeof jid !== 'string' || !jid.endsWith('@g.us')) {
            throw new Boom('jid group harus berakhiran @g.us', { statusCode: 400 });
        }
        const content = typeof message === 'string'
            ? { extendedTextMessage: { text: message } }
            : message;
        if (!content || typeof content !== 'object') {
            throw new Boom('message group status harus berupa string atau proto.IMessage', { statusCode: 400 });
        }
        const statusMessage = {
            groupStatusMessageV2: {
                message: content
            }
        };
        const additionalNodes = [
            ...(options.additionalNodes || []),
            { tag: 'meta', attrs: { is_group_status: 'true' } }
        ];
        return clientWithBuilder.relayMessage(jid, statusMessage, {
            ...options,
            additionalNodes
        });
    };
    MB.bind(clientWithBuilder);
    clientWithBuilder.AIRich = MB.AIRich;
    clientWithBuilder.Carousel = MB.Carousel;
    clientWithBuilder.Button = MB.Button;
    clientWithBuilder.ButtonV2 = MB.ButtonV2;
    clientWithBuilder.Toolkit = MB.Toolkit;
    clientWithBuilder.MessageBuilder = MB;
    return clientWithBuilder;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map