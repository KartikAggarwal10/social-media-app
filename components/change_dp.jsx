"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { changeDp } from "../app/actions/users";
export default function ChangeDpModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  async function handleSaveDp(e) {
    if (e) e.preventDefault();
    setError("");
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    if (userId === null || userId === undefined) {
      setError("User session not found.");
      return;
    }
    setLoading(true);
    try {
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("upload_preset", "collbsphere");
    const res = await fetch(
          "https://api.cloudinary.com/v1_1/da2gzc7uc/image/upload",
          {
            method: "POST",
            body: fd,
          }
        );

        const data = await res.json();
      await changeDp(data.secure_url)
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile picture.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl text-white">
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center gap-3 text-cyan-400 mb-2">
          <Camera size={22} />
          <span className="text-xs uppercase tracking-widest font-semibold">Update Photo</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">Profile Picture</h2>
        <p className="text-sm text-white/60 mt-1 mb-6">
          Upload a new photo to change your display picture.
        </p>

        <form onSubmit={handleSaveDp} className="space-y-6">
          {/* Circular Image Dropzone */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition group"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="mx-auto text-white/40 mb-2 group-hover:text-cyan-400 transition" size={28} />
                  <span className="text-xs text-white/40 group-hover:text-white/70">Click to upload</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 font-semibold shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Save Picture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}