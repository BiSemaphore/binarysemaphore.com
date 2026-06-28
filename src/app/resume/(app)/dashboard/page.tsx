import { redirect } from "next/navigation";

// The dashboard was merged into the home hub. Keep this path working.
export default function DashboardRedirectPage() {
  redirect("/");
}
