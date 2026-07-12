import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode]   = useState(false);
  const [language, setLanguage]   = useState("English");

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, language, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);