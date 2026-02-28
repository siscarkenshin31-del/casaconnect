// KEEP ALL YOUR IMPORTS
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Generate random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = () => {
    if (!contact) {
      alert("Please enter your email or phone number");
      return;
    }

    const otpCode = generateOTP();
    setGeneratedOTP(otpCode);

    // Simulate sending OTP (replace with backend later)
    alert(`OTP sent: ${otpCode}`);

    setStep(2);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }

    if (otp !== generatedOTP) {
      alert("Invalid OTP");
      return;
    }

    alert("OTP Verified!");
    setStep(3);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert("Password reset successful!");
    router.back();
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
          <Text style={styles.appTitle}>FORGOT PASSWORD</Text>
        </View>

        <View style={styles.formContainer}>

          {/* STEP 1 - ENTER EMAIL OR PHONE */}
          {step === 1 && (
            <>
              <TextInput
                placeholder="Enter Email or Phone Number"
                placeholderTextColor="#ccc"
                style={styles.input}
                value={contact}
                onChangeText={setContact}
              />

              <TouchableOpacity
                style={styles.mainButton}
                onPress={handleSendOTP}
              >
                <Text style={styles.buttonText}>SEND OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2 - ENTER OTP */}
          {step === 2 && (
            <>
              <Text style={styles.infoText}>
                Enter the 6-digit OTP sent to you
              </Text>

              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#ccc"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.mainButton}
                onPress={handleVerifyOTP}
              >
                <Text style={styles.buttonText}>VERIFY OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 - RESET PASSWORD */}
          {step === 3 && (
            <>
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#ccc"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
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
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>RESET PASSWORD</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  imageStyle: { width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    justifyContent: 'center'
  },
  header: { alignItems: 'center', marginBottom: 40 },
  appTitle: {
    color: '#fff',
    fontSize: 28,
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
  },
  infoText: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8
  }
});