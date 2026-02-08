import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
const DB_KEY = process.env.DB_KEY;

const checkRobotsTxt = async (url) => {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const { data } = await axios.get(robotsUrl, { timeout: 5000 });
    
    const lines = data.split('\n');
    let currentUserAgent = null;
    let disallowed = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('User-agent:')) {
        const agent = trimmed.substring(11).trim().toLowerCase();
        currentUserAgent = (agent === '*' || agent === 'indiesearch_bot');
      } else if (currentUserAgent && trimmed.startsWith('Disallow:')) {
        const disallowPath = trimmed.substring(9).trim();
        if (disallowPath === '/' || urlObj.pathname.startsWith(disallowPath)) {
          disallowed = true;
          break;
        }
      }
    }
    
    return !disallowed;
  } catch (err) {
    return true;
  }
};

const isAlreadyIndexed = (url) => {
  const index = JSON.parse(fs.readFileSync('index.json'));
  const pending = JSON.parse(fs.readFileSync('pending.json'));
  
  const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  
  const inIndex = index.some(item => 
    item.url.toLowerCase().replace(/\/$/, '') === normalizedUrl
  );
  
  const inPending = pending.some(item => 
    item.url.toLowerCase().replace(/\/$/, '') === normalizedUrl
  );
  
  return inIndex || inPending;
};

const scrapeSite = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $('title').text() || url;
    const description = $('meta[name="description"]').attr('content') || '';
    return { title, url, description, lastScraped: new Date().toISOString() };
  } catch (err) {
    console.error(`failed to scrape ${url}:`, err.message);
    return { title: url, url, description: '', lastScraped: new Date().toISOString() };
  }
};

app.post('/submit', async (req, res) => {
  const { url, description } = req.body;
  if (!url) return res.json({ success: false, error: 'URL required' });
  
  if (isAlreadyIndexed(url)) {
    return res.json({ success: false, error: 'site already indexed!' });
  }
  
  const allowed = await checkRobotsTxt(url);
  if (!allowed) {
    return res.json({ 
      success: false, 
      error: 'robots.txt blocked it! please allow "indiesearch_bot" and try again' 
    });
  }
  
  const pending = JSON.parse(fs.readFileSync('pending.json'));
  pending.push({ url, description, submittedAt: new Date().toISOString() });
  fs.writeFileSync('pending.json', JSON.stringify(pending, null, 2));
  res.json({ success: true });
});

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === DB_KEY) res.json({ success: true });
  else res.json({ success: false });
});

app.get('/pending.json', (req, res) => {
  res.sendFile(path.resolve('pending.json'));
});

app.post('/approve/:i', async (req, res) => {
  const pending = JSON.parse(fs.readFileSync('pending.json'));
  const index = JSON.parse(fs.readFileSync('index.json'));
  const item = pending.splice(req.params.i, 1)[0];
  if (item) {
    const scraped = await scrapeSite(item.url);
    index.push(scraped);
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
