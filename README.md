# 📚 Kushon - Sistema de Gerenciamento de Títulos e Volumes

Kushon é uma aplicação full-stack para gerenciamento de títulos (mangás, light novels, etc.) e seus volumes, permitindo que usuários acompanhem suas coleções e recebam notificações sobre novos lançamentos.

## 🌟 Características

- 🔐 **Autenticação**: Sistema completo de registro e login com JWT
- 📖 **Gerenciamento de Títulos**: Cadastro e acompanhamento de títulos de diferentes editoras
- 📚 **Controle de Volumes**: Marque volumes como adquiridos e acompanhe lançamentos
- 📧 **Notificações por E-mail**: Receba alertas sobre novos volumes dos seus títulos favoritos
- 👤 **Painel de Usuário**: Interface intuitiva para gerenciar sua coleção
- 🔑 **Painel Administrativo**: Gerenciamento completo de títulos, volumes e editoras
- 🎨 **Interface Moderna**: Frontend responsivo desenvolvido com React 19

## 🏗️ Arquitetura

### Backend
- **Framework**: NestJS com TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Email**: Nodemailer para notificações

### Frontend
- **Framework**: React 19
- **Roteamento**: React Router v7
- **Build Tool**: Vite
- **Linguagem**: TypeScript

### Infraestrutura
- **Docker**: Containerização do PostgreSQL
- **Deploy**: Configurado para Heroku

## 🗄️ Modelo de Dados

O banco de dados possui as seguintes entidades principais:

- **Publisher** (Editora): Editoras que publicam os títulos
- **Title** (Título): Mangás, light novels, etc. com status (Em andamento, Completo, Hiato)
- **Volume**: Volumes individuais de cada título
- **User** (Usuário): Usuários do sistema
- **UserRole**: Controle de permissões (ADMIN/USER)
- **UserVolume**: Relacionamento entre usuários e volumes (propriedade)
- **NotificationPreference**: Preferências de notificação por título

## 🚀 Como Executar

### Pré-requisitos

- Node.js 20.16+
- Docker Desktop
- npm ou yarn

### 1. Clone o repositório

```bash
git clone <repository-url>
cd kushon-app
```

### 2. Configure as variáveis de ambiente

#### Backend
Crie um arquivo `.env` na pasta `backend/`:

```env
# Database
DATABASE_URL="postgresql://postgres:kushon123@localhost:5432/kushon?schema=public"

# JWT
JWT_SECRET="seu-secret-secreto-aqui"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASSWORD="sua-senha-de-app"
SMTP_FROM="noreply@kushon.app"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

#### Frontend
Crie um arquivo `.env` na pasta `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Inicie o PostgreSQL com Docker

```bash
# Inicie o Docker Desktop primeiro, depois execute:
docker run --name kushon-postgres \
  -e POSTGRES_PASSWORD=kushon123 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=kushon \
  -p 5432:5432 \
  -d postgres:15

# Para iniciar o container posteriormente:
docker start kushon-postgres
```

### 4. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 5. Execute as migrações do banco de dados

```bash
cd backend
npx prisma migrate dev
```

### 6. (Opcional) Popule o banco de dados

```bash
cd backend
npm run prisma:seed
```

### 7. Inicie a aplicação

#### Backend (Terminal 1)
```bash
cd backend
npm run start:dev
```

O backend estará disponível em `http://localhost:3000`
- API: `http://localhost:3000/api`
- Uploads: `http://localhost:3000/uploads`

#### Frontend
```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Informações do usuário autenticado

### Títulos
- `GET /api/titles` - Listar todos os títulos
- `GET /api/titles/:id` - Obter detalhes de um título
- `POST /api/titles` - Criar novo título (Admin)
- `PUT /api/titles/:id` - Atualizar título (Admin)
- `DELETE /api/titles/:id` - Excluir título (Admin)
- `GET /api/titles/:id/volumes` - Listar volumes de um título

### Editoras
- `GET /api/publishers` - Listar editoras
- `POST /api/publishers` - Criar editora (Admin)

### Usuário
- `GET /api/user/titles/:titleId/volumes` - Volumes do usuário para um título
- `PUT /api/user/titles/:titleId/volumes` - Atualizar volumes do usuário
- `GET /api/user/titles/:titleId/notifications` - Obter preferências de notificação
- `PUT /api/user/titles/:titleId/notifications` - Atualizar preferências de notificação

## 🛠️ Tecnologias Utilizadas

### Backend
- [NestJS](https://nestjs.com/) - Framework Node.js
- [Prisma](https://www.prisma.io/) - ORM moderno
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional
- [Passport](http://www.passportjs.org/) - Autenticação
- [Nodemailer](https://nodemailer.com/) - Envio de e-mails
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Hash de senhas
- [Class Validator](https://github.com/typestack/class-validator) - Validação de dados

### Frontend
- [React](https://react.dev/) - Biblioteca UI
- [React Router](https://reactrouter.com/) - Roteamento
- [Vite](https://vitejs.dev/) - Build tool e dev server
- [TypeScript](https://www.typescriptlang.org/) - Linguagem tipada

### DevOps
- [Docker](https://www.docker.com/) - Containerização
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Formatação de código


## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação via JWT
- Validação de dados em todas as entradas
- CORS configurado adequadamente
- Proteção de rotas sensíveis
