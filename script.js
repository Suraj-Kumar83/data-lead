 const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwOJUnW77Pz0xrzVvYAWiSMiReHs4r6cTvxpMTDRF225AZdo84K1OEDNF-x_mRUrnY/exec";

  const form = document.getElementById("propertyForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusBox = document.getElementById("status");

  const listingType = document.getElementById("listingType");
  const priceLabel = document.getElementById("priceLabel");
  const priceHelp = document.getElementById("priceHelp");

  const propertyMedia = document.getElementById("propertyMedia");
  const mediaPreview = document.getElementById("mediaPreview");

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm"
  ];

  document.getElementById("year").textContent =
    new Date().getFullYear();

  listingType.addEventListener("change", function () {
    if (this.value === "Rent") {
      priceLabel.textContent = "Monthly Rent (₹)";
      priceHelp.textContent = "Enter the monthly rent in rupees.";
    } else {
      priceLabel.textContent = "Expected Sale Price (₹)";
      priceHelp.textContent = "Enter the total expected sale price.";
    }
  });

  function showStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = type;
    statusBox.style.display = "block";
  }

  function validateFiles(files) {
    if (files.length > MAX_FILES) {
      return "Please select a maximum of 5 files.";
    }

    let totalSize = 0;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return "Unsupported file type: " + file.name;
      }

      if (file.size > MAX_FILE_SIZE) {
        return "Each file must be 5 MB or smaller: " + file.name;
      }

      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return "The combined size of all selected files must not exceed 10 MB.";
    }

    return "";
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function () {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");

        if (commaIndex === -1) {
          reject(new Error("Could not read " + file.name));
          return;
        }

        resolve(result.substring(commaIndex + 1));
      };

      reader.onerror = function () {
        reject(new Error("Could not read " + file.name));
      };

      reader.readAsDataURL(file);
    });
  }

  propertyMedia.addEventListener("change", function () {
    mediaPreview.replaceChildren();

    const files = Array.from(this.files);
    const error = validateFiles(files);

    if (error) {
      alert(error);
      this.value = "";
      return;
    }

    if (!files.length) return;

    const list = document.createElement("ul");

    files.forEach(file => {
      const item = document.createElement("li");
      item.textContent =
        file.name + " (" + (file.size / 1048576).toFixed(2) + " MB)";
      list.appendChild(item);
    });

    mediaPreview.appendChild(list);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (
      !GOOGLE_SCRIPT_URL.startsWith(
        "https://script.google.com/macros/s/"
      )
    ) {
      showStatus("Google Apps Script is not configured.", "error");
      return;
    }

    if (!form.reportValidity()) return;

    const files = propertyMedia
      ? Array.from(propertyMedia.files)
      : [];

    const fileError = validateFiles(files);

    if (fileError) {
      showStatus(fileError, "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Preparing submission...";
    statusBox.style.display = "none";

    try {
      const formData = new FormData(form);
      const body = new URLSearchParams();

      // Send ordinary form fields, excluding the binary file objects.
      for (const [key, value] of formData.entries()) {
        if (key === "propertyMedia") continue;

        if (typeof value === "string") {
          body.append(key, value);
        }
      }

      // Encode each selected file for the Apps Script endpoint.
      body.append("mediaCount", String(files.length));

      for (let i = 0; i < files.length; i++) {
        submitBtn.textContent =
          "Preparing media " + (i + 1) + " of " + files.length + "...";

        const file = files[i];
        const base64 = await readFileAsBase64(file);

        body.append("media_" + i + "_name", file.name);
        body.append("media_" + i + "_type", file.type);
        body.append("media_" + i + "_base64", base64);
      }

      submitBtn.textContent = "Submitting property...";

      // no-cors means the browser cannot read the Apps Script response.
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: body
      });

      showStatus(
        "Your submission request has been sent. Because the browser cannot read the server response, this message does not confirm that the property and media were saved. Please verify the Property Leads sheet or contact The Real Track.",
        "success"
      );

      form.reset();
      mediaPreview.replaceChildren();

      priceLabel.textContent = "Expected Sale Price (₹)";
      priceHelp.textContent = "Enter the total expected sale price.";

    } catch (error) {
      console.error("Submission error:", error);

      showStatus(
        "We couldn't prepare or send your submission. Please check your connection and try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Property Details →";
    }
  });