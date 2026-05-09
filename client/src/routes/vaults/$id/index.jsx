import { createFileRoute } from "@tanstack/react-router";
import VaultDetailsPage from "@/pages/VaultDetails";

export const Route = createFileRoute("/vaults/$id/")({
  component: VaultDetailsPage
});
