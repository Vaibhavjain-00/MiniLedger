import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { getSummary } from "../loans/loans.repository";
const router=Router(); router.get("/",requireAuth,asyncHandler(async(req,res)=>res.json({success:true,summary:await getSummary(req.auth!.userId)}))); export default router;
