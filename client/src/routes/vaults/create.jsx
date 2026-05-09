import { createFileRoute } from "@tanstack/react-router";
import CreateVaultPage from "@/pages/CreateVault";

export const Route = createFileRoute("/vaults/create")({
  component: CreateVaultPage
});
