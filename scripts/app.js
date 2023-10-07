/////////////////////
////// IMPORTS //////
/////////////////////
import { auth, onAuthStateChanged, signOut, db, ref, onValue, deleteUser, remove, get, update } from "./firebase.js";

///////////////////////
////// VARIABLES //////
///////////////////////
const loader = document.getElementById('loader');

///////////////////
////// DATES //////
///////////////////
function stringifyDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
}
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    if (day && month && year) {
        const parsedDay = parseInt(day, 10);
        const parsedMonth = parseInt(month, 10) - 1; // Les mois dans JavaScript commencent à partir de 0
        const parsedYear = parseInt(year, 10);

        if (!isNaN(parsedDay) && !isNaN(parsedMonth) && !isNaN(parsedYear)) {
            return new Date(parsedYear, parsedMonth, parsedDay);
        }
    }
    return null; // Retourne null en cas de format de date invalide
}

//////////////////////
////// SETTINGS //////
//////////////////////
const settings_saturday = document.getElementById('settings_saturday');
const settings_color = document.getElementById('settings_color');

//Update color
function updateAccent(){
    
    const r = parseInt(settings_color.value.substr(1,2), 16);
    const g = parseInt(settings_color.value.substr(3,2), 16);
    const b = parseInt(settings_color.value.substr(5,2), 16);

    document.documentElement.style.setProperty('--accentValues', `${r}, ${g}, ${b}`);

}
settings_color.addEventListener('change', ()=>{

    updateAccent();
    update(ref(db, `users/${auth.currentUser.uid}`), {
        accent: settings_color.value.substr(1)
    });

});

//Update saturday
function updateSaturday(){
    if (settings_saturday.checked){
        daysPerWeek = 6;
        days_container[5].hidden = false;
        // console.log(current_monday.getDate())
        // console.log(currentDay.getDate() + 2)
        // if (currentDay.getDay() === 6 && current_monday.getDate() === currentDay.getDate() + 2){
        //     current_monday.setDate(current_monday.getDate() - 7); // Ajoute 7 jours pour obtenir le lundi de la semaine prochaine
        //     updateWeek();
        // }
    } else {
        daysPerWeek = 5;
        days_container[5].hidden = true;
        // if (currentDay.getDay() === 6 && current_monday.getDate() === getMondayDate(currentDay).getDate()){
        //     current_monday.setDate(current_monday.getDate() + 7); // Ajoute 7 jours pour obtenir le lundi de la semaine prochaine
        //     updateWeek();
        // }
    }
}
settings_saturday.addEventListener('change', ()=>{

    updateSaturday();
    update(ref(db, `users/${auth.currentUser.uid}`), {
        show_saturday: settings_saturday.checked
    });

});

//Delete account
document.getElementById('delete_account_btn').addEventListener('click', ()=>{
    swal({
        title:"Supprimer votre compte ?",
        text:"Cette action est définitive",
        dangerMode: true,
        buttons: true,
      }).then((result) => {
        if (result){
            remove(ref(db, `users/${auth.currentUser.uid}`))
            .then(()=>{
                deleteUser(auth.currentUser).then(() => {
                    window.location.href = "index.html";
                }).catch((error) => {
                    swal("Une erreur est survenu", error.message, "error");
                });
            })
            .catch((error)=>{
                swal("Une erreur est survenu", error.message, "error");
            });
        }
    });
});

////////////////////////
////// CATEGORIES //////
////////////////////////
let categories = [{name:"red", color:"227, 114, 42", id:'0'}, {name:"yellow", color:"254, 185, 46", id:'1'}]

function updateCategories(){

}

///////////////////
////// PAGES //////
///////////////////
const pages = document.getElementById('content').children;
const buttons = Array.from(document.getElementById('nav_buttons').children);
buttons.push(document.getElementById('nav_btn_settings'));
function nav_addbtn(btn_id, page_id, handler) {
    document.getElementById(btn_id).addEventListener('click', ()=>{

        //Remove all pages
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (page.id === page_id){
                page.style.display = 'flex';
            } else {
                page.style.display = 'none';
            }
        }

        //Set nav buttons
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            if (button.id === btn_id){
                button.classList.add('nav-button-active');
            } else {
                button.classList.remove('nav-button-active');
            }
        }

        //Handler
        if (handler){
            handler();
        }

    });
}

