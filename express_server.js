const express = require('express');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const { getUserByParam } = require('./helpers');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

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
  // example user to test functionality
  'abc123': {
    id: 'abc123',
    email: 'maddie@lighthouselabs.ca',
    password: bcrypt.hashSync('aeiou', bcrypt.genSaltSync(10))
  }
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

// ** ROUTES **
// Default route - redirects based on if user is logged in or not
app.get('/', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// Default error page route
app.get('/error', (req, res) => {
  const templateVars = {
    message: req.body.message,
    user: getUserByParam(req.session.userID, 'id', users)
  };
  res.render('error', templateVars);
});

// REGISTER
// GET registration page if user is not signed in
app.get('/register', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    const templateVars = { user };
    res.render('register', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

// POST user registration
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.render('error', { message: 'Email or password cannot be blank.', user: null });
  } else if (getUserByParam(req.body.email, 'email', users)) {
    res.status(400);
    res.render('error', { message: 'Email already registered!', user: null });
  } else {
    const userID = generateRandomString(6);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    };
    req.session.userID = userID;
    res.redirect('/urls');
  }
});

// LOGIN
// GET login page if user is not signed in
app.get('/login', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    const templateVars = { user };
    res.render('login', templateVars);
    return;
  } else {
    res.redirect('/urls');
  }
});

// POST user login
app.post('/login', (req, res) => {
  const user = getUserByParam(req.body.email, 'email', users);

  if (user === null) {
    res.status(403);
    res.render('error', { message: 'Email not registered', user });
  } else if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403);
    res.render('error', { message: 'Incorrect password', user });
  } else {
    req.session.userID = user.id;
    res.redirect('/urls');
  }
});

// POST user logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// URLS
// GET default URL table if user is signed in
app.get('/urls', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    res.status(403);
    res.render('error', { message: 'You are not logged in. Please log in or register to shorten URLS.', user });
  } else {
    const templateVars = {
      urls: urlsForUser(user.id),
      user
    };
    res.render('urls_index', templateVars);
  }
});

// NEW URL
// GET new URL creation page if user is signed in
app.get('/urls/new', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    res.redirect('/login');
    return;
  } else {
    const templateVars = { user };
    res.render('urls_new', templateVars);
  }
});

// POST new shortened URL and redirect to URL's ID page
app.post('/urls', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);

  if (user === null) {
    res.status(403);
    res.render('error', { message: 'You are not logged in. Please log in or register to shorten URLS.', user });
  } else {
    const id = generateRandomString(6);
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: user.id
    };
    res.redirect(`/urls/${id}`);
  }
});

// URL ID PAGE
// GET URL ID page
app.get('/urls/:id', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);
  const id = req.params.id;

  if (urlDatabase[id] === undefined) {
    res.status(404);
    res.render('error', { message: 'URL ID not found!', user });
  } else if (user === null) {
    res.status(403);
    res.render('error', { message: 'You are not logged in. Please log in or register to shorten URLS.', user });
  } else if (urlDatabase[id].userID !== user.id) {
    res.status(403);
    res.render('error', { message: 'You do not have permission to access this page.', user });
  } else {
    const templateVars = {
      id,
      longURL: urlDatabase[id].longURL,
      user
    };
    res.render('urls_show', templateVars);
  }
});

// PUT to edit the long URL that a URL ID redirects to
app.put('/urls/:id', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);
  const id = req.params.id;

  if (urlDatabase[id] === undefined) {
    res.status(404);
    res.render('error', { message: 'URL ID not found!', user });
  } else if (user === null) {
    res.status(403);
    res.render('error', { message: 'You are not logged in. Please log in or register to edit URLS.', user });
  } else if (urlDatabase[id].userID !== user.id) {
    res.status(403);
    res.render('error', { message: 'You do not have permission to edit this URL.', user });
  } else {
    const newURL = req.body.newURL;
    urlDatabase[id].longURL = newURL;
    res.redirect('/urls');
  }
});

// DELETE a short URL ID from the database
app.delete('/urls/:id', (req, res) => {
  const user = getUserByParam(req.session.userID, 'id', users);
  const id = req.params.id;

  if (urlDatabase[id] === undefined) {
    res.status(404);
    res.render('error', { message: 'URL ID not found!', user });
  } else if (user === null) {
    res.status(403);
    res.render('error', { message: 'You are not logged in. Please log in or register to edit URLS.', user });
  } else if (urlDatabase[id].userID !== user.id) {
    res.status(403);
    res.render('error', { message: 'You do not have permission to delete this URL.', user });
  } else {
    delete urlDatabase[id];
    res.redirect('/urls');
  }
});

// GET long URL that an ID redirects to
app.get('/u/:id', (req, res) => {
  const id = req.params.id;

  if (urlDatabase[id] === undefined) {
    res.status(404);
    res.render('error', {
      message: 'URL ID not found!',
      user: getUserByParam(req.session.userID, 'id', users)
    });
  } else {
    const redirectURL = urlDatabase[id].longURL;
    res.redirect(redirectURL);
  }
});

// ** SERVER **
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}...`);
});