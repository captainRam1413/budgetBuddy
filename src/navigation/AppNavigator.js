import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import Create from '../screens/Create';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';
const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

function myTabs() {
    return (
        <Tab.Navigator screenOptions={{headerShown: false}}>
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Create" component={Create} />
            <Tab.Screen name="Insights" component={Insights} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}

export default function AppNavigator(params) {
    // return (
    //     <Stack.Navigator>
    //         <Stack.Screen name="Tabs" component={myTabs} />
    //     </Stack.Navigator>
    // );

    return (
        <Stack.Navigator >
            <Stack.Screen name="BottomTabs" component={myTabs} />
            {/* <Stack.Screen name="Profile" component={Profile} /> */}
            {/* <Stack.Screen name="Create" component={Create} /> */}

            <Stack.Screen name= "Category" component={require('../screens/Category').default} options={{presentation: 'modal', headerShown: false}} />

        </Stack.Navigator>
    );
}