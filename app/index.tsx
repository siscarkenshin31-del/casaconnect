import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function RoleSelection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to </Text>
      <Text style={styles.appname}>CASA-CONNECT</Text>

      <TouchableOpacity 
        style={[styles.button, styles.tenantButton]} 
        onPress={() => router.push('/tenant/login')}
      >
        <Text style={styles.buttonText}>Login as Tenant</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.landownerButton]} 
        onPress={() => router.push('/landowner/login')}
      >
        <Text style={styles.buttonText}>Login as Landowner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 22,
  },
  appname: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 450,
    fontFamily: "times new roman"
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  tenantButton: {
    backgroundColor: '#2f95dc',
  },
  landownerButton: {
    backgroundColor: '#f4511e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});