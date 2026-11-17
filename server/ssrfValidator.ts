/**
 * SSRF and Network Security Validator
 * 
 * Protects against Server-Side Request Forgery (SSRF) and unsafe URL fetching.
 * Validates schemes, hostnames, IP addresses, and reserved networks.
 */

import { URL } from 'url';
import dns from 'dns/promises';

const PRIVATE_IP_RANGES = [
  // 127.0.0.0/8 (Loopback)
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  // 10.0.0.0/8 (Private Network)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  // 172.16.0.0/12 (Private Network)
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  // 192.168.0.0/16 (Private Network)
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  // 169.254.0.0/16 (Link Local / Cloud Metadata e.g. AWS/GCP/Azure)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  // 0.0.0.0
  /^0\.0\.0\.0$/,
  // IPv6 loopback and private
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i
];

export interface UrlValidationResult {
  valid: boolean;
  sanitizedUrl?: string;
  reason?: string;
}

/**
 * Validates a candidate URL to ensure it is safe to retrieve by the server.
 */
export async function validateSafeHttpUrl(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, reason: 'Malformed URL syntax.' };
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Protocol '${parsed.protocol}' is forbidden. Only HTTP/HTTPS is allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject localhost and raw IP patterns directly
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, reason: 'Access to localhost and internal domain names is blocked for security.' };
  }

  for (const regex of PRIVATE_IP_RANGES) {
    if (regex.test(hostname)) {
      return { valid: false, reason: `Access to private or reserved IP address (${hostname}) is blocked.` };
    }
  }

  // 3. Reject non-standard ports
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { valid: false, reason: `Port ${parsed.port} is not permitted. Only standard web ports (80/443) are allowed.` };
  }

  // 4. Resolve DNS to ensure hostname does not resolve to private IP
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      for (const regex of PRIVATE_IP_RANGES) {
        if (regex.test(record.address)) {
          return { valid: false, reason: `Hostname '${hostname}' resolved to private IP (${record.address}) which is blocked.` };
        }
      }
    }
  } catch (dnsErr: any) {
    // If DNS resolution fails, reject
    return { valid: false, reason: `DNS resolution failed for host '${hostname}': ${dnsErr.message || dnsErr}` };
  }

  return {
    valid: true,
    sanitizedUrl: parsed.toString()
  };
}
