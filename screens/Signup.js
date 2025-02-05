import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

const backImage = require("../assets/backImage.png");

export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState(""); // State to store user type

  const onHandleSignup = async () => {
    if (email !== "" && password !== "" && name !== "" && userType !== "") {
      try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: name,
        });
    
        console.log("User registered successfully with name:", user.displayName)

        // Determine which collection to add the user to based on the selected userType
        const collectionName = userType === "user" ? "users" : userType === "homeless" ? "homeless" : "shelters";


        // Add user to the appropriate Firestore collection
        await setDoc(doc(database, collectionName, user.uid), {
          name: name,
          email: email,
          createdAt: new Date().toISOString(),
          userType: userType, // Store the type for reference
        });

        console.log("Signup success");

      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          Alert.alert("Signup Error", "This email is already registered. Please use a different email.");
        } else {
          Alert.alert("Signup Error", err.message); // Handle other errors
        }
      }
    } else {
      Alert.alert("Error", "Please fill out all fields, including selecting a user type.");
    }
  };

  return (
    <View style={styles.container}>
      <Image source={backImage} style={styles.backImage} />
      <View style={styles.whiteSheet} />
      <SafeAreaView style={styles.form}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          autoCapitalize="words"
          textContentType="name"
          value={name}
          onChangeText={(text) => setName(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
          textContentType="password"
          value={password}
          onChangeText={(text) => setPassword(text)}
        />

        {/* Picker for User Type */}
        <Picker
          selectedValue={userType}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) => setUserType(itemValue)}
        >
          <Picker.Item label="Select Type" value="" />
          <Picker.Item label="User" value="user" />
          <Picker.Item label="Homeless" value="homeless" />
          <Picker.Item label="Shelter" value="shelter" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={onHandleSignup}>
          <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 18 }}>Sign Up</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}>
          <Text style={{ color: 'gray', fontWeight: '600', fontSize: 14 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={{ color: '#f57c00', fontWeight: '600', fontSize: 14 }}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <StatusBar barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: "orange",
    alignSelf: "center",
    paddingBottom: 24,
  },
  input: {
    backgroundColor: "#F6F7FB",
    height: 58,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 10,
    padding: 12,
  },
  backImage: {
    width: "100%",
    height: 340,
    position: "absolute",
    top: 0,
    resizeMode: 'cover',
  },
  whiteSheet: {
    width: '100%',
    height: '75%',
    position: "absolute",
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 60,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 30,
  },
  button: {
    backgroundColor: '#f57c00',
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  picker: {
    height: 50,
    marginVertical: 10,
  },
});
