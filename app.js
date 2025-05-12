import { config } from 'dotenv';
config();
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
// import errorMiddleware from './middleware/errorMiddleware.js';

//import routes
// import leadRoutes from './routes/leadRoutes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(                //this allows us to make requests from the frontend to the backend
    {
        // origin: 'http://localhost:5173/',  //https://damac.onrender.com
        origin: "https://nimiproject-8sad.onrender.com",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
));    
// const multer  = require('multer');
// const upload = multer();
// app.use(upload.array());
app.use(multer().array());
app.use(morgan('dev'));

app.use('/ping', (req, res) => {
    res.send('pong');
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

//routes
// app.use('/api/v1/lead', leadRoutes);

app.all('*', (req, res, next) => {
    next(new Error(`Can't find ${req.originalUrl} on this server!`));
});

app.use(errorMiddleware);

export default app;