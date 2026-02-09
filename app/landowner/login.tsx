import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandownerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = /\S+@\S+\.\S+/.test(email) && password.length > 0;

  const handleLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/landowner/dashboard');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#f4511e' }]}>Partner Portal</Text>
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

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isFormValid ? '#f4511e' : '#ccc' }]} 
        onPress={handleLogin}
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Landowner Login</Text>}
      </TouchableOpacity>

      {/* ITO ANG DINAGDAG NA SECTION */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text 
            style={styles.linkText} 
            onPress={() => router.push('/landowner/register')}
          >
            Register here
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
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30 
  },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
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
  // STYLES PARA SA DINAGDAG NA FOOTER
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#f4511e', // Match sa theme color mo
    fontWeight: 'bold',
  }
});