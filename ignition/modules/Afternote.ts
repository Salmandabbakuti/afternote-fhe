import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AfternoteModule", (m) => {
  const afternote = m.contract("Afternote");
  return { afternote };
});