//Setup nav buttons
nav_addbtn('nav_btn_home', 'page_home', ()=>{});
nav_addbtn('nav_btn_agenda', 'page_agenda', updateWeek);
nav_addbtn('nav_btn_categories', 'page_categories', updateCategories);
nav_addbtn('nav_btn_settings', 'page_settings', null);

////////////////////
////// AGENDA //////
////////////////////
const days_container = [document.getElementById('agenda_day1'), document.getElementById('agenda_day2'), document.getElementById('agenda_day3'), document.getElementById('agenda_day4'), document.getElementById('agenda_day5'), document.getElementById('agenda_day6')]
const days_contents = [document.getElementById('agenda_day1_content'), document.getElementById('agenda_day2_content'), document.getElementById('agenda_day3_content'), document.getElementById('agenda_day4_content'), document.getElementById('agenda_day5_content'), document.getElementById('agenda_day6_content')]
const days_dates = [document.getElementById('agenda_day1_date'), document.getElementById('agenda_day2_date'), document.getElementById('agenda_day3_date'), document.getElementById('agenda_day4_date'), document.getElementById('agenda_day5_date'), document.getElementById('agenda_day6_date')]
const week_name = document.getElementById('week_name');
let events = [];
let current_monday;
const currentDay = new Date();
let daysPerWeek = 6;

//Get this week monday
function getMondayDate(day) {
    const today = new Date(day);
    const dayOfWeek = today.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi
    const daysUntilMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const mondayDate = new Date(day);
    mondayDate.setDate(today.getDate() - daysUntilMonday);
    return mondayDate;
}

//Get date
current_monday = getMondayDate(currentDay);
if (current_monday.getDay() === 0) { // Si aujourd'hui est un samedi (6) ou un dimanche (0)
    current_monday.setDate(current_monday.getDate() + 7); // Ajoute 7 jours pour obtenir le lundi de la semaine prochaine
}

//Get last week
document.getElementById('week_left').addEventListener('click', ()=>{
    current_monday.setDate(current_monday.getDate() - 7);
    updateWeek();
});

//Get next week
document.getElementById('week_right').addEventListener('click', ()=>{
    current_monday.setDate(current_monday.getDate() + 7);
    updateWeek();
});

//Update week
function updateWeek(){
    
    //Current date
    week_name.textContent = `${current_monday.getDate().toString().padStart(2, '0')}/${(current_monday.getMonth() + 1).toString().padStart(2, '0')}/${current_monday.getFullYear()}`

    //Update events
    const date = new Date(current_monday);
    date.setDate(date.getDate() - 1);
    for (let i = 0; i < daysPerWeek; i++){
        
        //Get date
        date.setDate(date.getDate() + 1);
        const date_str = stringifyDate(date);
        
        //Set date
        days_dates[i].textContent = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

        //Current day
        if (date.getFullYear() === currentDay.getFullYear() && date.getMonth() === currentDay.getMonth() && date.getDate() === currentDay.getDate()){
            days_container[i].classList.add('agenda-day-today');
        } else {
            days_container[i].classList.remove('agenda-day-today');
        }

        //Remove events
        while (days_contents[i].firstChild){
            days_contents[i].removeChild(days_contents[i].firstChild);
        }
        
        //Get current day events
        let day = null;
        for (let j = 0; j < events.length; j++) { 
            if (events[j].date === date_str){
                day = events[j];
                break;
            }
        }
        if (!day){
            continue;
        }

        //Add new events
        for (let y = 0; y < day.events.length; y++) {
            const event = day.events[y];
            if (event.checked & !show_checked_tasks){
                continue;
            }

            //Get categories color
            let card_color = "var(--accentValues)";
            for (let z = 0; z < categories.length; z++) {
                if (categories[z].id === event.cat){
                    card_color = categories[z].color;
                    break;
                }                
            }

            //Create card
            let card = document.createElement('div');
            card.classList = "agenda-card";
            card.style = `--card-color: ${card_color}`;
            let title = document.createElement('p');
            title.classList = "agenda-card-title";
            title.textContent = event.title;
            card.appendChild(title);
            let subtitle = document.createElement('p');
            subtitle.classList = "agenda-card-subtitle";
            subtitle.textContent = event.desc;
            card.appendChild(subtitle);
            days_contents[i].appendChild(card);

            //Card click evet
            card.onclick = ()=>{
                showTask(day, event);
            };

        }

    }

}

