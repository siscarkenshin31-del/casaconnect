import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TenantRegister() {
  const router = useRouter();
  
  // These MUST be inside the function to work correctly
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation Logic: Check if fields are empty or password is too short
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const canRegister = name.trim().length > 0 && isEmailValid && password.length >= 6;

  const handleRegister = async () => {
    // Extra safety: do nothing if validation fails
    if (!canRegister) return;

    setIsLoading(true);
    try {
      // BACKEND LOGIC: Replace this with your actual DB call (Firebase/Supabase)
      console.log('Saving to database:', { name, email, password });
      
      // Simulate a database save delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert("Success", "Account created successfully!");
      router.replace('/tenant/home');
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        value={name} 
        onChangeText={setName} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password (Min 6 chars)" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry 
      />

      <TouchableOpacity 
        style={[styles.button, !canRegister && styles.disabledButton]} 
        onPress={handleRegister}
        disabled={!canRegister || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      {/* Direct back to login screen */}
      <TouchableOpacity 
        onPress={() => router.push('/tenant/login')} 
        style={styles.loginLink}
      >
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={{fontWeight: 'bold'}}>Log In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { 
    fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#2f95dc' },
  input: { 
    borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 10, marginBottom: 20, fontSize: 16 },
  button: { 
    backgroundColor: '#2f95dc', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabledButton: { 
    backgroundColor: '#ccc' }, 
  buttonText: { 
    color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginLink: { 
    marginTop: 20, alignItems: 'center' },
  loginLinkText: { 
    color: '#666' }
});