import { Router } from "express";
import { 
 
   
    ETAestimation,
    geofancing 
   
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()





router.route("/ETAestimation").get (
    ETAestimation
    )

    router.route("/geofancing").get (
    geofancing
    )

export default router