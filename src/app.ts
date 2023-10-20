import express from 'express';
import 'dotenv/config';

const app = express();
//const port = process.env.PORT || 80;

app.get('/', (req, response) => {
  response.send('Hello, Express with TypeScript! ver2.1' + process.env.STAGE);
});

//exports.default = app;    //case of commonJS
export default app;

/*
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
*/
