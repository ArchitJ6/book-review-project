const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

regd_users.use(express.json());

const isValid = (username, password) => {
  const isUsernameValid = typeof username === 'string' && username.trim() !== '';
  const isPasswordValid = typeof password === 'string' && password.trim() !== '';

  return isUsernameValid && isPasswordValid;
};

const isUsernameTaken = (username) => {
  return users.some(user => user.username === username);
};

regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password. Both username and password must be non-empty strings." });
  }

  if (isUsernameTaken(username)) {
    return res.status(409).json({ message: "Username already exists. Please choose a different username." });
  }
  if (!users) {
    users = [];
  }
  users.push({ username, password });

  return res.status(201).json({ message: "User registered successfully." });
});

const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
}

regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password. Both username and password must be non-empty strings." });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Authentication failed. Incorrect username or password." });
  }

  const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' });
  return res.status(200).json({ message: "Login successful.", token });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'User not logged in' });
  }
  const accessToken = token.slice(7);

  jwt.verify(accessToken, 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'User not authenticated' });
    }
    req.user = decoded;
    next();
  });
};
regd_users.put("/auth/review/:isbn", authMiddleware, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;

  if (!review || review.trim() === '') {
    return res.status(400).json({ message: "Review cannot be empty." });
  }

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }

  const username = req.user.username;
  book.reviews[username] = review;

  return res.status(200).json({ message: "Review added/modified successfully." });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;

  if (!review || review.trim() === '') {
    return res.status(400).json({ message: "Review cannot be empty." });
  }
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }

  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "User not logged in." });
  }

  try {
    const decodedToken = jwt.verify(token, 'secret_key');
    const username = decodedToken.username;

    book.reviews[username] = review;

    return res.status(200).json({ message: "Review added/modified successfully." });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.authenticatedUser = authenticatedUser;