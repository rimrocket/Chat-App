const admin = require("firebase-admin");

// Initialize the Admin SDK
const serviceAccount = require("./chatapp-5c181-firebase-adminsdk-tk9km-d392331769.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const updateDisplayNames = async () => {
  try {
    console.log("Fetching all users...");

    // Fetch all users in Firebase Authentication
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;

    for (const user of users) {
      // Skip users who already have a displayName
      if (user.displayName) {
        console.log(`User ${user.uid} already has a displayName: ${user.displayName}`);
        continue;
      }

      console.log(`Processing user: ${user.uid}`);

      // Helper function to fetch user details from Firestore
      const fetchUserFromFirestore = async (uid) => {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) return userDoc.data().name;

        const homelessDoc = await db.collection("homeless").doc(uid).get();
        if (homelessDoc.exists) return homelessDoc.data().name;

        const shelterDoc = await db.collection("shelters").doc(uid).get();
        if (shelterDoc.exists) return shelterDoc.data().name;

        return null; // Fallback if the user is not found
      };

      // Fetch the name for this user from Firestore
      const name = await fetchUserFromFirestore(user.uid);

      if (!name) {
        console.log(`No name found for user ${user.uid} in Firestore.`);
        continue;
      }

      // Update the displayName in Firebase Authentication
      await auth.updateUser(user.uid, { displayName: name });
      console.log(`Updated displayName for user ${user.uid}: ${name}`);
    }

    console.log("Display names updated for all users.");
  } catch (error) {
    console.error("Error updating display names:", error);
  }
};

// Run the script
updateDisplayNames();
