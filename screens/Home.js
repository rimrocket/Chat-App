import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, database } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import colors from "../colors";
import { Entypo } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { signOut } from "firebase/auth";

// Function to fetch users
const getUsersList = async () => {
  const usersCollection = collection(database, "users");
  const usersSnapshot = await getDocs(usersCollection);
  const usersList = usersSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(user => user.id !== auth.currentUser.uid);
  return usersList;
};

// Function to fetch shelters
const getSheltersList = async () => {
  const sheltersCollection = collection(database, "shelters");
  const sheltersSnapshot = await getDocs(sheltersCollection);
  const sheltersList = sheltersSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(shelter => shelter.id !== auth.currentUser.uid);
  return sheltersList;
};

// Function to fetch homeless data
const getHomelessList = async () => {
  const homelessCollection = collection(database, "homeless");
  const homelessSnapshot = await getDocs(homelessCollection);
  const homelessList = homelessSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(homeless => homeless.id !== auth.currentUser.uid);
  return homelessList;
};

export default function Home() {
  const [users, setUsers] = useState([]); // State to store all users
  const [currentUserName, setCurrentUserName] = useState("User"); // State to store the current user's name
  const navigation = useNavigation();

  const onSignOut = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
    console.log("Logout successful");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 10 }}
          onPress={onSignOut}
        >
          <AntDesign name="logout" size={24} color={colors.gray} style={{ marginRight: 10 }} />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all data concurrently
        const [usersList, sheltersList, homelessList] = await Promise.all([
          getUsersList(),
          getSheltersList(),
          getHomelessList(),
        ]);

        // Combine all lists
        setUsers([...usersList, ...sheltersList, ...homelessList]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAllData();

    // Listen for changes to the current user's display name
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserName(user.displayName || "User");
      }
    });

    // Cleanup the listener on unmount
    return unsubscribe;
  }, []);

  const handleChat = async (otherUser) => {
    const loggedInUserId = auth.currentUser.uid;
    const chatId = [loggedInUserId, otherUser.id].sort().join("_");

    const chatRef = doc(database, "chats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, {
        users: [loggedInUserId, otherUser.id],
        createdAt: new Date(),
      });
      console.log("Chat created between users:", loggedInUserId, "and", otherUser.id);
    } else {
      console.log("Chat already exists");
    }

    // Navigate to the chat screen
    navigation.navigate("Chat", { otherUserId: otherUser.id, otherUserName: otherUser.name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {currentUserName}!</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleChat(item)}
          >
            <Text style={styles.userName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("ChatList")}
        style={styles.chatButton}
      >
        <Entypo name="chat" size={24} color={colors.lightGray} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  userItem: {
    padding: 15,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
  },
  chatButton: {
    backgroundColor: colors.primary,
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    marginRight: 20,
    marginBottom: 50,
  },
});
