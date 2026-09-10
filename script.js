(function () {
  "use strict";

  /* Mobile navigation */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Active section highlighting */
  var sections = document.querySelectorAll("main [id]");
  var navLinks = document.querySelectorAll(".primary-nav a[href^='#']");
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var map = {};
    navLinks.forEach(function (l) {
      map[l.getAttribute("href").slice(1)] = l;
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = map[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.removeAttribute("aria-current"); });
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* Restrained entrance reveal, skipped entirely under reduced motion */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(".reveal");
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (t) { revealObserver.observe(t); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (t) {
      t.classList.add("is-visible");
    });
  }

  /* Contact form */
  var form = document.querySelector("#enquiry-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    // Replace this with a real form endpoint (e.g. a Formspree/Resend/own API
    // route) before launch. The form is wired to submit via fetch with
    // accessible loading, success and error states rather than mailto.
    var ENDPOINT = form.getAttribute("data-endpoint") || "";

    function setFieldError(field, message) {
      var wrap = field.closest(".field");
      var errorEl = wrap.querySelector(".field-error");
      if (message) {
        wrap.classList.add("error");
        if (errorEl) errorEl.textContent = message;
        field.setAttribute("aria-invalid", "true");
      } else {
        wrap.classList.remove("error");
        if (errorEl) errorEl.textContent = "";
        field.removeAttribute("aria-invalid");
      }
    }

    function validate() {
      var valid = true;
      form.querySelectorAll("[required]").forEach(function (field) {
        var value = (field.value || "").trim();
        if (!value || (field.type === "checkbox" && !field.checked)) {
          setFieldError(field, field.type === "checkbox" ? "Please confirm before sending." : "This field is required.");
          valid = false;
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setFieldError(field, "Enter a valid email address.");
          valid = false;
        } else {
          setFieldError(field, "");
        }
      });
      return valid;
    }

    form.querySelectorAll("input, textarea, select").forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.hasAttribute("required")) validate();
      });
    });

    function showStatus(kind, message) {
      status.className = "form-status visible " + kind;
      status.textContent = message;
      status.setAttribute("role", kind === "error" ? "alert" : "status");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      if (!validate()) {
        showStatus("error", "Please check the highlighted fields and try again.");
        return;
      }

      if (!ENDPOINT) {
        // No backend configured yet in this build.
        showStatus(
          "error",
          "This form isn't connected to a sending service yet. Please email omar.osama2011@yahoo.com or use WhatsApp directly for now."
        );
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            showStatus("success", "Thanks — your enquiry has been sent. I'll reply by email as soon as I can.");
          } else {
            showStatus("error", "Something went wrong sending this. Please try again or email directly.");
          }
        })
        .catch(function () {
          showStatus("error", "Something went wrong sending this. Please try again or email directly.");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.getAttribute("data-label") || "Send enquiry";
        });
    });
  }
})();
