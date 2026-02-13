let schedule = JSON.parse(localStorage.getItem('ashmita_schedule')) || { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
let currentViewDay = new Date().getDay(); 
if(currentViewDay === 0) currentViewDay = 1; 
let cycleData = JSON.parse(localStorage.getItem('ashmita_cycle')) || { startDate: '', cycleLength: 28, periodLength: 5, lastVibe: '', lastVibeDate: '' };
let goals = JSON.parse(localStorage.getItem('ashmita_goals')) || [];

document.addEventListener('DOMContentLoaded', () => {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting');
    if (hour < 12) greetingElement.innerText = "Good morning, Ashmita. ☀️";
    else if (hour < 18) greetingElement.innerText = "Good afternoon, Ashmita. 🌸";
    else greetingElement.innerText = "Good evening, Ashmita. 🌙";

    const isScheduleEmpty = Object.values(schedule).every(day => day.length === 0);
    if (isScheduleEmpty) { document.getElementById('timetable-setup').classList.remove('hidden'); }
    viewDay(currentViewDay);
    setInterval(checkLiveClasses, 60000); 

    updateCycleDisplay();
    
    // Stage 4 Boots
    checkSpecialDays();
    renderGoals();
});

function openPage(pageId) {
    const views = document.querySelectorAll('.app-view');
    views.forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    const activeView = document.getElementById(pageId);
    activeView.classList.remove('hidden');
    activeView.classList.add('active');
    window.scrollTo(0, 0);
}

// TIMETABLE
function toggleTimetableSetup() { document.getElementById('timetable-setup').classList.toggle('hidden'); }
function addClass() {
    const day = document.getElementById('day-select').value;
    const name = document.getElementById('class-name').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;
    if (!name || !start || !end) { alert("Please fill in all details!"); return; }
    schedule[day].push({ name, start, end });
    schedule[day].sort((a, b) => a.start.localeCompare(b.start));
    localStorage.setItem('ashmita_schedule', JSON.stringify(schedule));
    document.getElementById('class-name').value = ''; document.getElementById('start-time').value = ''; document.getElementById('end-time').value = '';
    viewDay(day); 
}
function deleteClass(day, index) { schedule[day].splice(index, 1); localStorage.setItem('ashmita_schedule', JSON.stringify(schedule)); viewDay(day); }
function viewDay(dayNum) {
    currentViewDay = dayNum;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    document.getElementById('current-day-label').innerText = days[dayNum];
    document.querySelectorAll('.day-btn').forEach((btn, index) => { if(index + 1 == dayNum) btn.classList.add('active'); else btn.classList.remove('active'); });
    const container = document.getElementById('class-list-container');
    container.innerHTML = '';
    if (schedule[dayNum].length === 0) { container.innerHTML = '<p style="text-align:center; color:white; margin-top:20px;">No classes today! 🌸</p>'; return; }
    schedule[dayNum].forEach((cls, index) => {
        const formatTime = (time24) => { let [h, m] = time24.split(':'); let ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ampm}`; };
        const div = document.createElement('div'); div.className = 'class-row'; div.setAttribute('data-start', cls.start); div.setAttribute('data-end', cls.end);
        div.innerHTML = `<div class="class-title">${cls.name}</div><div class="class-time">🕒 ${formatTime(cls.start)} - ${formatTime(cls.end)}</div><button class="delete-btn" onclick="deleteClass(${dayNum}, ${index})">Remove</button>`;
        container.appendChild(div);
    });
    checkLiveClasses(); 
}
function checkLiveClasses() {
    const now = new Date(); const today = now.getDay();
    if (currentViewDay != today) return; 
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const rows = document.querySelectorAll('.class-row');
    rows.forEach(row => {
        const startArr = row.getAttribute('data-start').split(':'); const endArr = row.getAttribute('data-end').split(':');
        const startMinutes = parseInt(startArr[0]) * 60 + parseInt(startArr[1]); const endMinutes = parseInt(endArr[0]) * 60 + parseInt(endArr[1]);
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) { row.classList.add('live-now'); } else { row.classList.remove('live-now'); }
    });
}

// CYCLE TRACKER
function toggleCycleSetup() {
    const setupDiv = document.getElementById('cycle-setup'); setupDiv.classList.toggle('hidden');
    if (!setupDiv.classList.contains('hidden') && cycleData.startDate) {
        document.getElementById('last-period-date').value = cycleData.startDate; document.getElementById('cycle-length').value = cycleData.cycleLength; document.getElementById('period-length').value = cycleData.periodLength;
    }
}
function saveCycleData() {
    const dateInput = document.getElementById('last-period-date').value;
    if (!dateInput) { alert("Please pick a start date!"); return; }
    cycleData.startDate = dateInput; cycleData.cycleLength = parseInt(document.getElementById('cycle-length').value) || 28; cycleData.periodLength = parseInt(document.getElementById('period-length').value) || 5;
    localStorage.setItem('ashmita_cycle', JSON.stringify(cycleData));
    document.getElementById('cycle-setup').classList.add('hidden'); updateCycleDisplay();
}
function updateCycleDisplay() {
    if (!cycleData.startDate) { document.getElementById('cycle-setup').classList.remove('hidden'); return; }
    const start = new Date(cycleData.startDate); const today = new Date(); start.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diffTime = today - start; const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) { document.getElementById('cycle-day-display').innerText = "Waiting..."; return; }
    let currentCycleDay = (diffDays % cycleData.cycleLength) + 1;
    document.getElementById('cycle-day-display').innerText = `Day ${currentCycleDay}`;
    const nextPeriod = new Date(start); let cyclesPassed = Math.floor(diffDays / cycleData.cycleLength);
    nextPeriod.setDate(start.getDate() + ((cyclesPassed + 1) * cycleData.cycleLength));
    document.getElementById('next-period-display').innerText = nextPeriod.toDateString();
    let phase = ""; let pLen = cycleData.periodLength; let cLen = cycleData.cycleLength; let ovulationDay = cLen - 14; 
    if (currentCycleDay <= pLen) phase = "Menstruation Phase 🩸"; else if (currentCycleDay < ovulationDay - 2) phase = "Follicular Phase 🌸"; else if (currentCycleDay >= ovulationDay - 2 && currentCycleDay <= ovulationDay + 2) phase = "Ovulation Phase ✨"; else phase = "Luteal Phase 🍂";
    document.getElementById('cycle-phase-display').innerText = phase;
    const pPct = (pLen / cLen) * 100; const fPct = ((ovulationDay - 3 - pLen) / cLen) * 100; const oPct = (5 / cLen) * 100; const lPct = 100 - (pPct + fPct + oPct);
    document.getElementById('bar-period').style.width = pPct + "%"; document.getElementById('bar-follicular').style.width = fPct + "%"; document.getElementById('bar-ovulation').style.width = oPct + "%"; document.getElementById('bar-luteal').style.width = lPct + "%";
    if (cycleData.lastVibeDate !== today.toDateString()) { document.getElementById('vibe-log').innerText = ""; } else { document.getElementById('vibe-log').innerText = `Current Vibe: ${cycleData.lastVibe}`; }
}
function logVibe(vibe) {
    cycleData.lastVibe = vibe; cycleData.lastVibeDate = new Date().toDateString();
    localStorage.setItem('ashmita_cycle', JSON.stringify(cycleData));
    document.getElementById('vibe-log').innerText = `Current Vibe: ${vibe}`;
}

// ==========================================
// STAGE 4: TODAY'S GOALS LOGIC (NEW!)
// ==========================================
function checkSpecialDays() {
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1; // JS months are 0-11
    
    let greeting = "";

    // The Logic for the special days
    if (month === 2 && date === 14) {
        greeting = "Happy Valentine's Day Bachaaa! 💘💖";
    } else if (month === 3 && date === 3) { // March 3rd Holi 2026
        greeting = "Happy Holi Sweetie! 🎨✨";
    } else if (date === 21) {
        greeting = "Happy Anniversary Monthly Cutu! 🥰💖";
    }
    
    const greetEl = document.getElementById('special-greeting');
    if (greeting) {
        greetEl.innerText = greeting;
        greetEl.style.display = 'block';
    } else {
        greetEl.style.display = 'none';
    }
}

function renderGoals() {
    const list = document.getElementById('goal-list');
    list.innerHTML = '';
    goals.forEach((goal, index) => {
        const li = document.createElement('li');
        li.className = `goal-item ${goal.done ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="custom-checkbox" ${goal.done ? 'checked' : ''} onchange="toggleGoal(${index})">
            <span>${goal.text}</span>
            <button class="delete-btn" style="margin-left:auto; margin-top:0;" onclick="deleteGoal(${index})">✖</button>
        `;
        list.appendChild(li);
    });
}

function addGoal() {
    const input = document.getElementById('new-goal');
    const val = input.value.trim();
    if(!val) return;
    
    goals.push({ text: val, done: false });
    localStorage.setItem('ashmita_goals', JSON.stringify(goals));
    input.value = '';
    renderGoals();
}

function toggleGoal(index) {
    goals[index].done = !goals[index].done;
    localStorage.setItem('ashmita_goals', JSON.stringify(goals));
    renderGoals();
    
    // Trigger the cute pop-up only if checking it ON
    if(goals[index].done) {
        showCutePopup();
    }
}

function deleteGoal(index) {
    goals.splice(index, 1);
    localStorage.setItem('ashmita_goals', JSON.stringify(goals));
    renderGoals();
}

function showCutePopup() {
    const popups = [
        '🐶 Good job cutie!', 
        '🐱 So proud of you bitchhh!', 
        '🐾 Yayyy baby!', 
        '💖 You did it sweetie Pyaruu kuchi puchiii!',
        '✨ Look at you go!',"APP TOH CUTIE HO","DAIYUM GURLLL!"

    ];
    
    const popupEl = document.getElementById('cute-popup');
    // Pick a random cute message
    popupEl.innerText = popups[Math.floor(Math.random() * popups.length)];
    
    // Restart animation trick
    popupEl.classList.remove('hidden');
    popupEl.style.animation = 'none';
    void popupEl.offsetWidth; // Trigger reflow
    popupEl.style.animation = 'floatUp 2.5s ease forwards';
    
    // Hide after animation finishes
    setTimeout(() => { 
        popupEl.classList.add('hidden'); 
    }, 2500);
}