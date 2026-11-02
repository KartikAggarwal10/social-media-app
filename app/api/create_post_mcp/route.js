import { createPostAction, publishPostAction } from "../../actions/posts";

export async function POST(request) {
    try {
        const {
            user_id,
            title,
            content,
            author,
            tags,
            category,
            cover,
            published
        } = await request.json();

        console.log(
            "came",
            user_id,
            title,
            content,
            tags,
            category,
            cover
        );

        const data = await createPostAction(user_id, title);

        console.log("came2", data);

        await publishPostAction(
            data.postId,
            content,
            title,
            category,
            tags,
            cover
        );

        console.log("came3 finished");

        return Response.json({
            success: true,
            postId: data.postId
        });

    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}