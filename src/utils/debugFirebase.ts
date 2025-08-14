import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

// Debug Firebase connection and data
export const debugFirebase = async () => {
  try {
    console.log('🔍 Debugging Firebase connection...');
    
    // Test 1: Simple query without orderBy
    console.log('📋 Test 1: Simple query without orderBy');
    const simpleQuery = await getDocs(collection(db, 'restaurants'));
    console.log('✅ Simple query result:', simpleQuery.size, 'documents found');
    
    simpleQuery.forEach((doc) => {
      console.log('📄 Document:', doc.id, doc.data());
    });
    
    // Test 2: Query with isActive filter
    console.log('📋 Test 2: Query with isActive filter');
    const activeQuery = query(
      collection(db, 'restaurants'),
      where('isActive', '==', true)
    );
    const activeSnapshot = await getDocs(activeQuery);
    console.log('✅ Active query result:', activeSnapshot.size, 'documents found');
    
    activeSnapshot.forEach((doc) => {
      console.log('📄 Active document:', doc.id, doc.data());
    });
    
    // Test 3: Query with orderBy (this might fail)
    console.log('📋 Test 3: Query with orderBy (might fail)');
    try {
      const orderQuery = query(
        collection(db, 'restaurants'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const orderSnapshot = await getDocs(orderQuery);
      console.log('✅ Order query result:', orderSnapshot.size, 'documents found');
    } catch (orderError) {
      console.error('❌ Order query failed:', orderError);
      console.log('💡 This is likely the issue - createdAt field needs indexing');
    }
    
    return {
      success: true,
      simpleCount: simpleQuery.size,
      activeCount: activeSnapshot.size,
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test loading restaurants with different approaches
export const testRestaurantLoading = async () => {
  try {
    console.log('🍽️ Testing restaurant loading approaches...');
    
    // Approach 1: Simple query (should work)
    const simpleQuery = await getDocs(collection(db, 'restaurants'));
    const simpleRestaurants = simpleQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Simple approach found:', simpleRestaurants.length, 'restaurants');
    simpleRestaurants.forEach(restaurant => {
      console.log('🍽️ Restaurant:', (restaurant as any).name, '| Active:', (restaurant as any).isActive);
    });
    
    // Approach 2: Filter by isActive only
    const activeQuery = query(
      collection(db, 'restaurants'),
      where('isActive', '==', true)
    );
    const activeSnapshot = await getDocs(activeQuery);
    const activeRestaurants = activeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Active filter approach found:', activeRestaurants.length, 'restaurants');
    
    return {
      success: true,
      simpleRestaurants,
      activeRestaurants,
    };
    
  } catch (error) {
    console.error('❌ Restaurant loading test failed:', error);
    return {
      success: false,
      error: error
    };
  }
}; 