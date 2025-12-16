# 📊 Interactive Box Plot for Power BI

Visual personalizado de Box Plot com análise estatística completa e alta personalização para Microsoft Power BI.

![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-yellow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 O que é este visual?

Um Box Plot interativo que mostra a **distribuição completa dos seus dados**, incluindo:

- ✅ **Quartis** (Q1, Mediana, Q3)
- ✅ **Valores Mínimo e Máximo**
- ✅ **Média** com símbolo personalizável
- ✅ **Outliers** (valores extremos) destacados
- ✅ **Pontos individuais** para ver a distribuição real
- ✅ **Tooltips detalhados** com todas as estatísticas
- ✅ **Suporta até 500.000 linhas** de dados

![Box Plot Preview](assets/preview.png)

---

## 📦 Instalação (3 passos)

### 1. Baixe o arquivo

Acesse a página de [**Releases**](https://github.com/ProjectsDataWill/Projetos-Power-BI/releases) e baixe o arquivo:
```
InteractiveBoxPlot.pbiviz
```

### 2. Importe no Power BI

1. Abra seu relatório no **Power BI Desktop**
2. No painel **Visualizações**, clique nos **3 pontinhos (...)** 
3. Selecione **"Importar um visual de um arquivo"**
4. Escolha o arquivo `InteractiveBoxPlot.pbiviz` baixado
5. Clique em **"Importar"** no aviso de segurança

### 3. Adicione ao relatório

O ícone do visual aparecerá no painel de Visualizações. Clique nele para adicionar ao seu relatório!

---

## 🚀 Como Usar

### Configure os campos:

| Campo | Obrigatório | O que colocar | Exemplo |
|-------|-------------|---------------|---------|
| **Categoria** | ✅ Sim | Campo de agrupamento | Filial, Região, Produto |
| **Valores** | ✅ Sim | Campo numérico **SEM agregação** | Tempo_Entrega, Lead_Time, Vendas |
| **Detalhes** | ⚠️ Recomendado | Identificador único | Número_Pedido, ID, Documento |

### ⚠️ IMPORTANTE: Configure "Não resumir"

O campo **Valores** deve estar como **"Não resumir"**:

1. Clique na **setinha** ao lado do campo
2. Selecione **"Não resumir"** (ou "Don't summarize")

**Por quê?** O Box Plot precisa dos valores individuais, não da soma ou média.

---

## ⚙️ Principais Configurações

Clique no ícone de **pincel** (Formatar) para personalizar:

### 📊 Box Plot Settings
- **Whisker Type**: Escolha o método de cálculo
  - **< 1.5 IQR**: Padrão estatístico (recomendado)
  - **Min/Max**: Mostra valores extremos
  - **Percentile**: Usa percentis 5% e 95%
- **Show Outliers**: Mostrar valores extremos ✅
- **Show Data Points**: Mostrar pontos individuais ✅

### 📈 Y Axis (Eixo Vertical)
- **Range Start/End**: Defina o intervalo do eixo manualmente
- **Focus on IQR**: Ignora outliers extremos na escala ✅ *Recomendado!*
- **Clip Outliers**: Limita outliers ao range definido

### 📐 X Axis (Eixo Horizontal)
- **Sort Order**: Ordenar categorias
  - Default: Ordem original
  - Ascending: A → Z
  - Descending: Z → A

### 🎯 Mean Settings (Média)
- **Mean Shape**: Escolha o símbolo
  - Circle (●), Square (■), Diamond (◆), Triangle (▲), Cross (✕)
- **Show Mean Label**: Mostrar valor numérico ✅
- **Label Background**: Adicionar fundo ao label

### 🔴 Outlier Settings
- **Outlier Size**: Tamanho dos pontos (3-15px)
- **Outlier Opacity**: Transparência (0-100%)
- **Outlier Border Width**: Largura da borda (0-5px)
- **Outlier Border Color**: Cor da borda ✨ **NOVO!**

### 🎨 Colors (Cores)
- **Box Color**: Cor da caixa
- **Median Color**: Cor da linha da mediana
- **Mean Color**: Cor do símbolo da média
- **Outlier Color**: Cor dos pontos extremos

---

## 💡 Exemplo Prático

**Cenário**: Analisar tempo de entrega por filial
```
Configuração:
✅ Categoria: Filial
✅ Valores: Minutos_Lead_Time (Não resumir)
✅ Detalhes: Numero_Pedido

Configurações recomendadas:
✅ Whisker Type: < 1.5 IQR
✅ Show Outliers: On
✅ Focus on IQR: On
✅ Range: 0 a 600 (ajuste conforme seus dados)
```

**O que você verá**:
- Box plot para cada filial
- Outliers (pedidos com atraso extremo) em destaque
- Mediana (linha vermelha) e Média (ponto verde)
- Tooltip detalhado ao passar o mouse

---

## 🐛 Problemas Comuns

### "Excesso de valores" ou "Não mostrando todos os dados"

**Causa**: Volume de dados acima do limite (>500.000 linhas)

**Solução**:
1. **Desative "Show Data Points"** nas configurações (melhora muito a performance)
2. Ou aplique **filtros** para reduzir o volume de dados
3. Ou use **slicers** para filtrar período/categoria
4. Para volumes extremos (>1 milhão), considere criar agregação prévia na fonte de dados

### Aparece apenas uma linha horizontal

**Causa**: Campo "Valores" está agregado (Soma, Média, etc)

**Solução**: 
1. Clique na setinha do campo "Valores"
2. Selecione **"Não resumir"**

### Outliers passam do limite do gráfico

**Solução**:
1. Vá em **Y Axis** → **Clip Outliers to Range** → **On**

### Visual muito comprimido

**Solução**:
1. Vá em **Y Axis** → **Focus on IQR** → **On**
2. Ou defina **Range Start** e **Range End** manualmente

### Visual lento ou travando

**Causa**: Muitos pontos individuais sendo renderizados

**Solução**:
1. **Desative "Show Data Points"** (essencial para >50k linhas)
2. Reduza **Data Point Size** para 2px
3. Diminua **Data Point Opacity** para 0.2
4. Use **filtros** para reduzir categorias no eixo X

---

## 📋 Requisitos

- ✅ Power BI Desktop (Julho 2023 ou superior)
- ✅ Dados com valores numéricos individuais (não agregados)
- ✅ Suporta até **500.000 linhas** de dados

### 📊 Performance por Volume

| Volume de Dados | Performance | Recomendações |
|-----------------|-------------|---------------|
| **< 10.000 linhas** | ⚡ Excelente | Todas funcionalidades ativas |
| **10.000 - 50.000** | ✅ Boa | Todas funcionalidades ativas |
| **50.000 - 100.000** | ⚠️ Moderada | Desative "Show Data Points" |
| **100.000 - 500.000** | ⚠️ Lenta | Desative "Show Data Points" obrigatoriamente |
| **> 500.000** | ❌ Muito lenta | Use filtros ou agregação na fonte de dados |

**💡 Dica**: Para grandes volumes, desativar "Show Data Points" melhora drasticamente a performance sem perder as estatísticas do box plot!

---

## 🎯 Casos de Uso

| Área | Aplicação |
|------|-----------|
| **Logística** | Analisar tempo de entrega por região/transportadora |
| **Vendas** | Comparar distribuição de vendas entre produtos |
| **Qualidade** | Monitorar tempo de produção e detectar anomalias |
| **RH** | Avaliar performance de equipes |
| **Financeiro** | Analisar distribuição de receitas/custos |
| **Manufatura** | Controle estatístico de processo (SPC) |
| **Healthcare** | Análise de tempo de atendimento por especialidade |

---

## 🔧 Otimizações de Performance

Para garantir a melhor experiência com grandes volumes de dados:

### ✅ Recomendações Essenciais

1. **Desative "Show Data Points"** para volumes >50k linhas
   - Vai em **Box Plot Settings** → **Show Data Points** → **Off**
   - Reduz DRASTICAMENTE o tempo de renderização
   - Mantém todas as estatísticas (quartis, média, mediana, outliers)

2. **Use "Focus on IQR"**
   - Vai em **Y Axis** → **Focus on IQR** → **On**
   - Ignora outliers extremos na escala
   - Melhora visualização do padrão principal

3. **Aplique filtros estratégicos**
   - Filtre por período relevante
   - Use Top N categorias
   - Aplique slicers para análise interativa

4. **Ajuste tamanhos**
   - **Data Point Size**: 2px (ao invés de 3px)
   - **Outlier Size**: 4px (ao invés de 5px)
   - **Data Point Opacity**: 0.3 (ao invés de 0.4)

### 📈 Configuração para Alto Volume (>100k linhas)
```
✅ Show Data Points: OFF (crítico!)
✅ Show Outliers: ON
✅ Focus on IQR: ON
✅ Clip Outliers: ON
✅ Whisker Type: 1.5 IQR
```

Esta configuração mantém todas as informações estatísticas importantes enquanto maximiza a performance.

---

## 📞 Suporte

- 🐛 **Problemas?** [Abra uma Issue](https://github.com/ProjectsDataWill/Projetos-Power-BI/issues)
- 💡 **Sugestões?** [Discussões](https://github.com/ProjectsDataWill/Projetos-Power-BI/discussions)
- 📧 **Contato**: [Seu email ou perfil]

---

## 📝 Changelog

### **v1.11.0** (Atual)
- ✨ **Adicionado:** Customização de cor da borda dos outliers
- 🎨 **Melhorado:** Controle completo sobre aparência dos outliers

### **v1.10.1** (Atual)
- 🐛 **Corrigido:** Cor das linhas de grade não aplicava corretamente
- 🔧 **Melhorado:** Renderização das linhas de grade para aceitar customização de cor

### **v1.10.0**
- ✨ **Adicionado:** Configurações de borda da box (largura e cor)
- ✨ **Adicionado:** Seção Grid Settings completa
  - Show/Hide grid lines
  - Grid color customization
  - Grid opacity control (0-1)
  - Grid line width adjustment (0-5)
- 🎨 **Melhorado:** Controle total sobre aparência das linhas de grade

### **v1.9.0**
- 🚀 **Aumentado limite para 500.000 linhas** de dados
- 🎨 **Suporte a ícone personalizado** (20x20 pixels)
- ⚡ **Otimizações de performance** para grandes volumes
- 📚 **Documentação expandida** com guia completo de uso
- 📊 **Melhorias de performance** no algoritmo de processamento de dados

### v1.8.1
- 🚀 Aumentado limite de dados para 100.000 linhas
- 🔧 Otimizado `dataReductionAlgorithm` no capabilities.json
- 📚 Documentação completa adicionada

### v1.8.0
- ✨ Ordenação do eixo X (Default, Ascending, Descending)
- 🎨 Margens otimizadas para máximo espaço de plotagem
- 📐 Título removido (mais área de plotagem)
- 🔧 Margens reduzidas: `{ top: 30, right: 30, bottom: 60, left: 60 }`

### v1.7.0
- ✨ Mean Settings completos com 5 formas de símbolo
- 🎯 Formas disponíveis: Circle, Square, Diamond, Triangle, Cross
- 🏷️ Labels da média com background opcional
- 👁️ Show/hide títulos dos eixos X e Y
- 🎨 Controle completo de aparência da média

### v1.6.0
- ✨ Formatação completa dos eixos X e Y
- 🎨 Controle de fontes, cores e ângulos dos labels
- ✂️ Clipping de outliers ao range do eixo Y
- 📐 Customização de títulos dos eixos

### v1.5.0
- ✨ Outlier Settings (tamanho, opacidade, borda)
- 🎨 Outliers mais customizáveis
- 📊 Melhor destaque visual de valores extremos

### v1.4.0
- ✨ Processamento de dados granulares
- ✨ Suporte a campo "Detalhes" para valores individuais
- 📊 Suporte até 10.000 linhas de dados
- 🐛 Correção de erro "Nenhum dado válido"
- 🔧 Melhor processamento de múltiplas categorias

### v1.3.0
- ✨ Focus on IQR (ignora outliers extremos na escala)
- 📏 Range manual do eixo Y
- 🎯 Melhor visualização de padrões principais

### v1.2.0
- ✨ Tooltips interativos detalhados
- 📊 Informações completas ao passar o mouse
- 🔍 Exibição de todas as estatísticas

### v1.1.0
- ✨ Múltiplos tipos de whisker
  - 1.5 IQR (padrão estatístico)
  - Min/Max (valores extremos)
  - 5th/95th Percentile
- 📊 Flexibilidade na análise estatística

### v1.0.0
- 🎉 Versão inicial do Interactive Box Plot
- 📊 Estatísticas básicas (Q1, Q2, Q3, Min, Max)
- 🎨 Cores personalizáveis
- 📈 Visualização de outliers

---

**Histórico completo**: [Ver todas as versões](https://github.com/ProjectsDataWill/Projetos-Power-BI/releases)

---

## 📄 Licença

Este projeto está sob a licença **MIT** - use livremente, inclusive comercialmente!
```
MIT License - Copyright (c) 2024 ProjectsDataWill
```

Veja o arquivo [LICENSE](LICENSE) para detalhes completos.

---

## 🙏 Créditos

**Desenvolvido por** [ProjectsDataWill](https://github.com/ProjectsDataWill)

**Tecnologias utilizadas:**
- Power BI Visuals API 5.4.0
- TypeScript 4.9.5
- D3.js 7.0.0
- Node.js 18.x

**Agradecimentos:**
- Microsoft Power BI Team
- D3.js Community
- Comunidade Power BI Brasil

---

## 🌟 Funcionalidades Destacadas

### 🎨 Personalização Total
Controle cada aspecto visual do box plot - cores, tamanhos, fontes, opacidades e muito mais.

### 📊 3 Métodos de Whisker
Escolha entre 1.5 IQR (padrão estatístico), Min/Max ou Percentile conforme sua análise.

### 🎯 5 Formas de Média
Circle, Square, Diamond, Triangle ou Cross - destaque a média como preferir.

### 🔍 Detecção Inteligente de Outliers
Identifique automaticamente valores extremos com cálculo baseado no IQR.

### ⚡ Alta Performance
Otimizado para trabalhar com até 500.000 linhas mantendo boa responsividade.

### 📱 Tooltips Interativos
Passe o mouse sobre qualquer elemento e veja estatísticas detalhadas instantaneamente.

---

## 📖 FAQ (Perguntas Frequentes)

**P: Posso usar este visual comercialmente?**  
R: ✅ Sim! A licença MIT permite uso comercial sem restrições.

**P: O visual funciona no Power BI Service (nuvem)?**  
R: ✅ Sim, mas pode ter limitações. Recomendamos Power BI Premium ou adicionar como visual organizacional.

**P: Como atualizo para uma nova versão?**  
R: Baixe o novo arquivo .pbiviz da página de Releases e reimporte no Power BI.

**P: Posso modificar o código fonte?**  
R: ✅ Sim! Fork o projeto no GitHub e customize conforme suas necessidades.

**P: O visual está travando, o que fazer?**  
R: Desative "Show Data Points" nas configurações. Isso resolve 90% dos problemas de performance.

**P: Funciona com dados de outras fontes (SQL, Excel, etc)?**  
R: ✅ Sim! Funciona com qualquer fonte de dados do Power BI, desde que sejam valores numéricos individuais.

**P: Posso usar em dashboards públicos?**  
R: ✅ Sim, mas verifique as políticas de visuais personalizados da sua organização.

---

<div align="center">

### ⭐ Gostou? Deixe uma estrela no repositório!

[![GitHub stars](https://img.shields.io/github/stars/ProjectsDataWill/Projetos-Power-BI?style=social)](https://github.com/ProjectsDataWill/Projetos-Power-BI)

---

### 📥 [Download Latest Version](https://github.com/ProjectsDataWill/Projetos-Power-BI/releases/latest)

---

**[🐛 Reportar Bug](https://github.com/ProjectsDataWill/Projetos-Power-BI/issues)** • **[💡 Sugerir Funcionalidade](https://github.com/ProjectsDataWill/Projetos-Power-BI/issues)** • **[📖 Documentação Completa](https://github.com/ProjectsDataWill/Projetos-Power-BI/wiki)**

---

**Desenvolvido com ❤️ por [ProjectsDataWill](https://github.com/ProjectsDataWill)**

*Transformando dados em insights visuais desde 2024*

</div>