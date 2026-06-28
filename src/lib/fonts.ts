import { Figtree } from "next/font/google";

/**
 * Figtree powers the resume product's chrome (the resumex clone). Shared so the
 * (app) layout and the editor layout load one instance.
 */
export const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
