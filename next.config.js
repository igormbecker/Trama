const nextConfig = {
  distDir: process.env.TRAMA_TEST_SERVER === "true" ? ".next-test" : ".next",
  outputFileTracingIncludes: {
    "/api/v1/migrations": ["./infra/migrations/**/*"],
  },
};

module.exports = nextConfig;
