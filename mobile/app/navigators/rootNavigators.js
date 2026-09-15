import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddVehicle } from '../src/views/addVehicle';
import { NearestWorkshop } from '../src/views/nearestWorkshop';
import MainNavigator from './mainNavigators';
import { DetailVehicle } from '../src/views/detailVehicle';
import { SelectWorkshop } from '../src/views/selectWorkshop';
import { BookingForm } from '../src/views/bookingForm';
import { SelectVehicle } from '../src/views/selectVehicle';



const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainNavigator} />
            <Stack.Screen
                name="AddVehicle"
                component={AddVehicle}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="NearestWorkshop"
                component={NearestWorkshop}
                
            />
            <Stack.Screen
                name="DetailVehicle"
                component={DetailVehicle}
            />
            <Stack.Screen
                name="SelectWorkshop"
                component={SelectWorkshop}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Booking"
                component={BookingForm}
                options={{ headerShown: false }}
            />
            <Stack.Screen
  name="SelectVehicle"
  component={SelectVehicle}
  options={{ headerShown: false }}
/>


        </Stack.Navigator>
    );
}