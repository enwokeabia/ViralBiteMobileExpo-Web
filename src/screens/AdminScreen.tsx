import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import * as DocumentPicker from 'expo-document-picker';

interface RestaurantFormData {
  name: string;
  cuisine: string;
  location: string;
  address: string;
  description: string;
  discountPercentage: number;
  rating: number;
  priceRange: string;
  isActive: boolean;
  
  // Vibe functionality
  vibes: string[];
  brunchDescription: string;
  happyHourDescription: string;
  happyHourDeal: string;
  brunchDiscountPercentage: number;
  
  // Time slots
  timeSlots: string[];
  brunchTimeSlots: string[];
  happyHourTimeSlots: string[];
}

const defaultTimeSlots = {
  dining: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
  brunch: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
  happyHour: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']
};

export default function AdminScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    cuisine: '',
    location: '',
    address: '',
    description: '',
    discountPercentage: 30,
    rating: 4.5,
    priceRange: '$$',
    isActive: true,
    vibes: ['dining'], // All restaurants must have dining
    brunchDescription: '',
    happyHourDescription: '',
    happyHourDeal: '',
    brunchDiscountPercentage: 25,
    timeSlots: defaultTimeSlots.dining,
    brunchTimeSlots: defaultTimeSlots.brunch,
    happyHourTimeSlots: defaultTimeSlots.happyHour,
  });

  const [videoFile, setVideoFile] = useState<any>(null);
  const [imageFile, setImageFile] = useState<any>(null);

  const handleInputChange = (field: keyof RestaurantFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVibeToggle = (vibe: string) => {
    setFormData(prev => {
      const currentVibes = [...prev.vibes];
      if (currentVibes.includes(vibe)) {
        // Don't allow removing 'dining' vibe
        if (vibe === 'dining') return prev;
        const index = currentVibes.indexOf(vibe);
        currentVibes.splice(index, 1);
      } else {
        currentVibes.push(vibe);
      }
      return { ...prev, vibes: currentVibes };
    });
  };

  const pickFile = async (type: 'video' | 'image') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'video' ? 'video/*' : 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'video') {
          setVideoFile(result.assets[0]);
        } else {
          setImageFile(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async (file: any, path: string): Promise<string> => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cuisine || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      let videoUrl = '';
      let imageUrl = '';

      // Upload video if provided
      if (videoFile) {
        const videoPath = `restaurants/${Date.now()}_${videoFile.name}`;
        videoUrl = await uploadFile(videoFile, videoPath);
      }

      // Upload image if provided
      if (imageFile) {
        const imagePath = `restaurants/${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, imagePath);
      }

      // Create restaurant document
      const restaurantData = {
        ...formData,
        videoUrl: videoUrl || 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30', // Fallback
        imageUrl: imageUrl || videoUrl || 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30', // Fallback
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'restaurants'), restaurantData);
      
      Alert.alert('Success', `Restaurant "${formData.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        cuisine: '',
        location: '',
        address: '',
        description: '',
        discountPercentage: 30,
        rating: 4.5,
        priceRange: '$$',
        isActive: true,
        vibes: ['dining'],
        brunchDescription: '',
        happyHourDescription: '',
        happyHourDeal: '',
        brunchDiscountPercentage: 25,
        timeSlots: defaultTimeSlots.dining,
        brunchTimeSlots: defaultTimeSlots.brunch,
        happyHourTimeSlots: defaultTimeSlots.happyHour,
      });
      setVideoFile(null);
      setImageFile(null);
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      Alert.alert('Error', error.message || 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Admin Portal</Text>
        <Text style={styles.headerSubtitle}>Create Restaurant with Vibe Support</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Restaurant Name *"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.cuisine}
              onValueChange={(value) => handleInputChange('cuisine', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Cuisine *" value="" />
              <Picker.Item label="Italian" value="Italian" />
              <Picker.Item label="Japanese" value="Japanese" />
              <Picker.Item label="Mexican" value="Mexican" />
              <Picker.Item label="American" value="American" />
              <Picker.Item label="Chinese" value="Chinese" />
              <Picker.Item label="Indian" value="Indian" />
              <Picker.Item label="Thai" value="Thai" />
              <Picker.Item label="Mediterranean" value="Mediterranean" />
              <Picker.Item label="French" value="French" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Downtown DC) *"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Full Address"
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
          />

          <TextInput
            style={styles.textArea}
            placeholder="Description *"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Vibe Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vibe Categories</Text>
          <Text style={styles.sectionSubtitle}>Select which vibes this restaurant supports</Text>
          
          {['dining', 'brunch', 'happy-hour'].map((vibe) => (
            <View key={vibe} style={styles.vibeItem}>
              <View style={styles.vibeInfo}>
                <Text style={styles.vibeLabel}>
                  {vibe === 'dining' ? 'Dining' : vibe === 'brunch' ? 'Brunch' : 'Happy Hour'}
                </Text>
                <Text style={styles.vibeDescription}>
                  {vibe === 'dining' ? 'All restaurants must support dining' : 
                   vibe === 'brunch' ? 'Breakfast/lunch focused experience' : 
                   'Bar and social atmosphere'}
                </Text>
              </View>
              <Switch
                value={formData.vibes.includes(vibe)}
                onValueChange={() => handleVibeToggle(vibe)}
                disabled={vibe === 'dining'} // Can't disable dining
                trackColor={{ false: '#767577', true: '#8B5CF6' }}
                thumbColor={formData.vibes.includes(vibe) ? '#A855F7' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Vibe-Specific Content */}
        {formData.vibes.includes('brunch') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brunch Content</Text>
            
            <TextInput
              style={styles.textArea}
              placeholder="Brunch description (e.g., Weekend brunch with bottomless mimosas)"
              value={formData.brunchDescription}
              onChangeText={(text) => handleInputChange('brunchDescription', text)}
              multiline
              numberOfLines={2}
            />

            <View style={styles.numberInputContainer}>
              <Text style={styles.inputLabel}>Brunch Discount %</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="25"
                value={formData.brunchDiscountPercentage.toString()}
                onChangeText={(text) => handleInputChange('brunchDiscountPercentage', parseInt(text) || 25)}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {formData.vibes.includes('happy-hour') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Happy Hour Content</Text>
            
            <TextInput
              style={styles.textArea}
              placeholder="Happy Hour description (e.g., Craft cocktails and small plates from 4-7pm)"
              value={formData.happyHourDescription}
              onChangeText={(text) => handleInputChange('happyHourDescription', text)}
              multiline
              numberOfLines={2}
            />

            <TextInput
              style={styles.input}
              placeholder="Happy Hour deal (e.g., 2-for-1 cocktails, $5 margaritas)"
              value={formData.happyHourDeal}
              onChangeText={(text) => handleInputChange('happyHourDeal', text)}
            />
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.rating}
              onValueChange={(value) => handleInputChange('rating', value)}
              style={styles.picker}
            >
              <Picker.Item label="Rating" value={4.5} />
              <Picker.Item label="5.0 ⭐⭐⭐⭐⭐" value={5.0} />
              <Picker.Item label="4.5 ⭐⭐⭐⭐⭐" value={4.5} />
              <Picker.Item label="4.0 ⭐⭐⭐⭐" value={4.0} />
              <Picker.Item label="3.5 ⭐⭐⭐⭐" value={3.5} />
              <Picker.Item label="3.0 ⭐⭐⭐" value={3.0} />
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.priceRange}
              onValueChange={(value) => handleInputChange('priceRange', value)}
              style={styles.picker}
            >
              <Picker.Item label="Price Range" value="$$" />
              <Picker.Item label="$ - Inexpensive" value="$" />
              <Picker.Item label="$$ - Moderate" value="$$" />
              <Picker.Item label="$$$ - Expensive" value="$$$" />
              <Picker.Item label="$$$$ - Very Expensive" value="$$$$" />
            </Picker>
          </View>

          <View style={styles.numberInputContainer}>
            <Text style={styles.inputLabel}>Discount Percentage</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="30"
              value={formData.discountPercentage.toString()}
              onChangeText={(text) => handleInputChange('discountPercentage', parseInt(text) || 30)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* File Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          <Pressable
            style={styles.uploadButton}
            onPress={() => pickFile('video')}
          >
            <Ionicons name="videocam-outline" size={24} color="#8B5CF6" />
            <Text style={styles.uploadButtonText}>
              {videoFile ? `Video: ${videoFile.name}` : 'Upload Video *'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.uploadButton}
            onPress={() => pickFile('image')}
          >
            <Ionicons name="image-outline" size={24} color="#8B5CF6" />
            <Text style={styles.uploadButtonText}>
              {imageFile ? `Image: ${imageFile.name}` : 'Upload Image (Optional)'}
            </Text>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#8B5CF6', '#A855F7']}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Restaurant'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  formContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  numberInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  vibeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  vibeInfo: {
    flex: 1,
    marginRight: 16,
  },
  vibeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  vibeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 