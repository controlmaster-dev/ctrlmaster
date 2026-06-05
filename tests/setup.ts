const TEST_KEY = Buffer.alloc(32, 7).toString('base64');

process.env.MONGODB_URI ??=
  'mongodb://127.0.0.1:27017/controlmaster_test?directConnection=true';
process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ??= '3000';
process.env.FILE_ENC_KEY ??= TEST_KEY;
process.env.CREDENTIALS_ENC_KEY ??= TEST_KEY;
process.env.CRON_SECRET ??= 'test-cron-secret';
process.env.NODE_ENV ??= 'test';
