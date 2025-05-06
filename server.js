const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Your JSONBin credentials
const BIN_ID = '6819bd788561e97a500eafcc';
const API_KEY = '$2a$10$0mdpHRQad0qFwHL7qfJYceHh2jH2l125eK0zZbmStw5XbvGOkiQYW'; // <-- Your actual key

const PASSWORD = 'junieismean';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check password
function authenticate(req, res, next) {
  if (req.body.password === PASSWORD) {
    next();
  } else {
    res.status(403).send('Forbidden: Incorrect Password');
  }
}

// Helpers to interact with JSONBin
async function getThoughts() {
  const res = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  return res.data.record;
}

async function saveThoughts(thoughts) {
  await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID}`, thoughts, {
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY
    }
  });
}

// Route: Get most recent thought
app.get('/content', async (req, res) => {
  try {
    const thoughts = await getThoughts();
    res.send(thoughts[0]?.content || 'No thoughts yet.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load thoughts');
  }
});

// Route: Get all previous thoughts
app.get('/previousThoughts', async (req, res) => {
  try {
    const thoughts = await getThoughts();
    res.json(thoughts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving thoughts');
  }
});

// Route: Post a new thought
app.post('/update', authenticate, async (req, res) => {
  try {
    const newContent = req.body.newContent;
    const thoughts = await getThoughts();
    const newThought = {
      date: new Date().toISOString().split('T')[0],
      content: newContent
    };
    thoughts.unshift(newThought);
    await saveThoughts(thoughts);
    res.send('Content updated successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update thought');
  }
});

// Route: Delete a thought
app.post('/delete', authenticate, async (req, res) => {
  try {
    const dateToDelete = req.body.date;
    const thoughts = await getThoughts();
    const updated = thoughts.filter(t => t.date !== dateToDelete);
    await saveThoughts(updated);
    res.send('Thought deleted.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete thought');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
