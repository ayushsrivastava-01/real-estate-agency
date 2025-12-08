/**
 * Authentication Check System - RESTRICTED VERSION
 * Blocks direct access to Admin.html, SearchDetails.html, and Details.html
 */

// ONLY these 3 pages are restricted
const RESTRICTED_PAGES = [
    "Admin.html",
    "SearchDetails.html", 
    "Details.html"
];

// Hardcoded admin credentials (in production, use server-side validation)
const ADMIN_CREDENTIALS = {
    email: "ayush10@gmail.com",
    password: "9788"
};

// ==================== CORE AUTH FUNCTIONS ====================

// Check if current page is restricted
function isPageRestricted() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    console.log("Checking page:", currentPage);
    console.log("Restricted pages:", RESTRICTED_PAGES);
    
    return RESTRICTED_PAGES.includes(currentPage);
}

// Check if user is authenticated
function isAuthenticated() {
    const authToken = sessionStorage.getItem('adminAuthToken');
    const authEmail = sessionStorage.getItem('adminEmail');
    const authTime = sessionStorage.getItem('authTime');
    
    // Check if token exists
    if (!authToken || !authEmail) {
        console.log("No auth token found");
        return false;
    }
    
    // Check token validity (2 hour expiry)
    if (authTime) {
        const currentTime = new Date().getTime();
        const loginTime = parseInt(authTime);
        const expiryTime = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        if (currentTime - loginTime > expiryTime) {
            console.log("Token expired");
            clearAuth();
            return false;
        }
    }
    
    // Verify token matches expected format
    const expectedToken = generateToken(authEmail);
    if (authToken !== expectedToken) {
        console.log("Invalid token");
        clearAuth();
        return false;
    }
    
    console.log("User authenticated:", authEmail);
    return true;
}

// Generate secure token
function generateToken(email) {
    return btoa(email + "|" + ADMIN_CREDENTIALS.password + "|" + Date.now()).replace(/=/g, '');
}

// Set authentication after successful login
function setAuthentication(email) {
    const token = generateToken(email);
    const authTime = new Date().getTime();
    
    sessionStorage.setItem('adminAuthToken', token);
    sessionStorage.setItem('adminEmail', email);
    sessionStorage.setItem('authTime', authTime.toString());
    sessionStorage.setItem('adminLoggedIn', 'true');
    
    console.log("Authentication set for:", email);
}

// Clear authentication (logout)
function clearAuth() {
    sessionStorage.removeItem('adminAuthToken');
    sessionStorage.removeItem('adminEmail');
    sessionStorage.removeItem('authTime');
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('redirectAfterLogin');
    
    console.log("Authentication cleared");
}

// Validate login credentials
function validateLogin(email, password) {
    return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

// Redirect to login page
function redirectToLogin() {
    // Store current page for redirect after login
    const currentPage = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    sessionStorage.setItem('redirectAfterLogin', currentPage);
    
    // Force redirect to index.html (which has login modal)
    window.location.href = "index.html";
    
    // Prevent any further execution on current page
    throw new Error("Redirecting to login");
}

// ==================== PAGE PROTECTION ====================

// Main protection function - CALL THIS ON EVERY RESTRICTED PAGE
function protectPage() {
    console.log("Protecting page...");
    console.log("Page restricted:", isPageRestricted());
    console.log("Authenticated:", isAuthenticated());
    
    if (isPageRestricted() && !isAuthenticated()) {
        console.log("Access denied! Redirecting to login...");
        redirectToLogin();
        return false; // Page should not load
    }
    
    console.log("Access granted!");
    return true; // Page can load
}

// ==================== EVENT HANDLERS ====================

// Run protection when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - Checking authentication");
    
    if (!protectPage()) {
        // If protection fails, stop everything
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="font-size: 2.5em; margin-bottom: 20px;">
                        <i class="fas fa-lock" style="color: #ff6b6b;"></i>
                        Access Restricted
                    </h1>
                    <p style="font-size: 1.2em; margin-bottom: 30px;">
                        Redirecting to login page...
                    </p>
                    <div style="font-size: 3em;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
                        If redirection doesn't work, <a href="index.html" style="color: #ffd166;">click here</a>
                    </p>
                </div>
            </div>
        `;
        
        // Force redirect after 3 seconds
        setTimeout(() => {
            window.location.href = "index.html";
        }, 3000);
    } else {
        // If authenticated, add logout button and session timer
        addLogoutButton();
        startSessionTimer();
    }
});

// ==================== UI FUNCTIONS ====================

// Add logout button to authenticated pages
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
            clearAuth();
            window.location.href = "index.html";
        }
    };
    
    document.body.appendChild(logoutBtn);
}

// Session timer to show remaining time
function startSessionTimer() {
    const authTime = sessionStorage.getItem('authTime');
    if (!authTime) return;
    
    const updateTimer = () => {
        const currentTime = new Date().getTime();
        const loginTime = parseInt(authTime);
        const expiryTime = 2 * 60 * 60 * 1000; // 2 hours
        const remainingTime = expiryTime - (currentTime - loginTime);
        
        if (remainingTime <= 0) {
            clearAuth();
            window.location.href = "index.html";
            return;
        }
        
        // Update logout button with time remaining (optional)
        const logoutBtn = document.getElementById('auth-logout-btn');
        if (logoutBtn) {
            const minutes = Math.floor(remainingTime / 60000);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            if (minutes < 15) {
                logoutBtn.innerHTML = `<i class="fas fa-clock" style="color: #ffd166;"></i> ${mins}m`;
                logoutBtn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
            }
        }
    };
    
    // Update every minute
    setInterval(updateTimer, 60000);
    updateTimer(); // Initial call
}

// ==================== EXPORT FUNCTIONS ====================

// Make functions available globally
window.authSystem = {
    isAuthenticated,
    setAuthentication,
    clearAuth,
    validateLogin,
    protectPage,
    isPageRestricted
};

// Console warning for developers
console.log("🔒 Auth System Loaded - Protecting:", RESTRICTED_PAGES);