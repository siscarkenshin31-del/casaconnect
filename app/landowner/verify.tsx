import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OTPVerify() {
  const router = useRouter();
  const { role, email } = useLocalSearchParams(); // To know where to send them after
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    // TEMPORARY FRONTEND BYPASS
    // Later, you will replace this with a backend call: axios.post('/verify-otp', { email, otp })
    if (otp === '123456') { 
      Alert.alert("Success", "Account Verified!");
      
      // Send them to their respective dashboards based on role
      if (role === 'landowner') {
        router.replace('/landowner/dashboard');
      } else {
        router.replace('/tenant/home');
      }
    } else {
      Alert.alert("Error", "Invalid OTP. Try 123456");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>Enter the code sent to {email}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#121212' },
  title: { 
    fontSize: 24, 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center' },
  subtitle: { 
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20 },
  input: { 
    backgroundColor: '#222', 
    color: '#fff', padding: 15, 
    borderRadius: 8, 
    marginBottom: 20, 
    textAlign: 'center', 
    fontSize: 20 },
  button: { 
    backgroundColor: '#f4511e', 
    padding: 15, borderRadius: 8, 
    alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
