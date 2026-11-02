"use client";

import { useRouter } from "next/navigation";
import GetTitleModal from "@/components/get_title_for_new_project/get_title";

/**
 * /get_title page – renders the GetTitleModal as a full‑screen page.
 * The modal is always open (`isOpen={true}`) and closing it navigates back
 * to the posts feed.
 */
export default function GetTitlePage() {
  const router = useRouter();

  // Close the modal → go back to the posts page
  const handleClose = () => router.push("/posts");

  return <GetTitleModal isOpen={true} onClose={handleClose} />;
}