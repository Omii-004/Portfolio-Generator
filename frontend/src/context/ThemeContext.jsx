import { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context (the broadcasting station)
const ThemeContext = createContext();

// 2. Create a custom hook to easily use this context in other files
export const useTheme = () => useContext(ThemeContext);

// 3. Create the Provider (the component that wraps our app)
export const ThemeProvider = ({ children }) => {
  // Check if the user already has a preference saved in their browser
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Whenever isDarkMode changes, update the HTML tag and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // The function to toggle the theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};