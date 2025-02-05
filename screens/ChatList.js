import React, { useState, useEffect } from "react";
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, where, doc, getDoc, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, database } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loggedInUserId = auth.currentUser?.uid; // Safely access the logged-in user
    if (!loggedInUserId) return; // Stop if the user is not logged in

    setLoading(true); // Start loading spinner

    const chatsQuery = query(
      collection(database, "chats"),
      where("users", "array-contains", loggedInUserId)
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        try {
          const chatsList = await Promise.all(
            snapshot.docs.map(async (chatDoc) => {
              const chat = chatDoc.data();
              const otherUserId = chat.users.find((userId) => userId !== loggedInUserId);

              // Helper function to fetch user details
              const fetchUserFromCollection = async (collectionName, userId) => {
                const userDoc = await getDoc(doc(database, collectionName, userId));
                return userDoc.exists() ? userDoc.data() : null;
              };

              // Fetch the other user
              const otherUser =
                (await fetchUserFromCollection("users", otherUserId)) ||
                (await fetchUserFromCollection("homeless", otherUserId)) ||
                (await fetchUserFromCollection("shelters", otherUserId));

              // Fetch the last message on initial load
              const messagesRef = collection(database, "chats", chatDoc.id, "messages");
              const messagesQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
              const messagesSnapshot = await getDocs(messagesQuery);

              //if (messagesSnapshot.empty) {
                //return null; // Exclude this chat if no messages exist. The code will stop here,actual chat will be null and the next iteration will begin. 
             // }
          
              const lastMessageData = messagesSnapshot.docs[0]?.data();
              const lastMessage = lastMessageData?.text || "No messages yet";
              const createdAt = lastMessageData?.createdAt?.toDate() || null;
              const read = lastMessageData?.read || false;

              // Ensure the blue circle only appears for the recipient
              const hasUnread =
                !read && // Message is unread
                lastMessageData?.user._id !== loggedInUserId; // Message was sent by someone else

              // Set up a real-time listener for the last message
              const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
                const message = messagesSnapshot.docs[0]?.data();
                if (message) {
                  const updatedLastMessage = message.text || "Media message";
                  const updatedCreatedAt = message.createdAt?.toDate() || null;
                  const updatedRead = message?.read || false;

                  // Update the specific chat in the state
                  setChats((prevChats) =>
                    prevChats.map((prevChat) =>
                      prevChat.id === chatDoc.id
                        ? {
                            ...prevChat,
                            lastMessage: updatedLastMessage,
                            createdAt: updatedCreatedAt,
                            read: updatedRead,
                            hasUnread: !updatedRead && message.user._id !== loggedInUserId, // Recalculate unread indicator
                          }
                        : prevChat
                    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  );
                }
              });

              return {
                id: chatDoc.id,
                otherUserName: otherUser?.name || "Unknown User",
                lastMessage,
                createdAt,
                hasUnread, // Correctly calculated `hasUnread`
                unsubscribeMessages, // Store the unsubscribe function
              };
            })
          );

          // Filter out null values (chats without messages) before sorting
          //const filteredChatsList = chatsList.filter((chat) => chat !== null);

          // Sort chats by createdAt before setting them in state
          //const sortedChatsList = filteredChatsList.sort(
          const sortedChatsList = chatsList.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );


          setChats(sortedChatsList); // Update state with initial data
          setLoading(false); // Stop loading spinner
        } catch (error) {
          console.error("Error fetching chats:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error with Firestore snapshot:", error);
        setLoading(false);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribe(); // Unsubscribe from chats listener
      chats.forEach((chat) => chat.unsubscribeMessages?.()); // Unsubscribe from message listeners
    };
  }, []);

  const openChat = (chat) => {
    navigation.navigate("Chat", { chatId: chat.id, otherUserName: chat.otherUserName });
  };

  if (loading) {
    return <Text>Loading chats...</Text>; // Display a loading message while fetching
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
            <View style={styles.chatRow}>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>Chat with: {item.otherUserName}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </View>
              {/* Display the blue circle for unread messages */}
              {item.hasUnread && (
                <View style={styles.unreadIndicatorWrapper}>
                  <Text style={styles.unreadIndicatorText}>●</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "No messages yet"}
            </Text>
          </TouchableOpacity>
        )}
      />
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
  chatItem: {
    padding: 15,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 10,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  unreadIndicatorWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadIndicatorText: {
    fontSize: 14,
    color: "#007bff", // Blue color for the unread indicator
    fontWeight: "bold",
  },
});
