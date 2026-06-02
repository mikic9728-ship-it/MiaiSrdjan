const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'mp4', 'mov']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime'
]);
const uploadEndpoint =
  "https://script.google.com/macros/s/AKfycbwAE5I4RhEhhHBtA93ELRyFvB8sRIHMX_nppYcsT9qaT3kBkNn6y8rcBln2T7l_xgR17g/exec";
const siteUrl = window.WEDDING_SITE_URL || window.location.href.split('#')[0];

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
const progressBar = document.querySelector('.progress-bar');
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

function getExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function isValidFile(file) {
  const extension = getExtension(file.name);
  const hasAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
  const hasAllowedMimeType = !file.type || ALLOWED_MIME_TYPES.has(file.type);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return `Format nije podržan: ${file.name}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Fajl je veći od 50MB: ${file.name}`;
  }

  return '';
}

function setStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `message ${type}`.trim();
}

function setProgress(value, label = 'Upload u toku...') {
  const percentage = Math.max(0, Math.min(100, Math.round(value)));
  progressWrap.hidden = false;
  progressFill.style.width = `${percentage}%`;
  progressPercent.textContent = `${percentage}%`;
  progressBar.setAttribute('aria-valuenow', String(percentage));
  progressLabel.textContent = label;
}

function renderFiles() {
  fileList.innerHTML = '';
  filePanel.hidden = selectedFiles.length === 0;
  uploadButton.disabled = selectedFiles.length === 0;

  selectedFiles.forEach((file) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const size = document.createElement('span');

    name.textContent = file.name;
    size.textContent = formatBytes(file.size);
    item.append(name, size);
    fileList.append(item);
  });
}

function addFiles(files) {
  const incomingFiles = Array.from(files);
  const errors = [];
  const validFiles = [];

  incomingFiles.forEach((file) => {
    const error = isValidFile(file);
    if (error) {
      errors.push(error);
    } else {
      validFiles.push(file);
    }
  });

  selectedFiles = [...selectedFiles, ...validFiles];
  renderFiles();

  if (errors.length) {
    setStatus(errors.join(' · '), 'error');
  } else if (validFiles.length) {
    setStatus(`${validFiles.length} fajl(a) spremno za upload.`, 'success');
  }
}

function resetUploadState() {
  selectedFiles = [];
  fileInput.value = '';
  renderFiles();
  setProgress(0, 'Priprema upload-a...');
  progressWrap.hidden = true;
}

async function uploadFiles() {
  if (!uploadEndpoint) {
    setStatus('Upload endpoint nije podešen.', 'error');
    return;
  }

  uploadButton.disabled = true;
  setStatus('Upload je počeo. Molimo ne zatvarajte stranicu.', '');
  setProgress(0);

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      setProgress(
        Math.round((i / selectedFiles.length) * 100),
        `Upload: ${file.name}`
      );

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {
          resolve(reader.result.split(',')[1]);
        };

        reader.onerror = reject;
      });

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          file: base64
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload error');
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

  } catch (error) {
    console.error(error);

    setStatus(
      'Upload nije uspio. Pokušajte ponovo.',
      'error'
    );
  }

  uploadButton.disabled = false;
}

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append('files', file, file.name));

  const xhr = new XMLHttpRequest();
  xhr.open('POST', uploadEndpoint, true);

  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      setProgress((event.loaded / event.total) * 100);
    }
  });

  xhr.addEventListener('load', () => {
    uploadButton.disabled = false;

    if (xhr.status >= 200 && xhr.status < 300) {
      setProgress(100, 'Upload završen');
      setStatus('Hvala! Vaše uspomene su uspješno uploadovane u Mia & Srđan galeriju.', 'success');
      selectedFiles = [];
      fileInput.value = '';
      renderFiles();
      return;
    }

    setStatus('Upload nije uspio. Molimo pokušajte ponovo za nekoliko trenutaka.', 'error');
  });

  xhr.addEventListener('error', () => {
    uploadButton.disabled = false;
    setStatus('Došlo je do mrežne greške tokom upload-a. Provjerite konekciju i pokušajte ponovo.', 'error');
  });

  uploadButton.disabled = true;
  setStatus('Upload je počeo. Molimo ne zatvarajte stranicu.', '');
  setProgress(0);
  xhr.send(formData);
}

function setupQrCode() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=24&data=${encodeURIComponent(siteUrl)}`;
  qrImage.src = qrUrl;
  siteUrlLabel.textContent = siteUrl;

  downloadQrButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'mia-srdjan-wedding-qr.png';
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  });
}

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragover');
  });
});

dropZone.addEventListener('drop', (event) => {
  addFiles(event.dataTransfer.files);
});

fileInput.addEventListener('change', (event) => {
  addFiles(event.target.files);
});

clearFilesButton.addEventListener('click', () => {
  resetUploadState();
  setStatus('Lista fajlova je obrisana.');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  uploadFiles();
});

setupQrCode();
