import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddVehicle } from '../src/views/addVehicle';
import { NearestWorkshop } from '../src/views/nearestWorkshop';
import MainNavigator from './mainNavigators';
import BookingDetail from '../src/views/bookingDetai';
import { DetailVehicle } from '../src/views/detailVehicle';
import PaymentWebView from '../src/views/paymentWebView';


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
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="DetailVehicle"
                component={DetailVehicle}
            />
            <Stack.Screen 
                name="BookingDetail"
                component={BookingDetail}
            />
            <Stack.Screen 
                name="PaymentWebView"
                component={PaymentWebView}
            />

        </Stack.Navigator>
    );
}