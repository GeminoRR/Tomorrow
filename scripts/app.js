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

    //Get categories
    get(ref(db, `users/${auth.currentUser.uid}/categories`))
    .then((snapshot)=>{
        
        //Get categories
        let new_categories = JSON.parse(snapshot.val());
        if (!new_categories){
            new_categories = {};
        }

        //Change color format
        for (let key in new_categories){
            new_categories[key].color = HexToColor(new_categories[key].color)
        }

        //Update variable
        user_categories = new_categories;

    })
    .catch(error=>{
        swal("Une erreur est survenu", 'Impossible de récupérer les données utilisateur.', "error");
    });

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

        //Hide panel (on mobile)
        if (onMobile && nav.classList.contains('nav-mobile-showed')){
            mobile_nav_btn.click()
        }

    };
}

//Setup nav buttons
pages_handle_btn('nav_btn_home', 'page_home');
pages_handle_btn('nav_btn_agenda', 'page_agenda', show_agenda, hide_agenda);
pages_handle_btn('nav_btn_categories', 'page_categories', show_categories, hide_categories);
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

////////////////////////
////// COLOR UTIL //////
////////////////////////
function ColorToHex(color) {
    function rgbToHex(rgb) {
        let hex = Number(rgb).toString(16);
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    }
    const [r, g, b] = color.split(", ");
    const red = rgbToHex(r);
    const green = rgbToHex(g);
    const blue = rgbToHex(b);
    return red + green + blue;
}
function HexToColor(hex){
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

////////////////////
////// AGENDA //////
////////////////////
const days_container = [document.getElementById('agenda_day1'), document.getElementById('agenda_day2'), document.getElementById('agenda_day3'), document.getElementById('agenda_day4'), document.getElementById('agenda_day5'), document.getElementById('agenda_day6')]
const days_contents = [document.getElementById('agenda_day1_content'), document.getElementById('agenda_day2_content'), document.getElementById('agenda_day3_content'), document.getElementById('agenda_day4_content'), document.getElementById('agenda_day5_content'), document.getElementById('agenda_day6_content')]
const days_dates = [document.getElementById('agenda_day1_date'), document.getElementById('agenda_day2_date'), document.getElementById('agenda_day3_date'), document.getElementById('agenda_day4_date'), document.getElementById('agenda_day5_date'), document.getElementById('agenda_day6_date')]
const agenda_day1_name = document.getElementById('agenda_day1_name');
const week_name = document.getElementById('week_name');
const agenda_show_checked_tasks_btn = document.getElementById('agenda_show_checked_tasks_btn'); 

var user_events = {};
var current_monday;
const currentDay = new Date();

//Get this week monday
function getMondayDate(date) {
    const currentDate = new Date(date);
    const currentDayOfWeek = currentDate.getDay();
    const difference = currentDayOfWeek - 1;
    currentDate.setDate(currentDate.getDate() - difference);
    return currentDate;
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

    //Set lundi
    agenda_day1_name.textContent = "Lundi";


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
    if (onMobile){
        daysPerWeek = 1;
        let jour = current_monday.toLocaleDateString('fr-FR', { weekday: 'long' });
        agenda_day1_name.textContent = jour.charAt(0).toUpperCase() + jour.slice(1);
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
        let currentDayKey = DateToStr(date);
        let currentDayEvents = user_events[currentDayKey];
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
            let card_color = user_categories[event.cat];
            if (card_color === undefined){
                card_color = "var(--accentValues)";
            } else {
                card_color = card_color.color;
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
                showTask(currentDayKey, y);
            };

        }

    }

}

//Get last week
document.getElementById('week_left').addEventListener('click', ()=>{
    if (onMobile){
        current_monday.setDate(current_monday.getDate() - 1);
        if (current_monday.getDay() === 0){
            current_monday.setDate(current_monday.getDate() - 1);
        }
        if (current_monday.getDay() === 6 && !settings_saturday_input.checked){
            current_monday.setDate(current_monday.getDate() - 1);
        }
    } else {
        current_monday.setDate(current_monday.getDate() - 7);
    }
    agenda_updateWeek();
});

