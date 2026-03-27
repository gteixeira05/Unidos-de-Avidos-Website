import { redirect } from "next/navigation";

export default function AdminUtilizadoresPage() {
  redirect("/admin?tab=utilizadores");
}
