import Chat from "../../../components/Chat";

export default async function Page({ params }) {
  const { receiverId } = await params;

  return <Chat receiverId={receiverId} />;
}