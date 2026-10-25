import InfluenceMap from "@/components/InfluenceMap";
import { mapPins, allArtists, allWorks, allLineages } from "@/lib/data";

export const metadata = { title: "Map — COLLECTIVE" };
export const revalidate = 300;

export default async function MapPage({ searchParams }: { searchParams: Promise<{ work?: string }> }) {
  const { work } = await searchParams;
  const [pins, artists, works, lineages] = await Promise.all([mapPins(), allArtists(), allWorks(), allLineages()]);
  return <InfluenceMap pins={pins} artists={artists} works={works} lineages={lineages} initialWork={work} />;
}
