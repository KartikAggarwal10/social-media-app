import { connectDB } from "../../../lib/mongodb";
export async function POST(request, { params }){
    const db = await connectDB();
    const {postId,userId,x,comment} = await params;
    if(x==0){
        await db.collection("posts").updateOne({PostId : postId} , {$push:{comments:{comment : comment , user : userId}}})
        await db.collection("users").updateOne({userId : userId} , {$push:{comments:{comment : comment , post : postId}}})
    }
    else{
        await db.collection("posts").updateOne({PostId : postId} , {$pull:{comments:{comment : comment , user : userId}}})
        await db.collection("users").updateOne({userId : userId} , {$pull:{comments:{comment : comment , post : postId}}})
    }
    return Response.json({ result: true });
}