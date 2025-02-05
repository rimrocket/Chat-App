import React, { useState, useLayoutEffect, useCallback } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import { collection, addDoc, orderBy, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { auth, database } from "../config/firebase";
import { useRoute } from "@react-navigation/native";

export default function Chat() {
  const [messages, setMessages] = useState([]);

  const route = useRoute();
  const { chatId } = route.params;

  useLayoutEffect(() => {
    if (!chatId) return;

    const collectionRef = collection(doc(database, "chats", chatId), "messages"); // ✅ Fixed collection reference
    const q = query(collectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map((doc) => ({
        _id: doc.id, // Use `doc.id` to ensure uniqueness
        createdAt: doc.data().createdAt?.toDate(),
        text: doc.data().text,
        user: doc.data().user,
        read: doc.data().read || false,
      }));

      setMessages(fetchedMessages);

      // Mark unread messages as read
      const unreadMessages = querySnapshot.docs.filter(
        (doc) => !doc.data().read && doc.data().user._id !== auth.currentUser?.uid
      );

      const updatePromises = unreadMessages.map((unread) => {
        const messageRef = doc(database, "chats", chatId, "messages", unread.id);
        return updateDoc(messageRef, { read: true });
      });

      await Promise.all(updatePromises); // ✅ Ensure all updates are handled in parallel
    });

    return unsubscribe;
  }, [chatId]);

  const onSend = useCallback((messages = []) => {
    if (!chatId || messages.length === 0) return;

    const collectionRef = collection(doc(database, "chats", chatId), "messages"); // ✅ Fixed reference

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );

    const { _id, createdAt, text, user } = messages[0];
    addDoc(collectionRef, {
      _id,
      createdAt,
      text,
      user,
      read: false, // Mark as unread initially
    });
  }, [chatId]);

  // Ensure the user is authenticated before using `auth.currentUser`
  const currentUser = auth.currentUser;
  const userId = currentUser ? currentUser.uid : "anonymous"; 

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: userId,
        name: currentUser?.displayName || "User",
      }}
    />
  );
}
