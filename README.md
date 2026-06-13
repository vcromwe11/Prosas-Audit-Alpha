<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0dea86c6-2653-4e9e-af80-768c05f59772

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
Guia de Funcionalidades e Arquitetura — prosas AUDIT
Este documento detalha o funcionamento, o estado operacional e os aspectos técnicos do sistema prosas AUDIT — uma plataforma de auditoria inteligente de propostas e editais que integra inteligência artificial generativa multimodal com regras determinísticas locais.
1. Visão Geral do Sistema
O prosas AUDIT foi desenvolvido para automatizar e otimizar o fluxo de análise de conformidade documental e técnica de candidatos em editais, chamadas públicas ou concursos de fomento. Através do uso estratégico da IA multimodal, a plataforma avalia se as propostas submetidas estão em conformidade com o regulamento do edital, com o modelo de formulário de inscrição e com as diretrizes analíticas definidas.
2. Estrutura de Fluxos e Telas (App Stages)
A plataforma está organizada de forma modular, permitindo que o gestor de projetos configure o ambiente e execute auditorias com clareza:
Controle de Acesso (AppStage.LOGIN): Interface de entrada protegida por autenticação segura via Firebase Auth, suportando acesso tradicional (Email/Senha) e autenticação federada (Google Sign-In).
Painel Histórico-Demonstrativo (AppStage.DASHBOARD / DEMO_PLATFORM): Espaço para visualização retrospectiva de resultados de editais analisados. Agrupa relatórios, exibe métricas de aprovação (Aprovados, Aprovados com Ressalva, Reprovados) e consolida os dados arquivados.
Nota de Operação: Atualmente, o painel central atua de forma demonstrativa e descritiva. Ele foi planejado para ilustrar o consolidado analítico de editais e permitir consulta direta de relatórios gerados e persistidos no banco de dados.
Configuração de Auditoria (AppStage.ANALYSIS_SETUP): A central de controle de contexto, onde o auditor faz o upload dos documentos norteadores:
Regulamento/Edital (Obrigatório): Documento base com as regras do processo.
Modelo de Formulário (Opcional): Estrutura que limita como a proposta deve ser enviada.
Outros Anexos (Opcional): Erratas, manuais e guias adicionais.
Mesa Concorrente de Análise (AppStage.ANALYSIS_RUN): Mesa de trabalho flexível onde múltiplos slots de candidatos podem ser adicionados dinamicamente. Suporta uploads individuais de arquivos (PDF, DOCX) por candidato para processamento simultâneo ou cancelamento de etapas de processamento.
Visualizador de Relatório (AppStage.REPORT_VIEW): Ficha detalhada do parecer final emitido para cada candidato. Inclui status de compliance, notas individuais de critérios, justificativas técnicas fundamentadas e exportação automática em documento PDF diagramado de alta fidelidade via html2pdf.js.
3. Modos de Auditoria por IA: Diferenças Cruciais
O sistema possui dois motores de processamento com lógicas distintas para atender às prioridades do fluxo operacional:
Modo A: IA Completa (100% Funcional e Homologada)
Fluxo de Operação: O sistema faz a leitura integral dos arquivos do candidato (através de analisadores locais em JavaScript) e monta uma instrução multimodal consolidada juntamente com o Regulamento, as regras do formulário e o Prompt customizado. No motor do Gemini, o conteúdo é verificado minuciosamente de ponta a ponta.
Resultado: Ideal para editais rigorosos que necessitam de um julgamento holístico e profundo de consistência técnica, adequação orçamentária ou conformidade sem limites estritos pré-definidos.
Modo B: IA Otimizada ("BETA")
Fluxo de Operação (Short-Circuit): Antes de enviar a volumosa documentação do candidato para o processamento de linguagem natural da API, o sistema roda o Mecanismo de Triagem Determinística (regras lógicas locais de documento/assinatura, data de certidões e existência de termos obrigatórios).
Julgamento de Inabilitação: Se o candidato falhar em um critério documental obrigatório estabelecido de forma determinística, a análise é interrompida imediatamente (Short-Circuit) e o status é definido como REPROVADO por inabilitação documental.
Diferencial Técnico: Evita-se o envio de propostas substancialmente fora da conformidade estrutural básica para processamento de IA, o que proporciona uma drástica economia de tokens, redução de custos operacionais e aceleração drástica no tempo de fila das análises concorrentes.
Classificação Atual: Marcado como "BETA" devido ao desenvolvimento constante dos algorítmos heurísticos automatizados que traduzem os editais em regras de validação lógica (RegEx e checagem de dados determinísticos).
4. A Força da IA: IA Criadora do seu Próprio Prompt ("Prompt Mestre")
A plataforma implementa um recurso sofisticado para reduzir a carga de trabalho de programação ou redação do auditor:
Configuração Inteligente: O botão "Gerar com IA do Regulamento" utiliza processamento de instruções baseadas em templates globais para ler o regulamento enviado, capturar as diretrizes de avaliação e extrair logicamente um prompt personalizado de avaliação de critérios.
Três Perfis de Seleção:
Econômico (Beta / Curto): Produz um prompt compacto (~1k tokens de instrução) voltado para avaliações concisas e de baixo consumo.
Padrão: Equilíbrio estruturado de conformidade analítica (~2.5k tokens).
Especializada: Prompt longo e detalhador de casos de bordas, exceções de regras jurídicas e tabelas complexas (~5k+ tokens).
5. Arquitetura e Pilha Tecnológica (Foco em Desenvolvimento)
Para o time técnico que dará manutenção, testará ou estenderá a plataforma, os seguintes pontos estruturais de engenharia devem ser observados:
Integração com Gemini API: Utiliza o SDK mais recente @google/genai operando no modelo recomendado de alta densidade cognitiva gemini-3.1-pro-preview, aproveitando suas capacidades avançadas de representação textual e compreensão de tabelas.
Processadores de Arquivos Client-Side:
PDF.js (pdfjs-dist): Extrai textos, sequências e estruturas de layouts PDF mantendo a isolação e a privacidade dos dados antes do payload de processamento.
Mammoth.js (mammoth): Converte documentos textuais .docx em estruturas normatizadas para inclusão em prompt.
Persistência de Dados: Configurado sob Firebase Firestore, gravando e recuperando o histórico de editais, relatórios emitidos para a diretoria, revisões, status analíticos e templates configurados de prompts centrais.
Transição de Estados Animada: O roteamento interno de telas é amparado por efeitos do motion (importado de motion/react), preservando leveza de experiência mesmo em telas altamente carregadas de slots e dados.
