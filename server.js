import app from "./app.js";
import connectionToDB from "./config/dbConnection.js";

const port = process.env.PORT || 5000;

app.listen(port, async() => {
    await connectionToDB();
    console.log(`Server is running on port ${port}`);
});