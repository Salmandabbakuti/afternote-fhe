import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import { sepolia, mainnet } from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const metadata = {
  name: "Afternote FHE",
  description: "Afternote FHE",
  url: "https://example.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
};

const networks = [sepolia, mainnet];

createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  metadata,
  allowUnsupportedChain: false,
  defaultNetwork: sepolia,
  themeMode: "dark",
  features: {
    analytics: true
  }
});

export default function Web3Provider({ children }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#667eea",
          colorBgContainer: "#1f1f1f",
          colorText: "#f0f0f0",
          borderRadius: 8,
          colorBgLayout: "#1f1f1f",
          colorBgElevated: "#1f1f1f",
          colorBorder: "rgba(124, 139, 255, 0.25)",
          controlHeight: 32
        },
        components: {
          Layout: {
            headerBg: "transparent",
            footerBg: "transparent",
            bodyBg: "transparent"
          }
        }
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
