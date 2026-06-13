import { DocumentAuthRule } from '../types';

export interface RuleTemplate {
  name: string;
  description: string;
  category: 'Cadastro' | 'Regularidade Fiscal' | 'Situação Jurídica';
  rule: Omit<DocumentAuthRule, 'id'>;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: 'Cartão CNPJ',
    description: 'Valida a situação cadastral ativa e data de emissão há no máximo 3 meses da data de referência.',
    category: 'Cadastro',
    rule: {
      questionPrefix: '1.1',
      documentType: 'Cartão CNPJ',
      dataToScrape: 'Data de Emissão',
      formatRegex: 'Emitido no dia\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isWithinThreeMonths(value, referenceDate)',
      approvalTrigger: 'CNPJ Ativo e emitido há menos de 3 meses da data de referência.',
      rejectionTrigger: 'CNPJ inativo ou emitido há mais de 3 meses em relação à data do edital.'
    }
  },
  {
    name: 'CND Federal (União)',
    description: 'Verifica a validade da Certidão de Débitos Relativos a Créditos Tributários Federais.',
    category: 'Regularidade Fiscal',
    rule: {
      questionPrefix: '1.2',
      documentType: 'CND Federal',
      dataToScrape: 'Data de Validade (Federal)',
      formatRegex: 'válida até\\s*(\\d{2}/\\d{2}/\\d{4})|válido até\\s*(\\d{2}/\\d{2}/\\d{4})|VALIDADE:\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isValidTo(value, referenceDate)',
      approvalTrigger: 'CND Federal dentro do prazo de validade em relação à data do edital.',
      rejectionTrigger: 'CND Federal vencida na data de corte ou data de validade não encontrada.'
    }
  },
  {
    name: 'CRF FGTS',
    description: 'Certificado de Regularidade do FGTS, confirmando situação regular e prazo vigente.',
    category: 'Regularidade Fiscal',
    rule: {
      questionPrefix: '1.3',
      documentType: 'CRF FGTS',
      dataToScrape: 'Data de Validade (FGTS)',
      formatRegex: 'Válido até\\s*(\\d{2}/\\d{2}/\\d{4})|válido até\\s*(\\d{2}/\\d{2}/\\d{4})|Validade:\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isValidTo(value, referenceDate)',
      approvalTrigger: 'Certificado de FGTS (CRF) válido na data de referência.',
      rejectionTrigger: 'CRF FGTS vencido ou situação de irregularidade constatada.'
    }
  },
  {
    name: 'CND Trabalhista (CNDT)',
    description: 'Certidão Negativa de Débitos Trabalhistas emitida pela Justiça do Trabalho.',
    category: 'Regularidade Fiscal',
    rule: {
      questionPrefix: '1.4',
      documentType: 'CNDT Trabalhista',
      dataToScrape: 'Data de Validade CNDT',
      formatRegex: 'validade:\\s*(\\d{2}/\\d{2}/\\d{4})|válida até\\s*(\\d{2}/\\d{2}/\\d{4})|Vigência:\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isValidTo(value, referenceDate)',
      approvalTrigger: 'Certidão CNDT regular e dentro do prazo de validade.',
      rejectionTrigger: 'CNDT Trabalhista vencida na data de corte ou padrão não identificado.'
    }
  },
  {
    name: 'Falência / Recuperação Judicial',
    description: 'Certidão de Falência e Recuperação Judicial, emitida há no máximo 3 meses.',
    category: 'Situação Jurídica',
    rule: {
      questionPrefix: '1.5',
      documentType: 'Recuperação Judicial',
      dataToScrape: 'Data de Emissão (Falência)',
      formatRegex: 'expedida em\\s*(\\d{2}/\\d{2}/\\d{4})|datado de\\s*(\\d{2}/\\d{2}/\\d{4})|emissão:\\s*(\\d{2}/\\d{2}/\\d{4})|Sessão de\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isWithinThreeMonths(value, referenceDate)',
      approvalTrigger: 'Certidão de Falência/Recuperação expedida a menos de 3 meses.',
      rejectionTrigger: 'Certidão com emissão superior a 90 dias ou ausente de data.'
    }
  },
  {
    name: 'CND Estadual',
    description: 'Certidão de Regularidade Fiscal com o Estado onde reside o proponente.',
    category: 'Regularidade Fiscal',
    rule: {
      questionPrefix: '1.6',
      documentType: 'CND Estadual',
      dataToScrape: 'Data de Validade Estadual',
      formatRegex: 'válida até\\s*(\\d{2}/\\d{2}/\\d{4})|validade:\\s*(\\d{2}/\\d{2}/\\d{4})|válida de\\s*\\d{2}/\\d{2}/\\d{4}\\s*a\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isValidTo(value, referenceDate)',
      approvalTrigger: 'Suficiência fiscal estadual comprovada dentro do prazo.',
      rejectionTrigger: 'Certidão Estadual vencida ou data final de validade ilegível.'
    }
  },
  {
    name: 'CND Municipal',
    description: 'Certidão de Regularidade com a prefeitura do município do proponente.',
    category: 'Regularidade Fiscal',
    rule: {
      questionPrefix: '1.7',
      documentType: 'CND Municipal',
      dataToScrape: 'Data de Validade Municipal',
      formatRegex: 'válida até\\s*(\\d{2}/\\d{2}/\\d{4})|validade:\\s*(\\d{2}/\\d{2}/\\d{4})|válida de\\s*\\d{2}/\\d{2}/\\d{4}\\s*a\\s*(\\d{2}/\\d{2}/\\d{4})',
      validationRule: 'isValidTo(value, referenceDate)',
      approvalTrigger: 'Certidão Municipal regular e válida perante o corte de inscrição.',
      rejectionTrigger: 'CND Municipal vencida na data do edital ou sem identificação.'
    }
  }
];

