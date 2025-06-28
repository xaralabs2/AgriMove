# Contributing to AgriMove

Thank you for your interest in contributing to AgriMove! This guide will help you get started with contributing to our agricultural logistics platform.

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/AgriMove.git`
3. Install dependencies: `npm install`
4. Copy environment file: `cp .env.example .env`
5. Configure your `.env` file with database and API keys
6. Run database migrations: `npm run db:push`
7. Start development server: `npm run dev`

## Project Structure

```
AgriMove/
├── client/          # React frontend (TypeScript)
├── server/          # Express backend (TypeScript)
├── shared/          # Shared types and schemas
├── docs/           # Documentation
└── package.json    # Project dependencies
```

## Development Workflow

### Branching Strategy
- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Write/update tests if applicable
4. Ensure code follows existing patterns
5. Commit with descriptive messages
6. Push to your fork
7. Create a Pull Request

### Code Style
- TypeScript for all new code
- ESLint configuration (run `npm run lint`)
- Prettier for code formatting
- Follow existing naming conventions

### Testing
- Test your changes locally
- Verify PWA functionality works
- Test mobile responsiveness
- Check offline capabilities

## Types of Contributions

### Bug Reports
- Use the issue template
- Include steps to reproduce
- Provide environment details
- Include screenshots if applicable

### Feature Requests
- Describe the use case
- Explain expected behavior
- Consider agricultural context
- Discuss implementation approach

### Code Contributions
- Follow development workflow
- Include tests where appropriate
- Update documentation
- Consider mobile-first design

### Documentation
- Keep README updated
- Document new features
- Update API documentation
- Include deployment guides

## Technical Guidelines

### Frontend (React)
- Use TypeScript
- Follow React hooks patterns
- Mobile-first responsive design
- Accessibility considerations
- PWA best practices

### Backend (Express)
- Use TypeScript
- RESTful API design
- Proper error handling
- Database optimization
- Security best practices

### Database (PostgreSQL)
- Use Drizzle ORM
- Write migrations for schema changes
- Consider performance implications
- Follow naming conventions

## Agricultural Domain Knowledge

### Understanding the Context
- Rural internet connectivity challenges
- Mobile-first user base
- SMS/WhatsApp accessibility needs
- Local language considerations
- Seasonal agricultural patterns

### User Roles
- **Farmers**: Produce sellers, inventory management
- **Buyers**: Marketplace users, order placement
- **Drivers**: Delivery logistics, route optimization
- **Admins**: Platform management, analytics

## Review Process

### Pull Request Guidelines
1. Descriptive title and description
2. Link related issues
3. Include testing instructions
4. Update documentation
5. Request appropriate reviewers

### Review Criteria
- Code quality and consistency
- Mobile functionality
- Performance considerations
- Security implications
- Agricultural use case alignment

## Community Guidelines

### Communication
- Be respectful and inclusive
- Focus on agricultural use cases
- Consider accessibility needs
- Provide constructive feedback

### Issue Discussion
- Stay on topic
- Provide relevant context
- Share agricultural insights
- Suggest practical solutions

## Getting Help

### Resources
- Project documentation in `/docs`
- API documentation in code comments
- Agricultural logistics best practices
- PWA development guides

### Contact
- Create GitHub issues for bugs/features
- Join community discussions
- Review existing documentation
- Check FAQ section

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for significant contributions
- Special mentions for agricultural domain expertise

Thank you for helping make agricultural logistics more accessible and efficient!