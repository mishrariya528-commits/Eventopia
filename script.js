/* ==========================================================================
   CampusConnect — Vanilla JavaScript Logic
   Uses localStorage to persist events and student registrations.
   ========================================================================== */

// Keys used to store data inside browser localStorage
const EVENTS_STORAGE_KEY = "campusconnect_events";
const REGISTRATIONS_STORAGE_KEY = "campusconnect_registrations";

// Default college events shown on first visit
const DEFAULT_EVENTS = [
  {
    id: "evt-101",
    name: "CodeSprint Hackathon 2026",
    category: "Coding",
    date: "2026-12-05",
    time: "09:00 AM - 05:00 PM",
    venue: "CS Innovation Lab, Block B",
    capacity: 60,
    description:
      "8-hour team coding challenge focused on solving real campus problems with web and mobile prototypes."
  },
  {
    id: "evt-102",
    name: "Full-Stack Web Workshop",
    category: "Workshop",
    date: "2026-12-08",
    time: "02:00 PM - 05:00 PM",
    venue: "Seminar Hall 2, Academic Block",
    capacity: 40,
    description:
      "Hands-on beginner workshop covering HTML5, CSS3, responsive layouts, and interactive JavaScript."
  },
  {
    id: "evt-103",
    name: "Future of AI & Cloud Seminar",
    category: "Seminar",
    date: "2026-12-12",
    time: "11:00 AM - 01:00 PM",
    venue: "Main Auditorium",
    capacity: 120,
    description:
      "Industry guest talk on software engineering careers, cloud architecture, and applied machine learning."
  },
  {
    id: "evt-104",
    name: "Campus Acoustic Night",
    category: "Music",
    date: "2026-12-15",
    time: "06:00 PM - 08:30 PM",
    venue: "Open Air Amphitheatre",
    capacity: 80,
    description:
      "Evening live performances by student bands, solo vocalists, and instrumentalists from across departments."
  },
  {
    id: "evt-105",
    name: "Aarohan Cultural Fest",
    category: "Cultural",
    date: "2026-12-20",
    time: "10:00 AM - 07:00 PM",
    venue: "Central College Ground",
    capacity: 150,
    description:
      "Annual cultural showcase featuring dance competitions, drama skits, art stalls, and food booths."
  }
];

// Application state
let events = [];
let registrations = [];
let selectedCategory = "All";
let activeRosterEventId = null;
let pendingDeleteEventId = null;
let notificationTimer = null;

/* ==========================================================================
   1. Storage Helper Functions
   ========================================================================== */

function loadEvents() {
  const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!saved) {
    events = DEFAULT_EVENTS.slice();
    saveEvents();
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    events = Array.isArray(parsed) ? parsed : DEFAULT_EVENTS.slice();
  } catch {
    events = DEFAULT_EVENTS.slice();
  }
}

