const $ = id => document.getElementById(id);
const stepsTbody = document.querySelector('#stepsTable tbody');
const instList = document.getElementById('instList');
const speedSelect = document.getElementById('speedSelect');
const stateGroups = {
  q0: document.getElementById('g_q0'),
  q1: document.getElementById('g_q1'),
  q2: document.getElementById('g_q2'),
  q3: document.getElementById('g_q3'),
  q4: document.getElementById('g_q4')
};
const transitions = {
  q0_q1: document.getElementById('t_q0_q1'),
  q1_q1: document.getElementById('t_q1_q1'),
  q1_q2: document.getElementById('t_q1_q2'),
  q2_q2: document.getElementById('t_q2_q2'),
  q2_q3: document.getElementById('t_q2_q3'),
  q3_q3: document.getElementById('t_q3_q3'),
  q3_q4: document.getElementById('t_q3_q4'),
  q0_q0: document.getElementById('t_q0_q0')
};

function setActiveState(name) {
  Object.values(stateGroups).forEach(g => g.classList.remove('active'));
  if (stateGroups[name]) {
    stateGroups[name].classList.add('active');
    const circ = stateGroups[name].querySelector('.state-circle');
    circ.style.filter = 'url(#glow)';
    setTimeout(()=>{ circ.style.filter='none'; }, 600);
  }
}

function highlightTransition(id) {
  Object.values(transitions).forEach(t => t.classList.remove('active'));
  if (transitions[id]) {
    transitions[id].classList.add('active');
  }
}

function resetUI() {
  stepsTbody.innerHTML = '';
  instList.textContent = '';
  Object.values(stateGroups).forEach(g => g.classList.remove('active'));
  Object.values(transitions).forEach(t => t.classList.remove('active'));
  document.getElementById('result').textContent = '';
}

function parseSegments(s) {
  let i = 0, n = s.length;
  while (i<n && s[i]==='x') i++;
  let xCount = i;
  let j = i;
  while (j<n && s[j]==='y') j++;
  let y1 = j - i;
  i = j;
  while (i<n && s[i]==='z') i++;
  let zCount = i - j;
  j = i;
  while (j<n && s[j]==='y') j++;
  let y2 = j - i;
  if (j!==n) return null;
  return { xCount, y1, zCount, y2 };
}

async function simulate(s) {
  resetUI();
  const speed = parseInt(speedSelect.value,10);
  if (![...s].every(ch => ['x','y','z'].includes(ch))) {
    document.getElementById('result').innerHTML = '<span class="bad">Error: solo símbolos x,y,z</span>';
    return;
  }
  const segs = parseSegments(s);
  if (!segs) {
    document.getElementById('result').innerHTML = '<span class="bad">Formato inválido: x* y+ z+ y+</span>';
    return;
  }

  let state = 'q0';
  let stack = ['Z0'];
  let step = 0;
  setActiveState('q0');
  instList.textContent += `(${state}, ${s}, ${stack.join('')})\n`;

  const chars = s.split('');
  for (let i=0;i<chars.length;i++) {
    const ch = chars[i];
    const top = stack[stack.length-1] || 'ε';
    let action = '', newState = state, transId = null;

    if (state==='q0') {
      if (ch==='x') { action='leer x'; newState='q0'; transId='q0_q0'; }
      else if (ch==='y') { action='leer y inicio'; stack.push('Y'); newState='q1'; transId='q0_q1'; }
      else { newState='ERR'; }
    } else if (state==='q1') {
      if (ch==='y') { action='leer y (y1)'; stack.push('Y'); newState='q1'; transId='q1_q1'; }
      else if (ch==='z') { action='leer z'; newState='q2'; transId='q1_q2'; }
      else { newState='ERR'; }
    } else if (state==='q2') {
      if (ch==='z') { action='leer z'; stack.push('Z'); newState='q2'; transId='q2_q2'; }
      else if (ch==='y') { action='inicio y finales'; newState='q3'; transId='q2_q3'; }
      else { newState='ERR'; }
    } else if (state==='q3') {
      if (ch==='y') {
        action='leer y final (grupo)';
        if (stack[stack.length-1]==='Y') stack.pop();
        newState='q3'; transId='q3_q3';
      } else { newState='ERR'; }
    } else { newState='ERR'; }

    step++;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${step}</td><td>${ch}</td><td>${state}</td><td>${top}</td><td>${action}</td><td>${newState}</td><td>${stack.join('')}</td>`;
    stepsTbody.appendChild(row);

    setActiveState(state);
    highlightTransition(transId);
    instList.textContent += `(${state}, ${s.slice(i)}, ${stack.join('')})\n`;

    state = newState;
    if (state==='ERR') break;
    await new Promise(r=>setTimeout(r,speed));
  }

  const { y1, zCount, y2 } = segs;
  const n = y1/2;
  let accepted = false;
  if (y1%2===0 && n>=1 && y2===3*n) {
    for (let m=2; m<=zCount-2; m++) {
      if (zCount === m + (m+2)) { accepted = true; break; }
    }
  }

  document.getElementById('result').innerHTML = accepted ? '<span class="good">CADENA ACEPTADA ✅</span>' : '<span class="bad">CADENA RECHAZADA ❌</span>';
  setActiveState(accepted?'q4':'q0');
  highlightTransition(null);
}

document.getElementById('checkBtn').addEventListener('click', ()=>simulate(document.getElementById('inputString').value.trim()));
document.getElementById('sampleBtn').addEventListener('click', ()=>{ document.getElementById('inputString').value='yyzzzzzzyyy'; });
