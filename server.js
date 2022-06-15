const express = require("express");
const res = require("express/lib/response");
const bcrypt = require("bcrypt");
const app = express();

const fs = require("fs");
const jwtSecret = "esto es un secreto"
const jwt = require("jsonwebtoken");
// require("dotenv").config();   // here we use dotenv module which we installed in the begining to access environment variables from .env file
const file = "quotes.json"
const usersFile = "users.json"
const constantNumber = 10;
// AUX FUNCTIONS
function getQuotesFromDatabase() {
  const text = fs.readFileSync(file);
  return JSON.parse(text);
}
function getUsersFromDataBase() {
  const text = fs.readFileSync(usersFile);
  return JSON.parse(text);
}
function saveQuotesToDatabase(quotes) {

  fs.writeFileSync(file, JSON.stringify(quotes, null, 2));

}
function saveUsersToDatabase(users) {

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

}

function generateJWT(userId) {
  // payload is just an object which usually contains some information about user but not confidential information such as password.
  const payload = {
    user: {
      id: userId
    }
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
}

function authenticate(req, res, next) {
  let token = req.header("authorization");


  if (!token) {
    return res.status(403).send({ message: "authorization denied", isAuthenticated: false });
  }

  token = token.split(" ")[1];

  try {
    jwt.verify(token, jwtSecret);

    next();

  } catch (err) {
    res.status(401).send({ message: "Token is not valid", isAuthenticated: false });
  }
};

// FUNCTIONS
const getQuotes = function (req, res) {
  const quotes = getQuotesFromDatabase();
  res.send(quotes)
};
const getCouteById = (req, res) => {
  const quotes = getQuotesFromDatabase();
  const id = Number(req.params.id)

  const quote = quotes.find(qoute => qoute.id === id)
  res.send(quote)

}
const postQuote = (req, res) => {
  const newQoute = req.body;
  const quotes = getQuotesFromDatabase();
  newQoute.id = quotes.length;
  quotes.push(newQoute)
  saveQuotesToDatabase(quotes)

  res.send(newQoute)
}

const updateQuote = (req, res) => {
  const newQoute = req.body;
  const quotes = getQuotesFromDatabase();
  newQoute.id = quotes.length;
  quotes.push(newQoute)
  saveQuotesToDatabase(quotes)

  res.send(newQoute)
}



const deleteQuote = (req, res) => {
  let quotes = getQuotesFromDatabase();
  const id = Number(req.params.quoteId);

  const getQuoteToDelete = quotes.find(quote => id === quote.id);
  quotes = quotes.filter(q => q.id != id);
  saveQuotesToDatabase(quotes)
  res.send(getQuoteToDelete)
}


async function signUp(req, res) {
  const users = getUsersFromDataBase()
  const newUser = req.body
  const id = Number(req.params.id)
  newUser.id = users.length
  const sameUser = users.find((u) => u.userName === newUser.userName);
  if (sameUser) {
    res
      .status(400)
      .json({ message: "user with same userName already exists." });
  } else {
    const ids = users.map((u) => u.id);
    newUser.id = users.length;
    const salt = await bcrypt.genSalt(constantNumber);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    users.push(newUser);

    saveUsersToDatabase(users);
    const jwtToken = generateJWT(newUser.id)
    res.status(201).json({ jwtToken: jwtToken, isAuthenticated: true, id: newUser.id, userName: newUser.userName });
  }
}
// MIDDLEWARES
app.use(express.json())
app.get("/quotes", getQuotes);

app.post("/signup", signUp)
app.get("/quotes/:id", getCouteById);

app.post("/quotes", authenticate, postQuote);

app.put("./quotes", authenticate, updateQuote);
app.delete("/quotes/:quoteId", authenticate, deleteQuote);


// SERVER
const port = 3000;
const url = `http://localhost:${port}/quotes`;
app.listen(port, () => console.log(`Listening on port ${url}`));
