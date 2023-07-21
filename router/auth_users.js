const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Middleware for JSON parsing
regd_users.use(express.json());

const isValid = (username, password) => {
  // Check if both the username and password are defined, not empty strings, and of type string
  const isUsernameValid = typeof username === 'string' && username.trim() !== '';
  const isPasswordValid = typeof password === 'string' && password.trim() !== '';

  // Return true only if both the username and password are valid
  return isUsernameValid && isPasswordValid;
};

const isUsernameTaken = (username) => {
  // Check if the given username is already registered
  return users.some(user => user.username === username);
};

// Register a new user
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username, password)) {
    return res.status(400).json({ message: "Invalid username or password. Both username and password must be non-empty strings." });
  }

  if (isUsernameTaken(username)) {
    return res.status(409).json({ message: "Username already exists. Please choose a different username." });
  }

  // Ensure that the 'users' array is defined before pushing a new user to it
  if (!users) {
    users = [];
  }

  // Add the new user to the 'users' array (simulating user registration)
  users.push({ username, password });

  // Sending a success message as response
  return res.status(201).json({ message: "User registered successfully." });
});

const authenticatedUser = (username, password) => {
  // Write code to check if username and password match the ones we have in records
  return users.some(user => user.username === username && user.password === password);
}

// Login user and generate JWT token
regd_users.post("/login", (req, res) => {
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

// Add or Modify a book review
// regd_users.put("/auth/review/:isbn", (req, res) => {
//   const { isbn } = req.params;
//   const { review } = req.body;

//   if (!review || review.trim() === '') {
//     return res.status(400).json({ message: "Review cannot be empty." });
//   }

//   // Find the book with the given ISBN in the 'books' object
//   const book = books[isbn];

//   if (!book) {
//     return res.status(404).json({ message: "Book not found for the given ISBN." });
//   }

//   // Get the user's username from the JWT token in the request header
//   const token = req.headers.authorization.split(' ')[1]; // Assuming the token is sent in the 'Authorization' header
//   const decodedToken = jwt.verify(token, 'secret_key'); // Replace 'secret_key' with your actual secret key
//   const username = decodedToken.username;

//   // Update or add the review to the book's reviews using the user's username
//   book.reviews[username] = review;

//   // Sending a success message as response
//   return res.status(200).json({ message: "Review added/modified successfully." });
// });
const authMiddleware = (req, res, next) => {
  // Check if the JWT token exists in the request headers
  const token = req.headers.authorization;
  // return res.status(200).json({ message: token });
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'User not logged in' });
  }

  // Extract the token from the 'Bearer ' prefix
  const accessToken = token.slice(7);

  // Verify the token using the secret key
  jwt.verify(accessToken, 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'User not authenticated' });
    }

    // Store the decoded user information in the request object for future use
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

  // Find the book with the given ISBN in the 'books' object
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }

  // Get the user's username from the decoded JWT token stored in req.user
  const username = req.user.username;

  // Update or add the review to the book's reviews using the user's username
  book.reviews[username] = review;

  // Sending a success message as response
  return res.status(200).json({ message: "Review added/modified successfully." });
});


// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;

  if (!review || review.trim() === '') {
    return res.status(400).json({ message: "Review cannot be empty." });
  }

  // Find the book with the given ISBN in the 'books' object
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the given ISBN." });
  }

  // Check if the user is logged in by verifying the JWT token
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "User not logged in." });
  }

  try {
    // Verify the JWT token and get the username
    const decodedToken = jwt.verify(token, 'secret_key'); // Replace 'secret_key' with your actual secret key
    const username = decodedToken.username;

    // Update or add the review to the book's reviews using the user's username
    book.reviews[username] = review;

    // Sending a success message as response
    return res.status(200).json({ message: "Review added/modified successfully." });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.authenticatedUser = authenticatedUser;