/* =========================================================
   CHAIHOLIC — script.js
   Replace the two values below with your own Supabase project
   URL and anon (public) key. Find them in:
   Supabase Dashboard → Project Settings → API
   ========================================================= */
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-SUPABASE-ANON-KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- helpers ---------- */
function setStatus(el, message, state){
  el.textContent = message;
  el.dataset.state = state || "";
}

function disableForm(form, disabled){
  [...form.elements].forEach(el => el.disabled = disabled);
}

/* ---------- mobile nav ---------- */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const authArea = document.getElementById("authArea");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  authArea.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  authArea.classList.remove("open");
}));

/* ---------- auth modal open/close/tabs ---------- */
const authBackdrop = document.getElementById("authBackdrop");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authClose = document.getElementById("authClose");
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function openAuth(tab){
  authBackdrop.classList.add("open");
  showTab(tab || "login");
}
function closeAuth(){ authBackdrop.classList.remove("open"); }
function showTab(tab){
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabSignup.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
}

loginBtn.addEventListener("click", () => openAuth("login"));
signupBtn.addEventListener("click", () => openAuth("signup"));
authClose.addEventListener("click", closeAuth);
authBackdrop.addEventListener("click", (e) => { if (e.target === authBackdrop) closeAuth(); });
tabLogin.addEventListener("click", () => showTab("login"));
tabSignup.addEventListener("click", () => showTab("signup"));

/* ---------- signup ---------- */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("signupStatus");
  disableForm(signupForm, true);
  setStatus(status, "Creating your account…");

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone } }
  });

  disableForm(signupForm, false);

  if (error){
    setStatus(status, error.message, "err");
    return;
  }

  // Mirror profile info into the profiles table (id = auth user id)
  if (data.user){
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: name,
      phone
    });
  }

  setStatus(status, "Account created. Check your email to confirm, then log in.", "ok");
  signupForm.reset();
});

/* ---------- login ---------- */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("loginStatus");
  disableForm(loginForm, true);
  setStatus(status, "Logging in…");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  disableForm(loginForm, false);

  if (error){
    setStatus(status, error.message, "err");
    return;
  }

  setStatus(status, "Welcome back!", "ok");
  loginForm.reset();
  setTimeout(closeAuth, 700);
});

/* ---------- auth state → nav UI ---------- */
function renderAuthArea(session){
  if (session && session.user){
    const label = session.user.user_metadata?.full_name || session.user.email;
    authArea.innerHTML = `
      <span class="user-chip">Hi, ${escapeHtml(label)}</span>
      <button class="btn btn-outline" id="logoutBtn" type="button">Log out</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabase.auth.signOut();
    });
    // prefill reservation name/phone if empty
    const resName = document.getElementById("resName");
    if (resName && !resName.value) resName.value = session.user.user_metadata?.full_name || "";
  } else {
    authArea.innerHTML = `
      <button class="btn btn-ghost" id="loginBtn" type="button">Log in</button>
      <button class="btn btn-solid" id="signupBtn" type="button">Sign up</button>
    `;
    document.getElementById("loginBtn").addEventListener("click", () => openAuth("login"));
    document.getElementById("signupBtn").addEventListener("click", () => openAuth("signup"));
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[s]));
}

supabase.auth.onAuthStateChange((_event, session) => renderAuthArea(session));
supabase.auth.getSession().then(({ data }) => renderAuthArea(data.session));

/* ---------- reservation form ---------- */
document.getElementById("reservationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("resStatus");
  disableForm(form, true);
  setStatus(status, "Booking your table…");

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id || null;

  const payload = {
    user_id: userId,
    name: document.getElementById("resName").value.trim(),
    phone: document.getElementById("resPhone").value.trim(),
    date: document.getElementById("resDate").value,
    time: document.getElementById("resTime").value,
    guests: Number(document.getElementById("resGuests").value),
    notes: document.getElementById("resNotes").value.trim() || null
  };

  const { error } = await supabase.from("reservations").insert(payload);
  disableForm(form, false);

  if (error){
    setStatus(status, "Couldn't save that — " + error.message, "err");
    return;
  }
  setStatus(status, "Table requested! We'll confirm by phone shortly.", "ok");
  form.reset();
});

/* ---------- contact form (general message) ---------- */
document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("contactStatus");
  disableForm(form, true);
  setStatus(status, "Sending…");

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id || null;

  const payload = {
    user_id: userId,
    name: document.getElementById("cName").value.trim(),
    email: null,
    phone: null,
    type: "general",
    message: `Contact: ${document.getElementById("cContact").value.trim()} — ${document.getElementById("cMessage").value.trim()}`
  };

  const { error } = await supabase.from("inquiries").insert(payload);
  disableForm(form, false);

  if (error){
    setStatus(status, "Couldn't send — " + error.message, "err");
    return;
  }
  setStatus(status, "Message sent. We'll get back to you soon.", "ok");
  form.reset();
});

/* ---------- inquiry form (catering / franchise / event) ---------- */
document.getElementById("inquiryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("inquiryStatus");
  disableForm(form, true);
  setStatus(status, "Submitting…");

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id || null;

  const payload = {
    user_id: userId,
    name: document.getElementById("iName").value.trim(),
    email: document.getElementById("iEmail").value.trim(),
    phone: document.getElementById("iPhone").value.trim(),
    type: document.getElementById("iType").value,
    message: document.getElementById("iMessage").value.trim()
  };

  const { error } = await supabase.from("inquiries").insert(payload);
  disableForm(form, false);

  if (error){
    setStatus(status, "Couldn't submit — " + error.message, "err");
    return;
  }
  setStatus(status, "Inquiry received. Expect a reply within a day.", "ok");
  form.reset();
});
