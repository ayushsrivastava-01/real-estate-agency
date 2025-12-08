// auth-check.js - UPDATED FOR NETLIFY
console.log("🔒 Auth-check.js LOADING...");

// Block access IMMEDIATELY
(function() {
    // List of protected pages - handle ALL case variations
    const PROTECTED_PATHS = [
        "admin", "Admin", "admin.html", "Admin.html",
        "searchdetails", "SearchDetails", "searchdetails.html", "SearchDetails.html",
        "details", "Details", "details.html", "Details.html"
    ];
    
    // Get current page path
    const currentPath = window.location.pathname;
    console.log("📍 Full path:", currentPath);
    
    // Extract just the filename or last part
    let currentPage = currentPath.split('/').pop();
    if (!currentPage) currentPage = ''; // Handle root
    
    console.log("📄 Current page:", currentPage);
    console.log("🔒 Is protected?", PROTECTED_PATHS.includes(currentPage));
    
    // Check if user is authenticated
    function checkAuth() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        const isLoggedIn = token === "AYUSH_AUTH_9788" && email === "ayush10@gmail.com";
        
        console.log("🔑 Auth check result:", {
            hasToken: !!token,
            tokenValid: token === "AYUSH_AUTH_9788",
            emailValid: email === "ayush10@gmail.com",
            isLoggedIn: isLoggedIn
        });
        
        return isLoggedIn;
    }
    
    // If page is protected and user is NOT logged in
    if (PROTECTED_PATHS.includes(currentPage) && !checkAuth()) {
        console.log("🚫 ACCESS DENIED! Page is protected but user not authenticated");
        
        // Store the original page they tried to access
        localStorage.setItem('redirectAfterLogin', currentPage);
        
        // BLOCK and REDIRECT IMMEDIATELY
        document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Restricted | Sunrise Real Estate</title>
                <meta http-equiv="refresh" content="0;url=https://sunriserealestate.netlify.app/">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: Arial, sans-serif;
                        color: white;
                        text-align: center;
                    }
                    .container {
                        padding: 40px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.2);
                        max-width: 500px;
                    }
                    .spinner {
                        border: 5px solid rgba(255,255,255,0.3);
                        border-top: 5px solid white;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔒 Access Restricted</h1>
                    <p>Please login to access the admin panel.</p>
                    <div class="spinner"></div>
                    <p style="margin-top: 20px; font-size: 0.9em;">
                        Redirecting to homepage...
                    </p>
                </div>
            </body>
            </html>
        `);
        
        // Force stop execution
        throw new Error("Access blocked - authentication required");
    }
    
    console.log("✅ Access granted!");
})();

// Authentication functions
window.authSystem = {
    // Login function
    login: function(email, password) {
        console.log("🔐 Login attempt for:", email);
        
        if (email === "ayush10@gmail.com" && password === "9788") {
            // Set authentication tokens
            localStorage.setItem('adminToken', 'AYUSH_AUTH_9788');
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('loginTime', new Date().getTime());
            
            console.log("✅ Login successful!");
            
            // Get redirect destination
            const redirectTo = localStorage.getItem('redirectAfterLogin') || "Admin.html";
            console.log("🔄 Redirecting to:", redirectTo);
            
            // Clear redirect storage
            localStorage.removeItem('redirectAfterLogin');
            
            // Redirect
            setTimeout(() => {
                window.location.href = "https://sunriserealestate.netlify.app/" + redirectTo;
            }, 500);
            
            return true;
        }
        
        console.log("❌ Login failed - invalid credentials");
        return false;
    },
    
    // Logout function
    logout: function() {
        console.log("🚪 Logging out...");
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = "https://sunriserealestate.netlify.app/";
    },
    
    // Check if logged in
    isLoggedIn: function() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        const loginTime = localStorage.getItem('loginTime');
        
        // Basic checks
        if (!token || !email) {
            console.log("❌ Not logged in: Missing token or email");
            return false;
        }
        
        // Validate credentials
        if (token !== "AYUSH_AUTH_9788" || email !== "ayush10@gmail.com") {
            console.log("❌ Not logged in: Invalid token or email");
            this.logout();
            return false;
        }
        
        // Check session timeout (2 hours)
        if (loginTime) {
            const currentTime = new Date().getTime();
            const twoHours = 2 * 60 * 60 * 1000;
            if (currentTime - parseInt(loginTime) > twoHours) {
                console.log("❌ Not logged in: Session expired");
                this.logout();
                return false;
            }
        }
        
        console.log("✅ User is logged in as:", email);
        return true;
    },
    
    // Get current user
    getCurrentUser: function() {
        return localStorage.getItem('adminEmail');
    }
};

console.log("✅ Auth System Ready!");