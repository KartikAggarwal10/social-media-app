import { connectDB } from "../../../lib/mongodb";
export async function POST(req){
    const {userName,email,password} = await req.json();
    const db = await connectDB();
    const ss =db.collection("users").countDocuments()
    await db.collection("users").insertOne({userId:ss,userName,email,password,posts:[],dp:"C:/Users/dell/OneDrive/Desktop/new_socil_medi_pp/my-pp/public/user.png",likes:[],comments:[],followed:[],followers:[],request_sent:[],request_came:[]})
}