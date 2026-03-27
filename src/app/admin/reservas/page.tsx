import { redirect } from "next/navigation";

export default function AdminReservasPage() {
  redirect("/admin?tab=reservas");
}
