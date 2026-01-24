import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const VaultTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Asset</TableHead>
        <TableHead>Vault Name</TableHead>
        <TableHead className="text-right">TVL</TableHead>
        <TableHead className="text-right">Depositors</TableHead>
        <TableHead className="text-right">Net Flow (7d)</TableHead>
        <TableHead className="text-right">Created</TableHead>
      </TableRow>
    </TableHeader>
  );
};
