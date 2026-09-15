
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddVehicle } from '../src/views/addVehicle';
import { NearestWorkshop } from '../src/views/nearestWorkshop';
import MainNavigator from './mainNavigators';
import { DetailVehicle } from '../src/views/detailVehicle';
import { SelectWorkshop } from '../src/views/selectWorkshop';
import { BookingForm } from '../src/views/bookingForm';
import { SelectVehicle } from '../src/views/selectVehicle';
import EditProfile from '../src/views/editProfile';
import { EditVehicle } from '../src/views/editVehicle';
import BookingDetail from '../src/views/bookingDetail';
import PaymentWebView from '../src/views/paymentWebView';
import Notifications from '../src/views/notifications';




const Stack = createNativeStackNavigator();

export default function RootNavigator() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicle}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="NearestWorkshop" component={NearestWorkshop} />
      <Stack.Screen name="DetailVehicle" component={DetailVehicle} />
      <Stack.Screen name="BookingDetail" component={BookingDetail} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebView} />
      <Stack.Screen name="Notifications" component={Notifications} />
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
      <Stack.Screen
                name="EditProfile"
                component={EditProfile}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="EditVehicle"
                component={EditVehicle}
                options={{ headerShown: false }}
            />
    </Stack.Navigator>
  );
}
