"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import "./createpost.css";
import { saveDraftAction, publishPostAction } from "../../app/actions/posts";

import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor…</p>,
});
// required :- postId,content,title,category,tags,cover

export default function CreatePost({ data }) {
  const quillRef = useRef(null);
  const [title, setTitle] = useState(data?.title || "");
  const [content, setContent] = useState(data?.content || "");
  const [category, setCategory] = useState(data?.category || "");
  const [tags, setTags] = useState(Array.isArray(data?.tags) ? data.tags : []);
  const [cover, setCover] = useState(data?.cover || "");
  const [saving, setSaving] = useState(false);
  const [status, setstatus] = useState("");
  const [FoundImages, setFoundImages] = useState(null);
  const [AiResponse, setAiResponse] = useState("");
  const [userPrompt, setuserPrompt] = useState("");
  const [searchTerm, setsearchTerm] = useState("");
  const [ailoading, setAiLoading] = useState(false);

  async function drft() {
    setSaving(true);
    setstatus("");
    try {
      await saveDraftAction({ postId: data.postId, content, title, category, tags, cover });
      setstatus("Draft saved");
    } catch (err) {
      setstatus(`Draft save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }
const handleAiGenerate = async () => {
  if (!userPrompt.trim()) {
    setAiResponse("Tell me what you want help with first.");
    return;
  }
  setAiLoading(true);
  setAiResponse("");

  try {
    const response = await fetch("/api/chat_bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: userPrompt,
            metadata: {
              prompt: `Title: ${title} | Category: ${category} | Content snippet: ${content.slice(
                0,
                300
              )}`,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "AI request failed");
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setAiResponse((prev) => prev + decoder.decode(value, { stream: true }));
    }

    const remaining = decoder.decode();
    if (remaining) setAiResponse((prev) => prev + remaining);

  } catch (err) {
    console.error("AI error:", err);
    setAiResponse("AI Error: " + err.message);
  } finally {
    setAiLoading(false);
  }
};

  const handleSearchImages = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat_bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "find_images",
          imageQuery: searchTerm || title || "nature",
        }),
      });
      const data = await res.json();
      setFoundImages(data.images || []);
      console.log(data.images);
    } catch (err) {
      console.error("Failed to fetch images", err);
    } finally {
      setAiLoading(false);
    }
  };

  async function Save() {
    setSaving(true);
    setstatus("");
    try {
      await publishPostAction({ postId: data.postId, content, title, category, tags, cover });
      setstatus("Published");
    } catch (err) {
      setstatus(`Publish failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }
  const postCoverHandler = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload_image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok || !result.secure_url) throw new Error(result.error?.message || "Upload failed");
      setCover(result.secure_url);
    } catch (err) {
      console.error(err);
      setstatus(`Cover upload failed: ${err.message}`);
    }
  }
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/upload_image", { method: "POST", body: fd });

        const data = await res.json();
        if (!res.ok || !data.secure_url) {
          throw new Error(data.error || "Image upload failed");
        }

        const quill = quillRef.current?.getEditor?.();
        if (!quill) return;
        const range = quill.getSelection();

        quill.insertEmbed(
          range ? range.index : 0,
          "image",
          data.secure_url
        );
      } catch (err) {
        console.error(err);
        alert("Image upload failed");
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        [{ align: [] }],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <h1>Create New Post</h1>
          <p>Write your content beautifully</p>
        </div>
        <div className="save">{saving ? "Saving..." : status || "Ready"}</div>
      </header>

      <div className="layout">
        <div className="editorSide">
          <input
            className="title"
            placeholder="Write title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className="editor"
          />
        </div>

        <div className="sidebar">
          {/* Status card with category datalist — renamed h3 to Category */}
          <div className="card">
            <h3>Category</h3>
            <input
              placeholder="Search or enter category..."
              list="category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent border border-white/10 rounded-xl p-3 focus:outline-none focus:border-violet-500"
            />
            <datalist id="category-options">
              <option value="Technology" />
              <option value="Programming" />
              <option value="AI" />
              <option value="Business" />
              <option value="Finance" />
              <option value="Lifestyle" />
              <option value="Entertainment" />
              <option value="Health" />
            </datalist>
          </div>

          <div className="card">
            <h3>Tags</h3>
            <input
              placeholder="react,nextjs"
              onBlur={(e) => {
                setTags(e.target.value.split(","));
              }}
            />
            <div className="tagBox">
              {tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Cover Image</h3>
            <input type="file" accept="image/*" onChange={(e) => postCoverHandler(e.target.files[0])} />
            {cover && <p>{typeof cover === "string" ? cover : cover.name}</p>}

            <input
              type="text"
              placeholder="Ask AI something..."
              onChange={(e) => setuserPrompt(e.target.value)}
            />
            <button type="button" onClick={handleAiGenerate} disabled={ailoading}>
              {ailoading ? "Generating..." : "Generate with AI"}
            </button>
            {AiResponse && (
              <div className="card" style={{ marginTop: "10px" }}>
                <h3>AI Response</h3>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#333",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {AiResponse}
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Search images..."
              onChange={(e) => setsearchTerm(e.target.value)}
            />
            <button type="button" onClick={handleSearchImages} disabled={ailoading}>
              {ailoading ? <div>loading result</div> : <div>search data</div>}
            </button>
            {FoundImages && FoundImages.length > 0 && (
              <div className="card" style={{ marginTop: "10px" }}>
                <h3>Search Results</h3>
                <p style={{ fontSize: "12px", color: "gray", marginBottom: "10px" }}>
                  Click an image to insert into editor. Long-press / right-click to set as cover.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                  }}
                >
                  {FoundImages.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={`result-${i}`}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: "2px solid transparent",
                        transition: "border 0.2s",
                      }}
                      onClick={() => {
                        const quill = quillRef.current?.getEditor?.();
                        if (!quill) return;
                        const range = quill.getSelection();
                        quill.insertEmbed(
                          range ? range.index : quill.getLength() - 1,
                          "image",
                          img.url
                        );
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCover(img.url);
                        alert("Image set as cover!");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="publish secondary" onClick={drft} disabled={saving}>
            Save draft
          </button>
          <button className="publish" onClick={Save} disabled={saving}>
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
