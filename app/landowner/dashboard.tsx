
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Import para sa mga icons

export default function LandownerDashboard() {
  const router = useRouter();
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 30, padding: 32}}>Welcome, Landlord</Text>
      
      <Button 
        title="Edit My Listing" 
        onPress={() => router.push('/landowner/edit-listing')} 
      />
      <Button 
        title="View Messages" 
        onPress={() => router.push('/landowner/chat')} 
      />

      {/* --- Bottom Navigation Bar --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push('/landowner/listings')}>
          <Ionicons name="book-outline" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/landowner/chat')}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/landowner/search')}>
          <Ionicons name="search-outline" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/landowner/finance')}>
          <Ionicons name="cash-outline" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around', // Pantay-pantay ang distansya
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 10 // Konting space sa ilalim para sa modern phones
  }
});