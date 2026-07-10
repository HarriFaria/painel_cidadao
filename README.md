# Painel Cidadao

Dashboard estatico dos servicos mais solicitados no Painel Cidadao, com base no arquivo `servicos+ate_junho_ano_mes.xlsx`.

## Como acessar localmente

Abra o arquivo `index.html` no navegador ou sirva a pasta com um servidor estatico:

```bash
python -m http.server 8080
```

## Deploy no Vercel

O projeto nao precisa de build. No Vercel, selecione este repositorio e mantenha as configuracoes padrao para projeto estatico.

## Fonte dos dados

- Arquivo: `servicos+ate_junho_ano_mes.xlsx`
- Aba: `painel_cidadao user_demands1`
- Periodo: 2019 a 2026
- Observacao: os dados possuem granularidade mensal; 2026 contem registros de janeiro a junho.
