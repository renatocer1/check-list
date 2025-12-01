# Checklist Inteligente com IA Gemini

Este é um aplicativo avançado de gestão de frota e checklist veicular, equipado com Inteligência Artificial do Google Gemini.

## Funcionalidades Principais

*   **Checklist Conversacional:** O motorista fala com o app para preencher o checklist.
*   **Diagnóstico por IA:** Usa o Gemini Thinking Mode para analisar problemas mecânicos complexos.
*   **Visão Computacional:** Analisa fotos de avarias e pneus.
*   **Gemini Live:** Copiloto de voz em tempo real.
*   **Integração Firebase:** Sincronização de dados em tempo real com o painel do gestor.
*   **PWA:** Instalável em Android e iOS.

## Como Publicar (Deploy)

Para colocar este app no ar, siga estes passos:

1.  **Configurar Firebase:**
    *   Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    *   Habilite o **Firestore Database**.
    *   Copie as configurações do projeto (Web App).
    *   Atualize o arquivo `services/firebase.ts` com suas chaves reais.

2.  **Hospedagem (Sugestão: Vercel ou Netlify):**
    *   Este projeto usa Vite e React.
    *   Conecte seu repositório GitHub na Vercel.
    *   A Vercel detectará automaticamente as configurações do Vite.
    *   **Importante:** Adicione a variável de ambiente `API_KEY` no painel da Vercel com sua chave da API do Google Gemini.

3.  **Instalação no Celular:**
    *   Acesse a URL gerada (ex: `seu-app.vercel.app`) pelo navegador do celular (Chrome no Android ou Safari no iOS).
    *   Toque em "Compartilhar" -> "Adicionar à Tela de Início".

## Variáveis de Ambiente

O app espera as seguintes variáveis (seja via `.env` local ou configuração do servidor de hospedagem):

*   `API_KEY`: Sua chave da API Google Gemini (AI Studio).