//Get next week
document.getElementById('week_right').addEventListener('click', ()=>{
    if (onMobile){
        current_monday.setDate(current_monday.getDate() + 1);
        if (current_monday.getDay() === 6 && !settings_saturday_input.checked){
            current_monday.setDate(current_monday.getDate() + 2);
        } else if (current_monday.getDay() === 0){
            current_monday.setDate(current_monday.getDate() + 1);
        }
    } else {
        current_monday.setDate(current_monday.getDate() + 7);
    }
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
const categories_container = document.getElementById('categories_container');
var user_categories = {};

//Show categories page
function show_categories(){

    //Set listener
    const eventsRef = ref(db, `users/${auth.currentUser.uid}/categories`);
    onValue(eventsRef, (snapshot)=>{

        //Get categories
        let new_categories = JSON.parse(snapshot.val());
        if (!new_categories){
            new_categories = {};
        }

        //Change color format
        for (let key in new_categories){
            new_categories[key].color = HexToColor(new_categories[key].color)
        }

        //Update variable
        user_categories = new_categories;

        //Udate categories
        categories_updateCategorie();

    });

}

//Hide categories page
function hide_categories(){
    
    //Detach listeners
    off(ref(db, `users/${auth.currentUser.uid}/categories`)); 

}

//Update categories
function categories_updateCategorie(){

    //Remove all child
    while (categories_container.firstChild){
        categories_container.removeChild(categories_container.firstChild);
    }

    //Loop through all categories
    for (let key in user_categories){

        //Create div
        let div = document.createElement('div');
        div.style = `--card-color: ${user_categories[key].color}`;
        let p = document.createElement('p');
        p.textContent = user_categories[key].name;
        div.appendChild(p);
        let div2 = document.createElement('div');
        let editBtn = document.createElement('button');
        let editBtnImg = document.createElement('img');
        editBtnImg.src = './ressources/app/edit.png';
        editBtn.appendChild(editBtnImg);
        div2.appendChild(editBtn);
        let deleteBtn = document.createElement('button');
        let deleteBtnImg = document.createElement('img');
        deleteBtnImg.src = './ressources/app/delete.png';
        deleteBtn.appendChild(deleteBtnImg);
        div2.appendChild(deleteBtn);
        div.appendChild(div2);
        categories_container.appendChild(div);

        //Edit categorie
        editBtn.onclick = ()=>{
            categories_update(key)
        };

        //Delete categorie
        deleteBtn.onclick = ()=>{
            swal({
                title:"Supprimer cette catégorie ?",
                text:"Cette action est définitive",
                dangerMode: true,
                buttons: true,
              }).then((result) => {
                if (result){
                    delete user_categories[key];
                    pushCategories();
                }
            });
        };

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
    menu_addtask_date.focus();
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
const menu_showtask_delete = document.getElementById('menu_showtask_delete');

menu_showtask_close.onclick = ()=>{
    menu_container.click();
}

function showTask(eventDay, index) {

    //Get event
    let event = user_events[eventDay][index];

    //Load event menu
    showMenu('menu_showtask');
    menu_showtask_name.textContent = event.title;
    menu_showtask_desc.textContent = event.desc;
    menu_showtask_checkbox.checked = event.checked;

    //Check event
    menu_showtask_checkbox.onclick = ()=>{

        menu_container.click();
        event.checked = menu_showtask_checkbox.checked;
        pushEvents();

    }

    //Delete event
    menu_showtask_delete.onclick = ()=>{
        swal({
            title:"Supprimer cette tache ?",
            text:"Cette action est définitive",
            dangerMode: true,
            buttons: true,
          }).then((result) => {
            if (result){
                menu_container.click();
                user_events[eventDay].splice(index, 1);
                pushEvents();
            }
        });
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

///////////////////////////
////// ADD CATEGORIE //////
///////////////////////////
const menu_addcategorie_name = document.getElementById('menu_addcategorie_name');
const menu_addcategorie_color = document.getElementById('menu_addcategorie_color');
const menu_addcategorie_cancel = document.getElementById('menu_addcategorie_cancel');
const menu_addcategorie_validate = document.getElementById('menu_addcategorie_validate');

document.getElementById('categories_addcategorie').addEventListener('click', ()=>{
    menu_addcategorie_name.value = '';
    menu_addcategorie_color.value = '#2C5CE9';
    showMenu("menu_addcategorie");
    menu_addcategorie_name.focus();
});

//Cancel
menu_addcategorie_cancel.onclick = ()=>{
    menu_container.click();
}

//Add categories
menu_addcategorie_validate.onclick = ()=>{
    
    //Close menu
    menu_container.click();
    
    //Get day
    let id = 0;
    while (user_categories[id] !== undefined){
        id += 1;
    }

    //Add categorie
    user_categories[id] = {
        name: menu_addcategorie_name.value,
        color: HexToColor(menu_addcategorie_color.value.substr(1))
    }

    //Push modification to database
    pushCategories();

}

///////////////////////////
////// ADD CATEGORIE //////
///////////////////////////
const menu_updatecategorie_name = document.getElementById('menu_addcategorie_name');
const menu_updatecategorie_color = document.getElementById('menu_addcategorie_color');
const menu_updatecategorie_cancel = document.getElementById('menu_addcategorie_cancel');
const menu_updatecategorie_validate = document.getElementById('menu_addcategorie_validate');

function categories_update(key){
    menu_updatecategorie_name.value = user_categories[key].name;
    menu_updatecategorie_color.value = "#" + ColorToHex(user_categories[key].color);
    showMenu("menu_addcategorie");
    menu_updatecategorie_name.focus();

    //Update categories
    menu_updatecategorie_validate.onclick = ()=>{

        //Close menu
        menu_container.click();

        //Add categorie
        user_categories[key] = {
            name: menu_updatecategorie_name.value,
            color: HexToColor(menu_updatecategorie_color.value.substr(1))
        }

        //Push modification to database
        pushCategories();

    }

};

//Cancel
menu_updatecategorie_cancel.onclick = ()=>{
    menu_container.click();
}

/////////////////////////////
////// PUSH CATEGORIES //////
/////////////////////////////
function pushCategories(){

    //Convert
    for (let key in user_categories){
        user_categories[key].color = ColorToHex(user_categories[key].color);
    }
    //Push to database
    update(ref(db, `users/${auth.currentUser.uid}`),{
        categories: JSON.stringify(user_categories)
    });

}

////////////////////////
////// MOBILE NAV //////
////////////////////////
const mobile_nav_btn = document.getElementById('mobile_nav_btn');
const mobile_nav_btn_img = document.getElementById('mobile_nav_btn_img');
const nav = document.getElementsByTagName('nav')[0];
mobile_nav_btn.onclick = ()=>{
    if (nav.classList.contains('nav-mobile-showed')){
        mobile_nav_btn_img.src = 'ressources/header/menu.png';
        nav.classList.remove('nav-mobile-showed');
    } else {
        mobile_nav_btn_img.src = 'ressources/header/back.png';
        nav.classList.add('nav-mobile-showed');
    }
}

var onMobile = false;
const mediaQuery = window.matchMedia('(max-width: 600px)');
function handleDeviceSizeChange(e) {
    if (e.matches) {
        onMobile = true;
        for (let i = 1; i < days_container.length; i++){
            days_container[i].hidden = true;
        }
        days_container[0].style.width = '100%';
    } else {
        onMobile = false;
        for (let i = 1; i < days_container.length; i++){
            days_container[i].hidden = false;
        }
        days_container[0].style.width = 'calc(100% / 5)';
        current_monday = getMondayDate(current_monday);
        if (document.getElementById('page_agenda').style.display == 'flex'){
            hide_agenda();
            show_agenda();
        }
    }
}
mediaQuery.addListener(handleDeviceSizeChange);
handleDeviceSizeChange(mediaQuery);