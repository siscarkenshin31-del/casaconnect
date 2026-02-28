import React, { useState } from 'react';
import { StyleSheet, Text, Alert, View, ImageBackground, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Add these
import { useRouter } from 'expo-router';
import { auth, db } from "../../firebaseConfig"; // Import db

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

const handleSignup = async () => {
  if (!fullName || !email || !password || !confirmPassword) {
    return Alert.alert("Error", "All fields are required.");
  }

  if (password !== confirmPassword) {
    return Alert.alert("Error", "Passwords do not match!");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "tenants", user.uid), {
      fullName: fullName,
      email: email,
      role: "tenant",
      createdAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Account created successfully! Please login.");

    // 🔥 Go back to login page
    router.replace("/");

  } catch (error: any) {
    Alert.alert("Registration Error", error.message);
  }
};
  return (
    <ImageBackground
      source={require('../images.png')}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.imageStyle}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>Create Account as Tenant</Text>
        </View>

        <View style={styles.formContainer}>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>
              SIGN UP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  appTitle: {
    color: '#fdfdfd',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 20
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  
  },
  mainButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2f95dc',
    elevation: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1
  },
  linkText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
    opacity: 0.8
  }
});
