const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 -- User registration -- POST
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserName = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserName);
  if (dbUser === undefined) {
    if (password.length > 5) {
      const updateUserDetails = `INSERT INTO user (username, name, password, gender, location)
            VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`;
      await db.run(updateUserDetails);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 -- login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserName = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserName);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 -- Change Password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserName = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserName);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (comparePassword === true) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
                UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`;
        await db.run(updatePassword);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
