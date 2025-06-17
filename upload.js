const cloudName = 'janisz-vanish';
const uploadPreset = 'wedding';
const backendUrl = 'https://wedding-backend-x2he.onrender.com';

const urlParams = new URLSearchParams(window.location.search);
const secretToken = urlParams.get('token') || '';

const fileInput = document.getElementById('file-input');
const statusText = document.getElementById('status');
const gallery = document.getElementById('gallery');
const pagination = document.getElementById('pagination');

let currentPage = 1;
const photosPerPage = 20;
let allPhotos = [];

function pluralizePhoto(count) {
  if (count === 1) return 'zdjęcie';
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 12 && lastTwo <= 14) return 'zdjęć';
  if (last >= 2 && last <= 4) return 'zdjęcia';
  return 'zdjęć';
}

fileInput.addEventListener('change', async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  if (!secretToken) {
    statusText.innerText = '❌ Brak tokenu dostępu w adresie URL!';
    return;
  }

  statusText.innerText = '⏳ Wysyłanie...';

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'images');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.secure_url) {
        await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-secret': secretToken
          },
          body: JSON.stringify({ url: data.secure_url })
        });
      }
    } catch (err) {
      console.error('Błąd przy wysyłaniu pliku:', err);
    }
  }

  statusText.innerText = `✅ Wysłano ${files.length} ${pluralizePhoto(files.length)}!`;
  setTimeout(() => statusText.innerText = '', 5000);

  fileInput.value = '';
  fetchGallery();
});

async function fetchGallery() {
  try {
    const res = await fetch(backendUrl);
    const urls = await res.json();
    allPhotos = urls;
    currentPage = 1;
    renderGallery();
  } catch (err) {
    console.error('Błąd ładowania galerii:', err);
  }
}

function renderGallery() {
  gallery.innerHTML = '';
  const start = (currentPage - 1) * photosPerPage;
  const end = start + photosPerPage;
  const pagePhotos = allPhotos.slice(start, end);

  pagePhotos.forEach(url => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Zdjęcie weselne';

    link.appendChild(img);
    gallery.appendChild(link);
  });

  renderPagination();
}

function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(allPhotos.length / photosPerPage);

  const prev = document.createElement('button');
  prev.textContent = '⬅️ Poprzednia';
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    currentPage--;
    renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = document.createElement('button');
  next.textContent = 'Następna ➡️';
  next.disabled = currentPage === totalPages;
  next.onclick = () => {
    currentPage++;
    renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` Strona ${currentPage} z ${totalPages} `;
  pageInfo.style.margin = '0 10px';

  pagination.appendChild(prev);
  pagination.appendChild(pageInfo);
  pagination.appendChild(next);
}

window.addEventListener('DOMContentLoaded', fetchGallery);
