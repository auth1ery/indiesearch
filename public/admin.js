const loginDiv = document.getElementById('loginDiv');
const panel = document.getElementById('panel');
const loginBtn = document.getElementById('loginBtn');
const loginMsg = document.getElementById('loginMsg');
const pendingList = document.getElementById('pendingList');

let authenticated = false;

loginBtn.addEventListener('click', async () => {
  const password = document.getElementById('password').value;
  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (data.success) {
    authenticated = true;
    loginDiv.classList.add('hidden');
    panel.classList.remove('hidden');
    loadPending();
  } else {
    loginMsg.textContent = 'wrong password! boo hoo';
  }
});

async function loadPending() {
  if (!authenticated) return;
  const pending = await (await fetch('/pending.json')).json();
  pendingList.innerHTML = '';
  pending.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${item.url}" target="_blank">${item.url}</a> — ${item.description}
      <button onclick="approve(${i})">Approve</button>
      <button onclick="deny(${i})">Deny</button>
    `;
    pendingList.appendChild(li);
  });
}

async function approve(i) {
  await fetch(`/approve/${i}`, { method: 'POST' });
  loadPending();
}
async function deny(i) {
  await fetch(`/deny/${i}`, { method: 'POST' });
  loadPending();
}
