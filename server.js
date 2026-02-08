import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

app.use(express.static(path.join(process.cwd(), 'public')));

const DB_KEY = process.env.DB_KEY;

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === DB_KEY) res.json({ success: true });
  else res.json({ success: false });
});

app.get('/pending.json', (req, res) => {
  res.sendFile(path.resolve('pending.json'));
});

app.post('/approve/:i', (req, res) => {
  const pending = JSON.parse(fs.readFileSync('pending.json'));
  const index = JSON.parse(fs.readFileSync('index.json'));
  const item = pending.splice(req.params.i, 1)[0];

  if (item) {
    index.push({ ...item, lastScraped: new Date().toISOString() });
    fs.writeFileSync('index.json', JSON.stringify(index, null, 2));
    fs.writeFileSync('pending.json', JSON.stringify(pending, null, 2));
  }

  res.json({ success: true });
});

app.post('/deny/:i', (req, res) => {
  const pending = JSON.parse(fs.readFileSync('pending.json'));
  pending.splice(req.params.i, 1);
  fs.writeFileSync('pending.json', JSON.stringify(pending, null, 2));
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
