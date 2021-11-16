// In App.js in a new project

import * as React from 'react';
import {View, Text} from 'react-native';
import Button from '@ant-design/react-native/lib/button';
import {NavigationContainer, Link} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const prefixes = ['http://localhost:9000'];

const screens = {
  Home: {
    path: 'home',
  },
  Details: {
    path: 'details',
  },
};

function HomeScreen({navigation}) {
  return (
    <View>
      <Text>Home Screen</Text>
      <Link to={{screen: 'Details', params: {id: 'jane'}}}>Go to Details</Link>
      <Button type="primary" onPress={() => navigation.navigate('Details')}>
        Go to Details
      </Button>
    </View>
  );
}

function DetailsScreen({navigation}) {
  return (
    <View>
      <Text>Details Screen</Text>
      <Button onPress={() => navigation.navigate('Home')}>Go to Home</Button>
      <Button onPress={() => navigation.goBack()}>Go back</Button>
    </View>
  );
}

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer
      linking={{
        prefixes,
        config: {
          screens,
        },
      }}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
