import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

/**
 * SSRF guard for user-supplied external LLM provider URLs.
 *
 * Threat: the server performs HTTP requests to a `baseUrl` chosen by an
 * unauthenticated client. Without a guard that lets anyone reach loopback,
 * private networks and cloud metadata endpoints (e.g. 169.254.169.254).
 *
 * Defences implemented here:
 *  1. Only https:// is accepted (http:// only with ALLOW_PRIVATE_PROVIDER_URLS=true).
 *  2. No credentials inside the URL.
 *  3. IP-literal hosts are checked directly.
 *  4. Hostnames are resolved by a custom `lookup` that runs at connect time and
 *     rejects the connection if ANY resolved address is non-public. Validating at
 *     connect time (not in a separate pre-check) closes the DNS-rebinding window.
 *  5. Redirects are never followed (node:http(s) does not follow them).
 *  6. Response size and total time are capped.
 */

export const PROVIDER_URL_BLOCKED = 'PROVIDER_URL_BLOCKED';

export class ProviderUrlError extends Error {
  code = PROVIDER_URL_BLOCKED;
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUrlError';
  }
}

export function isProviderUrlError(error: unknown): error is ProviderUrlError {
  return (
    error instanceof ProviderUrlError ||
    (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === PROVIDER_URL_BLOCKED)
  );
}

const blocked = new net.BlockList();

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
];

const BLOCKED_V6: Array<[string, number]> = [
  ['::', 96], // unspecified, loopback and IPv4-compatible
  ['64:ff9b::', 96], // NAT64
  ['64:ff9b:1::', 48], // local-use NAT64
  ['100::', 64], // discard-only
  ['2001::', 32], // Teredo
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4 (embeds an IPv4 address)
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
];

for (const [addr, prefix] of BLOCKED_V4) blocked.addSubnet(addr, prefix, 'ipv4');
for (const [addr, prefix] of BLOCKED_V6) blocked.addSubnet(addr, prefix, 'ipv6');

/** Expand an IPv6 string into 8 hextets, or null when it is not valid. */
function ipv6ToHextets(input: string): number[] | null {
  let s = input.toLowerCase();
  const zoneIdx = s.indexOf('%');
  if (zoneIdx >= 0) s = s.slice(0, zoneIdx);

  if (s.includes('.')) {
    const lastColon = s.lastIndexOf(':');
    const parts = s.slice(lastColon + 1).split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    s =
      s.slice(0, lastColon + 1) +
      ((parts[0] << 8) | parts[1]).toString(16) +
      ':' +
      ((parts[2] << 8) | parts[3]).toString(16);
  }

  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;

  const groups = [...head, ...(halves.length === 2 ? Array(missing).fill('0') : []), ...tail];
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

/** True when the address is not a publicly routable unicast address (fail closed). */
export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blocked.check(ip, 'ipv4');
  if (family === 6) {
    const h = ipv6ToHextets(ip);
    if (!h) return true;
    // IPv4-mapped (::ffff:a.b.c.d): judge by the embedded IPv4 address.
    if (h.slice(0, 5).every((n) => n === 0) && h[5] === 0xffff) {
      const v4 = `${h[6] >> 8}.${h[6] & 255}.${h[7] >> 8}.${h[7] & 255}`;
      return blocked.check(v4, 'ipv4');
    }
    return blocked.check(ip, 'ipv6');
  }
  return true; // not an IP -> block
}

function allowPrivateFromEnv(): boolean {
  return process.env.ALLOW_PRIVATE_PROVIDER_URLS === 'true';
}

/** Validate the syntactic parts of a provider base URL. Throws ProviderUrlError. */
export function parseProviderBaseUrl(raw: unknown, allowPrivate = allowPrivateFromEnv()): URL {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new ProviderUrlError('آدرس پایه API نامعتبر است.');
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ProviderUrlError('آدرس پایه API نامعتبر است.');
  }

  if (url.protocol !== 'https:' && !(allowPrivate && url.protocol === 'http:')) {
    throw new ProviderUrlError('فقط آدرس‌های https مجاز هستند.');
  }
  if (url.username || url.password) {
    throw new ProviderUrlError('آدرس نباید شامل نام کاربری یا گذرواژه باشد.');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host) {
    throw new ProviderUrlError('آدرس پایه API نامعتبر است.');
  }
  if (!allowPrivate && net.isIP(host) && isBlockedIp(host)) {
    throw new ProviderUrlError('این آدرس مجاز نیست (شبکهٔ داخلی یا رزروشده).');
  }

  return url;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: unknown, family?: number) => void;

/** DNS lookup that refuses to hand back non-public addresses (checked at connect time). */
function makeGuardedLookup(allowPrivate: boolean) {
  return (hostname: string, options: unknown, callback: LookupCallback) => {
    dns.lookup(hostname, options as dns.LookupOptions, (err, address, family) => {
      if (err) return callback(err);
      if (!allowPrivate) {
        const list = Array.isArray(address) ? address : [{ address: address as string, family: family as number }];
        for (const entry of list) {
          if (isBlockedIp(entry.address)) {
            return callback(new ProviderUrlError('این آدرس مجاز نیست (شبکهٔ داخلی یا رزروشده).') as NodeJS.ErrnoException);
          }
        }
      }
      return callback(null, address, family);
    });
  };
}

export interface ProviderPostOptions {
  headers: Record<string, string>;
  body: string;
  timeoutMs: number;
  maxResponseBytes: number;
  allowPrivate?: boolean;
}

export interface ProviderResponse {
  status: number;
  ok: boolean;
  text: string;
}

/**
 * POST JSON to `${baseUrl}${path}` with SSRF protections.
 * Rejects with ProviderUrlError for disallowed targets.
 */
export async function providerPostJson(
  baseUrl: unknown,
  path: string,
  opts: ProviderPostOptions,
): Promise<ProviderResponse> {
  const allowPrivate = opts.allowPrivate ?? allowPrivateFromEnv();
  const base = parseProviderBaseUrl(baseUrl, allowPrivate);
  const target = new URL(`${base.origin}${base.pathname.replace(/\/+$/, '')}${path}`);
  const transport = target.protocol === 'https:' ? https : http;

  return new Promise<ProviderResponse>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      fn();
    };

    const req = transport.request(
      target,
      {
        method: 'POST',
        headers: { ...opts.headers, 'Content-Length': String(Buffer.byteLength(opts.body)) },
        lookup: makeGuardedLookup(allowPrivate) as never,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > opts.maxResponseBytes) {
            finish(() => reject(new Error('پاسخ سرویس خارجی بیش از حد بزرگ است.')));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          finish(() =>
            resolve({ status, ok: status >= 200 && status < 300, text: Buffer.concat(chunks).toString('utf8') }),
          );
        });
        res.on('error', (e) => finish(() => reject(e)));
      },
    );

    const deadline = setTimeout(() => {
      finish(() => reject(new Error('زمان پاسخ‌دهی سرویس خارجی به پایان رسید.')));
      req.destroy();
    }, opts.timeoutMs);

    req.on('error', (e) => finish(() => reject(e)));
    req.end(opts.body);
  });
}
