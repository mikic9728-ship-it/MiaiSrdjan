const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "heic",
  "mp4",
  "mov"
];

const FALLBACK_UPLOAD_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyoKlTayU2QBqCCtOGhXMuLhT7M5tSId9-QXdoRvmNkiRK6KLdtr5VuqE5Yfmc8HxN8/exec";

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const uploadForm = document.querySelector("#uploadForm");
const uploadButton = document.querySelector("#uploadButton");
const clearFilesButton = document.querySelector("#clearFiles");
const fileSummary = document.querySelector("#fileSummary");
const fileCount = document.querySelector("#fileCount");
const totalSize = document.querySelector("#totalSize");
const fileList = document.querySelector("#fileList");
const progressWrap = document.querySelector("#progressWrap");
const progressBar = document.querySelector("#progressBar");
const progressLabel = document.querySelector("#progressLabel");
const progressPercent = document.querySelector("#progressPercent");
const statusMessage = document.querySelector("#statusMessage");
const qrImage = document.querySelector("#qrImage");
const qrUrl = document.querySelector("#qrUrl");

let selectedFiles = [];
let uploadEndpoint = FALLBACK_UPLOAD_ENDPOINT;

init();

function init() {

  setupDragAndDrop();

  setupQrCode();

  fileInput.addEventListener("change", () => {

    addFiles(fileInput.files);

    fileInput.value = "";

  });

  uploadForm.addEventListener(
    "submit",
    handleUpload
  );

  clearFilesButton.addEventListener(
    "click",
    clearSelectedFiles
  );
}

function setupDragAndDrop() {

  ["dragenter", "dragover"].forEach((eventName) => {

    dropZone.addEventListener(eventName, (event) => {

      event.preventDefault();

      dropZone.classList.add("is-dragover");

    });

  });

  ["dragleave", "drop"].forEach((eventName) => {

    dropZone.addEventListener(eventName, (event) => {

      event.preventDefault();

      dropZone.classList.remove("is-dragover");

    });

  });

  dropZone.addEventListener("drop", (event) => {

    addFiles(event.dataTransfer.files);

  });

  dropZone.addEventListener("keydown", (event) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      fileInput.click();

    }
  });
}

