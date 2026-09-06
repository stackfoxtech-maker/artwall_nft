// CSP is shipped Report-Only first: it collects violations without breaking the
// app. Move to enforcing `Content-Security-Policy` with per-request nonces once
// the report endpoint is quiet (tracked in docs/production-readiness.md §10).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://verify.walletconnect.org",
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co",
    "https://*.walletconnect.com wss://*.walletconnect.com",
    "https://*.walletconnect.org wss://*.walletconnect.org",
    "https://rpc.walletconnect.com https://explorer-api.walletconnect.com",
    "https://*.base.org https://*.mypinata.cloud",
    "https://api.pinata.cloud https://uploads.pinata.cloud",
  ].join(" "),
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { instrumentationHook: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.mypinata.cloud" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
  },
  webpack: (config, { webpack }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // RainbowKit → @base-org/account → @coinbase/cdp-sdk pulls optional x402
    // payment packages that aren't installed and aren't needed for wallet UX.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@x402\/|^@coinbase\/cdp-sdk$/,
      }),
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
