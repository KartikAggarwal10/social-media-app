import { connectDB } from "../../../lib/mongodb";

export async function POST(req){
    console.log("came")
    const {adminId,title} = await req.json();
    const db = await connectDB();
    const ss =await db.collection("posts").countDocuments()
    const date = new Date();
    await db.collection("posts").insertOne({userId:adminId,title,createdAt:date,postId:ss,status:"draft",content:"",categories:"",tags:[],cover:""});
    await db.collection("users").updateOne({userId:adminId},{$push:{posts:ss}})
    return Response.json({ postId : ss });
}