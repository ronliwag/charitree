import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, serverTimestamp, get} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyARsMEJn26cCEH3aVrkcVxvt9azZaEaegs",
    authDomain: "charitree-fed4b.firebaseapp.com",
    databaseURL: "https://charitree-fed4b-default-rtdb.asia-southeast1.firebasedatabase.app/",
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

// Make Firebase functions available globally
window.db = db;
window.ref = ref;
window.set = set;
window.get = get;
window.serverTimestamp = serverTimestamp;

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
        const fullname = document.getElementById("register-fullname").value;
        const email = document.getElementById("register-email").value;
        const contactNumber = document.getElementById("register-contact").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-confirm").value;
        
        // Simple validation
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        // Check if username already exists
        const userRef = ref(db, "users/" + username);
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    alert("Username already exists! Please choose a different username.");
                    return;
                }

                // Set user data in Firebase
                set(ref(db, "users/" + username), {
                    name: fullname,
                    email: email,
                    contactNumber: contactNumber,
                    password: password, // Note: In production, never store plain text passwords
                    avatar: "", // Empty string for new users - no default image
                    joinDate: serverTimestamp(),
                    totalXp: 0
                })
                .then(() => {
                    alert("User registered successfully! Please login with your new account.");
                    // Switch to login form
                    document.getElementById('register-form').style.display = 'none';
                    document.getElementById('login-form').style.display = 'flex';
                    document.querySelectorAll('.auth-tab').forEach(tab => {
                        if (tab.dataset.tab === 'login') {
                            tab.classList.add('active');
                        } else {
                            tab.classList.remove('active');
                        }
                    });
                    // Clear the register form
                    registerForm.reset();
                })
                .catch((error) => {
                    console.error("Error writing to Firebase: ", error);
                    alert("Registration failed: " + error.message);
                });
            })
            .catch((error) => {
                console.error("Error checking username: ", error);
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
                    username: username,
                    fullName: userData.name,
                    email: userData.email,
                    contactNumber: userData.contactNumber,
                    xp: userData.totalXp || 0,
                    avatar: userData.avatar || ""
                };

                window.isAdmin = document.querySelector('input[name="login-type"]:checked')?.value === "admin";

                // Optional: save to localStorage if you want session persistence
                localStorage.setItem("currentUser", JSON.stringify(window.currentUser));
                localStorage.setItem("isAdmin", window.isAdmin);

                alert("Login successful!");
                updateUIAfterLogin();
                document.getElementById('auth-modal').style.display = 'none';
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

    function generateDonationKey(username) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${username}_${timestamp}_${random}`;
    }

    function updateUIAfterLogin() {
        if (window.currentUser) {
            // Hide login/register buttons
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const userAvatar = document.getElementById('user-avatar');
            const logoutBtn = document.getElementById('logout-btn');
            const appSidebar = document.getElementById('app-sidebar');
            const usernameDisplay = document.getElementById('username-display');
            const totalXp = document.getElementById('total-xp');
            const adminNavItem = document.getElementById('admin-nav-item');

            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userAvatar) userAvatar.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (appSidebar) appSidebar.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = window.currentUser.fullName || window.currentUser.username;
            if (totalXp) totalXp.textContent = window.currentUser.xp || 0;
            if (adminNavItem && window.isAdmin) adminNavItem.style.display = 'block';

            // Update profile avatar - use default user image if no avatar is set
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) {
                if (window.currentUser.avatar && window.currentUser.avatar.trim() !== "") {
                    profileAvatar.src = window.currentUser.avatar;
                } else {
                    profileAvatar.src = 'src/image/user.png'; // Default user image for new accounts
                }
            }

            // Update user avatar in header
            const headerUserAvatar = document.querySelector('#user-avatar img');
            if (headerUserAvatar) {
                if (window.currentUser.avatar && window.currentUser.avatar.trim() !== "") {
                    headerUserAvatar.src = window.currentUser.avatar;
                } else {
                    headerUserAvatar.src = 'src/image/user.png'; // Default user image for new accounts
                }
            }
        }
    }

    function updateUIAfterLogout() {
        // Show login/register buttons
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userAvatar = document.getElementById('user-avatar');
        const logoutBtn = document.getElementById('logout-btn');
        const appSidebar = document.getElementById('app-sidebar');
        const adminNavItem = document.getElementById('admin-nav-item');

        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userAvatar) userAvatar.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (appSidebar) appSidebar.style.display = 'none';
        if (adminNavItem) adminNavItem.style.display = 'none';

        // Reset current section to home
        window.location.hash = 'home';
    }

    function logoutUser() {
        window.currentUser = null;
        window.isAdmin = false;
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
        
        updateUIAfterLogout();
        alert('Logged out successfully!');
    }
});
