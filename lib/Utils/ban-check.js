import { randomBytes, createHash } from 'node:crypto';
import { Curve, signedKeyPair } from './crypto.js';
import * as Defaults from '../Defaults/index.js';

const EXIST_URL = 'https://v.whatsapp.net/v2/exist';
const GRAPHQL_URL = 'https://graph.whatsapp.com/graphql';
const GRAPHQL_ACCESS_TOKEN = 'WA|1015890928915437|3201f239340c1c8ec6262a6dad04200e';
const GRAPHQL_BAN_STATUS_DOC_ID = '25573756098908502';
const MOBILE_TOKEN_PREFIX = '0a1mLfGUIBVrMKF1RdvLI5lkRBvof6vn0fD2QRSM';

const COUNTRY_CODES = [
  '1', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49',
  '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86',
  '90', '91', '92', '93', '94', '95', '98', '211', '212', '213', '216', '218', '220', '221', '222', '223', '224',
  '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240',
  '241', '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257',
  '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299',
  '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375',
  '376', '377', '378', '379', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500',
  '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596',
  '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683',
  '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960',
  '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977',
  '992', '993', '994', '995', '996', '998'
];

function getWaVersion() {
  const ver = Defaults.WA_VERSION || Defaults.version || Defaults.DEFAULT_CONNECTION_CONFIG?.version;
  if (Array.isArray(ver)) return ver.join('.');
  if (typeof ver === 'string' && ver.length > 0) return ver;
  return '2.3000.1';
}

function uuidv4() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateRegistrationId() {
  return randomBytes(2).readUInt16BE(0) & 16383;
}

function convertBufferToUrlHex(buffer) {
  let out = '';
  for (const byte of buffer) {
    out += '%' + byte.toString(16).padStart(2, '0').toLowerCase();
  }
  return out;
}

function urlencode(str) {
  return String(str)
    .replace(/-/g, '%2d')
    .replace(/_/g, '%5f')
    .replace(/~/g, '%7e');
}

export function parsePhone(input) {
  let cleaned = String(input || '').trim();
  if (!cleaned) {
    throw new Error('Masukkan nomor telepon.');
  }

  cleaned = cleaned.split('@')[0].split(':')[0];
  cleaned = cleaned.replace(/^00/, '+');

  if (cleaned.startsWith('08')) {
    cleaned = '+62' + cleaned.slice(1);
  }

  cleaned = cleaned.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  const digits = cleaned.slice(1);
  if (!/^\d+$/.test(digits)) {
    throw new Error('Nomor tidak valid.');
  }

  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.length - a.length);
  let countryCode = null;

  for (const code of sortedCodes) {
    if (digits.startsWith(code)) {
      countryCode = code;
      break;
    }
  }

  if (!countryCode) {
    throw new Error('Kode negara tidak dikenali. Gunakan format +628xxxxxxxxx');
  }

  const nationalNumber = digits.slice(countryCode.length);
  if (!nationalNumber || nationalNumber.length < 5) {
    throw new Error('Nomor nasional tidak valid.');
  }

  return {
    formatted: '+' + digits,
    countryCode,
    nationalNumber
  };
}

function buildCredentials() {
  const signedIdentityKey = Curve.generateKeyPair();
  const rawUuid = uuidv4();
  return {
    noiseKey: Curve.generateKeyPair(),
    pairingEphemeralKeyPair: Curve.generateKeyPair(),
    signedIdentityKey,
    signedPreKey: signedKeyPair(signedIdentityKey, 1),
    registrationId: generateRegistrationId(),
    advSecretKey: randomBytes(32).toString('base64'),
    deviceId: Buffer.from(rawUuid.replace(/-/g, ''), 'hex').toString('base64url'),
    phoneId: uuidv4(),
    identityId: randomBytes(20),
    backupToken: randomBytes(20)
  };
}

function registrationParams(creds, countryCode, nationalNumber, waVersion) {
  const regIdBuf = Buffer.alloc(4);
  regIdBuf.writeInt32BE(creds.registrationId);

  const keyIdBuf = Buffer.alloc(3);
  keyIdBuf.writeInt16BE(creds.signedPreKey.keyId);

  const versionHash = createHash('md5').update(waVersion).digest('hex');
  const tokenPrefixBuf = Buffer.from(MOBILE_TOKEN_PREFIX + versionHash);
  const token = createHash('md5')
    .update(Buffer.concat([tokenPrefixBuf, Buffer.from(nationalNumber)]))
    .digest('hex');

  return {
    cc: countryCode,
    in: nationalNumber,
    Rc: '0',
    lg: 'en',
    lc: 'GB',
    mistyped: '6',
    authkey: Buffer.from(creds.noiseKey.public).toString('base64url'),
    e_regid: regIdBuf.toString('base64url'),
    e_keytype: 'BQ',
    e_ident: Buffer.from(creds.signedIdentityKey.public).toString('base64url'),
    e_skey_id: keyIdBuf.toString('base64url'),
    e_skey_val: Buffer.from(creds.signedPreKey.keyPair.public).toString('base64url'),
    e_skey_sig: Buffer.from(creds.signedPreKey.signature).toString('base64url'),
    fdid: creds.phoneId,
    network_ratio_type: '1',
    expid: creds.deviceId,
    simnum: '1',
    hasinrc: '1',
    pid: Math.floor(Math.random() * 1000).toString(),
    id: convertBufferToUrlHex(creds.identityId),
    backup_token: convertBufferToUrlHex(creds.backupToken),
    token
  };
}

