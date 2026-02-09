import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandownerRegister() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [idImage, setIdImage] = useState(null); // Placeholder para sa ID image

  const isFormValid = 
    /\S+@\S+\.\S+/.test(email) && 
    password.length >= 6 && 
    password === confirmPassword;

  const handleRegister = async () => {
    setIsLoading(true);
    // Simulation ng registration process
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Account created! Please wait for admin verification.");
      router.back(); // Babalik sa Login page
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#f4511e' }]}>Create Partner Account</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Business Email" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Confirm Password" 
        value={confirmPassword} 
        onChangeText={setConfirmPassword}
        secureTextEntry 
      />

      {/* SECTION PARA SA ID VERIFICATION */}
      <Text style={styles.label}>ID Verification (Valid Government ID)</Text>
      <TouchableOpacity 
        style={styles.idUploadBox} 
        onPress={() => Alert.alert("Upload ID", "Open Gallery or Camera feature here.")}
      >
        <Text style={{ color: '#666' }}>+ Upload ID Picture</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isFormValid ? '#f4511e' : '#ccc' }]} 
        onPress={handleRegister}
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register Now</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.linkText} onPress={() => router.back()}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 30, 
    backgroundColor: '#f9f9f9' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600'
  },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
  },
  idUploadBox: {
    height: 120,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25
  },
  button: { 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#f4511e',
    fontWeight: 'bold',
  }
});