import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.37"
      },
      production: {
        version: "0.8.37",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  },
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [configVariable("PRIVATE_KEY")]
    }
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY")
    },
  }
});
