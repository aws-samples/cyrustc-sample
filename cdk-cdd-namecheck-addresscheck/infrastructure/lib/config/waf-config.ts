export const WAF_CONFIG = {
  rateLimit: {
    requestsPerFiveMinutes: 2000,
  },
  rules: {
    commonRuleSet: {
      enabled: true,
      priority: 2,
    },
    knownBadInputs: {
      enabled: true,
      priority: 3,
    },
  },
};
