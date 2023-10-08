/////////////////////
////// IMPORTS //////
/////////////////////
import { auth, onAuthStateChanged, signOut, db, ref, onValue, off, deleteUser, remove, get, update } from "./firebase.js";

//////////////////////
////// SETTINGS //////
//////////////////////
const settings_color_input = document.getElementById('settings_color_input');
const settings_saturday_input = document.getElementById('settings_saturday_input');

//Update color
function settings_UpdateAccentColor(){

    const r = parseInt(settings_color_input.value.substr(1,2), 16);
    const g = parseInt(settings_color_input.value.substr(3,2), 16);
    const b = parseInt(settings_color_input.value.substr(5,2), 16);

    document.documentElement.style.setProperty('--accentValues', `${r}, ${g}, ${b}`);

}

//Settings change color
settings_color_input.addEventListener('change', ()=>{

    //Update ui color
    settings_UpdateAccentColor();

    //Update database
    update(ref(db, `users/${auth.currentUser.uid}/preferences`), {
        accent: settings_color_input.value.substr(1)
    });

});

//Settings change show_saturday
settings_saturday_input.addEventListener('change', ()=>{

    //Update database
    update(ref(db, `users/${auth.currentUser.uid}/preferences`), {
        show_saturday: settings_saturday_input.checked
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

//////////////////////////////
////// USER PREFERENCES //////
//////////////////////////////
const loader = document.getElementById('loader');

//Get user preferences from database
onAuthStateChanged(auth, (user) => {

    //User is not connected
    if (!user) {
        window.location.href = "signin.html";
    }

    //Get user preferences
    get(ref(db, `users/${auth.currentUser.uid}/preferences`))
    .then(snapshot=>{

        //Accent color
        settings_color_input.value = '#' + snapshot.val().accent;
        settings_UpdateAccentColor();
    
        //Show checked_task
        agenda_show_checked_tasks_btn.setAttribute('checked', snapshot.val().show_checked_tasks);
        if (snapshot.val().show_checked_tasks){
            agenda_show_checked_tasks_btn.textContent = "Masquer les taches finies"
        } else {
            agenda_show_checked_tasks_btn.textContent = "Montrer les taches finies"
        }

        //Show saturday
        settings_saturday_input.checked = snapshot.val().show_saturday;

        //Load agenda
        pages_nav_buttons[1].click();

        //Remove loader
        loader.classList.add('loader-end');
        setTimeout(() => {
            loader.hidden = true;
        }, 300);
        
    })
    .catch(error=>{
        swal("Une erreur est survenu", 'Impossible de récupérer les données utilisateur.', "error");
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

//////////////////////
////// SIGN OUT //////
//////////////////////
document.getElementById('nav_btn_logout').addEventListener('click', ()=>{
    signOut(auth)
    .catch((err)=>{
        swal("Une erreur est survenu", err.message, "error");
    });
});

///////////////////
////// PAGES //////
///////////////////
const pages_contents = document.getElementById('content').children;
const pages_nav_buttons = Array.from(document.getElementById('nav_buttons').children);
pages_nav_buttons.push(document.getElementById('nav_btn_settings'));

function pages_handle_btn(btn_id, page_id, on_page_start, on_page_end) {
    
    //Set on_page_end
    document.getElementById(page_id).addEventListener('on_page_end', ()=>{
        if (on_page_end){
            on_page_end();
        }
    });

    //On click
    document.getElementById(btn_id).onclick = ()=>{

        //Already on page
        if (document.getElementById(page_id).style.display === 'flex'){
            return;
        }

        //Remove all pages
        for (let i = 0; i < pages_contents.length; i++) {
            const page = pages_contents[i];
            
            if (page.style.display == 'flex' && page.id !== page_id){
                //is displayed but need to be hidden
                page.dispatchEvent(new CustomEvent('on_page_end'))
                page.style.display = 'none';
            } else {
                //Other cases
                if (page.id === page_id){
                    page.style.display = 'flex';
                } else {
                    page.style.display = 'none';
                }
            }

        }

        //Set nav buttons
        for (let i = 0; i < pages_nav_buttons.length; i++) {
            const button = pages_nav_buttons[i];
            if (button.id === btn_id){
                button.classList.add('nav-button-active');
            } else {
                button.classList.remove('nav-button-active');
            }
        }

        //Handler
        if (on_page_start){
            on_page_start();
        }

    };
}

//Setup nav buttons
pages_handle_btn('nav_btn_home', 'page_home');
pages_handle_btn('nav_btn_agenda', 'page_agenda', show_agenda, hide_agenda);
pages_handle_btn('nav_btn_categories', 'page_categories');
pages_handle_btn('nav_btn_settings', 'page_settings');

///////////////////////
////// DATE UTIL //////
///////////////////////
function DateToStr(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function StrToDate(str){
    const dateParts = str.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    return new Date(year, month, day);
}

////////////////////
////// AGENDA //////
////////////////////
const days_container = [document.getElementById('agenda_day1'), document.getElementById('agenda_day2'), document.getElementById('agenda_day3'), document.getElementById('agenda_day4'), document.getElementById('agenda_day5'), document.getElementById('agenda_day6')]
const days_contents = [document.getElementById('agenda_day1_content'), document.getElementById('agenda_day2_content'), document.getElementById('agenda_day3_content'), document.getElementById('agenda_day4_content'), document.getElementById('agenda_day5_content'), document.getElementById('agenda_day6_content')]
const days_dates = [document.getElementById('agenda_day1_date'), document.getElementById('agenda_day2_date'), document.getElementById('agenda_day3_date'), document.getElementById('agenda_day4_date'), document.getElementById('agenda_day5_date'), document.getElementById('agenda_day6_date')]
const week_name = document.getElementById('week_name');
const agenda_show_checked_tasks_btn = document.getElementById('agenda_show_checked_tasks_btn'); 

var user_events = {};
var current_monday;
const currentDay = new Date();

//Get this week monday
function getMondayDate(date) {
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    return monday;
}
current_monday = getMondayDate(currentDay);

//Show agenda page
function show_agenda(){

    //Show saturday
    if (settings_saturday_input.checked){
        days_container[5].hidden = false;
    } else {
        days_container[5].hidden = true;
    }

    //Set listener
    const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
    onValue(eventsRef, (snapshot)=>{

        //Get events
        user_events = JSON.parse(snapshot.val());
        if (!user_events){
            user_events = {};
        }

        //Udate week
        agenda_updateWeek();

    });


}

//Hide agenda page
function hide_agenda(){
    
    //Detach listeners
    off(ref(db, `users/${auth.currentUser.uid}/events`)); 

}

//Update week agenda
function agenda_updateWeek(){

    //Current date
    week_name.textContent = `${current_monday.getDate().toString().padStart(2, '0')}/${(current_monday.getMonth() + 1).toString().padStart(2, '0')}/${current_monday.getFullYear()}`

    //Days per week (for loop)
    let daysPerWeek = 5;
    if (settings_saturday_input.checked){
        daysPerWeek = 6;
    }

    //Show checked tasks
    let showCheckedTask = agenda_show_checked_tasks_btn.getAttribute('checked') === 'true';

    //Update events
    const date = new Date(current_monday);
    date.setDate(date.getDate() - 1);
    for (let i = 0; i < daysPerWeek; i++){

        //Get date
        date.setDate(date.getDate() + 1);

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
        let currentDayEvents = user_events[DateToStr(date)];
        if (currentDayEvents === undefined){
            continue;
        }

        //Add new events
        for (let y = 0; y < currentDayEvents.length; y++) {
            const event = currentDayEvents[y];
            
            //Event checked => not show in agenda
            if (event.checked & !showCheckedTask){
                continue;
            }

            //Get categories color
            let card_color = user_categories[event.cat].color;
            if (card_color === undefined){
                card_color = "var(--accentValues)";
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
                showTask(event);
            };

        }

    }

}

//Get last week
document.getElementById('week_left').addEventListener('click', ()=>{
    current_monday.setDate(current_monday.getDate() - 7);
    agenda_updateWeek();
});

//Get next week
document.getElementById('week_right').addEventListener('click', ()=>{
    current_monday.setDate(current_monday.getDate() + 7);
    agenda_updateWeek();
});

//Settings change show_checked_task
agenda_show_checked_tasks_btn.onclick = ()=>{

    //Get state
    let state = agenda_show_checked_tasks_btn.getAttribute('checked') === 'true';
    
    //Update state
    state = !state; 
    agenda_show_checked_tasks_btn.setAttribute('checked', state);

    //Update ui
    if (state){
        agenda_show_checked_tasks_btn.textContent = "Masquer les taches finies"
    } else {
        agenda_show_checked_tasks_btn.textContent = "Montrer les taches finies"
    }
    agenda_updateWeek();

    //Update database
    update(ref(db, `users/${auth.currentUser.uid}/preferences`), {
        show_checked_tasks: state
    });
}

/////////////////////////
////// PUSH EVENTS //////
/////////////////////////
function pushEvents(){
    update(ref(db, `users/${auth.currentUser.uid}`),{
        events: JSON.stringify(user_events)
    });
}

////////////////////////
////// CATEGORIES //////
////////////////////////
var user_categories = {
    0:{
        name: 'Mathématique',
        color: '227, 114, 42'
    },
    1:{
        name: 'Anglais',
        color: '100, 256, 42'
    },
    2:{
        name: 'Gestion de proj.',
        color: '52, 124, 250'
    }
};

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
    menu_addtask_date.value = DateToStr(currentDay);
    menu_addtask_name.value = '';
    menu_addtask_desc.value = '';
    while (menu_addtask_cat.firstChild){
        menu_addtask_cat.removeChild(menu_addtask_cat.firstChild);
    }
    for (let key in user_categories) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = user_categories[key].name;
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
    let day = user_events[menu_addtask_date.value];
    if (day === undefined){
        user_events[menu_addtask_date.value] = [];
        day = user_events[menu_addtask_date.value];
    }

    //Add event    
    day.push({
        "title": menu_addtask_name.value,
        "desc": menu_addtask_desc.value,
        "cat": menu_addtask_cat.value,
    });

    //Push modification to database
    pushEvents();

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

function showTask(event) {

    showMenu('menu_showtask');
    menu_showtask_name.textContent = event.title;
    menu_showtask_desc.textContent = event.desc;
    menu_showtask_checkbox.checked = event.checked;

    menu_showtask_checkbox.onclick = ()=>{

        menu_container.click();
        event.checked = menu_showtask_checkbox.checked;
        pushEvents();

    }

}

//////////////////
////// MENU //////
//////////////////
const menu_container = document.getElementById('menu_container');

//Show menu
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