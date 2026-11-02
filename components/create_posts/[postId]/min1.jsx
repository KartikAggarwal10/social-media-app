import CreatePost from "../CreatePost";

export async function Min({ params }){
    const { postId } = await params;
    const simRes = await fetch(`/api/give_prticulr_post/${postId}`);
    if (!simRes.ok) {
      throw new Error("Similarity API failed");
    }
    const { dt } = await simRes.json();
    const renamed = Object.fromEntries(
  Object.entries(dt).map(([key, value]) => [
    key === "categories" ? "category" : key,
    value
  ])
);
    return (
        <CreatePost data = {dt} />
    )
}