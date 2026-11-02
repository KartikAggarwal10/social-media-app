"use client";

import UserDisplay from "../../../components/users_profile";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params.id;
  
  if (!id) return <div>Loading...</div>;

  const numericId = isNaN(Number(id)) ? id : Number(id);

  return <UserDisplay authorId={numericId} />;
}

