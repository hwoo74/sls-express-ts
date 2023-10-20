import app from './app.js'; //ESM 에서는, js까지 꼭 적어줘야 한다..

const port = process.env.PORT || 80;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
