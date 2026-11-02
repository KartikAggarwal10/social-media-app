import { connectDB } from "../../../lib/mongodb";
export async function POST(request, { params }){
    const db = await connectDB();
    const {adminId,userId} = await params;
        await db.collection("users").updateOne({userId : userId},{$push:{request_sent : adminId}})
        await db.collection("users").updateOne({userId : adminId},{$push:{request_came : userId}})
        return Response.json({success:true})
}
export async function DELETE(request, { params }){
    const db = await connectDB();
    const {adminId,userId,x} = await params;
    if(x == 1){
        await db.collection("users").updateOne({userId : userId},{$pull:{request_sent : adminId}})
        await db.collection("users").updateOne({userId : adminId},{$pull:{request_came : userId}})
    }
    else{
        await db.collection("users").updateOne({userId : userId},{$pull:{followed : adminId}})
        await db.collection("users").updateOne({userId : adminId},{$pull:{followers : userId}})
    }
    return Response.json({success:true})
}