function buildExistUrl(params) {
  const query = [];
  for (const key in params) {
    const val = params[key];
    if (val !== null && val !== undefined) {
      query.push(`${key}=${urlencode(val)}`);
    }
  }
  return `${EXIST_URL}?${query.join('&')}`;
}

async function mobileRegisterExists(params, waVersion) {
  const url = buildExistUrl(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': `WhatsApp/${waVersion} iOS/17.5.1 Device/Apple-iPhone_13`,
        Accept: 'application/json, text/plain, */*'
      },
      signal: controller.signal
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw {
        reason: 'bad_response',
        httpStatus: response.status,
        raw: rawText
      };
    }

    if (response.status > 300 || data.reason) throw data;
    if (data.status && !['ok', 'sent'].includes(data.status)) throw data;

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function getBanDetails(appealToken, waVersion) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const payload = {
      variables: JSON.stringify({
        app_id: 'dev.app.id',
        request_token: appealToken
      }),
      access_token: GRAPHQL_ACCESS_TOKEN,
      doc_id: GRAPHQL_BAN_STATUS_DOC_ID,
      lang: 'en_GB',
      'Content-Type': 'application/json'
    };

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'User-Agent': `WhatsApp/${waVersion} iOS/17.5.1 Device/Apple-iPhone_13`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const rawText = await response.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error('Respons GraphQL bukan JSON: ' + rawText);
    }

    return json?.data?.whatsapp_support_ban_appeal_status || null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkWA(phoneNumber) {
  const waVersion = getWaVersion();
  const parsed = parsePhone(phoneNumber);
  const creds = buildCredentials();
  const params = registrationParams(creds, parsed.countryCode, parsed.nationalNumber, waVersion);

  try {
    await mobileRegisterExists(params, waVersion);
    return {
      number: parsed.formatted,
      status: 'aktif',
      isBanned: false,
      isNeedOfficialWa: false,
      banInfo: null
    };
  } catch (err) {
    if (err?.appeal_token) {
      let banDetails = null;
      try {
        banDetails = await getBanDetails(err.appeal_token, waVersion);
      } catch {
        banDetails = null;
      }

      const appealStatus = banDetails?.status || null;
      let banType = 'tidak diketahui';
      if (appealStatus === 'BANNED') {
        banType = 'permanen';
      } else if (appealStatus) {
        banType = 'sementara';
      }

      return {
        number: parsed.formatted,
        status: 'terbanned',
        isBanned: true,
        isNeedOfficialWa: false,
        banInfo: {
          banType,
          violationType: err.violation_type || null,
          violationReason: err.violation_type ? `Tipe ${err.violation_type}` : 'Tidak diketahui',
          canAppeal: banType === 'sementara' ? true : banType === 'permanen' ? false : null,
          appealToken: err.appeal_token,
          banTime: banDetails?.ban_time || null,
          banDate: banDetails?.ban_time ? new Date(banDetails.ban_time * 1000).toISOString() : null,
          appealStatus,
          appealCreatedAt: banDetails?.appeal_creation_time
            ? new Date(banDetails.appeal_creation_time * 1000).toISOString()
            : null
        },
        raw: err
      };
    }

    if (err?.custom_block_screen) {
      return {
        number: parsed.formatted,
        status: 'diblokir',
        isBanned: false,
        isNeedOfficialWa: true,
        banInfo: null,
        raw: err
      };
    }

    if (err?.reason === 'incorrect') {
      return {
        number: parsed.formatted,
        status: 'aktif',
        isBanned: false,
        isNeedOfficialWa: false,
        banInfo: null,
        raw: err
      };
    }

    if (err?.reason === 'temporarily_unavailable') {
      return {
        number: parsed.formatted,
        status: 'dibatasi_sementara',
        isBanned: false,
        isNeedOfficialWa: false,
        banInfo: null,
        raw: err
      };
    }

    return {
      number: parsed.formatted,
      status: 'error',
      isBanned: false,
      isNeedOfficialWa: false,
      banInfo: null,
      raw: err
    };
  }
}

export default checkWA;
