import { monadTestnet } from "../scaffold.config";
import { hardhat } from "viem/chains";
import { createConfig, http } from "wagmi";

export const config = createConfig({
  chains: [monadTestnet, hardhat],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});
