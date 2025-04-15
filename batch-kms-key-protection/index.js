const {
  KMSClient,
  ListKeysCommand,
  CreateKeyCommand,
  ListResourceTagsCommand,
  DescribeKeyCommand,
  CancelKeyDeletionCommand,
} = require("@aws-sdk/client-kms");
const region = "ap-east-1";
const dryRunMode = true;

const customLogging = (message) => {
  const formattedMessage = `${new Date()}: ${message}`;
  console.log(formattedMessage);
};

const listAllKeys = async () => {
  const client = new KMSClient({ region });
  const keys = [];
  let truncated = true;
  let nextMarker = "";
  while (truncated) {
    const param = {
      Limit: 500,
    };
    if (nextMarker) {
      Object.assign(param, { Marker: nextMarker });
    }
    const result = await client.send(new ListKeysCommand(param));
    result.Keys.forEach((key) => {
      keys.push(key);
    });
    truncated = result.Truncated;
    nextMarker = truncated && result.NextMarker ? result.NextMarker : "";
  }
  return keys;
};

const listAllTags = async (keyId) => {
  const client = new KMSClient({ region });
  const param = { KeyId: keyId };
  return client.send(new ListResourceTagsCommand(param));
};

const describeKey = async (keyId) => {
  const client = new KMSClient({ region });
  const param = { KeyId: keyId };
  return client.send(new DescribeKeyCommand(param));
};

const cancelDeleteKey = async (keyId) => {
  const client = new KMSClient({ region });
  const param = { KeyId: keyId };
  return client.send(new CancelKeyDeletionCommand(param));
};

const checkIsPendingDeletion = async (keyId) => {
  const keyDescription = await describeKey(keyId);
  return keyDescription.KeyMetadata.KeyState === "PendingDeletion";
};

const checkIfImportantTagExists = (tags) => {
  return tags.some(
    (tag) => tag.TagKey === "cust_important" && tag.TagValue === "yes",
  );
};

const main = async () => {
  customLogging("Getting All Keys from AWS KMS");
  const keys = await listAllKeys();
  customLogging(`Retrieved ${keys.length} keys`);

  customLogging(`---------------------------------------`);
  customLogging(`Begin to retrieve each key's status`);
  let counter = 1;
  const pendingDeletionKeys = [];
  for (const keyObject of keys) {
    const key = keyObject.KeyId;
    const isPendingDeletion = await checkIsPendingDeletion(key);
    customLogging(
      `[${key}] (${counter}/${keys.length}) Check if it is pending for deletion: ${isPendingDeletion}`,
    );
    if (isPendingDeletion) {
      pendingDeletionKeys.push(key);
    }
    counter++;
  }
  customLogging(
    `Found ${
      pendingDeletionKeys.length
    } marked as pending deletion. List of pending deletion keys: ${
      pendingDeletionKeys.length > 0 ? pendingDeletionKeys.join(",") : "NA"
    }`,
  );

  if (pendingDeletionKeys.length <= 0) {
    customLogging(`No pending deletion key. Job exits`);
    return;
  }
  customLogging(`---------------------------------------`);
  customLogging(`Going to fetch tags for these deleted keys`);
  const cancelDeletionKeys = [];
  const cancelledDeletionKeys = [];
  for (const pendingDeletionKey of pendingDeletionKeys) {
    customLogging(`[${pendingDeletionKey}] Fetching tags`);
    const retrievedTags = await listAllTags(pendingDeletionKey);
    const isStillImportant = checkIfImportantTagExists(retrievedTags.Tags);
    customLogging(
      `[${pendingDeletionKey} is still important: ${isStillImportant} ${
        isStillImportant ? "****" : ""
      }. Tags retrieved ${JSON.stringify(retrievedTags.Tags)}`,
    );
    if (isStillImportant) {
      cancelDeletionKeys.push(pendingDeletionKey);
    }
  }
  customLogging(
    `Begin to cancel deletion schedule ${
      cancelDeletionKeys.length
    } key(s) require(s) to cancel deletion: ${cancelDeletionKeys.join(",")}`,
  );
  for (const cancelDeletionKey of cancelDeletionKeys) {
    customLogging(`[${cancelDeletionKey}] Requesting to cancel deletion`);
    if (dryRunMode) {
      customLogging(
        `[${cancelDeletionKey}] Request ignored due to dry run mode`,
      );
    } else {
      await cancelDeleteKey(cancelDeletionKey);
      customLogging(`[${cancelDeletionKey}] Requested to cancel deletion`);
      cancelledDeletionKeys.push(cancelDeletionKey);
    }
  }
  customLogging(
    `Cancellation process for ${cancelDeletionKeys.length} keys completed`,
  );

  customLogging(`---------------------------------------`);
  customLogging(`---------------------------------------`);
  customLogging(`Job completed.`);
  customLogging(`Examined keys: ${keys.length}`);
  customLogging(`Marked for deletion: ${pendingDeletionKeys.length}`);
  customLogging(
    `Marked for deletion but with important tag: ${cancelDeletionKeys.length}`,
  );
  customLogging(
    `Cancelled deletion (i.e. key shall not be deleted): ${cancelledDeletionKeys.length}`,
  );
  const retained = pendingDeletionKeys.filter(
    (x) => !cancelDeletionKeys.includes(x),
  );
  customLogging(
    `Retained deletion (i.e. key shall be deleted): ${retained.length}`,
  );
  customLogging(`---------------------------------------`);
  customLogging(`Marked for deletion:`);
  for (const key of pendingDeletionKeys) customLogging(`- ${key}`);
  customLogging(`Marked for deletion but with important tag:`);
  for (const key of cancelDeletionKeys) customLogging(`- ${key}`);
  customLogging(`Cancelled deletion (i.e. key shall not be deleted):`);
  for (const key of cancelledDeletionKeys) customLogging(`- ${key}`);
  customLogging(`Retained deletion (i.e. key shall be deleted):`);
  for (const key of retained) customLogging(`- ${key}`);
  customLogging(`---------------------------------------`);
};

main();
