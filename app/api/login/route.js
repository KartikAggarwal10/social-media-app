import { connectDB } from "../../../lib/mongodb";

export async function GET(req) {
    try {
        const db = await connectDB();

        const url = new URL(req.url);

        const email = url.searchParams.get("email") || "";
        const password = url.searchParams.get("password") || "";

        const user = await db.collection("users").findOne({
            email: email,
            password: password
        });

        if (user) {
            return Response.json({
                success: true,
                id: user.userId
            });
        }

        return Response.json({
            success: false,
            error: "Invalid email or password"
        }, { status: 401 });

    } catch (error) {
        console.error("Login error:", error);

        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}