function setupQrCode() {

  const pageUrl =
    window.location.href.split("#")[0];

  const qrApiUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=18&data=${encodeURIComponent(pageUrl)}`;

  qrImage.src = qrApiUrl;

  qrUrl.textContent = pageUrl;
}

function addFiles(fileListToAdd) {

  const incomingFiles =
    Array.from(fileListToAdd);

  const validationErrors = [];

  incomingFiles.forEach((file) => {

    const extension =
      getFileExtension(file.name);

    const alreadySelected =
      selectedFiles.some((selectedFile) => {

        return (
          selectedFile.name === file.name &&
          selectedFile.size === file.size
        );

      });

    if (
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {

      validationErrors.push(
        `${file.name}: format nije podržan.`
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {

      validationErrors.push(
        `${file.name}: fajl je veći od 50MB.`
      );

      return;
    }

    if (!alreadySelected) {

      selectedFiles.push(file);

    }
  });

  renderFiles();

  if (validationErrors.length > 0) {

    showStatus(
      validationErrors.join(" "),
      "error"
    );

  } else if (incomingFiles.length > 0) {

    showStatus(
      "Fajlovi su spremni za upload.",
      "success"
    );
  }
}

function renderFiles() {

  fileList.innerHTML = "";

  selectedFiles.forEach((file) => {

    const item =
      document.createElement("li");

    const name =
      document.createElement("span");

    const size =
      document.createElement("span");

    name.className = "file-name";

    name.textContent = file.name;

    size.className = "file-size";

    size.textContent =
      formatBytes(file.size);

    item.append(name, size);

    fileList.appendChild(item);
  });

  const filesLength =
    selectedFiles.length;

  const selectedTotalSize =
    selectedFiles.reduce(
      (total, file) =>
        total + file.size,
      0
    );

  fileSummary.hidden =
    filesLength === 0;

  uploadButton.disabled =
    filesLength === 0;

  fileCount.textContent =
    `${filesLength} ${getFileWord(filesLength)}`;

  totalSize.textContent =
    `${formatBytes(selectedTotalSize)} ukupno`;
}

async function handleUpload(event) {

  event.preventDefault();

  if (selectedFiles.length === 0) {

    showStatus(
      "Prvo izaberite fajlove.",
      "error"
    );

    return;
  }

  uploadButton.disabled = true;

  progressWrap.hidden = false;

  try {

    for (
      let i = 0;
      i < selectedFiles.length;
      i++
    ) {

      const file = selectedFiles[i];

      updateProgress(
        Math.round(
          (i / selectedFiles.length) * 100
        ),
        `Upload: ${file.name}`
      );

      const base64 =
        await toBase64(file);

      const response = await fetch(
        uploadEndpoint,
        {
          method: "POST",

          body: JSON.stringify({
            name: file.name,
            type: file.type,
            file: base64.split(",")[1]
          })
        }
      );

      const result =
        await response.json();

      if (!result.success) {

        throw new Error(
          result.message
        );
      }
    }

    updateProgress(
      100,
      "Upload završen"
    );

    showStatus(
      "Hvala! Vaše uspomene su uspješno uploadovane ❤️",
      "success"
    );

    clearSelectedFiles({
      keepStatus: true
    });

  } catch (error) {

    console.error(error);

    showStatus(
      "Upload nije uspio. Pokušajte ponovo.",
      "error"
    );
  }

  uploadButton.disabled = false;
}

function clearSelectedFiles(
  options = {}
) {

  selectedFiles = [];

  renderFiles();

  if (!options.keepStatus) {

    showStatus("", "");

    progressWrap.hidden = true;

    updateProgress(
      0,
      "Priprema upload-a..."
    );
  }
}

function showStatus(message, type) {

  statusMessage.textContent = message;

  statusMessage.className =
    `status-message ${type || ""}`.trim();
}

function updateProgress(
  percent,
  label
) {

  progressBar.style.width =
    `${percent}%`;

  progressPercent.textContent =
    `${percent}%`;

  progressLabel.textContent =
    label;
}

function getFileExtension(fileName) {

  return fileName
    .split(".")
    .pop()
    .toLowerCase();
}

function getFileWord(count) {

  if (count === 1) {
    return "fajl";
  }

  if (count >= 2 && count <= 4) {
    return "fajla";
  }

  return "fajlova";
}

function formatBytes(bytes) {

  if (bytes === 0) {
    return "0 MB";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const exponent = Math.min(
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    bytes / 1024 ** exponent;

  return `${value.toFixed(
    value >= 10 || exponent === 0
      ? 0
      : 1
  )} ${units[exponent]}`;
}

function toBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = reject;

    }
  );
}function init() {

  setupDragAndDrop();

  setupQrCode();

  fileInput.addEventListener("change", () => {

    addFiles(fileInput.files);

    fileInput.value = "";

  });

  uploadForm.addEventListener(
    "submit",
    handleUpload
  );

  clearFilesButton.addEventListener(
    "click",
    clearSelectedFiles
  );
}

function setupDragAndDrop() {

  ["dragenter", "dragover"].forEach((eventName) => {

    dropZone.addEventListener(eventName, (event) => {

      event.preventDefault();

      dropZone.classList.add("is-dragover");

    });

  });

  ["dragleave", "drop"].forEach((eventName) => {

    dropZone.addEventListener(eventName, (event) => {

      event.preventDefault();

      dropZone.classList.remove("is-dragover");

    });

  });

  dropZone.addEventListener("drop", (event) => {

    addFiles(event.dataTransfer.files);

  });

  dropZone.addEventListener("keydown", (event) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      fileInput.click();

    }
  });
}

function setupQrCode() {

  const pageUrl =
    window.location.href.split("#")[0];

  const qrApiUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=18&data=${encodeURIComponent(pageUrl)}`;

  qrImage.src = qrApiUrl;

  qrUrl.textContent = pageUrl;
}

