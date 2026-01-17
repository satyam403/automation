import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import Airtable from "airtable"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: '500mb' }));  // JSON ke liye
app.use(express.urlencoded({ 
  limit: '500mb', 
  extended: true 
}));
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'

//routes declaration

app.use("/api/v1/users", userRouter)


export { app }