const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  serverExternalPackages: ["pg", "pg-connection-string", "@prisma/adapter-pg"],
})
