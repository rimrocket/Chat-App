
import React, { createContext, useState } from 'react';

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([
    { id: '1', name: 'Abri de la Rive-Sud', latitude: 45.528214, longitude: -73.517206 },
    { id: '2', name: 'La Maison Benoît Labre', latitude: 45.480695, longitude: -73.578573 },
    { id: '3', name: 'Refuge des Jeunes de Montréal', latitude: 45.522852, longitude: -73.55189 },
    { id: '4', name: 'Maison du Père', latitude: 45.513895, longitude: -73.556525 }
  ]);
  
  return (
    <FavoritesContext.Provider value={{ favorites, setFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};