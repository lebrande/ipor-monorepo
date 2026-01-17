import { createContext, useContext, type ReactNode } from 'react';
import { useVaultDetails } from '@/vault-details/hooks/use-vault-details';
import type { TabId } from '@/vault-details/components/vault-tabs';

const VaultDetailsContext = createContext<
  ReturnType<typeof useVaultDetails> | undefined
>(undefined);

interface Props {
  children: ReactNode;
  activeTab: TabId;
}

export const VaultDetailsProvider = ({ children, activeTab }: Props) => {
  const value = useVaultDetails(activeTab);

  return (
    <VaultDetailsContext.Provider value={value}>
      {children}
    </VaultDetailsContext.Provider>
  );
};

export const useVaultDetailsContext = () => {
  const context = useContext(VaultDetailsContext);
  if (context === undefined) {
    throw new Error(
      'useVaultDetailsContext must be used within a VaultDetailsProvider',
    );
  }
  return context;
};
