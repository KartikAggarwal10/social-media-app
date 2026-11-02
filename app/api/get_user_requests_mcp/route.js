import { connectDB } from "../../../lib/mongodb";

export async function GET(request) {
    try {
        const db = await connectDB();

        const { searchParams } = new URL(request.url);

        const user_id = searchParams.get("user");

        if (!user_id) {
            return Response.json(
                {
                    success: false,
                    error: "User ID is required"
                },
                { status: 400 }
            );
        }

        const requests = await db.collection("users").findOne(
            { userId: user_id },
            {
                projection: {
                    request_came: 1,
                    _id: 0
                }
            }
        );

        return Response.json({
            success: true,
            result: requests
        });

    } catch (error) {
        console.error("get_user_requests_mcp error:", error);

        return Response.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}