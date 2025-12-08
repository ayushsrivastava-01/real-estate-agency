// auth-check.js - ULTIMATE FIX
console.log("🔒 Auth-check.js LOADING...");

// Block access IMMEDIATELY
(function() {
    // List of protected pages
    const PROTECTED_PAGES = ["Admin.html", "SearchDetails.html", "Details.html"];
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    console.log("📄 Current page:", currentPage);
    
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
        
        // Store where they tried to go
        localStorage.setItem('redirectAfterLogin', currentPage);
        
        // BLOCK PAGE LOAD IMMEDIATELY
        document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Denied</title>
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
                    p {
                        margin-bottom: 30px;
                        font-size: 1.1em;
                        opacity: 0.9;
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
                <meta http-equiv="refresh" content="2;url=index.html">
            </head>
            <body>
                <div class="container">
                    <h1>🔒 Access Restricted</h1>
                    <p>You must be logged in to access this page.</p>
                    <p>Redirecting to login page...</p>
                    <div class="spinner"></div>
                    <p style="margin-top: 20px; font-size: 0.9em;">
                        If not redirected, <a href="index.html" style="color: #ffd166;">click here</a>
                    </p>
                </div>
                <script>
                    // Force redirect after 2 seconds
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 2000);
                </script>
            </body>
            </html>
        `);
        
        // Stop all further execution
        throw new Error("Access blocked - not authenticated");
    }
    
    console.log("✅ Access granted!");
})();

// Authentication functions
window.authSystem = {
    // Login function
    login: function(email, password) {
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
        window.location.href = "index.html";
    },
    
    // Check if logged in
    isLoggedIn: function() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        const loginTime = localStorage.getItem('loginTime');
        
        // Check token exists
        if (!token || !email) return false;
        
        // Check token validity
        if (token !== "AYUSH_AUTH_9788" || email !== "ayush10@gmail.com") {
            this.logout();
            return false;
        }
        
        // Check session timeout (2 hours)
        if (loginTime) {
            const currentTime = new Date().getTime();
            const twoHours = 2 * 60 * 60 * 1000;
            if (currentTime - parseInt(loginTime) > twoHours) {
                this.logout();
                return false;
            }
        }
        
        return true;
    }
};

console.log("✅ Auth System Ready!");