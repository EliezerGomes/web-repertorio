import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Tipagem do Contexto
interface NavigationContextData {
  showPage: string;
  navigateTo: (page: string, id?: number) => void;
  worship: any
}

// 2. Criando o contexto propriamente dito
const NavigationContext = createContext<NavigationContextData>({} as NavigationContextData);

// 3. Provider: O componente que "envolve" o app
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showPage, setShowPage] = useState<string>('main'); // Valor inicial
  const [worship, setWorship] = useState({}); // Valor inicial

  const navigateTo = (page: string, worship?: any) => {
    setShowPage(page);
    if(worship) setWorship(worship)
      
  };

  return (
    <NavigationContext.Provider value={{ showPage, navigateTo, worship }}>
      {children}
    </NavigationContext.Provider>
  );
};

// 4. Hook personalizado para facilitar o uso nos componentes
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de um NavigationProvider');
  }
  return context;
};