import { useState } from 'react';
import { DarkModeContext } from './darkModeContext';

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={darkMode ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </DarkModeContext.Provider>
  );
}


