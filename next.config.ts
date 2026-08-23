import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ["192.168.0.23", "127.0.0.1", "localhost", "*.ngrok-free.dev"] //hurler-womanlike-corrosive.ngrok-free.dev usar este en caso de que el wildcard no funcione, solo que se debe estar actualizando corriendo ngrok http 3000
};

export default nextConfig;