function saveEvents() {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function loadRegistrations() {
  const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
  if (!saved) {
    registrations = [];
    saveRegistrations();
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    registrations = Array.isArray(parsed) ? parsed : [];
  } catch {
    registrations = [];
  }
}

function saveRegistrations() {
  localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
}

/* ==========================================================================
   2. Utility & Calculation Functions
   ========================================================================== */

function getRegisteredCount(eventId) {
  return registrations.filter(function (reg) {
    return reg.eventId === eventId;
  }).length;
}

function getAvailableSeats(eventObj) {
  const taken = getRegisteredCount(eventObj.id);
  const remaining = eventObj.capacity - taken;
  return remaining > 0 ? remaining : 0;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================================================
   3. Notifications
   ========================================================================== */

function showNotification(message, type) {
  const box = document.getElementById("notificationBox");
  const iconEl = document.getElementById("notificationIcon");
  const msgEl = document.getElementById("notificationMessage");
  if (!box || !iconEl || !msgEl) return;

  box.className = "notification-box " + (type || "success");
  if (type === "warning") {
    iconEl.textContent = "!";
  } else if (type === "error") {
    iconEl.textContent = "×";
  } else {
    iconEl.textContent = "✓";
  }

  msgEl.textContent = message;
  box.hidden = false;

  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }
  notificationTimer = setTimeout(function () {
    box.hidden = true;
  }, 4500);
}

function hideNotification() {
  const box = document.getElementById("notificationBox");
  if (box) {
    box.hidden = true;
  }
}

/* ==========================================================================
   4. Navigation & Section Switching
   ========================================================================== */

function showSection(sectionId) {
  const sections = document.querySelectorAll(".page-section");
  sections.forEach(function (section) {
    section.classList.toggle("active", section.id === sectionId);
  });

  const navButtons = document.querySelectorAll(".nav-link");
  navButtons.forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-section") === sectionId);
  });

  // Close mobile menu after choosing a section
  const mainNav = document.getElementById("mainNav");
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  if (mainNav && menuToggleBtn) {
    mainNav.classList.remove("open");
    menuToggleBtn.setAttribute("aria-expanded", "false");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================================================
   5. Rendering Functions
   ========================================================================== */

function createEventCardHtml(eventObj) {
  const available = getAvailableSeats(eventObj);
  const isFull = available === 0;
  let seatClass = "seat-status";
  if (isFull) {
    seatClass += " full";
  } else if (available <= 5) {
    seatClass += " low";
  }

  const seatText = isFull
    ? "Event Full (0 / " + eventObj.capacity + " seats left)"
    : available + " of " + eventObj.capacity + " seats available";

  const buttonClass = isFull ? "btn btn-full btn-sm" : "btn btn-primary btn-sm";
  const buttonLabel = isFull ? "Event Full" : "Register";

  return (
    '<article class="event-card">' +
    "<div>" +
    '<div class="event-meta-line">' +
    escapeHtml(eventObj.category) +
    " &middot; " +
    escapeHtml(formatDate(eventObj.date)) +
    "</div>" +
    '<h3 class="event-title">' +
    escapeHtml(eventObj.name) +
    "</h3>" +
    '<p class="event-description">' +
    escapeHtml(eventObj.description) +
    "</p>" +
    '<div class="event-details">' +
    "<span><strong>Time:</strong> " +
    escapeHtml(eventObj.time) +
    "</span>" +
    "<span><strong>Venue:</strong> " +
    escapeHtml(eventObj.venue) +
    "</span>" +
    "</div>" +
    "</div>" +
    '<div class="event-footer">' +
    '<span class="' +
    seatClass +
    '">' +
    escapeHtml(seatText) +
    "</span>" +
    '<button type="button" class="' +
    buttonClass +
    ' register-event-btn" data-event-id="' +
    escapeHtml(eventObj.id) +
    '">' +
    buttonLabel +
    "</button>" +
    "</div>" +
    "</article>"
  );
}

function renderHomeSection() {
  const totalEventsEl = document.getElementById("statTotalEvents");
  const availableSeatsEl = document.getElementById("statAvailableSeats");
  const totalRegEl = document.getElementById("statTotalRegistrations");
  const featuredGrid = document.getElementById("homeFeaturedGrid");

  let totalAvailable = 0;
  events.forEach(function (evt) {
    totalAvailable += getAvailableSeats(evt);
  });

  if (totalEventsEl) totalEventsEl.textContent = String(events.length);
  if (availableSeatsEl) availableSeatsEl.textContent = String(totalAvailable);
  if (totalRegEl) totalRegEl.textContent = String(registrations.length);

  if (featuredGrid) {
    if (events.length === 0) {
      featuredGrid.innerHTML =
        '<div class="empty-state"><p>No events scheduled yet. Visit the Admin Dashboard to add an event.</p></div>';
      return;
    }
    const previewEvents = events.slice(0, 3);
    featuredGrid.innerHTML = previewEvents.map(createEventCardHtml).join("");
  }
}

function renderEventsSection() {
  const eventsGrid = document.getElementById("eventsGrid");
  const searchInput = document.getElementById("searchInput");
  if (!eventsGrid) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filtered = events.filter(function (evt) {
    const matchesCategory = selectedCategory === "All" || evt.category === selectedCategory;
    const matchesQuery =
      !query ||
      evt.name.toLowerCase().includes(query) ||
      evt.venue.toLowerCase().includes(query) ||
      evt.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  if (filtered.length === 0) {
    eventsGrid.innerHTML =
      '<div class="empty-state">' +
      "<p>No matching events found. Try a different keyword or select All categories.</p>" +
      '<button type="button" id="resetEventFilterBtn" class="btn btn-outline">Reset Filters</button>' +
      "</div>";

    const resetBtn = document.getElementById("resetEventFilterBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        setCategoryFilter("All");
      });
    }
    return;
  }

  eventsGrid.innerHTML = filtered.map(createEventCardHtml).join("");
}

function renderRegistrationsSection() {
  const listEl = document.getElementById("registrationsList");
  const searchEl = document.getElementById("regSearchInput");
  if (!listEl) return;

  const query = searchEl ? searchEl.value.trim().toLowerCase() : "";

  const filtered = registrations.filter(function (reg) {
    if (!query) return true;
    return (
      reg.studentName.toLowerCase().includes(query) ||
      reg.studentId.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.eventName.toLowerCase().includes(query)
    );
  });

  if (registrations.length === 0) {
    listEl.innerHTML =
      '<div class="empty-state">' +
      "<p>You have not registered for any events yet.</p>" +
      '<button type="button" id="emptyGoEventsBtn" class="btn btn-primary">Browse Upcoming Events</button>' +
      "</div>";

    const goBtn = document.getElementById("emptyGoEventsBtn");
    if (goBtn) {
      goBtn.addEventListener("click", function () {
        showSection("events-section");
      });
    }
    return;
  }

  if (filtered.length === 0) {
    listEl.innerHTML =
      '<div class="empty-state"><p>No registrations match your search query.</p></div>';
    return;
  }

  listEl.innerHTML = filtered
    .slice()
    .reverse()
    .map(function (reg) {
      return (
        '<article class="registration-card">' +
        '<div class="reg-card-header">' +
        "<div>" +
        "<h3>" +
        escapeHtml(reg.eventName) +
        "</h3>" +
        '<span class="reg-id-text">' +
        escapeHtml(reg.eventCategory) +
        " &middot; " +
        escapeHtml(formatDate(reg.eventDate)) +
        " &middot; " +
        escapeHtml(reg.eventTime) +
        "</span>" +
        "</div>" +
        '<span class="reg-id-text">ID: ' +
        escapeHtml(reg.regId) +
        "</span>" +
        "</div>" +
        '<div class="reg-details-grid">' +
        '<div><span class="reg-detail-label">Student Name</span><span class="reg-detail-value">' +
        escapeHtml(reg.studentName) +
        "</span></div>" +
        '<div><span class="reg-detail-label">Student ID</span><span class="reg-detail-value">' +
        escapeHtml(reg.studentId) +
        "</span></div>" +
        '<div><span class="reg-detail-label">Department</span><span class="reg-detail-value">' +
        escapeHtml(reg.department) +
        "</span></div>" +
        '<div><span class="reg-detail-label">Email</span><span class="reg-detail-value">' +
        escapeHtml(reg.email) +
        "</span></div>" +
        '<div><span class="reg-detail-label">Venue</span><span class="reg-detail-value">' +
        escapeHtml(reg.eventVenue) +
        "</span></div>" +
        "</div>" +
        '<div class="reg-card-footer">' +
        '<span class="reg-date-note">Registered on ' +
        escapeHtml(reg.registeredAt) +
        "</span>" +
        '<button type="button" class="btn btn-outline btn-sm print-slip-btn" data-reg-id="' +
        escapeHtml(reg.regId) +
        '">Print Confirmation Slip</button>' +
        "</div>" +
        "</article>"
      );
    })
    .join("");
}

function renderAdminSection() {
  const tableBody = document.getElementById("adminEventsTableBody");
  if (!tableBody) return;

  if (events.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6">No events available. Use the form to add your first event.</td></tr>';
  } else {
    tableBody.innerHTML = events
      .map(function (evt) {
        const registered = getRegisteredCount(evt.id);
        const available = getAvailableSeats(evt);

        return (
          "<tr>" +
          "<td><strong>" +
          escapeHtml(evt.name) +
          "</strong><br><small>" +
          escapeHtml(evt.category) +
          "</small></td>" +
          "<td>" +
          escapeHtml(formatDate(evt.date)) +
          "<br><small>" +
          escapeHtml(evt.venue) +
          "</small></td>" +
          '<td class="num-col">' +
          evt.capacity +
          "</td>" +
          '<td class="num-col">' +
          registered +
          "</td>" +
          '<td class="num-col">' +
          available +
          "</td>" +
          "<td>" +
          '<div class="table-actions">' +
          '<button type="button" class="btn btn-outline btn-sm view-students-btn" data-event-id="' +
          escapeHtml(evt.id) +
          '">Students (' +
          registered +
          ")</button>" +
          '<button type="button" class="btn btn-outline btn-sm edit-event-btn" data-event-id="' +
          escapeHtml(evt.id) +
          '">Edit</button>' +
          '<button type="button" class="btn btn-danger btn-sm delete-event-btn" data-event-id="' +
          escapeHtml(evt.id) +
          '">Delete</button>' +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  renderStudentRoster();
}

function renderStudentRoster() {
  const rosterPanel = document.getElementById("studentRosterPanel");
  const titleEl = document.getElementById("rosterEventTitle");
  const summaryEl = document.getElementById("rosterSeatSummary");
  const tbody = document.getElementById("rosterTableBody");

  if (!rosterPanel || !titleEl || !summaryEl || !tbody) return;

  if (!activeRosterEventId) {
    rosterPanel.hidden = true;
    return;
  }

  const eventObj = events.find(function (evt) {
    return evt.id === activeRosterEventId;
  });

  if (!eventObj) {
    activeRosterEventId = null;
    rosterPanel.hidden = true;
    return;
  }

  const eventStudents = registrations.filter(function (reg) {
    return reg.eventId === eventObj.id;
  });
  const available = getAvailableSeats(eventObj);

  titleEl.textContent = "Registered Students — " + eventObj.name;
  summaryEl.textContent =
    "Capacity: " +
    eventObj.capacity +
    " · Registered: " +
    eventStudents.length +
    " · Available Seats: " +
    available;

  if (eventStudents.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4">No students have registered for this event yet.</td></tr>';
  } else {
    tbody.innerHTML = eventStudents
      .map(function (student) {
        return (
          "<tr>" +
          "<td>" +
          escapeHtml(student.studentName) +
          "</td>" +
          "<td>" +
          escapeHtml(student.studentId) +
          "</td>" +
          "<td>" +
          escapeHtml(student.email) +
          "</td>" +
          "<td>" +
          escapeHtml(student.department) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  rosterPanel.hidden = false;
}

function renderAll() {
  renderHomeSection();
  renderEventsSection();
  renderRegistrationsSection();
  renderAdminSection();
}

/* ==========================================================================
   6. Category Filter Handler
   ========================================================================== */

function setCategoryFilter(category) {
  selectedCategory = category;
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-category") === category);
  });
  renderEventsSection();
}

/* ==========================================================================
   7. Student Registration Logic
   ========================================================================== */

function openRegisterModal(eventId) {
  const eventObj = events.find(function (evt) {
    return evt.id === eventId;
  });
  if (!eventObj) return;

  const available = getAvailableSeats(eventObj);
  if (available <= 0) {
    showNotification(
      'Registration closed: "' + eventObj.name + '" is already full.',
      "warning"
    );
    return;
  }

  const modal = document.getElementById("registerModal");
  const summaryEl = document.getElementById("modalEventSummary");
  const form = document.getElementById("registrationForm");
  const eventIdInput = document.getElementById("regEventId");

  if (!modal || !summaryEl || !form || !eventIdInput) return;

  form.reset();
  eventIdInput.value = eventObj.id;
  summaryEl.innerHTML =
    "<strong>" +
    escapeHtml(eventObj.name) +
    "</strong>" +
    "<span>" +
    escapeHtml(formatDate(eventObj.date)) +
    " &middot; " +
    escapeHtml(eventObj.time) +
    " &middot; " +
    escapeHtml(eventObj.venue) +
    " &middot; " +
    available +
    " seats left</span>";

  modal.hidden = false;
  const nameInput = document.getElementById("regName");
  if (nameInput) nameInput.focus();
}

function closeRegisterModal() {
  const modal = document.getElementById("registerModal");
  if (modal) modal.hidden = true;
}

function handleRegistrationSubmit(e) {
  e.preventDefault();

  const eventId = document.getElementById("regEventId").value;
  const studentName = document.getElementById("regName").value.trim();
  const studentId = document.getElementById("regStudentId").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const department = document.getElementById("regDepartment").value.trim();

  // Validate required fields
  if (!studentName || !studentId || !email || !department) {
    showNotification("Please fill in all required registration fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showNotification("Please enter a valid college email address.", "error");
    return;
  }

  const eventObj = events.find(function (evt) {
    return evt.id === eventId;
  });
  if (!eventObj) {
    showNotification("Selected event could not be found.", "error");
    closeRegisterModal();
    return;
  }

  // Check seat limit again before saving
  if (getAvailableSeats(eventObj) <= 0) {
    showNotification(
      'Registration failed: "' + eventObj.name + '" has reached full capacity.',
      "warning"
    );
    closeRegisterModal();
    renderAll();
    return;
  }

  // Prevent duplicate registration for the same event (by Student ID or Email)
  const isDuplicate = registrations.some(function (reg) {
    return (
      reg.eventId === eventObj.id &&
      (reg.studentId.toLowerCase() === studentId.toLowerCase() ||
        reg.email.toLowerCase() === email.toLowerCase())
    );
  });

  if (isDuplicate) {
    showNotification(
      "Duplicate registration blocked: this Student ID or Email is already registered for " +
        eventObj.name +
        ".",
      "warning"
    );
    return;
  }

  const newReg = {
    regId: "CC-" + Date.now().toString().slice(-6),
    eventId: eventObj.id,
    eventName: eventObj.name,
    eventCategory: eventObj.category,
    eventDate: eventObj.date,
    eventTime: eventObj.time,
    eventVenue: eventObj.venue,
    studentName: studentName,
    studentId: studentId,
    email: email,
    department: department,
    registeredAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  };

  registrations.push(newReg);
  saveRegistrations();
  closeRegisterModal();
  renderAll();

  showNotification(
    'Registration confirmed for "' + eventObj.name + '"! Confirmation ID: ' + newReg.regId,
    "success"
  );
}

/* ==========================================================================
   8. Confirmation Slip Modal & Printing
   ========================================================================== */

function openSlipModal(regId) {
  const reg = registrations.find(function (item) {
    return item.regId === regId;
  });
  if (!reg) return;

  document.getElementById("slipRegId").textContent = reg.regId;
  document.getElementById("slipStudentName").textContent = reg.studentName;
  document.getElementById("slipStudentId").textContent = reg.studentId;
  document.getElementById("slipDepartment").textContent = reg.department;
  document.getElementById("slipEmail").textContent = reg.email;
  document.getElementById("slipEventName").textContent = reg.eventName;
  document.getElementById("slipCategory").textContent = reg.eventCategory;
  document.getElementById("slipDateTime").textContent =
    formatDate(reg.eventDate) + " · " + reg.eventTime;
  document.getElementById("slipVenue").textContent = reg.eventVenue;
  document.getElementById("slipRegisteredAt").textContent = reg.registeredAt;

  const modal = document.getElementById("slipModal");
  if (modal) modal.hidden = false;
}

function closeSlipModal() {
  const modal = document.getElementById("slipModal");
  if (modal) modal.hidden = true;
}

/* ==========================================================================
   9. Admin Dashboard CRUD Logic
   ========================================================================== */

function resetEventForm() {
  const form = document.getElementById("eventForm");
  if (form) form.reset();

  document.getElementById("editEventId").value = "";
  document.getElementById("eventFormTitle").textContent = "Add New Event";
  document.getElementById("saveEventBtn").textContent = "Add Event";
  document.getElementById("cancelEditBtn").hidden = true;
}

function startEditEvent(eventId) {
  const eventObj = events.find(function (evt) {
    return evt.id === eventId;
  });
  if (!eventObj) return;

  document.getElementById("editEventId").value = eventObj.id;
  document.getElementById("eventName").value = eventObj.name;
  document.getElementById("eventCategory").value = eventObj.category;
  document.getElementById("eventCapacity").value = String(eventObj.capacity);
  document.getElementById("eventDate").value = eventObj.date;
  document.getElementById("eventTime").value = eventObj.time;
  document.getElementById("eventVenue").value = eventObj.venue;
  document.getElementById("eventDescription").value = eventObj.description;

  document.getElementById("eventFormTitle").textContent = "Edit Event";
  document.getElementById("saveEventBtn").textContent = "Update Event";
  document.getElementById("cancelEditBtn").hidden = false;

  document.getElementById("eventName").focus();
}

function handleEventFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById("editEventId").value.trim();
  const name = document.getElementById("eventName").value.trim();
  const category = document.getElementById("eventCategory").value.trim();
  const capacityVal = Number(document.getElementById("eventCapacity").value);
  const date = document.getElementById("eventDate").value.trim();
  const time = document.getElementById("eventTime").value.trim();
  const venue = document.getElementById("eventVenue").value.trim();
  const description = document.getElementById("eventDescription").value.trim();

  if (!name || !category || !date || !time || !venue || !description || !capacityVal) {
    showNotification("Please complete all event fields before saving.", "error");
    return;
  }

  if (capacityVal < 1 || !Number.isInteger(capacityVal)) {
    showNotification("Seat limit must be a whole number of at least 1.", "error");
    return;
  }

  if (editId) {
    const existing = events.find(function (evt) {
      return evt.id === editId;
    });
    if (!existing) return;

    const currentRegistered = getRegisteredCount(editId);
    if (capacityVal < currentRegistered) {
      showNotification(
        "Seat limit cannot be less than current registered students (" + currentRegistered + ").",
        "warning"
      );
      return;
    }

    existing.name = name;
    existing.category = category;
    existing.capacity = capacityVal;
    existing.date = date;
    existing.time = time;
    existing.venue = venue;
    existing.description = description;

    // Keep matching registration event details in sync
    registrations.forEach(function (reg) {
      if (reg.eventId === editId) {
        reg.eventName = name;
        reg.eventCategory = category;
        reg.eventDate = date;
        reg.eventTime = time;
        reg.eventVenue = venue;
      }
    });

    saveEvents();
    saveRegistrations();
    resetEventForm();
    renderAll();
    showNotification('Event "' + name + '" updated successfully.', "success");
  } else {
    const newEvent = {
      id: "evt-" + Date.now(),
      name: name,
      category: category,
      capacity: capacityVal,
      date: date,
      time: time,
      venue: venue,
      description: description
    };

    events.push(newEvent);
    saveEvents();
    resetEventForm();
    renderAll();
    showNotification('New event "' + name + '" added to CampusConnect.', "success");
  }
}

function openDeleteModal(eventId) {
  const eventObj = events.find(function (evt) {
    return evt.id === eventId;
  });
  if (!eventObj) return;

  pendingDeleteEventId = eventId;
  const regCount = getRegisteredCount(eventId);
  const textEl = document.getElementById("deleteModalText");
  if (textEl) {
    textEl.textContent =
      'Are you sure you want to delete "' +
      eventObj.name +
      '"?' +
      (regCount > 0
        ? " This will also remove " + regCount + " student registration(s) for this event."
        : "");
  }

  const modal = document.getElementById("deleteModal");
  if (modal) modal.hidden = false;
}

function closeDeleteModal() {
  pendingDeleteEventId = null;
  const modal = document.getElementById("deleteModal");
  if (modal) modal.hidden = true;
}

function confirmDeleteEvent() {
  if (!pendingDeleteEventId) return;

  const target = events.find(function (evt) {
    return evt.id === pendingDeleteEventId;
  });

  events = events.filter(function (evt) {
    return evt.id !== pendingDeleteEventId;
  });

  registrations = registrations.filter(function (reg) {
    return reg.eventId !== pendingDeleteEventId;
  });

  if (activeRosterEventId === pendingDeleteEventId) {
    activeRosterEventId = null;
  }

  if (document.getElementById("editEventId").value === pendingDeleteEventId) {
    resetEventForm();
  }

  saveEvents();
  saveRegistrations();
  closeDeleteModal();
  renderAll();

  if (target) {
    showNotification('Event "' + target.name + '" deleted.', "success");
  }
}

/* ==========================================================================
   10. Event Listeners & Initialization
   ========================================================================== */

function setupEventListeners() {
  // Navigation bar links
  document.querySelectorAll(".nav-link").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetSection = btn.getAttribute("data-section");
      if (targetSection) showSection(targetSection);
    });
  });

  const brandLink = document.querySelector(".brand");
  if (brandLink) {
    brandLink.addEventListener("click", function (e) {
      e.preventDefault();
      showSection("home-section");
    });
  }

  // Mobile menu toggle
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const mainNav = document.getElementById("mainNav");
  if (menuToggleBtn && mainNav) {
    menuToggleBtn.addEventListener("click", function () {
      const isOpen = mainNav.classList.toggle("open");
      menuToggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Quick navigation buttons on Home & Navbar
  document.getElementById("navRegisterBtn").addEventListener("click", function () {
    showSection("events-section");
  });
  document.getElementById("heroBrowseBtn").addEventListener("click", function () {
    showSection("events-section");
  });
  document.getElementById("viewAllEventsBtn").addEventListener("click", function () {
    showSection("events-section");
  });
  document.getElementById("heroRegistrationsBtn").addEventListener("click", function () {
    showSection("registrations-section");
  });

  // Search and Category Filters
  document.getElementById("searchInput").addEventListener("input", renderEventsSection);
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setCategoryFilter(btn.getAttribute("data-category") || "All");
    });
  });

  // My Registrations Filter
  document.getElementById("regSearchInput").addEventListener("input", renderRegistrationsSection);
  document.getElementById("clearRegFilterBtn").addEventListener("click", function () {
    document.getElementById("regSearchInput").value = "";
    renderRegistrationsSection();
  });

  // Notification close
  document.getElementById("closeNotificationBtn").addEventListener("click", hideNotification);

  // Registration Form & Modal
  document.getElementById("registrationForm").addEventListener("submit", handleRegistrationSubmit);
  document.getElementById("closeRegisterModalBtn").addEventListener("click", closeRegisterModal);
  document.getElementById("cancelRegisterBtn").addEventListener("click", closeRegisterModal);

  // Confirmation Slip Modal
  document.getElementById("closeSlipModalBtn").addEventListener("click", closeSlipModal);
  document.getElementById("doneSlipBtn").addEventListener("click", closeSlipModal);
  document.getElementById("printSlipBtn").addEventListener("click", function () {
    window.print();
  });

  // Admin Event Form & Roster
  document.getElementById("eventForm").addEventListener("submit", handleEventFormSubmit);
  document.getElementById("cancelEditBtn").addEventListener("click", resetEventForm);
  document.getElementById("closeRosterBtn").addEventListener("click", function () {
    activeRosterEventId = null;
    renderStudentRoster();
  });

  // Delete Confirmation Modal
  document.getElementById("closeDeleteModalBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDeleteEvent);

  // Event delegation for dynamically generated buttons
  document.addEventListener("click", function (e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const regBtn = target.closest(".register-event-btn");
    if (regBtn) {
      openRegisterModal(regBtn.getAttribute("data-event-id"));
      return;
    }

    const slipBtn = target.closest(".print-slip-btn");
    if (slipBtn) {
      openSlipModal(slipBtn.getAttribute("data-reg-id"));
      return;
    }

    const studentsBtn = target.closest(".view-students-btn");
    if (studentsBtn) {
      activeRosterEventId = studentsBtn.getAttribute("data-event-id");
      renderStudentRoster();
      return;
    }

    const editBtn = target.closest(".edit-event-btn");
    if (editBtn) {
      startEditEvent(editBtn.getAttribute("data-event-id"));
      return;
    }

    const deleteBtn = target.closest(".delete-event-btn");
    if (deleteBtn) {
      openDeleteModal(deleteBtn.getAttribute("data-event-id"));
    }
  });
}

// Start application once DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadEvents();
  loadRegistrations();
  setupEventListeners();
  renderAll();
});