///////////////////////
////// CONNEXION //////
///////////////////////
function waitFor(condition) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
        if (condition()) {
            clearInterval(interval);
            resolve();
        }
      }, 50);
    });
  }
onAuthStateChanged(auth, (user) => {
    if (user) {

        //No load week
        let loadWeek = 0

        //Get accent color
        get(ref(db, `users/${auth.currentUser.uid}/accent`))
        .then(snapshot=>{
            settings_color.value = '#' + snapshot.val();
            updateAccent();
            loadWeek += 1;
        })
        .catch(error=>{
            swal("Une erreur est survenu", 'Impossible de récupérer les données utilisateur. (./accent)', "error");
        });

        //Get saturday
        get(ref(db, `users/${auth.currentUser.uid}/show_saturday`))
        .then(snapshot=>{
            settings_saturday.checked = snapshot.val();
            updateSaturday();
            loadWeek += 1;
        })
        .catch(error=>{
            swal("Une erreur est survenu", 'Impossible de récupérer les données utilisateur. (./show_saturday)', "error");
        });

        //Show tasks
        get(ref(db, `users/${auth.currentUser.uid}/show_checked_tasks`))
        .then(snapshot=>{
            show_checked_tasks = snapshot.val();
            updateToggleShowCheckedTasksBtn();
            loadWeek += 1;
        })
        .catch(error=>{
            swal("Une erreur est survenu", 'Impossible de récupérer les données utilisateur. (./show_checked_tasks)', "error");
        });

        //Realtime update
        const eventsRef = ref(db, `users/${user.uid}/events`);
        onValue(eventsRef, (snapshot)=>{

            //Get events
            events = JSON.parse(snapshot.val());
            if (!events){
                events = [];
            }

            //Load user data
            loadWeek += 1;

        });

        //Wait until everything is loaded
        waitFor(()=>{loadWeek > 3}).then(()=>{
            
            //Load user data
            document.getElementById('nav_btn_agenda').click();
            
            //Remove loader
            loader.classList.add('loader-end');
            setTimeout(() => {
                loader.hidden = true;
            }, 300);

        });

    } else {

        // User need to sign in
        window.location.href = "signin.html";

    }
});

//////////////////////
////// SIGN OUT //////
//////////////////////
document.getElementById('nav_btn_logout').addEventListener('click', ()=>{
    signOut(auth)
    .then(()=>{
        window.location.href = "index.html";
    })
    .catch((err)=>{
        swal("Une erreur est survenu", err.message, "error");
    });
});

///////////////////////////
////// LOAD SVG ICON //////
///////////////////////////
const nav_logo = document.getElementById('nav_logo');
fetch(nav_logo.getAttribute("src"))
.then(response => response.text())
.then(svgText => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");    
    nav_logo.parentNode.replaceChild(svgDoc.documentElement, nav_logo);
})
.catch(error => {
    console.error("Une erreur s'est produite lors du chargement du SVG :", error);
});

////////////////////////
////// INPUT DATE //////
////////////////////////
function setInputDateToDate(elm, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    elm.value = `${year}-${month}-${day}`;
}
function InputDateToDate(value) {
    const [year, month, day] = value.split('-');
    return new Date(year, month - 1, day);
}

///////////////////////////////////////
////// TOGGLE SHOW CHECKED TASKS //////
///////////////////////////////////////
const agenda_toggle_checked_tasks = document.getElementById('agenda_toggle_checked_tasks');
var show_checked_tasks = false;

