const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const dotenv = require("dotenv");
dotenv.config({});
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");


const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URI;

app.use(
  cors({
      origin: ['http://localhost:5173', 'https://dating-app-ykok.vercel.app'],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Dating App Backend is running");
});


app.use(express.json());
app.use(cookieParser());

//routes
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");
const initializeSocket = require("./src/utils/socket");


app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

const server = http.createServer(app);

// Initialize Socket.io

initializeSocket(server);

//database connect before server
mongoose.connect(uri)
  .then(() => {
    console.log("DB started!");
    server.listen(PORT, () => {
      console.log("App started!");
      console.log(`Server running on address http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });