// Mobile menu
const menu = document.getElementById('menu');
const nav = document.getElementById('nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});

// Close mobile menu when a link is clicked
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  });
});

// Header shadow on scroll
const header = document.querySelector('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Scroll reveals
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.lead, .steps, .who div, .result, .planner .controls, .honest .wrap > *').forEach((el) => {
  el.classList.add('reveal'); io.observe(el);
});

// Program tabs
const tabs = [...document.querySelectorAll('[role=tab]')];
if (tabs.length > 0) {
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
}

// Workshop planner
const plannerControls = document.querySelector('.planner');
if (plannerControls) {
  const plan = {
    ai: ['AI & Machine Learning', [
      'Python basics: variables, loops, and data handling','Working with data: cleaning, processing, and visualization','Building and testing your first machine learning models',
      'Computer vision: object detection and image classification','Introduction to neural networks and deep learning','Fine-tuning custom AI models for specific tasks',
      'Working with Large Language Models (LLMs) locally','Optimizing offline AI models for standard computer hardware','Integrating your AI models into custom web backends','Deploying your own full-stack AI application']],
    elec: ['Electronics & Robotics', [
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
    const title = `${name} · ${lvl} · ${names[m]} (${m} months)`;
    document.getElementById('rTitle').textContent = title;
    document.getElementById('rList').innerHTML = rows.map(r => `<li><b>${r.when}:</b> ${r.s}</li>`).join('');
    outlineText = `I would like to plan a program.\nProgram: ${title}\nDraft timeline:\n` +
      rows.map(r => `- ${r.when}: ${r.s}`).join('\n') + '\n\nNumber of students: ';
  }
  
  document.querySelectorAll('.planner input').forEach(i => i.addEventListener('change', render));
  render();
  
  document.getElementById('useOutline').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(outlineText);
      alert("Program outline copied! You can now paste it into the contact form.");
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
      document.querySelector('textarea[name="message"]').value = outlineText;
    } catch (err) {
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Contact form
const form = document.getElementById('contactForm');
if (form) {
  const statusEl = document.getElementById('status');
  const fallback = document.getElementById('fallback');
  const msgEl = form.elements.message;
  const loadedAt = Date.now();
  let lastMessage = '';

  function syncType() {
    const t = form.elements.type.value;
    form.querySelectorAll('.adapt').forEach(g => { g.hidden = !g.dataset.for.split('|').includes(t); });
  }
  form.querySelectorAll('input[name=type]').forEach(r => r.addEventListener('change', syncType));
  msgEl.addEventListener('input', () => { document.getElementById('count').textContent = msgEl.value.length; });

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

  form.addEventListener('submit', async e => {
    e.preventDefault();
    fallback.hidden = true;
    
    // Disable buttons temporarily to prevent double-clicking
    const buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach(b => b.disabled = true);
    
    const f = new FormData(form);
    
    // Re-enable buttons if validation fails
    const unlock = () => buttons.forEach(b => b.disabled = false);

    if (f.get('website')) return unlock(); 
    if (Date.now() - loadedAt < 4000) { say('Please take a moment to fill in the form, then try again.', true); return unlock(); }
    
    const name = f.get('name').trim();
    const phone = f.get('phone').trim();
    const msg = f.get('message').trim();
    const type = f.get('type');
    
    // STRICT VALIDATION: Blocks submission and targets the missing field
    if (!name) { form.elements.name.focus(); say('Please enter your name.', true); return unlock(); }
    if (!phone || phone.length < 9) { form.elements.phone.focus(); say('Please enter a valid phone number.', true); return unlock(); }
    
    if (type === 'School or college workshop' || type === 'Partnership') {
      if (!f.get('institution').trim()) { form.elements.institution.focus(); say('Please enter the school or institution name.', true); return unlock(); }
      if (!f.get('role')) { form.elements.role.focus(); say('Please select your role.', true); return unlock(); }
      if (!f.get('count')) { form.elements.count.focus(); say('Please estimate the number of students.', true); return unlock(); }
      if (!f.get('when')) { form.elements.when.focus(); say('Please select a timing option.', true); return unlock(); }
    } else {
      if (!f.get('grade').trim()) { form.elements.grade.focus(); say('Please enter the class or grade.', true); return unlock(); }
      if (!f.get('interest')) { form.elements.interest.focus(); say('Please select what you are most interested in.', true); return unlock(); }
    }

    if (msg.length < 10) { msgEl.focus(); say('Please write a short message (at least 10 characters).', true); return unlock(); }
    
    const wait = waitTime();
    if (wait) { say('You have sent a message recently. Please wait ' + fmt(wait) + ' before sending another, or call us.', true); return unlock(); }

    if (via === 'whatsapp') {
      // Build text specifically for WhatsApp
      const lines = [`Name: ${name}`, `About: ${type}`];
      [['institution', 'Institution'], ['role', 'Role'], ['count', 'Students'], ['when', 'Timing'],
       ['grade', 'Class'], ['interest', 'Interested in'], ['phone', 'Phone']].forEach(([k, label]) => {
        const el = form.elements[k];
        if (el && !el.closest('[hidden]') && f.get(k)) lines.push(`${label}: ${f.get(k)}`);
      });
      lines.push('', msg);
      lastMessage = lines.join('\n');
      
      record();
      say('Opening WhatsApp...');
      fallback.hidden = false;
      window.open('https://wa.me/916296113701?text=' + encodeURIComponent(lastMessage), '_blank', 'noopener');
      unlock();
    } else {
      // Direct Background Email via Web3Forms
      say('Sending message securely...');
      
      // Let Web3Forms format the raw data beautifully
      const emailData = new FormData(form);
      emailData.append('access_key', 'e2c268be-e8e0-48dc-b574-f1385cf450f0');
      emailData.append('subject', 'New Roboyaan Enquiry from ' + name);
      
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: emailData
        });
        const data = await response.json();
        
        if (data.success) {
          record();
          say('Message sent successfully! We will contact you soon.');
          form.reset();
        } else {
          say('Something went wrong. Please click "Send on WhatsApp" instead.', true);
          fallback.hidden = false;
        }
      } catch (error) {
        say('Network error. Please click "Send on WhatsApp" instead.', true);
        fallback.hidden = false;
      }
      unlock();
    }
  });

  document.getElementById('copyMsg').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(lastMessage); e.target.textContent = 'Copied'; }
    catch (err) { e.target.textContent = 'Copy failed. Select the text in your form instead.'; }
  });
}
