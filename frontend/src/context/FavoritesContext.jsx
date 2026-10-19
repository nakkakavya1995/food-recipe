import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      if (!isAuthenticated || !token) {
        setFavorites([]);
        return;
      }

      try {
        const response = await api.get('/favorites/');
        if (!cancelled) {
          const data = response.data;
          setFavorites(
            Array.isArray(data) ? data : data.favorites || []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load favorites:', error);
          setFavorites([]);
        }
      }
    };

    fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const extractId = (recipeOrId) => {
    if (!recipeOrId) return '';
    if (typeof recipeOrId === 'object') {
      return String(recipeOrId._id || recipeOrId.id || recipeOrId.recipe_id || '');
    }
    return String(recipeOrId);
  };

  const isFavorite = (recipeOrId) => {
    const targetId = extractId(recipeOrId);
    if (!targetId) return false;
    return favorites.some(
      (item) => extractId(item) === targetId || extractId(item.recipe) === targetId
    );
  };

  const addFavorite = async (recipeOrId) => {
    const id = extractId(recipeOrId);
    if (!id) return;

    const recipeObj = typeof recipeOrId === 'object' ? recipeOrId : { _id: id };

    setFavorites((current) => {
      if (current.some((item) => extractId(item) === id)) return current;
      return [...current, recipeObj];
    });

    try {
      const response = await api.post(`/favorites/${id}`, { recipe_id: id });
      if (response.data?.recipe) {
        setFavorites((current) =>
          current.map((item) => (extractId(item) === id ? response.data.recipe : item))
        );
      }
    } catch (err) {
      setFavorites((current) => current.filter((item) => extractId(item) !== id));
      throw err;
    }
  };

  const removeFavorite = async (recipeOrId) => {
    const id = extractId(recipeOrId);
    if (!id) return;

    const previous = [...favorites];
    setFavorites((current) => current.filter((item) => extractId(item) !== id && extractId(item.recipe) !== id));

    try {
      await api.delete(`/favorites/${id}`);
    } catch (err) {
      setFavorites(previous);
      throw err;
    }
  };

  const toggleFavorite = async (recipeOrId) => {
    const id = extractId(recipeOrId);
    if (isFavorite(id)) {
      await removeFavorite(recipeOrId);
      return false;
    } else {
      await addFavorite(recipeOrId);
      return true;
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        setFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
