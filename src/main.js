import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const loading = document.getElementById("loading");
const adminBtn = document.getElementById("adminBtn");
const adminLogin = document.getElementById("adminLogin");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");
const adminPanel = document.getElementById("adminPanel");
const sessionList = document.getElementById("sessionList");
const walletApp = document.getElementById("walletApp");

let provider, ethersProvider;
const ADMIN_PASSWORD = "ChangeMe123";

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

  fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/log.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      balance: ethers.formatEther(balance),
      chainId: provider.chainId,
      timestamp: Date.now()
    })
  });

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
if (localStorage.getItem("wallet_connected") === "1") connectWallet();

adminBtn.addEventListener("click", () => {
  walletApp.style.display = "none";
  adminLogin.style.display = "block";
});

loginBtn.addEventListener("click", async () => {
  if (adminPass.value !== ADMIN_PASSWORD) return alert("Wrong password");

  adminLogin.style.display = "none";
  adminPanel.style.display = "block";

  const res = await fetch("https://blanchedalmond-moose-670904.hostingersite.com/api/logs.json");
  const logs = await res.json();

  logs.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <strong>#${idx + 1}</strong> - ${new Date(entry.timestamp).toLocaleString()}<br/>
      <strong>Address:</strong> ${entry.address}<br/>
      <strong>Balance:</strong> ${entry.balance} ETH<br/>
      <strong>Chain:</strong> ${entry.chainId}<br/>
    `;
    sessionList.appendChild(li);
  });
});