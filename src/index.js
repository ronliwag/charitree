// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";

// Your web app's Firebase configuration
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
const db = getDatabase();

/**
 * Writes user data to the database
 * @param {string} userId - Unique user ID
 * @param {string} name - User's full name
 * @param {string} email - User's email (unique)
 * @param {string} avatarUrl - URL to user's avatar image
 * @param {number} totalXp - User's total XP points
 */
function writeUserData(userId, name, email, avatarUrl, totalXp = 0) {
    const userRef = ref(db, `users/${userId}`);
    
    set(userRef, {
        name: name,
        email: email,
        avatarUrl: avatarUrl,
        totalXp: totalXp,
        joinDate: serverTimestamp()
    });
}

/**
 * Writes donation data to the database
 * @param {string} donationId - Unique donation ID
 * @param {string} userId - ID of donating user
 * @param {string} charityId - ID of receiving charity
 * @param {string} type - "monetary" or "item"
 * @param {string} message - Optional message from donor
 * @param {number} xpEarned - XP points earned
 * @param {object} details - Type-specific donation details
 * @param {string} status - Donation status
 */
function writeDonationData(donationId, userId, charityId, type, message, xpEarned, details, status = "pending") {
    const donationRef = ref(db, `donations/${donationId}`);
    
    set(donationRef, {
        userId: userId,
        charityId: charityId,
        type: type,
        message: message || "",
        xpEarned: xpEarned,
        donationDate: serverTimestamp(),
        status: status,
        details: details
    });
}

/**
 * Writes charity data to the database
 * @param {string} charityId - Unique charity ID
 * @param {string} name - Charity name
 * @param {object} address - Charity address object
 * @param {string} contactEmail - Charity contact email
 * @param {string} verificationStatus - Verification status
 */
function writeCharityData(charityId, name, address, contactEmail, verificationStatus = "unverified") {
    const charityRef = ref(db, `charities/${charityId}`);
    
    set(charityRef, {
        name: name,
        address: {
            street: address.street,
            city: address.city,
            country: address.country
        },
        contactEmail: contactEmail,
        verificationStatus: verificationStatus
    });
}

/**
 * Writes tree data to the database
 * @param {string} treeId - Unique tree ID
 * @param {string} userId - ID of user who donated for this tree
 * @param {string} charityId - ID of charity managing the tree
 * @param {string} species - Tree species
 * @param {object} location - Geo location {lat, lng}
 * @param {string} status - Tree growth status
 */
function writeTreeData(treeId, userId, charityId, species, location, status = "sapling") {
    const treeRef = ref(db, `trees/${treeId}`);
    
    set(treeRef, {
        userId: userId,
        charityId: charityId,
        plantedDate: serverTimestamp(),
        species: species,
        location: {
            lat: location.lat,
            lng: location.lng
        },
        status: status,
        lastMaintenanceDate: serverTimestamp()
    });
}

// Example usage of the functions:

// Create a user
writeUserData(
    "user123",
    "Alfred Palpal-Latoc",
    "palpallatocalfredjoshua0302@gmail.com",
    "https://example.com/avatars/user123.jpg",
    15800
);

// Create a monetary donation
writeDonationData(
    "donation456",
    "user123",
    "charity789",
    "monetary",
    "Happy to help!",
    12500,
    {
        amount: 2500,
        paymentMethod: "GCash"
    },
    "completed"
);

// Create an item donation
writeDonationData(
    "donation789",
    "user123",
    "charity789",
    "item",
    "Hope these help!",
    1000,
    {
        itemType: "clothes",
        weight: 10,
        deliveryMethod: "drop-off"
    },
    "verified"
);

// Create a charity
writeCharityData(
    "charity789",
    "Caritas Manila",
    {
        street: "2002 Jesus St.",
        city: "Manila",
        country: "Philippines"
    },
    "contact@caritasmanila.org",
    "verified"
);

// Create a tree record
writeTreeData(
    "tree321",
    "user123",
    "charity789",
    "Narra",
    { lat: 14.5995, lng: 120.9842 },
    "growing"
);