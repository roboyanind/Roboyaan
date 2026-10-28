// Mobile menu
const menu = document.getElementById('menu');
const nav = document.getElementById('nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// ---- Image skeletons: shimmer until each photo has loaded ----
document.querySelectorAll('.hero img, .panel img').forEach(img => {
  if (img.complete) return;
  img.classList.add('skel-img');
  const done = () => img.classList.remove('skel-img');
  img.addEventListener('load', done); img.addEventListener('error', done);
});

// ---- Contact form ----
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('status');
const fallback = document.getElementById('fallback');
const msgEl = form.elements.message;
const loadedAt = Date.now();
let lastMessage = '';

// Adaptive fields
function syncType() {
  const t = form.elements.type.value;
  form.querySelectorAll('.adapt').forEach(g => { g.hidden = !g.dataset.for.split('|').includes(t); });
}
form.querySelectorAll('input[name=type]').forEach(r => r.addEventListener('change', syncType));
msgEl.addEventListener('input', () => { document.getElementById('count').textContent = msgEl.value.length; });

// Rate limiting (client side): 30 s between sends, 3 sends per hour.
// This protects visitors from accidental repeats and blocks simple bots,
// but it cannot stop a determined attacker. See notes for server-side options.
const KEY = 'roboyaan_sends', COOLDOWN = 30e3, WINDOW = 36e5, MAX = 3;
function waitTime() {
  let t = [];
  try { t = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  const now = Date.now();
  t = t.filter(x => now - x < WINDOW);
  if (t.length && now - t[t.length - 1] < COOLDOWN) return COOLDOWN - (now - t[t.length - 1]);
  if (t.length >= MAX) return WINDOW - (now - t[0]);
  return 0;
}
function record() {
  let t = [];
  try { t = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  t.push(Date.now());
  try { localStorage.setItem(KEY, JSON.stringify(t.slice(-MAX))); } catch (e) {}
}
const fmt = ms => ms > 60e3 ? Math.ceil(ms / 60e3) + ' minutes' : Math.ceil(ms / 1e3) + ' seconds';
const say = (m, bad) => { statusEl.textContent = m; statusEl.classList.toggle('bad', !!bad); };

let via = 'email';
form.querySelectorAll('[data-via]').forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));

form.addEventListener('submit', e => {
  e.preventDefault();
  fallback.hidden = true;
  const f = new FormData(form);
  if (f.get('website')) return; // honeypot: bots fill hidden fields
  if (Date.now() - loadedAt < 4000) return say('Please take a moment to fill in the form, then try again.', true);
  const name = f.get('name').trim(), msg = f.get('message').trim();
  if (!name) { form.elements.name.focus(); return say('Please enter your name.', true); }
  if (msg.length < 10) { msgEl.focus(); return say('Please write a short message (at least 10 characters).', true); }
  const wait = waitTime();
  if (wait) return say('You have sent a message recently. Please wait ' + fmt(wait) + ' before sending another, or call us on +91 62961 13701.', true);

  const lines = [`Name: ${name}`, `About: ${f.get('type')}`];
  [['institution', 'Institution'], ['role', 'Role'], ['count', 'Students'], ['when', 'Timing'],
   ['grade', 'Class'], ['interest', 'Interested in'], ['phone', 'Phone']].forEach(([k, label]) => {
    const el = form.elements[k];
    if (el && !el.closest('[hidden]') && f.get(k)) lines.push(`${label}: ${f.get(k)}`);
  });
  lines.push('', msg);
  lastMessage = lines.join('\n');
  record();
  say('Opening ' + (via === 'whatsapp' ? 'WhatsApp' : 'your email app') + '...');
  fallback.hidden = false;
  if (via === 'whatsapp') window.open('https://wa.me/916296113701?text=' + encodeURIComponent(lastMessage), '_blank', 'noopener');
  else location.href = 'mailto:roboyaan.info@gmail.com?subject=' + encodeURIComponent('Enquiry from ' + name) + '&body=' + encodeURIComponent(lastMessage);
});
document.getElementById('copyMsg').addEventListener('click', async e => {
  try { await navigator.clipboard.writeText(lastMessage); e.target.textContent = 'Copied'; }
  catch (err) { e.target.textContent = 'Copy failed. Select the text in your form instead.'; }
});

// Header shadow on scroll
const header = document.querySelector('header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Scroll reveals
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.lead, .steps, .who div, .result, .planner .controls, .honest .wrap > *').forEach((el, i) => {
  el.classList.add('reveal'); io.observe(el);
});

