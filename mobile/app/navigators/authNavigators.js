import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { Login } from '../src/views/login';
import { Register } from '../src/views/register';



const Stack = createNativeStackNavigator();

export function AuthStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}