export interface FileScanSuggestion {
  fileName: string;
  suggestedTemplateName: string;
  confidence: 'HIGH' | 'MEDIUM';
  reason: string;
  template: RuleTemplate;
}

/**
 * Escaneia uma lista de nomes de arquivos para sugerir regras prontas cabíveis.
 */
export const scanFilesForRules = (fileNames: string[]): FileScanSuggestion[] => {
  const suggestions: FileScanSuggestion[] = [];

  for (const name of fileNames) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('cnpj') || lowerName.includes('cadastro_nacional') || lowerName.includes('receita_federal')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'Cartão CNPJ')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'Cartão CNPJ',
        confidence: 'HIGH',
        reason: 'O nome do arquivo menciona "cnpj" ou termos cadastrais correlatos.',
        template
      });
    } else if (lowerName.includes('uniao') || lowerName.includes('union') || (lowerName.includes('federal') && lowerName.includes('cnd'))) {
      const template = RULE_TEMPLATES.find(t => t.name === 'CND Federal (União)')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'CND Federal',
        confidence: 'HIGH',
        reason: 'O nome indica uma certidão negativa federal.',
        template
      });
    } else if (lowerName.includes('fgts') || lowerName.includes('crf') || lowerName.includes('fundo_de_garnt')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'CRF FGTS')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'CRF FGTS',
        confidence: 'HIGH',
        reason: 'O nome traz siglas ou menções diretas ao FGTS / CRF.',
        template
      });
    } else if (lowerName.includes('trabalho') || lowerName.includes('cndt') || lowerName.includes('trabalhista')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'CND Trabalhista (CNDT)')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'CND Trabalhista',
        confidence: 'HIGH',
        reason: 'O nome indica um documento de regularidade trabalhista (CNDT).',
        template
      });
    } else if (lowerName.includes('falencia') || lowerName.includes('recuperacao') || lowerName.includes('recuperação') || lowerName.includes('judicial')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'Falência / Recuperação Judicial')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'Recuperação Judicial',
        confidence: 'HIGH',
        reason: 'O arquivo contém termos sobre falência, recuperação judicial ou certidões forenses.',
        template
      });
    } else if (lowerName.includes('estadual') || lowerName.includes('sefaz') || lowerName.includes('icms')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'CND Estadual')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'CND Estadual',
        confidence: 'HIGH',
        reason: 'O arquivo cita recolhimentos estaduais ou SEFAZ.',
        template
      });
    } else if (lowerName.includes('municipal') || lowerName.includes('subprefeitura') || lowerName.includes('mobiliario') || lowerName.includes('prefeitura') || lowerName.includes('iss')) {
      const template = RULE_TEMPLATES.find(t => t.name === 'CND Municipal')!;
      suggestions.push({
        fileName: name,
        suggestedTemplateName: 'CND Municipal',
        confidence: 'HIGH',
        reason: 'O nome do arquivo indica uma certidão de tributos municipais.',
        template
      });
    }
  }

  return suggestions;
};
