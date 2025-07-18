<div align="center">

# 🚗 Autovision Project

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

*Complete dealership management system developed with modern technologies and focus on performance, security and user experience*

[Get Started](#-installation) • [Documentation](#-main-features) • [Usage](#-how-to-run) • [License](#-license)

</div>

---

## 📋 Overview

Autovision is a web platform for vehicle dealership management, offering complete functionalities for:

- Vehicle inventory management
- Authentication and authorization system
- Dashboard with statistics and reports
- Image upload and management
- Vehicle comparison
- Vehicle approval system
- User management (administrators)

## 🎯 Objectives

- Demonstrate proficiency in full-stack development with modern technologies
- Implement robust vehicle management system
- Apply security and authentication best practices
- Create intuitive and responsive user interface
- Develop scalable and maintainable architecture

## 🛠️ Technologies and Tools

### Frontend
- **React 18** - Library for building user interfaces
- **TypeScript** - JavaScript superset with static typing
- **Vite** - Fast and modern build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern and accessible UI components
- **React Query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Minimalist web framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - TypeScript-first ORM
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

### DevOps & Tools
- **ESBuild** - JavaScript/TypeScript bundler
- **PostCSS** - CSS processor
- **Git** - Version control

## 📦 Prerequisites

Before starting, make sure you have installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)
- Git

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/anthonycdp/autovision-project.git
cd autovision-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your configurations:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autovision
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-key-here
```

5. Run database migrations:
```bash
npm run db:push
```

## 💻 Usage

### Development Mode

To run the project in development mode (frontend and backend simultaneously):

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Production Build

To create a production build:

```bash
npm run build
```

To run the production build:

```bash
npm start
```

## 📁 Project Structure

```
autovision-project/
├── client/                 # Frontend code
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context API
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Application pages
│   │   └── types/         # TypeScript types
│   └── index.html
├── server/                # Backend code
│   ├── middleware/        # Express middlewares
│   ├── services/          # Business logic
│   ├── auth.ts           # Authentication
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared code
│   └── schema.ts         # Database schemas
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 🧪 Main Features

### Vehicle Management
- **Complete CRUD**: Create, read, update, and delete vehicles
- **Image Upload**: Multiple image support with optimization
- **Advanced Filters**: Search by make, model, year, price range
- **Status Management**: Pending, approved, rejected workflow
- **Comparison Tool**: Side-by-side vehicle comparison

### User Management
- **Authentication**: JWT-based secure login system
- **Authorization**: Role-based access control (admin/user)
- **User Profiles**: Complete user information management
- **Activity Tracking**: Audit log for user actions

### Dashboard & Analytics
- **Statistics Cards**: Total vehicles, sales, revenue metrics
- **Interactive Charts**: Sales trends and performance graphs
- **Real-time Data**: Live updates of key metrics
- **Export Reports**: PDF and CSV export functionality

### Security Features
- **Password Encryption**: Bcrypt hashing
- **JWT Tokens**: Secure authentication tokens
- **Input Validation**: Zod schema validation
- **File Upload Security**: Type and size validation

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Run production build
- `npm run check` - Check TypeScript types
- `npm run db:push` - Run database migrations

## 🔍 Validations Implemented

### Frontend Validations
- **Form Validation**: React Hook Form with Zod schemas
- **Real-time Feedback**: Instant validation feedback
- **File Upload**: Type, size, and format validation
- **User Input**: XSS protection and sanitization

### Backend Validations
- **Schema Validation**: Strict data type validation
- **Authentication**: JWT token verification
- **Authorization**: Role-based access control
- **Database Integrity**: Foreign key constraints

### Business Validations
- **Vehicle Data**: VIN, make, model validation
- **Price Ranges**: Minimum and maximum constraints
- **Image Requirements**: Format and size limits
- **User Permissions**: Action-based authorization

## 📊 Project Statistics

- **Total Components**: 25+ React components
- **API Endpoints**: 15+ RESTful endpoints
- **Database Tables**: 4 main entities (users, vehicles, images, activities)
- **Technology Stack**: 10+ modern technologies
- **Security Features**: JWT, bcrypt, input validation
- **UI Components**: 30+ Shadcn/ui components

## 🎓 Best Practices and Learnings

### Implemented
- **TypeScript-first development** for type safety
- **Component-based architecture** for reusability
- **JWT authentication** for secure access
- **Database ORM** for type-safe queries
- **Environment configuration** for different environments
- **Input validation** on both frontend and backend

### Development Process
1. **Requirements Analysis**: Feature specification and design
2. **Database Design**: Schema creation with Drizzle ORM
3. **API Development**: RESTful endpoints with Express
4. **Frontend Implementation**: React components with TypeScript
5. **Testing**: Manual testing and validation
6. **Documentation**: Code comments and README updates

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribution

This project was developed as a demonstration of skills in:
- **Full-stack development** with modern technologies
- **Database design** and ORM implementation
- **Authentication and authorization** systems
- **User interface design** with modern components
- **API development** with RESTful principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

<div align="center">

**Anthony Coelho**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/anthonycdp)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anthonycoelhoqae/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:anthonycoelho.dp@hotmail.com)

*Full-stack Developer specialized in React, Node.js and modern web technologies*

</div>

---

<div align="center">

### If this project was useful to you, consider giving it a star!

### Contributions are welcome!

**Version**: 1.0.0

</div>