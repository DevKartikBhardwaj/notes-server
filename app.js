const express = require("express");
const app = express();
const PORT = process.env.BACKEND_PORT | 5000;
const cookies = require("cookie-parser");
app.use(cookies());
app.use(express.json());

require("dotenv").config();
require("./database/conn");

//All the Routes are listed below
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");

app.use(userRoutes);
app.use(noteRoutes);

app.listen(PORT, () => {
  console.log(`Backend is running at ${PORT}`);
});
