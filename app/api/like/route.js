import { connectDB } from "../../../lib/mongodb";
export async function POST(request, { params }){
    const db = await connectDB();
    const {postId,userId,x} = await params;
    if(x==0){
        await db.collection("posts").updateOne({PostId : postId} , {$inc:{likes:1}})
        await db.collection("users").updateOne({userId : userId} , {$push:{likes:postId}})
    }
    else{
        await db.collection("posts").updateOne({PostId : postId} , {$dec:{likes:1}})
        await db.collection("users").updateOne({userId : userId} , {$pull:{likes:postId}})
    }
    return Response.json({ result: true });
}