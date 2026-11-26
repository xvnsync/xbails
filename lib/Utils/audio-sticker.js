import { Boom } from '@hapi/boom';
import { spawn } from 'child_process';

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
export const isOggOpus = (buffer) => Buffer.isBuffer(buffer) &&
    buffer.length > 4 &&
    buffer.toString('ascii', 0, 4) === 'OggS' &&
    buffer.includes(Buffer.from('OpusHead'));
export const convertToOggOpus = async (buffer) => {
    if (isOggOpus(buffer)) {
        return buffer;
    }
    return runFfmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '64k', '-f', 'ogg']);
};