agenda_toggle_checked_tasks.onclick = ()=>{
    show_checked_tasks = !show_checked_tasks;
    updateToggleShowCheckedTasksBtn();
    updateWeek();
    update(ref(db, `users/${auth.currentUser.uid}`), {
        show_checked_tasks: settshow_checked_tasks
    });
}
function updateToggleShowCheckedTasksBtn(){
    if (show_checked_tasks){
        agenda_toggle_checked_tasks.textContent = "Fermer les taches finies"
    } else {
        agenda_toggle_checked_tasks.textContent = "Montrer les taches finies"
    }
}

//////////////////////
////// ADD TASK //////
//////////////////////
const menu_addtask_date = document.getElementById('menu_addtask_date');
const menu_addtask_name = document.getElementById('menu_addtask_name');
const menu_addtask_desc = document.getElementById('menu_addtask_desc');
const menu_addtask_cat = document.getElementById('menu_addtask_cat');
const menu_addtask_cancel = document.getElementById('menu_addtask_cancel');
const menu_addtask_validate = document.getElementById('menu_addtask_validate');

document.getElementById('agenda_addtask_btn').addEventListener('click', ()=>{
    setInputDateToDate(menu_addtask_date, currentDay);
    menu_addtask_name.value = '';
    menu_addtask_desc.value = '';
    while (menu_addtask_cat.firstChild){
        menu_addtask_cat.removeChild(menu_addtask_cat.firstChild);
    }
    for (let i = 0; i < categories.length; i++) {
        const option = document.createElement('option');
        option.value = categories[i].id;
        option.textContent = categories[i].name;
        menu_addtask_cat.appendChild(option);
    }
    showMenu("menu_addtask");
    menu_addtask_name.focus();
});

//Cancel
menu_addtask_cancel.onclick = ()=>{
    menu_container.click();
}

//Add task
menu_addtask_validate.onclick = ()=>{
    
    //Close menu
    menu_container.click();
    
    //Get day
    const date_str = stringifyDate(InputDateToDate(menu_addtask_date.value));
    let day = null;
    for (let i = 0; i < events.length; i++) { 
        if (events[i].date === date_str){
            day = events[i];
            break;
        }
    }
    if (!day){
        day = {
            date: date_str,
            events: []
        }
        events.push(day);
    }

    //Add event    
    day.events.push({
        "title": menu_addtask_name.value,
        "desc": menu_addtask_desc.value,
        "cat": menu_addtask_cat.value,
    });

    //Push modification to database
    pushEvents();

}

/////////////////////////
////// PUSH EVENTS //////
/////////////////////////
function pushEvents(){
    update(ref(db, `users/${auth.currentUser.uid}`),{
        events: JSON.stringify(events)
    });
}

////////////////////////
////// SHOW EVENT //////
////////////////////////
const menu_showtask_name = document.getElementById('menu_showtask_name');
const menu_showtask_desc = document.getElementById('menu_showtask_desc');
const menu_showtask_close = document.getElementById('menu_showtask_close');
const menu_showtask_checkbox = document.getElementById('menu_showtask_checkbox');

menu_showtask_close.onclick = ()=>{
    menu_container.click();
}

function showTask(day, event) {

    showMenu('menu_showtask');
    menu_showtask_name.textContent = event.title;
    menu_showtask_desc.textContent = event.desc;
    menu_showtask_checkbox.checked = event.checked;

    menu_showtask_checkbox.onclick = ()=>{

        event.checked = true;
        pushEvents();

    }

}

//////////////////
////// MENU //////
//////////////////
const menu_container = document.getElementById('menu_container');

function showMenu(menuID) {
    
    const menu = document.getElementById(menuID);

    menu_container.style.display = 'flex';
    menu.hidden = false;
    setTimeout(() => {
        menu_container.classList.add('menu-visible');
        menu.classList.add('menu-visible');
    }, 1); //Idk why this work but this work, i don't want to use @keyframes

    menu_container.onclick = (e)=>{
        if (e.currentTarget !== e.target) return;
        menu_container.classList.remove('menu-visible');
        menu.classList.remove('menu-visible');
        setTimeout(() => {
            menu.hidden = true;
            menu_container.style.display = 'none';
        }, 200);
    }

    document.onkeydown = (e)=>{
        if(e.key === "Escape") {
            menu_container.click();
        }
    }

}