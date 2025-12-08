// auth-check.js - CASE-INSENSITIVE VERSION
console.log("🔒 Auth-check.js LOADING...");

// Block access IMMEDIATELY
(function() {
    // List of protected pages (all lowercase for comparison)
    const PROTECTED_PAGES = ["admin.html", "searchdetails.html", "details.html"];
    
    // Get current page (convert to lowercase)
    const currentPage = window.location.pathname.toLowerCase().split('/').pop();
    console.log("📄 Current page (lowercase):", currentPage);
    
    // Check if current page is protected
    const isProtected = PROTECTED_PAGES.includes(currentPage);
    console.log("🔒 Is protected?", isProtected);
    
    // Check if user is authenticated
    function checkAuth() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        const isLoggedIn = token === "AYUSH_AUTH_9788" && email === "ayush10@gmail.com";
        
        console.log("🔑 Authentication check:", {
            hasToken: !!token,
            email: email,
            isLoggedIn: isLoggedIn
        });
        
        return isLoggedIn;
    }
    
    // If page is protected and user is NOT logged in
    if (isProtected && !checkAuth()) {
        console.log("🚫 ACCESS DENIED! Redirecting...");
        
        // Store where they tried to go (with correct case)
        const originalPage = window.location.pathname.split('/').pop();
        localStorage.setItem('redirectAfterLogin', originalPage);
        
        // BLOCK PAGE LOAD IMMEDIATELY
        document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Denied - Sunrise Real Estate</title>
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
                    h1 {
                        margin-bottom: 20px;
                        font-size: 2.5em;
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
                    <p>You must login to access this page.</p>
                    <div class="spinner"></div>
                    <p style="margin-top: 20px; font-size: 0.9em;">
                        Redirecting to homepage...
                    </p>
                </div>
            </body>
            </html>
        `);
        
        // Force redirect after 1 second
        setTimeout(() => {
            window.location.href = "https://sunriserealestate.netlify.app/";
        }, 1000);
        
        // Stop all further execution
        throw new Error("Access blocked - not authenticated");
    }
    
    console.log("✅ Access granted!");
})();

// Authentication functions
window.authSystem = {
    // Login function
    login: function(email, password) {
        console.log("Login attempt:", email);
        if (email === "ayush10@gmail.com" && password === "9788") {
            localStorage.setItem('adminToken', 'AYUSH_AUTH_9788');
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('loginTime', new Date().getTime());
            console.log("✅ Login successful!");
            
            // Redirect to intended page or admin dashboard
            const redirectTo = localStorage.getItem('redirectAfterLogin') || "Admin.html";
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectTo;
            return true;
        }
        console.log("❌ Login failed!");
        return false;
    },
    
    // Logout function
    logout: function() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('redirectAfterLogin');
        console.log("✅ Logged out");
        window.location.href = "https://sunriserealestate.netlify.app/";
    },
    
    // Check if logged in
    isLoggedIn: function() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        const loginTime = localStorage.getItem('loginTime');
        
        // Check token exists
        if (!token || !email) {
            console.log("❌ No auth token found");
            return false;
        }
        
        // Check token validity
        if (token !== "AYUSH_AUTH_9788" || email !== "ayush10@gmail.com") {
            console.log("❌ Invalid token");
            this.logout();
            return false;
        }
        
        // Check session timeout (2 hours)
        if (loginTime) {
            const currentTime = new Date().getTime();
            const twoHours = 2 * 60 * 60 * 1000;
            if (currentTime - parseInt(loginTime) > twoHours) {
                console.log("❌ Session expired");
                this.logout();
                return false;
            }
        }
        
        console.log("✅ User authenticated:", email);
        return true;
    }
};

console.log("✅ Auth System Ready!");