const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  'abc123': {
    id: 'abc123',
    email: 'maddie@lighthouselabs.ca',
    password: 'aeiou'
  }
};

// Look up user by email
const getUser = function(lookup, param, users) {
  for (const user in users) {
    if (users[user][param] === lookup) {
      return users[user];
    }
  }

  // If user not found
  return null;
};

// Return a string of random alphanumeric characters of a given length
const generateRandomString = function(charLimit) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < charLimit; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return randomString;
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {
  const user = users[req.cookies['user_id']];

  if (user === undefined) {
    const templateVars = { user };
    res.render('register', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Missing parameter');
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('Email already registered');
  } else {
    const userID = generateRandomString(6);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  const user = users[req.cookies['user_id']];

  if (user === undefined) {
    const templateVars = { user };
    res.render('login', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if (user === null) {
    res.status(403).send('Email not registered');
  } else if (user.password !== req.body.password) {
    res.status(403).send('Incorrect password');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const user = users[req.cookies['user_id']];

  if (user === undefined) {
    res.redirect('/login');
    return;
  } else {
    const templateVars = { user };
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const id = generateRandomString(6);
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const newURL = req.body.newURL;
  urlDatabase[req.params.id] = newURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.get('/u/:id', (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send('URL ID not found!');
  } else {
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}...`);
});