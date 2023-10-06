const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'abc123'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'abc123'
  },
  'm4T2s9': {
    longURL: 'http://www.kitbfilms.com',
    userID: 'def456'
  }
};

const users = {
  'abc123': {
    id: 'abc123',
    email: 'maddie@lighthouselabs.ca',
    password: 'aeiou'
  }
};

// Look up user by any parameter
const getUserByParam = function(lookup, param, users) {
  for (const user in users) {
    if (users[user][param] === lookup) {
      return users[user];
    }
  }

  // If user not found
  return null;
};

// Return URLs where the userID is equal to the ID of the currently logged-in user
const urlsForUser = function(id) {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = {
        longURL: urlDatabase[url].longURL,
        userID: urlDatabase[url].userID
      };
    }
  }
  return userURLs;
}

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
  res.send('Hello!\nn');
});

app.get('/register', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    const templateVars = { user };
    res.render('register', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Missing parameter\n');
  } else if (getUserByParam(req.body.email, 'email', users)) {
    res.status(400).send('Email already registered\n');
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
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    const templateVars = { user };
    res.render('login', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  const user = getUserByParam(req.body.email, 'email', users);

  if (user === null) {
    res.status(403).send('Email not registered\n');
  } else if (user.password !== req.body.password) {
    res.status(403).send('Incorrect password\n');
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
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    res.send('You are not logged in. Please log in or register to shorten URLS.\n');
  } else {
  const templateVars = {
    urls: urlsForUser(user.id),
    user
  };
  res.render('urls_index', templateVars);
  }
});

app.get('/urls/new', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    res.redirect('/login');
    return;
  } else {
    const templateVars = { user };
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    res.send('You are not logged in!\n');
  } else {
    const id = generateRandomString(6);
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: user.id
    };
    res.redirect(`/urls/${id}`);
  }
});

app.get('/urls/:id', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);
  const id = req.params.id;

  if (user === null) {
    res.send('You are not logged in!\n');
    return;
  } else if (urlDatabase[id].userID === user.id) {
    const templateVars = {
      id,
      longURL: urlDatabase[req.params.id].longURL,
      user
    };
    res.render('urls_show', templateVars);
    return;
  } else {
    res.send('Error: URL belongs to a different user\n');
  }
});

app.post('/urls/:id', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);

  if (user === null) {
    res.send('You are not logged in!\n');
  } else {
    const newURL = req.body.newURL;
    urlDatabase[req.params.id].longURL = newURL;
    res.redirect('/urls');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  const user = getUserByParam(req.cookies['user_id'], 'id', users);
  const id = urlDatabase[req.params.id]

  if (id === undefined) {
    res.send('ID does not exist\n');
    return;
  } else if (user === null) {
    res.send('You are not logged in!\n');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});

app.get('/u/:id', (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send('URL ID not found!\n');
    return;
  } else {
    const redirectURL = urlDatabase[req.params.id].longURL;
    res.redirect(redirectURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}...`);
});