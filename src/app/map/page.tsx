import InfluenceMap from "@/components/InfluenceMap";
import { mapPins, allArtists, allWorks, allLineages, allArtistInfluences } from "@/lib/data";

export const metadata = { title: "Map — COLLECTIVE" };
export const revalidate = 300;

export default async function MapPage({ searchParams }: { searchParams: Promise<{ work?: string; artist?: string }> }) {
  const { work, artist } = await searchParams;
  const [pins, artists, works, lineages, influences] = await Promise.all([mapPins(), allArtists(), allWorks(), allLineages(), allArtistInfluences()]);
  return <InfluenceMap pins={pins} artists={artists} works={works} lineages={lineages} influences={influences} initialWork={work} initialArtist={artist} />;
}
