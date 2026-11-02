import { connectDB } from "../../../lib/mongodb";
export async function POST(request, { params }){
    const db = await connectDB();
    const {adminId,userId} = await params;
    await db.collection("users").updateOne({userId : userId},{$pull:{request_sent : adminId},$push:{followed:adminId}})
    await db.collection("users").updateOne({userId : adminId},{$pull:{request_came : userId},$push:{followers:userId}})
    return Response.json({success:true})
}