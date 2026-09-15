const MAX_LIVES = 10;
const STORAGE_KEY = 'normal-superior-convencion-save';

let students = [];
let selectedStudentIndex = null;

const namesInput = document.getElementById('namesInput');
const searchInput = document.getElementById('searchInput');
const studentsList = document.getElementById('studentsList');
const selectedStudentName = document.getElementById('selectedStudentName');
const feedbackBanner = document.getElementById('feedbackBanner');

const showFeedback = (message, type = 'neutral') => {
  feedbackBanner.textContent = message;
  feedbackBanner.classList.remove('good', 'bad');

  if (type !== 'neutral') {
    feedbackBanner.classList.add(type);
  }
};

const saveState = () => {
  const data = {
    students,
    selectedStudentIndex,
    namesInputValue: namesInput.value,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);
    if (!Array.isArray(data.students)) return false;

    students = data.students;
    selectedStudentIndex = data.selectedStudentIndex ?? 0;
    namesInput.value = data.namesInputValue || '';
    return true;
  } catch (error) {
    console.error('No se pudo cargar la sesión guardada:', error);
    return false;
  }
};

const getSanitizedNames = () => {
  const rawText = namesInput.value.trim();
  if (!rawText) return [];

  return rawText
    .split(/\n|,/) 
    .map((name) => name.trim())
    .filter(Boolean);
};

const renderStudents = () => {
  studentsList.innerHTML = '';

  if (!students.length) {
    studentsList.innerHTML = '<p class="empty-state">Escribe los nombres para comenzar la partida.</p>';
    selectedStudentName.textContent = 'Ninguno';
    return;
  }

  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredStudents = searchTerm
    ? students.filter((student) => student.name.toLowerCase().includes(searchTerm))
    : students;

  filteredStudents.forEach((student) => {
    const index = students.indexOf(student);
    const card = document.createElement('div');
    card.className = 'student-card';

    if (selectedStudentIndex === index) {
      card.classList.add('selected');
    }

    if (student.lives <= 0) {
      card.classList.add('out');
    }

    const lives = Array.from({ length: MAX_LIVES }, (_, lifeIndex) => {
      const heart = document.createElement('span');
      heart.className = 'life';

      if (lifeIndex < student.lives) {
        heart.classList.add('active');
        heart.textContent = '❤';
      } else {
        heart.classList.add('lost');
        heart.textContent = '♡';
      }

      return heart;
    });

    const header = document.createElement('div');
    header.className = 'student-header';

    const name = document.createElement('span');
    name.className = 'student-name';
    name.textContent = student.name;

    const status = document.createElement('span');
    status.className = 'student-status';
    status.textContent = student.lives <= 0 ? 'Fuera' : `${student.lives} vidas`;

    header.appendChild(name);
    header.appendChild(status);

    const livesContainer = document.createElement('div');
    livesContainer.className = 'lives';
    lives.forEach((life) => livesContainer.appendChild(life));

    card.appendChild(header);
    card.appendChild(livesContainer);

    card.addEventListener('click', () => {
      selectedStudentIndex = index;
      selectedStudentName.textContent = students[index].name;
      showFeedback(`Estudiante seleccionado: ${students[index].name}`, 'neutral');
      saveState();
      renderStudents();
    });

    studentsList.appendChild(card);
  });

  if (selectedStudentIndex !== null && students[selectedStudentIndex]) {
    selectedStudentName.textContent = students[selectedStudentIndex].name;
  } else {
    selectedStudentName.textContent = 'Ninguno';
  }
};

const startGame = () => {
  const names = getSanitizedNames();

  if (!names.length) {
    alert('Escribe al menos un nombre para comenzar.');
    return;
  }

  students = names.map((name) => ({
    name,
    lives: MAX_LIVES,
  }));

  selectedStudentIndex = 0;
  saveState();
  showFeedback('Juego iniciado. ¡Buena suerte con el grupo!', 'good');
  renderStudents();
};

const resetGame = () => {
  students = [];
  selectedStudentIndex = null;
  namesInput.value = '';
  searchInput.value = '';
  localStorage.removeItem(STORAGE_KEY);
  showFeedback('Juego reiniciado. Esperando nuevos nombres.', 'neutral');
  renderStudents();
};

const saveSession = () => {
  if (!students.length) {
    showFeedback('Primero escribe y comienza el juego para guardar una sesión.', 'neutral');
    return;
  }

  saveState();
  showFeedback('Sesión guardada correctamente en este navegador.', 'good');
};

const loadSession = () => {
  const hasLoaded = loadState();

  if (!hasLoaded) {
    showFeedback('No hay una sesión guardada aún.', 'neutral');
    return;
  }

  showFeedback('Sesión cargada correctamente.', 'good');
  renderStudents();
};

const applyBehaviorChange = (type) => {
  if (!students.length) {
    alert('Primero registra a los estudiantes.');
    return;
  }

  if (selectedStudentIndex === null || !students[selectedStudentIndex]) {
    alert('Selecciona un estudiante antes de continuar.');
    return;
  }

  const student = students[selectedStudentIndex];
  const selectedCard = document.querySelectorAll('.student-card')[selectedStudentIndex];

  if (type === 'good') {
    student.lives = Math.min(MAX_LIVES, student.lives + 1);
    showFeedback(`${student.name} se comportó bien. ¡Gana 1 vida!`, 'good');

    if (selectedCard) {
      selectedCard.classList.remove('pulse-bad');
      selectedCard.classList.add('pulse-good');
      setTimeout(() => selectedCard.classList.remove('pulse-good'), 700);
    }
  } else {
    student.lives = Math.max(0, student.lives - 1);
    showFeedback(`${student.name} se portó mal. Pierde 1 vida.`, 'bad');

    if (selectedCard) {
      selectedCard.classList.remove('pulse-good');
      selectedCard.classList.add('pulse-bad');
      setTimeout(() => selectedCard.classList.remove('pulse-bad'), 700);
    }
  }

  const lifeEls = selectedCard?.querySelectorAll('.life') || [];
  lifeEls.forEach((lifeEl) => {
    lifeEl.classList.remove('bump');
    void lifeEl.offsetWidth;
    lifeEl.classList.add('bump');
    setTimeout(() => lifeEl.classList.remove('bump'), 260);
  });

  if (student.lives <= 0) {
    showFeedback(`${student.name} ya no tiene vidas. ¡Debe salir de la actividad!`, 'bad');
  }

  saveState();
  renderStudents();
};

document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('saveSessionBtn').addEventListener('click', saveSession);
document.getElementById('loadSessionBtn').addEventListener('click', loadSession);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('goodBehaviorBtn').addEventListener('click', () => applyBehaviorChange('good'));
document.getElementById('badBehaviorBtn').addEventListener('click', () => applyBehaviorChange('bad'));
searchInput.addEventListener('input', renderStudents);

const hasSavedSession = loadState();
if (hasSavedSession) {
  showFeedback('Se restauró la última sesión guardada.', 'good');
} else {
  showFeedback('Esperando acción del profesor...', 'neutral');
}

renderStudents();
