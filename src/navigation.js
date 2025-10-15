import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './screens/Dashboard';
import Coin from './screens/Coin';


const Stack = createNativeStackNavigator();


export default function Navigation() {
return (
<Stack.Navigator initialRouteName="Dashboard">
<Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Crypto Dashboard' }} />
<Stack.Screen name="Coin" component={Coin} options={{ title: 'Szczegóły' }} />
</Stack.Navigator>
);
}