const MAX_FILE_SIZE = 50 * 1024 * 1024;

const uploadEndpoint =
  "https://script.google.com/macros/s/AKfycbwAE5I4RhEhhHBtA93ELRyFvB8sRIHMX_nppYcsT9qaT3kBkNn6y8rcBln2T7l_xgR17g/exec";

const form = document.querySelector('#uploadForm');
const dropZone = document.querySelector('#dropZone');
const fileInput = document.querySelector('#fileInput');
const filePanel = document.querySelector('#filePanel');
const fileList = document.querySelector('#fileList');
const clearFilesButton = document.querySelector('#clearFiles');
const uploadButton = document.querySelector('#uploadButton');
const progressWrap = document.querySelector('#progressWrap');
const progressFill = document.querySelector('#progressFill');
const progressPercent = document.querySelector('#progressPercent');
const progressLabel = document.querySelector('#progressLabel');
const statusMessage = document.querySelector('#statusMessage');
const qrImage = document.querySelector('#qrImage');
const siteUrlLabel = document.querySelector('#siteUrl');
const downloadQrButton = document.querySelector('#downloadQr');

let selectedFiles = [];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function setStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `message ${type}`.trim();
}

function setProgress(value, label = 'Upload u toku...') {
  const percentage = Math.round(value);

  progressWrap.hidden = false;
  progressFill.style.width = `${percentage}%`;
  progressPercent.textContent = `${percentage}%`;
  progressLabel.textContent = label;
}

function renderFiles() {
  fileList.innerHTML = '';

  filePanel.hidden = selectedFiles.length === 0;
  uploadButton.disabled = selectedFiles.length === 0;

  selectedFiles.forEach((file) => {
    const li = document.createElement('li');
    li.textContent = `${file.name} (${formatBytes(file.size)})`;
    fileList.appendChild(li);
  });
}

function addFiles(files) {
  const newFiles = Array.from(files);

  for (const file of newFiles) {
    if (file.size > MAX_FILE_SIZE) {
      setStatus(
        `${file.name} je veći od 50 MB.`,
        'error'
      );
      return;
    }
  }

  selectedFiles.push(...newFiles);
  renderFiles();

  if (selectedFiles.length) {
    setStatus('Fajlovi spremni za upload.', 'success');
  }
}

async function uploadFiles() {
  if (!selectedFiles.length) return;

  uploadButton.disabled = true;

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      setProgress(
        (i / selectedFiles.length) * 100,
        `Upload: ${file.name}`
      );

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result.split(',')[1]);
        };

        reader.onerror = () => {
  reject(new Error('Greška pri čitanju fajla: ' + file.name));
};

        reader.readAsDataURL(file);
      });

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          file: base64
        })
      });

      const text = await response.text();

      console.log('SERVER ODGOVOR:', text);

      setStatus('Server odgovorio: ' + text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        throw new Error('Server nije vratio JSON: ' + text);
      }

      if (!result.success) {
        throw new Error(
          result.message ||
          result.error ||
          'Nepoznata greška servera'
        );
      }
    }

    setProgress(100, 'Upload završen');

    setStatus(
      'Hvala! Vaše uspomene su uspješno uploadovane ❤️',
      'success'
    );

    selectedFiles = [];
    fileInput.value = '';
    renderFiles();

  } catch (err) {
    console.error(err);

    setStatus(
      'GREŠKA: ' + err.toString(),
      'error'
    );
  }

  uploadButton.disabled = false;
}

function setupQrCode() {
  const siteUrl =
    window.location.href.split('#')[0];

  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(siteUrl)}`;

  qrImage.src = qrUrl;

  if (siteUrlLabel) {
    siteUrlLabel.textContent = siteUrl;
  }

  if (downloadQrButton) {
    downloadQrButton.addEventListener('click', () => {
      window.open(qrUrl, '_blank');
    });
  }
}

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
  });
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  addFiles(event.dataTransfer.files);
});

fileInput.addEventListener('change', (event) => {
  addFiles(event.target.files);
});

clearFilesButton.addEventListener('click', () => {
  selectedFiles = [];
  fileInput.value = '';
  renderFiles();
  setStatus('');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  uploadFiles();
});

setupQrCode();
