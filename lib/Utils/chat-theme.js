import { Boom } from '@hapi/boom';
import { spawn } from 'child_process';
import { unlink } from 'fs/promises';
import { proto } from '../../WAProto/index.js';
import { encryptedStream, getStream, toBuffer } from './messages-media.js';

const WALLPAPER_HKDF_INFO = 'Chat Wallpaper';

const runFfmpeg = (input, args) => new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', ...args, 'pipe:1'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const outChunks = [];
    const errChunks = [];
    proc.stdout.on('data', chunk => outChunks.push(chunk));
    proc.stderr.on('data', chunk => errChunks.push(chunk));
    proc.on('error', err => reject(new Boom(`ffmpeg failed to start: ${err.message}`, { statusCode: 500 })));
    proc.on('close', code => {
        if (code !== 0) {
            reject(new Boom(`ffmpeg exited with code ${code}: ${Buffer.concat(errChunks).toString('utf8').slice(0, 500)}`, { statusCode: 500 }));
            return;
        }
        resolve(Buffer.concat(outChunks));
    });
    proc.stdin.on('error', () => { });
    proc.stdin.end(input);
});

export const CHAT_THEME_COLOR_PRESETS = Object.freeze({
    pink: '#ff69b4',
    biru: '#1e90ff',
    ungu: '#9b59b6',
    hitam: '#121212',
    hijau: '#2ecc71',
    merah: '#e74c3c',
    kuning: '#f1c40f',
    oren: '#e67e22',
    putih: '#f5f6fa'
});

const THEME_FAMILIES = {
    default: 'Default',
    'whatsapp-green': 'WhatsApp-Green',
    'pearl-indigo': 'Pearl-Indigo',
    'tyrian-purple': 'Tyrian-Purple',
    'sunset-orange': 'Sunset-Orange',
    'merino-teal': 'Merino-Teal',
    'royal-blue': 'Royal-Blue',
    'dark-cerulean': 'Dark-Cerulean',
    'charcoal-green': 'Charcoal-Green',
    'persian-plum': 'Persian-Plum',
    'dune-mono': 'Dune-Mono',
    'default-blue': 'Default-Blue',
    'default-mono': 'Default-Mono',
    'sky-blue': 'Sky-Blue',
    brown: 'Brown',
    cream: 'Cream',
    emerald: 'Emerald',
    lemon: 'Lemon',
    lime: 'Lime',
    pink: 'Pink',
    red: 'Red',
    'sunrise-orange': 'Sunrise-Orange',
    'warm-yellow': 'Warm-Yellow'
};
const MINIMAL_THEMES = new Set(['default-blue', 'default-mono', 'sky-blue', 'pearl-indigo']);
const schemes = { ...THEME_FAMILIES };
for (const [alias, id] of Object.entries(THEME_FAMILIES)) {
    if (alias !== 'default') {
        schemes[`${alias}-tonal`] = `${id}@Tonal`;
    }
    if (MINIMAL_THEMES.has(alias)) {
        schemes[`${alias}-minimal`] = `${id}@Minimal`;
    }
}
export const CHAT_THEME_PRESETS = Object.freeze(schemes);
export const CHAT_BUBBLE_PRESETS = CHAT_THEME_PRESETS;
const CHAT_SCHEME_IDS = new Set(Object.values(CHAT_THEME_PRESETS));

const RESET_WORDS = new Set(['reset', 'clear', 'hapus', 'default']);
const EXAMPLE_WORDS = new Set(['example', 'examples', 'contoh', 'list']);
const ARGB_ALPHA = 0xff000000;

export const isChatThemeExample = (content) => typeof content === 'string' && EXAMPLE_WORDS.has(content.trim().toLowerCase());

export const getChatThemeExamples = () => ({
    themes: CHAT_THEME_PRESETS,
    bubbles: CHAT_BUBBLE_PRESETS,
    usage: [
        "client.setThemeGroup(jid, { theme: 'pink' })",
        "client.setThemeGroup(jid, { bubble: 'royal-blue' })",
        "client.setThemeGroup(jid, { theme: 'pink', bubble: 'royal-blue' })",
        "client.setThemeGroup(jid, { theme: { url: './wallpaper.jpg' }, bubble: 'pink-tonal' })",
        "client.setThemeGroup(jid, { reset: true })"
    ]
});

