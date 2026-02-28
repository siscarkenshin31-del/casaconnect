import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Alert,
  ImageBackground, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut} from "firebase/auth";
import { auth, db } from "../firebaseConfig"; 
import { doc, getDoc } from "firebase/firestore";



export default function RoleSelection() {
  const router = useRouter();

  const [role, setRole] = useState<'tenant' | 'landowner'>('tenant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const activeColor = role === 'tenant' ? '#2f95dc' : '#f4511e';

  // 2. Make handleLogin asynchronous to wait for Firebase
 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter email and password");
    return;
  }

  try {
    // 1. Authenticate the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. CHECK THE BOUNDARY: Look for the user in the selected role's collection
    // If the user selected 'tenant' on the UI, we check the 'tenants' collection
    const collectionName = role === 'tenant' ? "tenants" : "landowners";
    const userDoc = await getDoc(doc(db, collectionName, uid));

    if (userDoc.exists()) {
      // SUCCESS: User is in the right place
      Alert.alert("Success", `Logged in as ${role}`);
      router.replace(`../${role}/dashboard`);
    } else {
      
      await signOut(auth); 
      Alert.alert(
        "Access Denied", 
        `This account is not registered as a ${role}. Please switch roles or sign up correctly.`
      );
    }
  } catch (error: any) {
    Alert.alert("Login Error", error.message);
  }
};

  return (
    <ImageBackground 
      source={require('./images.png')} 
      resizeMode="cover"   
      style={styles.background}
      imageStyle={styles.imageStyle} 
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >

        <View style={styles.header}>
          <Text style={[styles.appTitle,{ fontFamily: 'aptos', }]}>CASA</Text>
          <Text style={[styles.appTitle, { marginTop: -15,fontFamily: 'aptos' }]}>CONNECT</Text>
          <Text style={[styles.choose, { marginBottom:-80,fontFamily: 'arial'}]}>Choose a Role</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab,
                role === 'tenant' && styles.activeTenant
              ]}
              onPress={() => setRole('tenant')}
            >
              <Text style={styles.tabText}>Tenant Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tab,
                role === 'landowner' && styles.activeLandowner
              ]}
              onPress={() => setRole('landowner')}
            >
              <Text style={styles.tabText}>Landowner Login</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none" // Important for emails
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: activeColor }]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>
              LOGIN AS {role.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/${role}/signup`)}
          >
            <Text style={styles.linkText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/${role}/forgot-password`)}
          >
            <Text style={styles.linkText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

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
    marginBottom: 60 
  },
  appTitle: { 
    color: '#fdfdfd', 
    fontSize: 48, 
    fontWeight: 'bold', 
    letterSpacing: 2 
  },
  choose: { 
    color: '#fdfdfd', 
    fontSize: 18, 
    padding: 30,
    fontWeight: 'bold', 
    letterSpacing: 2 
  },
  formContainer: { 
    width: '100%',
    maxWidth: 400,   
    alignSelf: 'center',
    gap: 20 
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 20 
  },
  tab: { 
    paddingVertical: 10, 
    width: '45%', 
    alignItems: 'center' 
  },
  tabText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16 
  },
  mainButton: { 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
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
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
  },
  activeTenant: {
    backgroundColor: '#2f95dc',
    borderRadius: 10,   
  },
  activeLandowner: {
    backgroundColor: '#f4511e',
    borderRadius: 10,   
  },
});