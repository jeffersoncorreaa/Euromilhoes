# Análise de Loterias - Euromilhões

App web para análise estatística completa dos sorteios do Euromilhões.

## Funcionalidades

- ✅ **Cadastro Manual**: Adicione sorteios individualmente
- ✅ **Importação em Massa**: Carregue dados históricos oficiais automaticamente
- ✅ **Análise Estatística**: Frequência de números e estrelas, padrões, tendências
- ✅ **Análise Inteligente**: Algoritmos de IA para identificar números quentes/frios
- ✅ **Combinações Sugeridas**: Geração automática de chaves estratégicas
- ✅ **Gráficos Interativos**: Visualização de dados com Recharts
- ✅ **Filtros Avançados**: Análise por período de datas
- ✅ **Exportação**: Salve dados em JSON ou CSV
- ✅ **PWA**: Funciona como app mobile
- ✅ **Persistência**: Dados salvos no localStorage

## Dados Históricos

O app inclui uma base de dados com 60 sorteios oficiais do Euromilhões de 2024, permitindo análises estatísticas robustas desde o primeiro momento.

### Como Adicionar Mais Dados

1. **Importação Automática**: Clique em "Importar Dados Históricos" para carregar sorteios oficiais
2. **Cadastro Manual**: Use "Adicionar Sorteio" para inserir sorteios individuais
3. **Importação JSON**: Use "Importar" para carregar arquivos JSON com múltiplos sorteios

## Análises Disponíveis

### Estatísticas Básicas
- Total de sorteios cadastrados
- Média de números e estrelas
- Frequência individual de cada número (1-50) e estrela (1-12)

### Análise Avançada
- **Números Quentes**: Mais frequentes recentemente
- **Números Frios**: Menos sorteados (oportunidades)
- **Tendências**: Análise de padrões e direções
- **Combinações Estratégicas**: Sugestões baseadas em algoritmos estatísticos

### Visualizações
- Gráficos de barras para frequência de números
- Gráficos de pizza para frequência de estrelas
- Tendências e padrões históricos

## Instalação

1. Instale o Node.js: https://nodejs.org/ (versão LTS)
2. Instale as dependências:
   ```bash
   npm install
   ```

## Rodar o app

Desenvolvimento:
```bash
npm run dev
```

Build para produção:
```bash
npm run build
```

Preview do build:
```bash
npm run preview
```

## Estrutura dos Dados

Cada sorteio é armazenado no formato:
```json
{
  "id": 1,
  "drawNumber": "001/2024",
  "date": "2024-01-02",
  "numbers": [5, 12, 23, 34, 45],
  "stars": [2, 8]
}
```

## Tecnologias

- **React 18**: Framework frontend
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Estilização
- **Recharts**: Gráficos interativos
- **Lucide React**: Ícones
- **date-fns**: Manipulação de datas

## PWA (Progressive Web App)

O app pode ser instalado como aplicativo mobile. Para adicionar ícones personalizados, coloque os arquivos na pasta `public/`:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)

## Licença

Este projeto é open source e pode ser usado livremente para fins educacionais e pessoais.
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

Ou converter o `icon.svg` existente para PNG usando ferramentas como:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/pt/svg-png/

## Instalar como App Mobile

1. Abra o app no navegador (Chrome no Android ou Safari no iOS)
2. No menu do navegador, selecione "Adicionar à tela inicial" ou "Instalar app"
3. O app será instalado como um app nativo

## Tecnologias

- React 18
- Vite
- TailwindCSS
- Recharts (gráficos)
- Lucide React (ícones)
- Vite PWA (PWA)
