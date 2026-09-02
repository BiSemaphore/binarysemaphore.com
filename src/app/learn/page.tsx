import { redirect } from "next/navigation";
import { learnBase } from "@/lib/learn/paths";

/**
 * Temporary. The books have moved under `/notebooks` so that `learn` can be a
 * platform with more than one section, and the mentorship page that belongs
 * here is the next piece of work. Until then, send people to the library.
 *
 * Deliberately a temporary redirect, not permanent: this URL is about to become
 * a real page and must not be cached as a redirect by anyone.
 */
export default async function LearnIndexPlaceholder() {
  redirect(`${await learnBase()}/notebooks`);
}
