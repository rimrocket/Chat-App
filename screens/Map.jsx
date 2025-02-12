import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FavoritesContext } from '../scripts/FavoritesContext';
import { PROVIDER_GOOGLE } from 'react-native-maps'; // Ensure this is used if you intend to use Google Maps

const INITIAL_REGION = {
  latitude: 45.5017,
  longitude: -73.5673,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function Map({ navigation }) {
  const { favorites } = useContext(FavoritesContext);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
        provider={PROVIDER_GOOGLE} // Add this if you're using Google Maps
      >
        {favorites.map((dest) => (
          <Marker
            key={dest.id}
            coordinate={{ latitude: dest.latitude, longitude: dest.longitude }}
            title={dest.name}
            description={dest.name}
            onCalloutPress={() => navigation.navigate('Details', { destination: dest })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
