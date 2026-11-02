import { connectDB } from "../../../../lib/mongodb";
export async function GET(request, { params }){
    const db = await connectDB();
    const {postId} = await params;
    const res = await db.collection("posts").findOne({postId: parseInt(postId, 10)})
    return Response.json({dt : res})
}