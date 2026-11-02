export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "An image file is required" }, { status: 400 });
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", process.env.CLOUDINARY_PRESET || "");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/da2gzc7uc/image/upload",
      { method: "POST", body: uploadData }
    );
    const result = await response.json();

    const secureUrl =
      typeof result?.secure_url === "string" ? result.secure_url : "";

    if (!response.ok || !secureUrl) {
      return Response.json(
        { error: result.error?.message || "Image upload failed" },
        { status: response.status || 502 }
      );
    }

    return Response.json({ secure_url: secureUrl });
  } catch (error) {
    console.error("Image upload error:", error);
    return Response.json({ error: "Image upload failed" }, { status: 500 });
  }
}
