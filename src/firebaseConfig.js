import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, serverTimestamp, get} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyARsMEJn26cCEH3aVrkcVxvt9azZaEaegs",
    authDomain: "charitree-fed4b.firebaseapp.com",
    databaseURL: "https://charitree-fed4b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "charitree-fed4b",
    storageBucket: "charitree-fed4b.firebasestorage.app",
    messagingSenderId: "770475286583",
    appId: "1:770475286583:web:e7b104ea036482e89fdfb2",
    measurementId: "G-KHX4WZEWKN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Wait for DOM to be loaded
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const storedUser = localStorage.getItem("currentUser");
    const storedAdmin = localStorage.getItem("isAdmin");
    const monetaryForm = document.getElementById("monetary-form");
    const itemForm = document.getElementById("item-form");


    if (storedUser) {
        window.currentUser = JSON.parse(storedUser);
        window.isAdmin = storedAdmin === "true";
        updateUIAfterLogin();
    }

    //register logic
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("register-username").value;
        //const fullname = document.getElementById("register-fullname").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-confirm").value;
        
        // Simple validation
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        // Set user data in Firebase
        set(ref(db, "users/" + username), {
            name: username,  //switch to fullname when implemented
            email: email,
            password: password, // Note: In production, never store plain text passwords
            avatar: "",
            joinDate: serverTimestamp(),
            totalXp: 0
        })
        .then(() => {
            alert("User registered successfully!");
        })
        .catch((error) => {
            console.error("Error writing to Firebase: ", error);
            alert("Registration failed: " + error.message);
        });
        });
    }

    // Login logic
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        const userRef = ref(db, "users/" + username);

        get(userRef)
            .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.password === password) {
                window.currentUser = {
                    username: userData.name,
                    email: userData.email,
                    xp: userData.totalXp || 0,
                };

                window.isAdmin = document.querySelector('input[name="login-type"]:checked')?.value === "admin";

                // Optional: save to localStorage if you want session persistence
                localStorage.setItem("currentUser", JSON.stringify(window.currentUser));
                localStorage.setItem("isAdmin", window.isAdmin);

                alert("Login successful!");
                updateUIAfterLogin();
                } else {
                alert("Incorrect password.");
                }
            } else {
                alert("User not found.");
            }
            })
            .catch((error) => {
            console.error("Login error: ", error);
            alert("Login failed: " + error.message);
            });
        });
    }

    // Logout Logic
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutUser();
        }); 
    }
    
    if (monetaryForm) {
        monetaryForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentUserId = window.currentUser?.username || "anonymous"; // <== moved here
        const donationId = generateDonationKey(currentUserId);
        const donationDate = new Date().toISOString();
        const charityId = document.getElementById("charity").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const paymentMethod = document.getElementById("payment-method").value;
        const message = document.getElementById("message").value.trim();

        const data = {
            userId: currentUserId,
            charityId: charityId,
            type: "monetary",
            message: message || null,
            xpEarned: Math.floor(amount / 10), // Example: 1 XP per ₱10
            donationDate: donationDate,
            status: "pending",
            details: {
            amount: amount,
            paymentMethod: paymentMethod
            }
        };

        set(ref(db, `donations/${donationId}`), data)
            .then(() => {
            alert("Thank you for your monetary donation!");
            monetaryForm.reset();
            })
            .catch((err) => {
            console.error("Error submitting monetary donation:", err);
            alert("Something went wrong. Please try again.");
            });
        });
    }

    if (itemForm) {
        itemForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentUserId = window.currentUser?.username || "anonymous"; // <== moved here
        const donationId = generateDonationKey(currentUserId);
        const donationDate = new Date().toISOString();
        const charityId = document.getElementById("item-charity").value; //implement charity name = charityid matching
        const itemType = document.querySelector('input[name="donation-type"]:checked').value;
        const weight = parseFloat(document.getElementById("item-weight").value);
        const deliveryMethod = document.getElementById("delivery-method").value;
        const message = document.getElementById("item-message").value.trim();

        const data = {
            userId: currentUserId,
            charityId: charityId,
            type: "item",
            message: message || null,
            xpEarned: Math.floor(weight * 5), // Example: 5 XP per kg
            donationDate: donationDate,
            status: "pending",
            details: {
            itemType: itemType,
            weight: weight,
            deliveryMethod: deliveryMethod
            }
        };

        set(ref(db, `donations/${donationId}`), data)
            .then(() => {
            alert("Thank you for your item donation!");
            itemForm.reset();
            })
            .catch((err) => {
            console.error("Error submitting item donation:", err);
            alert("Something went wrong. Please try again.");
            });
        });
    }


});

    function generateDonationKey(username) {
        const safeUsername = username.replace(/[.#$\[\]/]/g, '_');
        return `${safeUsername}_${Date.now()}`;
    }

    function updateUIAfterLogin() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userAvatar = document.getElementById('user-avatar');
        const logoutBtn = document.getElementById('logout-btn');
        const appSidebar = document.getElementById('app-sidebar');
        const usernameDisplay = document.getElementById('username-display');
        const totalXp = document.getElementById('total-xp');
        const adminNavItem = document.getElementById('admin-nav-item');

        // Hide login/register buttons, show avatar and logout
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userAvatar) {
            userAvatar.style.display = 'block';
            userAvatar.src = 'src/image/leo.jpg';
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // Show sidebar
        if (appSidebar) appSidebar.style.display = 'block';

        // Update user info
        if (usernameDisplay && window.currentUser) {
            usernameDisplay.textContent = window.currentUser.username;
        }
        if (totalXp && window.currentUser) {
            totalXp.textContent = window.currentUser.xp.toLocaleString();
        }

        // Show admin nav item if admin
        if (adminNavItem) {
            adminNavItem.style.display = window.isAdmin ? 'block' : 'none';
        }

        window.location.hash = window.isAdmin ? 'admin' : 'home';
        }

    function updateUIAfterLogout() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userAvatar = document.getElementById('user-avatar');
        const logoutBtn = document.getElementById('logout-btn');
        const appSidebar = document.getElementById('app-sidebar');
        const adminNavItem = document.getElementById('admin-nav-item');

        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (userAvatar) userAvatar.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (appSidebar) appSidebar.style.display = 'none';
        if (adminNavItem) adminNavItem.style.display = 'none';

        window.location.hash = 'home';
        }

    function logoutUser() {
        // Clear session data
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isAdmin");

        // Clear global variables
        window.currentUser = null;
        window.isAdmin = false;

        // Update the UI
        updateUIAfterLogout();
    }