// Program tabs (arrow keys supported)
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(i) {
  tabs.forEach((t, j) => {
    t.setAttribute('aria-selected', i === j);
    t.tabIndex = i === j ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = i !== j;
  });
  tabs[i].focus({ preventScroll: true });
}
tabs.forEach((t, i) => {
  t.tabIndex = i === 0 ? 0 : -1;
  t.addEventListener('click', () => selectTab(i));
  t.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') selectTab((i + 1) % tabs.length);
    if (e.key === 'ArrowLeft') selectTab((i - 1 + tabs.length) % tabs.length);
  });
});

// Workshop planner: a month-by-month draft, refined with the partner later.
// Level sets where students start (skips early basics); length sets how far they go.
const plan = {
  ai: ['AI &amp; Machine Learning', [
      'Python basics: variables, loops, and data handling','Working with data: cleaning, processing, and visualization','Building and testing your first machine learning models',
      'Computer vision: object detection and image classification','Introduction to neural networks and deep learning','Fine-tuning custom AI models for specific tasks',
      'Working with Large Language Models (LLMs) locally','Optimizing offline AI models for standard computer hardware','Integrating your AI models into custom web backends','Deploying your own full-stack AI application']],
    'Neural networks explained step by step','Improving models: more data, tuning, testing','Using AI tools and APIs responsibly','Putting a small AI app online for others to try']],
  elec: ['Electronics &amp; Robotics', [
    'Circuits on a breadboard: voltage, current, resistance','Arduino basics: LEDs, buttons, serial output','Sensors: distance, temperature, light',
    'Motors and drivers: making things move','Build a line-following or obstacle-avoiding robot','Soldering and neat wiring (supervised)',
    'Wireless and IoT: send sensor data to a phone','Design a simple circuit board layout','Robot arm or custom mechanism','Debugging, testing and documenting your build']],
  drone: ['Drone Technology', [
    'How drones fly: lift, thrust and balance','Parts and what each one does; safety rules','Flight simulator practice',
    'Controlled flying (venue and rules permitting)','Assembling a drone from a kit','Flight controller setup and tuning basics',
    'Camera use, aerial photography and mapping basics','Planning missions and waypoints','Sensors, payloads and uses such as inspection','Local drone rules and responsible operation']]
};
const offset = { Beginner: 0, Intermediate: 2, Advanced: 3 };
const names = { 3: 'Sprint', 6: 'Run', 12: 'Marathon' };
const howMany = { 3: 3, 6: 5, 12: 7 };
const finale = { 3: 'Final project and showcase', 6: 'Capstone project and school showcase', 12: 'Capstone project and open showcase day' };
const val = n => document.querySelector(`input[name=${n}]:checked`).value;
let outlineText = '';
function render() {
  const [name, stages] = plan[val('prog')];
  const lvl = val('lvl'), m = +val('len');
  const start = offset[lvl];
  const items = stages.slice(start, start + howMany[m]);
  items.push(finale[m]);
  const parts = items.length;
  const rows = items.map((s, i) => {
    const from = Math.round(i * m / parts) + 1;
    const to = Math.max(from, Math.round((i + 1) * m / parts));
    return { when: from === to ? `Month ${from}` : `Months ${from} to ${to}`, s };
  });
  const title = `${name.replace(/&amp;/g, '&')} · ${lvl} · ${names[m]} (${m} months)`;
  document.getElementById('rTitle').textContent = title;
  document.getElementById('rList').innerHTML = rows.map(r => `<li><b>${r.when}:</b> ${r.s}</li>`).join('');
  outlineText = `I would like to plan a program.\nProgram: ${title}\nDraft timeline:\n` +
    rows.map(r => `- ${r.when}: ${r.s.replace(/&amp;/g, '&')}`).join('\n') + '\n\nNumber of students: ';
}
document.querySelectorAll('.planner input').forEach(i => i.addEventListener('change', render));
render();
document.getElementById('useOutline').addEventListener('click', () => {
  msgEl.value = outlineText; msgEl.dispatchEvent(new Event('input'));
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => form.elements.name.focus({ preventScroll: true }), 600);
});
