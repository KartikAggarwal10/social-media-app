import { connectDB } from "../../../lib/mongodb";
export async function POST(req){
    const {postId,content,title,category,tags,cover} = await req.json()
    const db = await connectDB();
    await db.collection("posts").updateOne({PostId:postId},{$set:{content:content,title:title,category:category,cover:cover,tags:tags}})
    return Response.json({ success: true });
}