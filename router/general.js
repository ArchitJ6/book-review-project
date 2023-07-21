const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const { authenticatedUser } = require("./auth_users.js");
const jwt = require('jsonwebtoken');

// Middleware for JSON parsing
public_users.use(express.json());

const getBookList = async () => {
  try {
    return Object.values(books);
  } catch (error) {
    console.error('Error fetching book list:', error.message);
    throw error;
  }
};
// const getBookDetailsByISBN = async (isbnToFind) => {
//   try {
//     const book = Object.values(books).find(
//       (book) => book.title.toLowerCase().includes(isbnToFind.toLowerCase())
//     );

//     if (!book) {
//       throw new Error('Book not found for the given ISBN.');
//     }

//     return book;
//   } catch (error) {
//     throw error;
//   }
// };

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password." });
  }

  if (users.some(user => user.username === username)) {
    return res.status(409).json({ message: "Username already exists. Please choose a different username." });
  }

  // Add the new user to the 'users' array
  users.push({ username, password });

  // Sending a success message as response
  return res.status(201).json({ message: "User registered successfully." });
});

// public_users.post("/login", regd_users);
public_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password. Both username and password must be non-empty strings." });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Authentication failed. Incorrect username or password." });
  }

  // Generate and send JWT token to the user upon successful authentication
  const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' }); // Replace 'secret_key' with your actual secret key and set token expiration time
  return res.status(200).json({ message: "Login successful.", token });
});

// Get the book list available in the shop
// public_users.get('/', function (req, res) {
//   //Write your code here
//   return res.status(200).send(JSON.stringify(books, null, 2));
// });
public_users.get('/', async (req, res) => {
  try {
    const bookList = await getBookList();
    return res.status(200).send(JSON.stringify(bookList, null, 2));
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get book details based on ISBN
// public_users.get('/isbn/:isbn', function (req, res) {
//   // Retrieve the ISBN from the request parameters
//   const isbnToFind = req.params.isbn;

//   // Find the book with the given ISBN in the 'books' object
//   const book = Object.values(books).find((book) => book.title.toLowerCase().includes(isbnToFind.toLowerCase()));

//   // Check if the book with the given ISBN exists
//   if (!book) {
//     return res.status(404).json({ message: "Book not found for the given ISBN." });
//   }

//   // Sending the book details as a JSON response
//   return res.status(200).json(book);
// });

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


// Get book details based on author
// public_users.get('/author/:author', function (req, res) {
//   // Retrieve the author from the request parameters
//   const authorToFind = req.params.author;

//   // Filter books based on the author
//   const booksByAuthor = Object.keys(books).reduce((result, key) => {
//     if (books[key].author === authorToFind) {
//       result[key] = books[key];
//     }
//     return result;
//   }, {});

//   // Check if there are books by the given author
//   if (Object.keys(booksByAuthor).length === 0) {
//     return res.status(404).json({ message: "No books found for the given author." });
//   }

//   // Sending the book details as a JSON response
//   return res.status(200).json(booksByAuthor);
// });

public_users.get('/author/:author', async (req, res) => {
  // Retrieve the author from the request parameters
  try {
    const authorToFind = req.params.author;

    // Filter books based on the author
    const booksByAuthor = Object.keys(books).reduce((result, key) => {
      if (books[key].author === authorToFind) {
        result[key] = books[key];
      }
      return result;
    }, {});

    // Check if there are books by the given author
    if (Object.keys(booksByAuthor).length === 0) {
      return res.status(404).json({ message: "No books found for the given author." });
    }

    // Sending the book details as a JSON response
    return res.status(200).json(booksByAuthor);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all books based on title
// public_users.get('/title/:title', function (req, res) {
//   // Retrieve the title from the request parameters
//   const titleToFind = req.params.title;

//   // Filter books based on the title
//   const booksByTitle = Object.keys(books).reduce((result, key) => {
//     if (books[key].title.toLowerCase().includes(titleToFind.toLowerCase())) {
//       result[key] = books[key];
//     }
//     return result;
//   }, {});

//   // Check if there are books with the given title
//   if (Object.keys(booksByTitle).length === 0) {
//     return res.status(404).json({ message: "No books found with the given title." });
//   }

//   // Sending the book details as a JSON response
//   return res.status(200).json(booksByTitle);
// });

public_users.get('/title/:title', async (req, res) => {
  try {
    // Retrieve the title from the request parameters
    const titleToFind = req.params.title;

    // Filter books based on the title
    const booksByTitle = Object.keys(books).reduce((result, key) => {
      if (books[key].title.toLowerCase().includes(titleToFind.toLowerCase())) {
        result[key] = books[key];
      }
      return result;
    }, {});

    // Check if there are books with the given title
    if (Object.keys(booksByTitle).length === 0) {
      return res.status(404).json({ message: "No books found with the given title." });
    }

    // Sending the book details as a JSON response
    return res.status(200).json(booksByTitle);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  // Retrieve the ISBN from the request parameters
  const isbnToFind = req.params.isbn;

  // Find the book with the given ISBN in the 'books' object
  const book = books[isbnToFind];

  // Check if the book with the given ISBN exists
  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }

  // Retrieve the reviews for the book
  const reviews = book.reviews;

  // Sending the book reviews as a JSON response
  return res.status(200).json(reviews);
});

module.exports.general = public_users;
