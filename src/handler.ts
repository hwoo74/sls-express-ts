import serverlessExpress from '@vendia/serverless-express';
import app from './app.js'; //ESM 에서는, js까지 꼭 적어줘야 한다..

const handler = serverlessExpress({ app });

export { handler };
