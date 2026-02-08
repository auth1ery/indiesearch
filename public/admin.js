const loginDiv = document.getElementById('loginDiv');
const panel = document.getElementById('panel');
const loginBtn = document.getElementById('loginBtn');
const loginMsg = document.getElementById('loginMsg');
const pendingList = document.getElementById('pendingList');
const indexedList = document.getElementById('indexedList');
const pendingTab = document.getElementById('pendingTab');
const indexedTab = document.getElementById('indexedTab');

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
    loadIndexed();
  } else {
    loginMsg.style.color = 'red';
    loginMsg.textContent = 'wrong password! boo hoo';
  }
});

function showTab(tab) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'pending') {
    tabs[0].classList.add('active');
    pendingTab.classList.remove('hidden');
    indexedTab.classList.add('hidden');
  } else {
    tabs[1].classList.add('active');
    pendingTab.classList.add('hidden');
    indexedTab.classList.remove('hidden');
  }
}

async function loadPending() {
  if (!authenticated) return;
  const pending = await (await fetch('/pending.json')).json();
  pendingList.innerHTML = '';
  
  if (pending.length === 0) {
    pendingList.innerHTML = '<li>no pending submissions! all clear.</li>';
    return;
  }
  
  pending.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${item.url}" target="_blank">${item.url}</a><br>
      <small>${item.description || 'no description'}</small><br>
      <button onclick="approve(${i})">approve</button>
      <button class="deny" onclick="deny(${i})">deny</button>
    `;
    pendingList.appendChild(li);
  });
}

async function loadIndexed() {
  if (!authenticated) return;
  const indexed = await (await fetch('/index.json')).json();
  indexedList.innerHTML = '';
  
  if (indexed.length === 0) {
    indexedList.innerHTML = '<li>no indexed sites yet!</li>';
    return;
  }
  
  indexed.forEach((item, i) => {
    const li = document.createElement('li');
    const date = new Date(item.lastScraped).toLocaleDateString();
    li.innerHTML = `
      <a href="${item.url}" target="_blank"><strong>${item.title || item.url}</strong></a><br>
      <small>${item.description || 'no description'}</small><br>
      <small style="color: #999;">indexed: ${date}</small>
    `;
    indexedList.appendChild(li);
  });
}

async function approve(i) {
  await fetch(`/approve/${i}`, { method: 'POST' });
  loadPending();
  loadIndexed();
}

async function deny(i) {
  await fetch(`/deny/${i}`, { method: 'POST' });
  loadPending();
}
