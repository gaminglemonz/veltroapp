let menuOpen = false;
const profileMenu = document.getElementById('profile-menu');
const profileLink = document.getElementById('profile');

const toggleProfileMenu = () => {
    switch (menuOpen){
        case false:
            profileMenu.style.display = "block";
            menuOpen = true;
        break;
        case true:
            profileMenu.style.display = "none";
            menuOpen = false;
        break;
    }
}
profileLink.addEventListener('click', toggleProfileMenu);