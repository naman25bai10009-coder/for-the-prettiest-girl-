let schedule = JSON.parse(localStorage.getItem('ashmita_schedule')) || { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
let currentViewDay = new Date().getDay(); 
if(currentViewDay === 0) currentViewDay = 1; 
let cycleData = JSON.parse(localStorage.getItem('ashmita_cycle')) || { startDate: '', cycleLength: 28, periodLength: 5, lastVibe: '', lastVibeDate: '' };
let goals = JSON.parse(localStorage.getItem('ashmita_goals')) || [];
let bucketList = JSON.parse(localStorage.getItem('ashmita_bucket')) || [];

document.addEventListener('DOMContentLoaded', () => {
    // PERSONALIZED GREETING
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting');
    if (hour < 12) greetingElement.innerText = "Good morninggg meri jaan. ☀️";
    else if (hour < 18) greetingElement.innerText = "Good afternoonnn cutu. 🌸";
    else greetingElement.innerText = "Good eveninggg baunitaa. 🌙";

    // Init Logic
    if (Object.values(schedule).every(day => day.length === 0)) { document.getElementById('timetable-setup').classList.remove('hidden'); }
    viewDay(currentViewDay);
    setInterval(checkLiveClasses, 60000); 
    updateCycleDisplay();
    checkSpecialDays();
    renderGoals();
    renderBucket();
    startCountdown(); // Start the Jabalpur timer
});

// ROUTING
function openPage(pageId) {
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById(pageId).classList.add('active');
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
    document.querySelectorAll('.class-row').forEach(row => {
        const startArr = row.getAttribute('data-start').split(':'); const endArr = row.getAttribute('data-end').split(':');
        const startMinutes = parseInt(startArr[0]) * 60 + parseInt(startArr[1]); const endMinutes = parseInt(endArr[0]) * 60 + parseInt(endArr[1]);
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) { row.classList.add('live-now'); } else { row.classList.remove('live-now'); }
    });
}

// CYCLE
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

// GOALS & BUCKET LIST
function checkSpecialDays() {
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1; 
    let greeting = "";
    
    // CUSTOM SPECIAL DAY MESSAGES
    if (month === 2 && date === 14) greeting = "Happy Valentine's Day Babyyy! 💘💖";
    else if (month === 3 && date === 3) greeting = "Happy Holi Sweetieee! Rang mat lagwana zyada! 🎨✨";
    else if (date === 21) greeting = "Happy Anniversary Monthly Cutuuu! I love youuu! 🥰💖";
    
    const greetEl = document.getElementById('special-greeting');
    if (greeting) { greetEl.innerText = greeting; greetEl.style.display = 'block'; } else { greetEl.style.display = 'none'; }
}

function renderGoals() {
    const list = document.getElementById('goal-list'); list.innerHTML = '';
    goals.forEach((goal, index) => {
        const li = document.createElement('li'); li.className = `goal-item ${goal.done ? 'completed' : ''}`;
        li.innerHTML = `<input type="checkbox" class="custom-checkbox" ${goal.done ? 'checked' : ''} onchange="toggleGoal(${index})"><span>${goal.text}</span><button class="delete-btn" style="margin-left:auto; margin-top:0;" onclick="deleteGoal(${index})">✖</button>`;
        list.appendChild(li);
    });
}
function addGoal() { const val = document.getElementById('new-goal').value.trim(); if(!val) return; goals.push({ text: val, done: false }); localStorage.setItem('ashmita_goals', JSON.stringify(goals)); document.getElementById('new-goal').value = ''; renderGoals(); }
function toggleGoal(index) { goals[index].done = !goals[index].done; localStorage.setItem('ashmita_goals', JSON.stringify(goals)); renderGoals(); if(goals[index].done) showCutePopup(); }
function deleteGoal(index) { goals.splice(index, 1); localStorage.setItem('ashmita_goals', JSON.stringify(goals)); renderGoals(); }

