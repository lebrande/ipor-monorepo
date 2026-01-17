import { createContext, useContext, type ReactNode } from 'react';
import { useVaultDirectory } from '@/vault-directory/hooks/use-vault-directory';

// Create the context with inferred type from the hook
const VaultDirectoryContext = createContext<
  ReturnType<typeof useVaultDirectory> | undefined
>(undefined);

// Provider component
interface Props {
  children: ReactNode;
}

export const VaultDirectoryProvider = ({ children }: Props) => {
  const value = useVaultDirectory();

  return (
    <VaultDirectoryContext.Provider value={value}>
      {children}
    </VaultDirectoryContext.Provider>
  );
};

// Custom hook to consume the context
export const useVaultDirectoryContext = () => {
  const context = useContext(VaultDirectoryContext);
  if (context === undefined) {
    throw new Error(
      'useVaultDirectoryContext must be used within a VaultDirectoryProvider',
    );
  }
  return context;
};
