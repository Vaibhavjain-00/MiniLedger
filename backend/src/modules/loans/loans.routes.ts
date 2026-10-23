import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";
import { createLoan,deleteLoan,listLoans,repayLoan } from "./loans.repository";
const router=Router(); router.use(requireAuth);
const schema=z.object({friendName:z.string().trim().min(1).max(100),amount:z.union([z.string(),z.number()]).transform(String).refine(v=>/^\d{1,10}(\.\d{1,2})?$/.test(v)&&Number(v)>0,"Amount must be positive with at most two decimal places"),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"dueDate must use YYYY-MM-DD")});
function apiLoan(r:any){return {id:r.id,friendName:r.friend_name,amount:r.amount,dueDate:r.due_date,status:r.status,createdAt:r.created_at,repaidAt:r.repaid_at,receiptUrl:r.receipt_url};}
router.get("/",asyncHandler(async(req,res)=>res.json({success:true,loans:(await listLoans(req.auth!.userId)).map(apiLoan)})));
router.post("/",asyncHandler(async(req,res)=>{const p=schema.safeParse(req.body);if(!p.success)throw new HttpError(400,p.error.issues[0]?.message||"Invalid input");const d=new Date(`${p.data.dueDate}T00:00:00Z`);if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==p.data.dueDate)throw new HttpError(400,"Invalid due date");const r=await createLoan(req.auth!.userId,p.data.friendName,p.data.amount,p.data.dueDate);res.status(201).json({success:true,loan:apiLoan(r)});}));
router.patch("/:id/repay",asyncHandler(async(req,res)=>{const p=z.string().uuid().safeParse(req.params.id);if(!p.success)throw new HttpError(400,"Invalid loan ID");const r=await repayLoan(req.auth!.userId,p.data);if(!r)throw new HttpError(404,"Pending loan not found");res.json({success:true,loan:apiLoan(r)});}));
router.delete("/:id",asyncHandler(async(req,res)=>{const p=z.string().uuid().safeParse(req.params.id);if(!p.success)throw new HttpError(400,"Invalid loan ID");if(!await deleteLoan(req.auth!.userId,p.data))throw new HttpError(404,"Loan not found");res.status(204).send();}));
export default router;
