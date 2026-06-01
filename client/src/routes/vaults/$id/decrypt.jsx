import { createFileRoute } from "@tanstack/react-router";
import VaultDecryptPage from "@/pages/VaultDecrypt";

export const Route = createFileRoute("/vaults/$id/decrypt")({
  component: VaultDecryptPage
});
