/**
 * Authentication Check System
 * Protects specific pages from direct access
 */

// ONLY these 3 pages are restricted
const RESTRICTED_PAGES = [
    "Admin.html",
    "SearchDetails.html", 
    "Details.html"
];

// Check if current page is restricted
function isPageRestricted() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    // Debug: Log the current page (remove in production)
    console.log("Current page:", currentPage);
    console.log("Is restricted?", RESTRICTED_PAGES.includes(currentPage));
    
    return RESTRICTED_PAGES.includes(currentPage);
}

// Check if user is authenticated (using your existing login system)
function isAuthenticated() {
    // Check if admin is logged in (from your existing login system)
    const adminEmail = localStorage.getItem('adminEmail');
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    return adminLoggedIn && adminEmail === "ayush10@gmail.com";
}

// Redirect to login page
function redirectToLogin() {
    // Store the page they tried to access
    const currentPage = window.location.pathname.split('/').pop();
    localStorage.setItem('redirectAfterLogin', currentPage);
    
    // Redirect to your index.html (which has the admin login modal)
    window.location.href = "index.html";
}

// Check and protect pages on load
function protectPage() {
    if (isPageRestricted() && !isAuthenticated()) {
        console.log("Page is restricted and user is not authenticated. Redirecting...");
        redirectToLogin();
    }
}

// Auto-check authentication when page loads
document.addEventListener('DOMContentLoaded', function() {
    protectPage();
    
    // If authenticated and on restricted page, add logout button
    if (isAuthenticated() && isPageRestricted()) {
        addLogoutButton();
    }
});

// Add logout button to protected pages
function addLogoutButton() {
    // Check if logout button already exists
    if (document.getElementById('auth-logout-btn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'auth-logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 8px;
        cursor: pointer;
        z-index: 9999;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(255,107,107,0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    logoutBtn.onmouseenter = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(255,107,107,0.4)';
    };
    
    logoutBtn.onmouseleave = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(255,107,107,0.3)';
    };
    
    logoutBtn.onclick = function() {
        if (confirm('Are you sure you want to logout from the admin session?')) {
            // Clear authentication
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('redirectAfterLogin');
            
            // Redirect to home page
            window.location.href = "index.html";
        }
    };
    
    document.body.appendChild(logoutBtn);
}

// Function to set authentication (call this after successful login)
function setAuthentication(email) {
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminEmail', email);
    localStorage.setItem('adminLoginTime', new Date().getTime());
    
    // Check if there's a redirect URL stored
    const redirectTo = localStorage.getItem('redirectAfterLogin');
    if (redirectTo && RESTRICTED_PAGES.includes(redirectTo)) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
    } else {
        window.location.href = "Admin.html"; // Default redirect
    }
}

// Function to clear authentication
function clearAuthentication() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('redirectAfterLogin');
}

// Auto-logout after 2 hours
setTimeout(function() {
    if (isAuthenticated()) {
        const loginTime = localStorage.getItem('adminLoginTime');
        const currentTime = new Date().getTime();
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        if (currentTime - loginTime > twoHours) {
            clearAuthentication();
            if (isPageRestricted()) {
                redirectToLogin();
            }
        }
    }
}, 60000); // Check every minute

// Export functions for use in other files
window.authSystem = {
    isAuthenticated,
    setAuthentication,
    clearAuthentication,
    protectPage,
    isPageRestricted
};