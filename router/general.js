const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const { authenticatedUser } = require("./auth_users.js");
const jwt = require('jsonwebtoken');

public_users.use(express.json());

const getBookList = async () => {
  try {
    return Object.values(books);
  } catch (error) {
    console.error('Error fetching book list:', error.message);
    throw error;
  }
};

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password." });
  }

  if (users.some(user => user.username === username)) {
    return res.status(409).json({ message: "Username already exists. Please choose a different username." });
  }
  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully." });
});

public_users.post("/login", (req, res) => {
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

public_users.get('/', async (req, res) => {
  try {
    const bookList = await getBookList();
    return res.status(200).send(JSON.stringify(bookList, null, 2));
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const isbnToFind = req.params.isbn;
    const book = books[isbnToFind];

    if (!book) {
      return res.status(404).json({ message: 'Book not found for the given ISBN.' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

public_users.get('/author/:author', async (req, res) => {
  try {
    const authorToFind = req.params.author;
    const booksByAuthor = Object.keys(books).reduce((result, key) => {
      if (books[key].author === authorToFind) {
        result[key] = books[key];
      }
      return result;
    }, {});

    if (Object.keys(booksByAuthor).length === 0) {
      return res.status(404).json({ message: "No books found for the given author." });
    }

    return res.status(200).json(booksByAuthor);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

public_users.get('/title/:title', async (req, res) => {
  try {
    const titleToFind = req.params.title;
    const booksByTitle = Object.keys(books).reduce((result, key) => {
      if (books[key].title.toLowerCase().includes(titleToFind.toLowerCase())) {
        result[key] = books[key];
      }
      return result;
    }, {});

    if (Object.keys(booksByTitle).length === 0) {
      return res.status(404).json({ message: "No books found with the given title." });
    }

    return res.status(200).json(booksByTitle);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

public_users.get('/review/:isbn', function (req, res) {
  const isbnToFind = req.params.isbn;
  const book = books[isbnToFind];
  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }
  const reviews = book.reviews;
  return res.status(200).json(reviews);
});

module.exports.general = public_users;
