/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The kiosk UI is fully client-side; export static files so the Pi can
  // serve them without a Node runtime (see deploy/ for the kiosk setup).
  output: "export",
};

export default nextConfig;
