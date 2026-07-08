import { SavedReport } from '../types';

/**
 * Verifica se um ID proposto (tanto para edital quanto para proposta/projeto) já existe no banco de dados.
 * 
 * @param type Tipo de ID: 'proposta' ou 'edital'
 * @param proposedId O ID proposto digitado pelo usuário
 * @param reportId O ID interno do relatório que está sendo editado (para não comparar com ele mesmo)
 * @param editalName O nome do edital do relatório atual (para permitir o mesmo ID de edital entre projetos do mesmo edital)
 * @param globalAllReports Lista completa de todos os relatórios cadastrados no sistema
 * @returns Um objeto contendo se está disponível (isAvailable) e o próximo ID sugerido (nextSuggestedId)
 */
export const verifyIdAvailability = (
  type: 'proposta' | 'edital',
  proposedId: string,
  reportId: string,
  editalName: string,
  globalAllReports: SavedReport[]
): { isAvailable: boolean; nextSuggestedId: string } => {
  if (!proposedId || proposedId.trim() === '') {
    return { isAvailable: true, nextSuggestedId: '1' };
  }

  const cleanProposed = proposedId.trim();
  let isDuplicate = false;

  if (type === 'proposta') {
    // IDs de proposta devem ser únicos globalmente para todos os projetos
    isDuplicate = globalAllReports.some(
      (r) => r.id !== reportId && r.propostaId === cleanProposed
    );
  } else {
    // IDs de edital devem ser únicos entre editais diferentes.
    // Projetos que pertencem ao MESMO edital (mesmo nome) compartilham o mesmo ID de edital,
    // mas editais com nomes diferentes não podem repetir o ID de edital.
    isDuplicate = globalAllReports.some(
      (r) => r.editalName !== editalName && r.editalId === cleanProposed
    );
  }

  // Calcula o próximo ID sequencial disponível para este tipo
  let max = 0;
  globalAllReports.forEach((r) => {
    const val = type === 'proposta' ? r.propostaId : r.editalId;
    if (val) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
  });

  const nextSuggestedId = String(max + 1);

  return {
    isAvailable: !isDuplicate,
    nextSuggestedId,
  };
};

export const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;

  return true;
};

export const isValidCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};
