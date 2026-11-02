import { Min } from "../../../components/Postprticlur/min3";

export default async function Page({ params }) {
    const { post_id } = await params;

    return <Min post_id={post_id} />;
}