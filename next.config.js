const nextConfig = {
  allowedDevOrigins: (process.env.TRAMA_DEV_ORIGINS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
  distDir: process.env.TRAMA_TEST_SERVER === "true" ? ".next-test" : ".next",
  outputFileTracingIncludes: {
    "/api/v1/migrations": ["./infra/migrations/**/*"],
  },
};

module.exports = nextConfig;
