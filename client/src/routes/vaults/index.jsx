import { createFileRoute } from "@tanstack/react-router";
import VaultsPage from "@/pages/Vaults";

export const Route = createFileRoute("/vaults/")({
  component: VaultsPage
});
