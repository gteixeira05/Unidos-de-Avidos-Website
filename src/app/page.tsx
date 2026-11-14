import HomeContent from "./HomeContent";
import { proximosEventos } from "@/lib/agenda";

// Recalcula de hora a hora para os eventos passados saírem sozinhos.
export const revalidate = 3600;

export default function Home() {
  return <HomeContent eventosFuturos={proximosEventos()} />;
}
