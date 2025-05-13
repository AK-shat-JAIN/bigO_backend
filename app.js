import { config } from "dotenv";
config();
import express from "express";
import cors from "cors";
import cokieParser from "cookie-parser";
import morgan from "morgan";
import bodyParser from "body-parser";
import errorMiddleware from "./middlewares/error.middleware.js";

// Import routes
import userRoutes from "./routes/user.routes.js";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(
    {
        origin: [process.env.FRONTEND_URL],
        credentials: true
    }
));
app.use(cokieParser());
app.use(morgan("dev")); // log every request to the console for debugging purposes


app.use('/ping', (req, res) => {
    res.send('pong');
});

//  routes middleware

app.use('/api/v1/user', userRoutes)

// app.all('*', (req, res, next) => {
//     res.status(404).send('OOPS!! 404 page Not Found')
// })

app.use(errorMiddleware);

export default app;