import { connectDB } from "../../../lib/mongodb";

export async function POST(request) {
    try {
        const db = await connectDB();

        const { userId, adminId } = await request.json();

        if (!userId || !adminId) {
            return Response.json(
                {
                    success: false,
                    error: "userId and adminId are required"
                },
                { status: 400 }
            );
        }

        // Remove request from the user who sent it
        // and add adminId to their followed list
        await db.collection("users").updateOne(
            { userId: userId },
            {
                $pull: {
                    request_sent: adminId
                },
                $push: {
                    followed: adminId
                }
            }
        );

        // Remove request from admin's incoming requests
        // and add userId to admin's followers
        await db.collection("users").updateOne(
            { userId: adminId },
            {
                $pull: {
                    request_came: userId
                },
                $push: {
                    followers: userId
                }
            }
        );

        return Response.json({
            success: true,
            message: "Follow request accepted"
        });

    } catch (error) {
        console.error("accept_follow_request_mcp error:", error);

        return Response.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}