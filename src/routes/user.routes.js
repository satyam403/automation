import { Router } from "express";
import { 
 
   
    ETAestimation 
   
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()





router.route("/ETAestimation").get (
    ETAestimation
    )

export default router