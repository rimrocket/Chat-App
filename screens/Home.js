import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, database } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import colors from "../colors";
import { Entypo, AntDesign } from '@expo/vector-icons';
import { signOut } from "firebase/auth";

const getUsersList = async (collectionName) => {
  const usersCollection = collection(database, collectionName);
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => user.id !== auth.currentUser?.uid);
};

export default function Home() {
  const [users, setUsers] = useState([]); 
  const [currentUserName, setCurrentUserName] = useState("User"); 
  const navigation = useNavigation();

  const onSignOut = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
    console.log("Logout successful");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={onSignOut}>
          <AntDesign name="logout" size={24} color={colors.gray} style={{ marginRight: 10 }} />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [usersList, sheltersList, homelessList] = await Promise.all([
          getUsersList("users"),
          getUsersList("shelters"),
          getUsersList("homeless"),
        ]);

        setUsers([...usersList, ...sheltersList, ...homelessList]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAllData();

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentUserName(user.displayName || "User");
    });

    return unsubscribe;
  }, []);

  const handleChat = async (otherUser) => {
    const loggedInUserId = auth.currentUser?.uid;
    const loggedInUserName = auth.currentUser?.displayName || "User";

    if (!loggedInUserId) {
      console.error("🚨 User not authenticated");
      return;
    }

    const chatId = [loggedInUserId, otherUser.id].sort().join("_"); 
    const chatRef = doc(database, "chats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, {
        users: {
          [loggedInUserId]: { id: loggedInUserId, name: loggedInUserName },
          [otherUser.id]: { id: otherUser.id, name: otherUser.name },
        },
        createdAt: new Date(),
      });
      console.log("🔥 Chat created:", chatId);
    } else {
      console.log("✅ Chat already exists:", chatId);
    }

    // ✅ Pass `chatId` to Chat.js
    navigation.navigate("Chat", { chatId });
    
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {currentUserName}!</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => handleChat(item)}>
            <Text style={styles.userName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity onPress={() => navigation.navigate("ChatList")} style={styles.chatButton}>
        <Entypo name="chat" size={24} color={colors.lightGray} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Map")} style={styles.mapButton}>
        <Entypo name="Map" size={24} color={colors.lightGray} />
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  userItem: { padding: 15, backgroundColor: "#f1f1f1", borderRadius: 8, marginBottom: 10 },
  userName: { fontSize: 18 },
  chatButton: {
    backgroundColor: colors.primary,
    height: 50, width: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9, shadowRadius: 8, marginRight: 20, marginBottom: 50,
  },
  mapButton: {
    backgroundColor: colors.primary,
    height: 50, width: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8, marginRight: 20, marginBottom: 50,
  },
});
