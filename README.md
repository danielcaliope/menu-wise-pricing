# Menu-Wise

SaaS de precificação de receitas para restaurantes: cadastro de ingredientes,
ficha técnica de receitas e cálculo de preço de venda (custo, margem, impostos,
taxa de entrega). Projeto originalmente gerado no [Lovable](https://lovable.dev/projects/09b089b4-4151-43fb-a04e-224b4a9d3a59),
Vite + React + TypeScript + shadcn-ui + Tailwind + Supabase.

Documentação mais a fundo em [docs/](docs/):
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — estrutura de pastas e como os dados fluem pelo app.
- [docs/MOTOR-DE-PRECIFICACAO.md](docs/MOTOR-DE-PRECIFICACAO.md) — o que cada função de `src/domain/pricing` calcula.
- [docs/TESTES.md](docs/TESTES.md) — comandos de lint/teste/build e o que hoje tem cobertura.
- [docs/GUIA-NOVAS-FEATURES.md](docs/GUIA-NOVAS-FEATURES.md) — como adicionar uma feature seguindo os padrões já estabelecidos.
- [src/features/README.md](src/features/README.md) — padrão de acesso ao Supabase por feature (`src/features/<domínio>/api/`).

## Instalação

Requisito: Node.js e npm ([instalar via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# 1. Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependências
npm i

# 3. Configurar variáveis de ambiente
cp .env.example .env
# preencha VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_URL
# com os valores do seu projeto em Supabase > Project Settings > API
# (são valores públicos por design — protegidos por RLS no banco, não por sigilo).

# 4. Rodar em desenvolvimento
npm run dev
```

Comandos de teste, lint e build estão documentados em [docs/TESTES.md](docs/TESTES.md).

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/09b089b4-4151-43fb-a04e-224b4a9d3a59) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable. See "Instalação" acima para os passos completos, incluindo a configuração do `.env`.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/09b089b4-4151-43fb-a04e-224b4a9d3a59) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
