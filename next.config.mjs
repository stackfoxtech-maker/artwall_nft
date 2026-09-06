/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
