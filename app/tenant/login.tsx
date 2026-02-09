import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
// Import icons para sa mga logos
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function TenantLogin() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- EXISTING STATES ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // --- DAGDAG NA STATE PARA SA PANGALAWANG POPUP ---
  const [showDashboardPreview, setShowDashboardPreview] = useState(false);

  // Validation: Email format at minimum password length
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const canLogin = isEmailValid && password.length >= 6;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Logging in with:', { email, password });
      
      // Simulating API Call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Error", "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- BINAGONG PROCEED PARA LUMABAS YUNG PANGALAWANG MODAL ---
  const handleProceed = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
        setShowDashboardPreview(true); // Lalabas yung screen na may mga logos
    }, 500);
  };

  // --- LAST STEP: PAPUNTA NA SA REAL HOME ---
  const handleFinalHome = () => {
    setShowDashboardPreview(false);
    router.replace('/tenant/home'); 
  };

  return (
    <View style={styles.container}>
      {/* --- FIRST MODAL (SUCCESS) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Login Successful!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleProceed}>
              <Text style={styles.buttonText}>Proceed to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- SECOND MODAL (DASHBOARD PREVIEW NA KATULAD NG IMAGE) --- */}
      <Modal
        animationType="slide"
        transparent={false} 
        visible={showDashboardPreview}
      >
        <View style={styles.dashboardPopup}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.title}>Tenant Dashboard</Text>
            <Text style={styles.subtitle}>Select an option to continue</Text>
          </View>

          {/* LOWER NAV BAR: Eto yung kopya ng nasa picture mo */}
          <View style={styles.bottomNavContainer}>
            <TouchableOpacity onPress={handleFinalHome} style={styles.navIconWrapper}>
                <Ionicons name="book-outline" size={26} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFinalHome} style={styles.navIconWrapper}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFinalHome} style={styles.navIconWrapper}>
                <Ionicons name="search-outline" size={26} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFinalHome} style={styles.navIconWrapper}>
                <MaterialCommunityIcons name="cash-multiple" size={26} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>Welcome Back</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email Address" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry 
      />

      <TouchableOpacity 
        style={[styles.button, !canLogin && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={!canLogin || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/tenant/register')} 
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Don't have an account? <Text style={styles.linkText}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#2f95dc', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#2f95dc', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#a0ccf0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footer: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#666' },
  linkText: { color: '#2f95dc', fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 20
  },
  modalButton: {
    backgroundColor: '#2f95dc',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10
  },


  dashboardPopup: {
    flex: 1,
    backgroundColor: '#f2f2f2', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 80,
  },
  dashboardHeader: {
    alignItems: 'center'
  },
  bottomNavContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 70, 
    backgroundColor: '#fff', 
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingBottom: 10 
  },
  navIconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});