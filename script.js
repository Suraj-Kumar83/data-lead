
// ============================================
// THE REAL TRACK — PROPERTY FORM
// Text-only Google Sheets submission
// ============================================

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw1SlNZlCKvQ8j4hE1HDD7xXXTbZRFraTcaztyqIha-dD95V3KR7okt889Z6eznSaQ/exec";

const form = document.getElementById("propertyForm");
const submitBtn = document.getElementById("submitBtn");
const statusBox = document.getElementById("status");

const listingType = document.getElementById("listingType");
const priceLabel = document.getElementById("priceLabel");
const priceHelp = document.getElementById("priceHelp");

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// ============================================
// PRICE LABEL
// ============================================

function updatePriceLabel() {
  if (!listingType || !priceLabel || !priceHelp) return;

  if (listingType.value === "Rent") {
    priceLabel.textContent = "Monthly Rent (₹)";
    priceHelp.textContent = "Enter the monthly rent in rupees.";
  } else {
    priceLabel.textContent = "Expected Sale Price (₹)";
    priceHelp.textContent = "Enter the total expected sale price.";
  }
}

if (listingType) {
  listingType.addEventListener("change", updatePriceLabel);
  updatePriceLabel();
}


// ============================================
// STATUS MESSAGE
// ============================================

function showStatus(message, type) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.className = type;
  statusBox.style.display = "block";
}


// ============================================
// HIDDEN IFRAME FOR CROSS-ORIGIN FORM POST
// ============================================

let submissionFrame = document.getElementById("submissionFrame");

if (!submissionFrame) {
  submissionFrame = document.createElement("iframe");
  submissionFrame.name = "submissionFrame";
  submissionFrame.id = "submissionFrame";
  submissionFrame.style.display = "none";
  submissionFrame.title = "Property submission";
  document.body.appendChild(submissionFrame);
}


// ============================================
// FORM SUBMISSION
// ============================================

if (form) {
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    if (
      !GOOGLE_SCRIPT_URL.startsWith(
        "https://script.google.com/macros/s/"
      )
    ) {
      showStatus(
        "Google Apps Script URL is not configured correctly.",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting property...";

    if (statusBox) {
      statusBox.style.display = "none";
    }

    try {
      // Create a temporary form so the existing form layout
      // and page do not need to change.
      const postForm = document.createElement("form");

      postForm.method = "POST";
      postForm.action = GOOGLE_SCRIPT_URL;
      postForm.target = "submissionFrame";
      postForm.style.display = "none";

      // Copy only text fields. No media is uploaded.
      const formData = new FormData(form);

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) continue;

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;

        postForm.appendChild(input);
      }

      // Explicitly keep media fields empty.
      const photoLinks = document.createElement("input");
      photoLinks.type = "hidden";
      photoLinks.name = "photoLinks";
      photoLinks.value = "";
      postForm.appendChild(photoLinks);

      document.body.appendChild(postForm);

      // Submit to Apps Script in the hidden iframe.
      postForm.submit();

      showStatus(
        "Your submission has been sent. Please verify that it appears in the Property Leads spreadsheet before submitting again.",
        "success"
      );

      // Do not clear the form immediately. This avoids losing
      // the entered details if the backend rejects the request.
      // The iframe cannot reliably expose the Apps Script JSON
      // response because the destination is cross-origin.

      // Re-enable the button after a short delay.
      window.setTimeout(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Property Details →";
        postForm.remove();
      }, 3000);

    } catch (error) {
      console.error("Property submission error:", error);

      showStatus(
        "We couldn't send your submission. Please check your internet connection and try again.",
        "error"
      );

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Property Details →";
    }
  });
}
