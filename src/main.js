import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const loading = document.getElementById("loading");

let provider, ethersProvider;

async function connectWallet() {
  loading.style.display = "block";
  connectBtn.disabled = true;

  provider = await EthereumProvider.init({
    projectId: "84e8498a4e08cafe1acaf08369fd7a56",
    chains: [1, 56, 137],
    showQrModal: true,
  });

  await provider.enable();
  ethersProvider = new ethers.BrowserProvider(provider);

  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  const balance = await ethersProvider.getBalance(address);

  walletAddress.textContent = address;
  walletBalance.textContent = ethers.formatEther(balance);

  walletDetails.style.display = "block";
  loading.style.display = "none";
  localStorage.setItem("wallet_connected", "1");
}

function disconnectWallet() {
  if (provider) provider.disconnect();
  localStorage.removeItem("wallet_connected");
  walletDetails.style.display = "none";
  connectBtn.disabled = false;
}

connectBtn.addEventListener("click", connectWallet);
disconnectBtn.addEventListener("click", disconnectWallet);

// Auto-reconnect on reload
if (localStorage.getItem("wallet_connected") === "1") {
  connectWallet();
}
