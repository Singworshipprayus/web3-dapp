import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

console.log("✅ JS Loaded");

const connectBtn = document.getElementById("connectBtn");
console.log("Button loaded:", connectBtn);

connectBtn.addEventListener("click", async () => {
  console.log("Button clicked");

  const provider = await EthereumProvider.init({
    projectId: "84e8498a4e08cafe1acaf08369fd7a56", // demo projectId
    chains: [1], // Ethereum mainnet
    showQrModal: true,
  });

  await provider.enable();

  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();

  alert("Connected to wallet: " + address);
});
