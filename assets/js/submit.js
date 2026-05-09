/* OSEA submission form
   - Drag-drop / file picker for the photograph
   - Client-side EXIF parsing via exifr (date, GPS, camera)
   - Leaflet map for manual pin (or auto-populated from EXIF)
   - Stub POST to backend (/api/submit). Until the backend ships, this
     short-circuits to a confirmation render so the form is testable now. */

(() => {
  'use strict';

  const API_BASE = window.OSEA_API_BASE || 'https://osea-api.onrender.com';
  const PROGRAM_SLUG = 'sevengill';

  const photoPlate = document.getElementById('photoPlate');
  const photoInput = document.getElementById('photoInput');
  const photoImg = document.getElementById('photoImg');
  const photoImgWrap = document.getElementById('photoImgWrap');
  const photoReplace = document.getElementById('photoReplace');
  const photoRemove = document.getElementById('photoRemove');
  const exifStrip = document.getElementById('exifStrip');
  const capturedAt = document.getElementById('capturedAt');
  const capturedAtRow = document.getElementById('capturedAtRow');
  const coordReadout = document.getElementById('coordReadout');
  const form = document.getElementById('submitForm');
  const submitBtn = document.getElementById('submitBtn');
  const fieldNoNum = document.getElementById('fieldNoNum');

  let currentFile = null;
  let exifData = null;
  let pinLatLng = null;  // {lat, lng} when set

  // --- DRAFT field-note number for visual interest -----------------------
  fieldNoNum.textContent = String(1100 + Math.floor(Math.random() * 800)).padStart(4, '0');

  // --- File picker / drag-drop ------------------------------------------
  photoPlate.addEventListener('click', (e) => {
    if (e.target.closest('.photo-plate-actions')) return; // ignore action buttons
    photoInput.click();
  });
  photoPlate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      photoInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach((ev) => {
    photoPlate.addEventListener(ev, (e) => {
      e.preventDefault();
      photoPlate.classList.add('dragging');
    });
  });
  ['dragleave', 'dragend', 'drop'].forEach((ev) => {
    photoPlate.addEventListener(ev, (e) => {
      e.preventDefault();
      photoPlate.classList.remove('dragging');
    });
  });
  photoPlate.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  });

  photoReplace.addEventListener('click', (e) => {
    e.stopPropagation();
    photoInput.click();
  });
  photoRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  function handleFile(file) {
    const ok = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
      .includes(file.type);
    if (!ok && !/\.(jpe?g|png|heic|heif)$/i.test(file.name)) {
      alert('Please upload a JPEG, PNG, or HEIC image.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('That photograph is larger than 25 MB. Please use a smaller version.');
      return;
    }
    currentFile = file;

    // Display
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoImg.src = ev.target.result;
      photoImgWrap.hidden = false;
      photoPlate.classList.add('has-image');
    };
    reader.readAsDataURL(file);

    // EXIF
    parseExif(file);
  }

  function clearFile() {
    currentFile = null;
    exifData = null;
    photoInput.value = '';
    photoImg.src = '';
    photoImgWrap.hidden = true;
    photoPlate.classList.remove('has-image');
    exifStrip.innerHTML = '';
    exifStrip.hidden = true;
    capturedAt.value = '';
    capturedAtRow.hidden = true;
  }

  // --- EXIF parsing ------------------------------------------------------

  async function parseExif(file) {
    try {
      const data = await window.exifr.parse(file, {
        gps: true, tiff: true, exif: true, xmp: false, ifd1: false,
      });
      exifData = data || {};

      const chips = [];
      let dateFound = false;

      if (data && data.DateTimeOriginal) {
        const d = new Date(data.DateTimeOriginal);
        if (!isNaN(d.getTime())) {
          // Set datetime-local input
          const tz = d.getTimezoneOffset() * 60000;
          const local = new Date(d.getTime() - tz).toISOString().slice(0, 16);
          if (!capturedAt.value) capturedAt.value = local;
          chips.push(['DATE', d.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })]);
          dateFound = true;
        }
      }

      // Show the manual date field only when we couldn't read it from EXIF.
      capturedAtRow.hidden = dateFound;

      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        pinLatLng = { lat: data.latitude, lng: data.longitude };
        chips.push(['GPS', `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`]);
        renderPin(pinLatLng);
        coordReadout.textContent =
          `From photograph: ${pinLatLng.lat.toFixed(4)}°, ${pinLatLng.lng.toFixed(4)}°, drag the pin to adjust.`;
      }

      if (data && data.Make && data.Model) {
        chips.push(['CAMERA', `${data.Make} ${data.Model}`.trim()]);
      } else if (data && data.Model) {
        chips.push(['CAMERA', data.Model]);
      }

      if (data && data.ImageWidth && data.ImageHeight) {
        chips.push(['DIMS', `${data.ImageWidth} × ${data.ImageHeight}`]);
      }

      if (chips.length) {
        exifStrip.hidden = false;
        exifStrip.innerHTML = chips.map(([k, v]) =>
          `<span class="exif-chip"><span class="key">${k}</span><span class="val">${escapeHTML(v)}</span></span>`
        ).join('');
      } else {
        exifStrip.hidden = false;
        exifStrip.innerHTML =
          '<span class="exif-chip"><span class="key">META</span><span class="val">No EXIF metadata in this file, that\'s fine, just fill in date and place by hand.</span></span>';
      }
    } catch (err) {
      console.warn('EXIF parse failed:', err);
      capturedAtRow.hidden = false;
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // --- Leaflet map -------------------------------------------------------

  let leafletMap = null;
  let leafletMarker = null;

  function ensureMap() {
    if (leafletMap || !window.L) return;
    leafletMap = window.L.map('locationMap', {
      center: [37.5, -122.3],   // San Francisco Bay default
      zoom: 9,
      scrollWheelZoom: false,
    });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(leafletMap);

    leafletMap.on('click', (e) => {
      pinLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
      renderPin(pinLatLng, /*setView=*/ false);
      coordReadout.textContent =
        `Pinned: ${pinLatLng.lat.toFixed(4)}°, ${pinLatLng.lng.toFixed(4)}°`;
    });
  }

  function renderPin(latlng, setView = true) {
    ensureMap();
    if (!leafletMap) return;
    if (leafletMarker) leafletMarker.remove();
    leafletMarker = window.L.marker([latlng.lat, latlng.lng], {
      draggable: true,
    }).addTo(leafletMap);
    leafletMarker.on('dragend', () => {
      const ll = leafletMarker.getLatLng();
      pinLatLng = { lat: ll.lat, lng: ll.lng };
      coordReadout.textContent =
        `Pinned: ${pinLatLng.lat.toFixed(4)}°, ${pinLatLng.lng.toFixed(4)}°`;
    });
    if (setView) leafletMap.setView([latlng.lat, latlng.lng], 13);
  }

  // Defer map init until Leaflet finishes loading
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ensureMap();
    }, 50);
  });

  // --- Form submission ---------------------------------------------------

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentFile) {
      alert('Please add a photograph before submitting.');
      photoPlate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const consentResearch = document.getElementById('consentResearch').checked;
    if (!consentResearch) {
      alert('We need permission to use the photograph for research before we can accept it.');
      return;
    }

    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Filing…';

    try {
      const fd = new FormData();
      fd.append('photo', currentFile);
      fd.append('program_slug', PROGRAM_SLUG);
      fd.append('captured_at', capturedAt.value || '');
      if (pinLatLng) {
        fd.append('latitude', pinLatLng.lat);
        fd.append('longitude', pinLatLng.lng);
      }
      fd.append('depth', document.getElementById('depth').value || '');
      fd.append('conditions', document.getElementById('conditions').value || '');
      fd.append('notes', document.getElementById('notes').value || '');
      fd.append('submitter_name', document.getElementById('submitterName').value || '');
      fd.append('submitter_email', document.getElementById('submitterEmail').value || '');
      fd.append('consent_research', consentResearch ? '1' : '0');
      fd.append('consent_public',
        document.getElementById('consentPublic').checked ? '1' : '0');
      // Read venue from URL ?venue=<slug>
      const params = new URLSearchParams(window.location.search);
      if (params.get('venue')) fd.append('venue', params.get('venue'));

      // Try the backend; fall back to a local-only confirmation while it's not deployed.
      let resp;
      try {
        resp = await fetch(`${API_BASE}/api/submit`, {
          method: 'POST',
          body: fd,
        });
      } catch (netErr) {
        console.warn('Backend unreachable; rendering local stub confirmation.', netErr);
      }

      let payload = null;
      if (resp && resp.ok) {
        payload = await resp.json();
      } else if (resp && !resp.ok) {
        const txt = await resp.text();
        throw new Error(`Backend rejected the submission: ${resp.status} ${txt}`);
      }

      // Persist a local-stub confirmation if the backend isn't reachable yet.
      if (!payload) {
        payload = {
          submission_id: 'LOCAL-' + Date.now().toString(36).toUpperCase(),
          status: 'pending_review',
          message: 'Backend not yet deployed, this is a local preview confirmation.',
        };
      }
      sessionStorage.setItem('osea_last_submission', JSON.stringify(payload));
      window.location.href = '../../thanks.html';
    } catch (err) {
      console.error(err);
      alert('Something went wrong filing the sighting. Please try again, or email us.');
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

})();
