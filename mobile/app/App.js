import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from './src/context/AuthContext';
import { AuthStack } from './navigators/authNavigators';
import MainNavigator from './navigators/mainNavigators';
import RootNavigator from './navigators/rootNavigators';



export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  useEffect(() => {
    cekToken();
  }, []);
  const cekToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ isLogin, setIsLogin }}>
      <SafeAreaProvider>
        <NavigationContainer>
          {
            isLogin ? <RootNavigator /> : <AuthStack />
          }
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

