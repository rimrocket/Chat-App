import React, { useState, useLayoutEffect, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, addDoc, orderBy, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { auth, database } from '../config/firebase';
import { useRoute } from "@react-navigation/native";

export default function Chat() {
  const [messages, setMessages] = useState([]);

  const route = useRoute(); 
  const { chatId } = route.params;

  useLayoutEffect(() => {
    const collectionRef = collection(database, "chats", chatId, "messages");
    const q = query(collectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map((doc) => ({
        _id: doc.data()._id,
        createdAt: doc.data().createdAt.toDate(),
        text: doc.data().text,
        user: doc.data().user,
        read: doc.data().read || false, 
      }));

      setMessages(fetchedMessages);

      // Mark unread messages as read
      const unreadMessages = querySnapshot.docs.filter(
        (doc) => !doc.data().read && doc.data().user._id !== auth.currentUser.uid
      );

      for (const unread of unreadMessages) {
        const messageRef = doc(database, "chats", chatId, "messages", unread.id);
        await updateDoc(messageRef, { read: true }); // Update the `read` field to true
      }
    });

    return unsubscribe;
  }, [chatId]);

  const onSend = useCallback((messages = []) => {
    const collectionRef = collection(database, "chats", chatId, "messages");
    
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );

    const { _id, createdAt, text, user } = messages[0];
    addDoc(collectionRef, {
      _id,
      createdAt,
      text,
      user,
      read: false, // Set the `read` field to false for new messages
    });
  }, [chatId]);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: auth.currentUser.uid,
        name: auth.currentUser.displayName || "User",
      }}
    />
  );
}

