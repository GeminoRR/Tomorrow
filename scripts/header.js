//////////////////
////// LOGO //////
//////////////////
document.getElementById('header_logo').onclick = ()=>{
    window.location.href = "index.html";
}

//////////////////////
////// OPEN APP //////
//////////////////////
document.getElementById('header_open_app').onclick = ()=>{
    window.location.href = 'app.html';
}

////////////////////////
////// MOBILE NAV //////
////////////////////////
const mobile_header_btn = document.getElementById('mobile_header_btn');
const mobile_header_btn_img = document.getElementById('mobile_header_btn_img');
const header = document.getElementsByTagName('header')[0];
mobile_header_btn.onclick = ()=>{
    if (header.classList.contains('header-mobile-showed')){
        mobile_header_btn_img.src = 'ressources/header/menu.png';
        header.classList.remove('header-mobile-showed');
    } else {
        mobile_header_btn_img.src = 'ressources/header/back.png';
        header.classList.add('header-mobile-showed');
    }
}