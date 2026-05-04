import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vaults/")({
  component: VaultsComponent
});

function VaultsComponent() {
  return <div>Vaults List</div>;
}
