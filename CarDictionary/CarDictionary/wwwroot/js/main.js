const uri = 'https://localhost:7155/cars';

//Form
const form = document.querySelector('.form')
const inputs = [
  document.querySelector('#plateNumber'),
  document.querySelector('#brand'),
  document.querySelector('#color'),
  document.querySelector('#release-year'),
]

//Table filters
const filters = [
  document.querySelector('.plateNumber-filter'),
  document.querySelector('.brand-filter'),
  document.querySelector('.color-filter'),
  document.querySelector('.year-filter')
]
const filterRepr = {
  "Гос. номер": "plateNumber",
  "Марка": "brand",
  "Цвет": "color",
  "Год": "year"
}

//Statistics fields
const carCount = document.querySelector('.car-count');
const firstDate = document.querySelector('.first-date');
const lastDate = document.querySelector('.last-date');

//Buttons + dependencies
const postButton = document.querySelector('.post-btn');
const deleteButton = document.querySelector('.dlt-btn');
const notification = document.querySelector('.state-notification');
const loading = document.querySelector('.loading');
const states = {
  success: 'state-success',
  error: 'state-error',
  exist: 'state-exist',
  nonexist: 'state-nonexist'
}
const stateSaveQuotes = {
  success: "Данные об автомобиле успешно сохранены!",
  error: "Что-то пошло не так, попробуйте позднее",
  exist: "Автомобиль с таким гос. номером уже существует",
}
const stateDeleteQuotes = {
  success: "Данные об автомобиле были успешно удалены!",
  error: "Что-то пошло не так, попробуйте позднее",
  nonexist: "В базе данных нет автомобиля с данным гос.номером"
}

//Show status notification
function showStateNote(stateName, processQuotes) {
  notification.innerHTML = processQuotes[stateName];
  notification.className = "state-notification " + states[stateName];
  setTimeout(() => {notification.classList.add("hidden")}, 2000);
}

//"GET"
function getItems() {
  fetch(uri)
  .then(response => response.json())
  .then(data => _displayItems(data))
  .catch(error => console.error('Unable to get items.', error));
}

//"POST"
function postItem() {
  let item = {
    plateNumber: formatInputValue(inputs[0].value, 'plateNumber'),
    brand: formatInputValue(inputs[1].value, ''),
    color: formatInputValue(inputs[2].value, ''),
    year: inputs[3].value
  }

  if (!form.checkValidity()) return;
  
  loading.classList.remove('d-none');

  fetch(uri, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })
  .then(response => {
    loading.classList.add('d-none')
    if (response.ok) { 
      showStateNote('success', stateSaveQuotes); 
      updateStatistics('post');
    }
    else showStateNote('exist', stateSaveQuotes)
  })
  .then(() => {inputs.forEach(inp => inp.value = '')})
  .then(checkForPostBtn)
  .then(getItems)
  .catch(error => { 
    console.error('Unable to add item.', error);
    loading.classList.add('d-none'); 
    showStateNote('error', stateSaveQuotes) });
}

//"DELETE"
function deleteItem(id) {
  if (!form.checkValidity()) return;

  loading.classList.remove('d-none');

  fetch(`${uri}/${id}`, {
    method: 'DELETE'
  })
  .then(response => {
    loading.classList.add('d-none')
    if (response.ok) { showStateNote('success', stateDeleteQuotes); updateStatistics('delete'); }
    else showStateNote('nonexist', stateDeleteQuotes);
  })
  .then(() => { inputs[0].value = '' })
  .then(checkForDeleteBtn)
  .then(getItems)
  .catch(error => { 
    console.error('Unable to add item.', error);
    loading.classList.add('d-none'); 
    showStateNote('error', stateDeleteQuotes) });
}

//Display items from DB on page
function _displayItems(data) {
  const tBody = document.querySelector('tbody');
  tBody.innerHTML = '';

  data.forEach(item => {
    tr = document.createElement('tr');
    Object.entries(item).forEach(field => {
        th = document.createElement('th');
        th.className = "car";
        th.innerText = field[1];
        tr.append(th)
    })
    tBody.append(tr);
  });
}

//Get plate number in uppercase and other fields values capitalized
function formatInputValue(str, inputType) {
  switch (inputType) {
  case 'plateNumber':
    return str.toUpperCase();
  default:
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
}

//Sort items by given field name
async function sortByInput(param) {
  const response = await fetch(uri);
  let data = await response.json();
  data = data.sort((a, b) => a[param].toString().localeCompare(b[param].toString()));
  _displayItems(data);
}

//Check if post button should be available
function checkForPostBtn() {
  for (let item of inputs) {
    if (item.value === '') {
      postButton.setAttribute('disabled', true);
      return;
    }
  }
  postButton.removeAttribute('disabled');
}

//Check if delete button should be available
function checkForDeleteBtn() {
  if (inputs[0].value !== "" && inputs[1].value === "" && inputs[2].value === "" && inputs[3].value === "") deleteButton.removeAttribute('disabled')
  else deleteButton.setAttribute('disabled', true)
}

//Get current formatted time as DD.MM.YYYY HH:MM:SS
function getFormattedDateNow() {
  const dateNow = new Date();
  const day =  dateNow.getDate().toString().length < 2 ? '0' + dateNow.getDate() : dateNow.getDate();
  const month = (dateNow.getMonth() + 1).toString().length < 2 ? '0' + (dateNow.getMonth() + 1) : dateNow.getMonth();
  const year = dateNow.getFullYear();
  const hours = dateNow.getHours().toString().length < 2 ? '0' + dateNow.getHours() : dateNow.getHours();
  const minutes = dateNow.getMinutes().toString().length < 2 ? '0' + dateNow.getMinutes() : dateNow.getMinutes();
  const seconds = dateNow.getSeconds().toString().length < 2 ? '0' + dateNow.getSeconds() : dateNow.getSeconds();
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}

//Update statistics fields
async function updateStatistics(methodName) {
  carCount.innerText = await (await fetch(uri + '/stat')).text();
  if (carCount.innerText === '0') { 
    localStorage.clear(); 
    lastDate.innerText = '';
    firstDate.innerText = '';
    return;
   }
   switch (methodName) {
    case 'post':
      if (carCount.innerText === '1') {
        localStorage.setItem('first-date', getFormattedDateNow());
        firstDate.innerText = localStorage.getItem('first-date');
      }
      localStorage.setItem('last-date', getFormattedDateNow());
      lastDate.innerText = localStorage.getItem('last-date');
    case '':
      firstDate.innerText = localStorage.getItem('first-date');
      lastDate.innerText = localStorage.getItem('last-date');
   }
}

window.addEventListener('DOMContentLoaded', () => {
  inputs.forEach(inp => { inp.addEventListener('input', checkForPostBtn); inp.addEventListener('input', checkForDeleteBtn)})
  filters.forEach(filter => filter.addEventListener('click', () => { sortByInput(filterRepr[filter.innerText]); }));

  form.addEventListener('submit', (e) => { e.preventDefault(); })

  inputs[3].setAttribute('min', '1900')
  inputs[3].setAttribute('max', new Date().getFullYear());

  postButton.addEventListener('click', postItem);
  deleteButton.addEventListener('click', () => { 
    deleteItem(formatInputValue(inputs[0].value, 'plateNumber'));
  });

  getItems();
  updateStatistics('');
});