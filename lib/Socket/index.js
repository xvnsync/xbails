import MB from './MessageBuilder.js';
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