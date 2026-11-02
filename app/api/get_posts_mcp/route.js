import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";

export async function GET(req) {
    try {
        const db = await connectDB();

        const { searchParams } = new URL(req.url);

        const limit = parseInt(searchParams.get("limit")) || 10;
        const offset = parseInt(searchParams.get("offset")) || 0;

        const category = searchParams.get("category");
        const author = searchParams.get("author");

        const filter = {
            status: "published"
        };

        if (category) {
            filter.categories = category;
        }

        if (author) {
            filter.userId = author;
        }

        const posts = await db
            .collection("posts")
            .find(filter)
            .sort({ likes: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            success: true,
            data: posts
        });

    } catch (error) {
        console.error("get_posts_mcp error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}