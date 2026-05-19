(() => {
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
  const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "mp4", "mov"]);

  const endpoint = window.WEDDING_UPLOAD_ENDPOINT || "/api/upload";
  const eventName = window.WEDDING_EVENT_NAME || "Mia & Srđan — Wedding Memories";
  const eventDate = window.WEDDING_EVENT_DATE || "2026-08-21";

  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const browseBtn = document.getElementById("browseBtn");
  const fileList = document.getElementById("fileList");
  const statusMessage = document.getElementById("statusMessage");
  const submitBtn = document.getElementById("submitBtn");
  const progressWrap = document.getElementById("progressWrap");
  const progressBar = document.getElementById("progressBar");
  const progressPercent = document.getElementById("progressPercent");
  const qrImage = document.getElementById("qrImage");

  let selectedFiles = [];

  function bytesToMb(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  function getExt(filename) {
    const idx = filename.lastIndexOf(".");
    return idx > -1 ? filename.slice(idx + 1).toLowerCase() : "";
  }

  function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.classList.remove("ok", "error");
    if (type) statusMessage.classList.add(type);
  }

  function clearProgress() {
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    progressWrap.classList.remove("show");
    progressWrap.setAttribute("aria-hidden", "true");
  }

  function showProgress() {
    progressWrap.classList.add("show");
    progressWrap.setAttribute("aria-hidden", "false");
  }

  function renderFiles() {
    fileList.innerHTML = "";

    if (!selectedFiles.length) return;

    selectedFiles.forEach((file, idx) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.innerHTML = `
        <span>${file.name}</span>
        <span>${bytesToMb(file.size)} MB</span>
      `;
      li.dataset.index = String(idx);
      fileList.appendChild(li);
    });
  }

  function validateFiles(files) {
    const valid = [];
    const errors = [];

    files.forEach((file) => {
      const ext = getExt(file.name);

      if (!ACCEPTED_EXTENSIONS.has(ext)) {
        errors.push(`Fajl \"${file.name}\" nije podržan format.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`Fajl \"${file.name}\" prelazi 50MB.`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }

  function addFiles(fileLikeList) {
    const incoming = Array.from(fileLikeList || []);
    if (!incoming.length) return;

    const { valid, errors } = validateFiles(incoming);

    if (errors.length) {
      setStatus(errors.join(" "), "error");
    } else {
      setStatus("");
    }

    if (!valid.length) return;

    selectedFiles = [...selectedFiles, ...valid];
    renderFiles();
  }

  function resetSelection() {
    selectedFiles = [];
    fileInput.value = "";
    renderFiles();
  }

  function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
      };

      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        if (ok) {
          resolve({ status: xhr.status, body: xhr.responseText });
        } else {
          reject(new Error(`Server je vratio status ${xhr.status}.`));
        }
      };

      xhr.onerror = () => reject(new Error("Greška mreže tokom upload-a."));
      xhr.send(formData);
    });
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!selectedFiles.length) {
      setStatus("Odaberite barem jedan fajl prije slanja.", "error");
      return;
    }

    submitBtn.disabled = true;
    browseBtn.disabled = true;
    showProgress();
    setStatus("Slanje fajlova...", "");

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("eventName", eventName);
    formData.append("eventDate", eventDate);

    try {
      await uploadWithProgress(formData);
      setStatus("Hvala! Uspješno ste poslali uspomene. 🤍", "ok");
      resetSelection();
    } catch (err) {
      setStatus(err.message || "Upload nije uspio. Pokušajte ponovo.", "error");
    } finally {
      submitBtn.disabled = false;
      browseBtn.disabled = false;
      setTimeout(clearProgress, 400);
    }
  }

  function buildQr() {
    const url = window.location.href;
    const qrEndpoint = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=";
    qrImage.src = `${qrEndpoint}${encodeURIComponent(url)}`;
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => addFiles(e.target.files));

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    addFiles(e.dataTransfer.files);
  });

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  form.addEventListener("submit", onSubmit);

  buildQr();
  clearProgress();
})();function init() {

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
}