function addFiles(fileListToAdd) {

  const incomingFiles =
    Array.from(fileListToAdd);

  const validationErrors = [];

  incomingFiles.forEach((file) => {

    const extension =
      getFileExtension(file.name);

    const alreadySelected =
      selectedFiles.some((selectedFile) => {

        return (
          selectedFile.name === file.name &&
          selectedFile.size === file.size
        );

      });

    if (
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {

      validationErrors.push(
        `${file.name}: format nije podržan.`
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {

      validationErrors.push(
        `${file.name}: fajl je veći od 50MB.`
      );

      return;
    }

    if (!alreadySelected) {

      selectedFiles.push(file);

    }
  });

  renderFiles();

  if (validationErrors.length > 0) {

    showStatus(
      validationErrors.join(" "),
      "error"
    );

  } else if (incomingFiles.length > 0) {

    showStatus(
      "Fajlovi su spremni za upload.",
      "success"
    );
  }
}

function renderFiles() {

  fileList.innerHTML = "";

  selectedFiles.forEach((file) => {

    const item =
      document.createElement("li");

    const name =
      document.createElement("span");

    const size =
      document.createElement("span");

    name.className = "file-name";

    name.textContent = file.name;

    size.className = "file-size";

    size.textContent =
      formatBytes(file.size);

    item.append(name, size);

    fileList.appendChild(item);
  });

  const filesLength =
    selectedFiles.length;

  const selectedTotalSize =
    selectedFiles.reduce(
      (total, file) =>
        total + file.size,
      0
    );

  fileSummary.hidden =
    filesLength === 0;

  uploadButton.disabled =
    filesLength === 0;

  fileCount.textContent =
    `${filesLength} ${getFileWord(filesLength)}`;

  totalSize.textContent =
    `${formatBytes(selectedTotalSize)} ukupno`;
}

async function handleUpload(event) {

  event.preventDefault();

  if (selectedFiles.length === 0) {

    showStatus(
      "Prvo izaberite fajlove.",
      "error"
    );

    return;
  }

  uploadButton.disabled = true;

  progressWrap.hidden = false;

  try {

    for (
      let i = 0;
      i < selectedFiles.length;
      i++
    ) {

      const file = selectedFiles[i];

      updateProgress(
        Math.round(
          (i / selectedFiles.length) * 100
        ),
        `Upload: ${file.name}`
      );

      const base64 =
        await toBase64(file);

      const response = await fetch(
  uploadEndpoint,
  {
    method: "POST",

    body: JSON.stringify({
      name: file.name,
      type: file.type,
      file: base64.split(",")[1]
    })
  }
);

      const result =
        await response.json();

      if (!result.success) {

        throw new Error(
          result.message
        );
      }
    }

    updateProgress(
      100,
      "Upload završen"
    );

    showStatus(
      "Hvala! Vaše uspomene su uspješno uploadovane ❤️",
      "success"
    );

    clearSelectedFiles({
      keepStatus: true
    });

  } catch (error) {

    console.error(error);

    showStatus(
      "Upload nije uspio. Pokušajte ponovo.",
      "error"
    );
  }

  uploadButton.disabled = false;
}

function clearSelectedFiles(
  options = {}
) {

  selectedFiles = [];

  renderFiles();

  if (!options.keepStatus) {

    showStatus("", "");

    progressWrap.hidden = true;

    updateProgress(
      0,
      "Priprema upload-a..."
    );
  }
}

function showStatus(message, type) {

  statusMessage.textContent = message;

  statusMessage.className =
    `status-message ${type || ""}`.trim();
}

function updateProgress(
  percent,
  label
) {

  progressBar.style.width =
    `${percent}%`;

  progressPercent.textContent =
    `${percent}%`;

  progressLabel.textContent =
    label;
}

function getFileExtension(fileName) {

  return fileName
    .split(".")
    .pop()
    .toLowerCase();
}

function getFileWord(count) {

  if (count === 1) {
    return "fajl";
  }

  if (count >= 2 && count <= 4) {
    return "fajla";
  }

  return "fajlova";
}

function formatBytes(bytes) {

  if (bytes === 0) {
    return "0 MB";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const exponent = Math.min(
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    bytes / 1024 ** exponent;

  return `${value.toFixed(
    value >= 10 || exponent === 0
      ? 0
      : 1
  )} ${units[exponent]}`;
}

function toBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = reject;

    }
  );
}  const index = Math.floor(Math.log(bytes) / Math.log(1024));
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

function uploadFiles() {
  if (!uploadEndpoint) {
    setStatus('Upload endpoint nije podešen. Dodajte WEDDING_UPLOAD_ENDPOINT iz .env konfiguracije prije objave sajta.', 'error');
    return;
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
