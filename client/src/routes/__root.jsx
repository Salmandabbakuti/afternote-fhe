import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import SiteLayout from "@/components/SiteLayout";
import Web3Provider from "@/components/Web3Provider";

const RootLayout = () => (
  <>
    <Web3Provider>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </Web3Provider>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
