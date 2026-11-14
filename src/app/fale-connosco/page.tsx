import FaleConnoscoContent from "./FaleConnoscoContent";
import { getContactos } from "@/lib/conteudos";

export const revalidate = 3600;

export default async function FaleConnoscoPage() {
  return <FaleConnoscoContent contactos={await getContactos()} />;
}