// CUTE POPUP LOGIC
function showCutePopup() {
    // PERSONALIZED REWARDS
    const popups = [
        'Good girllll!!!! 🐶', 
        'Merii pyariii bachi ne karliyaaa! 🥺💖', 
        'Yayyyy cutu bachaaaa! 🐾', 
        'You did it baunitaa! ✨', 
        'Look at you goooo! 💅'
    ];
    const popupEl = document.getElementById('cute-popup');
    popupEl.innerText = popups[Math.floor(Math.random() * popups.length)];
    popupEl.classList.remove('hidden'); popupEl.style.animation = 'none'; void popupEl.offsetWidth; popupEl.style.animation = 'floatUp 2.5s ease forwards';
    setTimeout(() => { popupEl.classList.add('hidden'); }, 2500);
}

// BUCKET LIST FUNCTIONS
function renderBucket() {
    const list = document.getElementById('bucket-list'); list.innerHTML = '';
    bucketList.forEach((item, index) => {
        const li = document.createElement('li'); li.className = `goal-item ${item.done ? 'completed' : ''}`;
        li.innerHTML = `<input type="checkbox" class="custom-checkbox" ${item.done ? 'checked' : ''} onchange="toggleBucket(${index})"><span>${item.text}</span><button class="delete-btn" style="margin-left:auto; margin-top:0;" onclick="deleteBucket(${index})">✖</button>`;
        list.appendChild(li);
    });
}
function addBucket() { const val = document.getElementById('new-bucket').value.trim(); if(!val) return; bucketList.push({ text: val, done: false }); localStorage.setItem('ashmita_bucket', JSON.stringify(bucketList)); document.getElementById('new-bucket').value = ''; renderBucket(); }
function toggleBucket(index) { bucketList[index].done = !bucketList[index].done; localStorage.setItem('ashmita_bucket', JSON.stringify(bucketList)); renderBucket(); if(bucketList[index].done) showCutePopup(); }
function deleteBucket(index) { bucketList.splice(index, 1); localStorage.setItem('ashmita_bucket', JSON.stringify(bucketList)); renderBucket(); }

// COUNTDOWN TIMER
function startCountdown() {
    const targetDate = new Date("June 21, 2026 00:00:00").getTime();
    setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById("cd-days").innerText = days;
        document.getElementById("cd-hours").innerText = hours;
        document.getElementById("cd-min").innerText = minutes;
        document.getElementById("cd-sec").innerText = seconds;
    }, 1000);
}

// OPEN WHEN LETTERS (KEPT ORIGINAL AS REQUESTED)
function openLetter(type) {
    const modal = document.getElementById('letter-modal');
    const title = document.getElementById('letter-title');
    const body = document.getElementById('letter-body');
    
    if (type === 'miss') {
        title.innerText = "When you miss me... 🥺";
        body.innerText = "Remember that I am just one call away. Close your eyes and imagine I'm holding your hand. This distance is temporary, but what we have is forever. I love you more than miles can ever separate us.";
    } else if (type === 'sad') {
        title.innerText = "When you are sad... 😢";
        body.innerText = "It's okay to not be okay sometimes. Take a deep breath. Drink some water. Put on your favorite song. I am sending you the biggest, warmest virtual hug right now. You are strong, and you will get through this.";
    } else if (type === 'mad') {
        title.innerText = "When you are mad at me... 😠";
        body.innerText = "I'm sorry. I probably did something stupid. Please forgive me? I hate fighting with you. Let's talk it out when you're ready. You mean the world to me.";
    } else if (type === 'happy') {
        title.innerText = "When you are happy... 🥰";
        body.innerText = "Seeing you happy makes my entire day! Keep that beautiful smile on your face. You deserve all the joy in the world. I wish I was there to celebrate with you!";
    }
    
    modal.classList.remove('hidden');
}

function closeLetter() {
    document.getElementById('letter-modal').classList.add('hidden');
}
