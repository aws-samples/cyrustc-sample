export const STORAGE_CONFIG = {
  tables: {
    analysis: {
      // Table configuration
      streamEnabled: true,
      pointInTimeRecovery: true,
      billingMode: "PAY_PER_REQUEST",

      // GSI configuration
      gsi: {
        createdAtIndex: {
          partitionKey: "yearMonth",
          sortKey: "createdAt",
        },
      },
    },
  },
};
