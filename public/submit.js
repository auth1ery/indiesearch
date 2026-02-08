const showFormBtn = document.getElementById('showFormBtn');
const submitFormDiv = document.getElementById('submitFormDiv');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const siteURL = document.getElementById('siteURL');
const siteDesc = document.getElementById('siteDesc');
const submitMsg = document.getElementById('submitMsg');

showFormBtn.addEventListener('click', () => {
  submitFormDiv.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  submitFormDiv.classList.add('hidden');
  submitMsg.textContent = '';
  siteURL.value = '';
  siteDesc.value = '';
});

submitBtn.addEventListener('click', async () => {
  const url = siteURL.value.trim();
  const description = siteDesc.value.trim();

  if (!url) {
    submitMsg.textContent = 'URL is required!';
    return;
  }

  const res = await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, description })
  });

  const data = await res.json();
  if (data.success) {
    submitMsg.style.color = 'green';
    submitMsg.textContent = 'aubmission sent! awaiting review.';
    siteURL.value = '';
    siteDesc.value = '';
  } else {
    submitMsg.style.color = 'red';
    submitMsg.textContent = 'failed to submit.';
  }
});