const parseColor = (value) => {
    if (typeof value !== 'string') {
        throw new Boom('chat theme color must be a hex string', { statusCode: 400 });
    }
    const input = value.trim().toLowerCase();
    const resolved = CHAT_THEME_COLOR_PRESETS[input] || input;
    const hex = resolved.startsWith('#') ? resolved.slice(1) : resolved;
    if (!/^[0-9a-f]{6}$/.test(hex)) {
        throw new Boom('chat theme color must be #RRGGBB or a known preset', { statusCode: 400 });
    }
    return (ARGB_ALPHA | parseInt(hex, 16)) >>> 0;
};
const findScheme = (value) => {
    const input = value.trim();
    if (CHAT_SCHEME_IDS.has(input)) {
        return input;
    }
    const alias = input.toLowerCase().replace(/[\s_@]+/g, '-');
    return CHAT_THEME_PRESETS[alias] || null;
};
const resolveScheme = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Boom(`${label} must be a theme ID from setThemeGroup(jid, 'example')`, { statusCode: 400 });
    }
    const scheme = findScheme(value);
    if (!scheme) {
        throw new Boom(`${label} is unknown; use setThemeGroup(jid, 'example')`, { statusCode: 400 });
    }
    return scheme;
};
const normalizeContent = (content) => {
    if (content == null) {
        throw new Boom('setThemeGroup needs a theme, bubble, wallpaper, color, or reset', { statusCode: 400 });
    }
    if (typeof content === 'string') {
        const value = content.trim();
        if (RESET_WORDS.has(value.toLowerCase())) {
            return { reset: true };
        }
        if (value.startsWith('#') || CHAT_THEME_COLOR_PRESETS[value.toLowerCase()] || /^[0-9a-f]{6}$/i.test(value)) {
            return { color: value };
        }
        return { wallpaper: content };
    }
    if (Buffer.isBuffer(content) || content instanceof Uint8Array || content instanceof URL) {
        return { wallpaper: content };
    }
    if (typeof content !== 'object') {
        throw new Boom('setThemeGroup content is invalid', { statusCode: 400 });
    }
    return { ...content };
};
const normalizeWallpaper = (wallpaper) => {
    if (typeof wallpaper === 'string' || wallpaper instanceof URL) {
        return { url: wallpaper };
    }
    if (!Buffer.isBuffer(wallpaper) && wallpaper instanceof Uint8Array) {
        return Buffer.from(wallpaper);
    }
    return wallpaper;
};
const isGif = (buffer) => buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
const isVideo = (buffer) => buffer.length >= 12 && (buffer.toString('ascii', 4, 8) === 'ftyp' ||
    (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) ||
    (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI '));
// grabs the first frame of a GIF/video wallpaper and fits it into a 1080x1080 JPEG,
// using the same ffmpeg-via-stdio approach as sticker.js instead of sharp/fluent-ffmpeg
const extractWallpaperFrame = async (buffer) => runFfmpeg(buffer, [
    '-vf', "scale='min(1080,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black",
    '-vframes', '1',
    '-vcodec', 'mjpeg',
    '-f', 'image2'
]);
const prepareWallpaper = async (wallpaper, options) => {
    const { stream } = await getStream(normalizeWallpaper(wallpaper), options.options);
    const source = await toBuffer(stream);
    if (!source.length) {
        throw new Boom('chat wallpaper is empty', { statusCode: 400 });
    }
    if (!isGif(source) && !isVideo(source)) {
        return source;
    }
    const converted = await extractWallpaperFrame(source);
    if (!converted.length) {
        throw new Boom('ffmpeg produced an empty wallpaper frame', { statusCode: 400 });
    }
    return converted;
};
const uploadWallpaper = async (wallpaper, options) => {
    if (typeof options.upload !== 'function') {
        throw new Boom('setThemeGroup wallpaper needs an uploaded media backend', { statusCode: 500 });
    }
    const media = await prepareWallpaper(wallpaper, options);
    const encrypted = await encryptedStream(media, 'chat-wallpaper', {
        logger: options.logger,
        opts: options.options
    }, WALLPAPER_HKDF_INFO);
    try {
        const { directPath } = await options.upload(encrypted.encFilePath, {
            fileEncSha256B64: encrypted.fileEncSha256.toString('base64'),
            mediaType: 'chat-wallpaper',
            timeoutMs: options.mediaUploadTimeoutMs
        });
        if (!directPath) {
            throw new Boom('chat wallpaper upload returned no direct path', { statusCode: 500 });
        }
        return {
            directPath,
            mediaKey: encrypted.mediaKey,
            fileEncSha256: encrypted.fileEncSha256,
            fileSha256: encrypted.fileSha256
        };
    }
    finally {
        await unlink(encrypted.encFilePath).catch(() => { });
    }
};
const buildMessage = ({ bubble, color, wallpaper, reset, defaultWallpaper }) => {
    const chatThemeSetting = proto.Message.ChatThemeSetting.fromObject({
        settingTimestampMs: Date.now(),
        ...(reset ? { clearTheme: true } : {}),
        ...(bubble ? { colorSchemeId: bubble } : {}),
        ...(defaultWallpaper ? { defaultWallpaper: {} } : {}),
        ...(color != null ? { solidColor: { backgroundLightArgb: color, backgroundDarkArgb: color } } : {}),
        ...(wallpaper ? { customImage: wallpaper } : {})
    });
    return proto.Message.fromObject({
        protocolMessage: {
            type: proto.Message.ProtocolMessage.Type.CHAT_THEME_SETTING,
            chatThemeSetting
        }
    });
};
export const prepareChatThemeMessages = async (content, options = {}) => {
    const input = normalizeContent(content);
    if (input.theme != null) {
        if (input.color != null || input.wallpaper != null || input.reset === true) {
            throw new Boom('theme cannot be combined with color, wallpaper, or reset', { statusCode: 400 });
        }
        if (typeof input.theme === 'string') {
            const value = input.theme.trim();
            if (!value) {
                throw new Boom('theme must not be empty', { statusCode: 400 });
            }
            const scheme = findScheme(value);
            if (scheme) {
                input.themeScheme = scheme;
            }
            else if (value.startsWith('#') || CHAT_THEME_COLOR_PRESETS[value.toLowerCase()] || /^[0-9a-f]{6}$/i.test(value)) {
                input.color = value;
            }
            else {
                input.wallpaper = input.theme;
            }
        }
        else {
            input.wallpaper = input.theme;
        }
    }
    if (input.bubble != null && input.colorSchemeId != null) {
        throw new Boom('use only one of bubble or colorSchemeId', { statusCode: 400 });
    }
    const bubble = input.bubble != null ? resolveScheme(input.bubble, 'bubble') : input.colorSchemeId;
    if (bubble != null && (typeof bubble !== 'string' || !bubble.trim())) {
        throw new Boom('chatThemeSetting.colorSchemeId must be a non-empty string', { statusCode: 400 });
    }
    const reset = input.reset === true;
    const sources = [reset, input.color != null, input.wallpaper != null, input.themeScheme != null].filter(Boolean).length;
    if (sources > 1 || (sources === 0 && bubble == null) || (reset && bubble != null)) {
        throw new Boom('setThemeGroup needs exactly one theme source, optionally one bubble, or reset', { statusCode: 400 });
    }
    if (reset) {
        return [buildMessage({ reset })];
    }
    const color = input.color != null ? parseColor(input.color) : undefined;
    let wallpaper;
    if (input.wallpaper != null) {
        wallpaper = await uploadWallpaper(input.wallpaper, options);
        if (input.dimLevel != null) {
            wallpaper.dimLevel = Number(input.dimLevel);
        }
    }
    if (input.themeScheme) {
        const themeMessage = buildMessage({ bubble: input.themeScheme, defaultWallpaper: true });
        if (bubble && bubble !== input.themeScheme) {
            return [themeMessage, buildMessage({ bubble })];
        }
        return [themeMessage];
    }
    return [buildMessage({ bubble, color, wallpaper })];
};
export const prepareChatThemeMessage = async (content, options = {}) => {
    const messages = await prepareChatThemeMessages(content, options);
    if (messages.length !== 1) {
        throw new Boom('named theme and bubble overrides require prepareChatThemeMessages', { statusCode: 400 });
    }
    return messages[0];
};
