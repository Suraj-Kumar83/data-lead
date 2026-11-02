
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwOJUnW77Pz0xrzVvYAWiSMiReHs4r6cTvxpMTDRF225AZdo84K1OEDNF-x_mRUrnY/exec";

const form = document.getElementById("propertyForm");
const submitBtn = document.getElementById("submitBtn");
const statusBox = document.getElementById("status");

const listingType = document.getElementById("listingType");
const priceLabel = document.getElementById("priceLabel");
const priceHelp = document.getElementById("priceHelp");

// Update the footer year.
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Update the price label depending on listing type.
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

// Display success or error messages.
function showStatus(message, type) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.className = type;
  statusBox.style.display = "block";
}

// Submit property details to Google Apps Script.
if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (
      !GOOGLE_SCRIPT_URL.startsWith(
        "https://script.google.com/macros/s/"
      )
    ) {
      showStatus(
        "Google Apps Script is not configured.",
        "error"
      );
      return;
    }

    // Validate required HTML form fields.
    if (!form.reportValidity()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting property...";
    
    if (statusBox) {
      statusBox.style.display = "none";
    }

    try {
      const formData = new FormData(form);
      const body = new URLSearchParams();

      // Send only text-based property details.
      // Ignore file inputs and other non-string values.
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) continue;

        body.append(key, value);
      }

      // No media files are uploaded.
      body.set("mediaCount", "0");
      body.set("photoLinks", "");

      // Send the property details to Google Apps Script.
      // no-cors prevents reading the response, but allows
      // a simple form POST to be sent cross-origin.
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: body
      });

      // IMPORTANT:
      // With no-cors, the response is opaque. We cannot
      // confirm that Google Sheets saved the property.
      showStatus(
        "Your submission request has been sent. Please verify that your property has been recorded.",
        "success"
      );

      form.reset();

      // Restore the default sale-price label.
      updatePriceLabel();

    } catch (error) {
      console.error("Property submission error:", error);

      showStatus(
        "We couldn't send your submission. Please check your internet connection and try again.",
        "error"
      );

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Property Details →";
    }
  });
}
