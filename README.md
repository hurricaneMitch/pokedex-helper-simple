# Pokemon Go Tracker

A web application to track your Pokemon Go collection with categories for Regular, Shiny, and XXL variants. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- **User Authentication**: Email-based registration and login with JWT tokens
- **Pokemon Management**: Add, edit, and delete Pokemon from your collection
- **Category Tracking**: Organize Pokemon by type (Regular, Shiny, XXL)
- **PokeAPI Integration**: Automatically fetch Pokemon names and images
- **Statistics**: View collection totals by category
- **Multi-User Support**: Each user sees only their own Pokemon

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Project Structure

```
pokedex-helper-simple/
├── server/              # Node.js + Express backend
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth middleware
│   ├── controllers/    # Business logic
│   ├── server.js       # Express app entry
│   ├── config.js       # Configuration
│   └── package.json
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   ├── styles/     # CSS styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
```

Configure `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pokemon-tracker
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
npm install
```

The `.env` file is already configured to point to `http://localhost:5000/api`

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh JWT token (requires auth)

### Pokemon (`/api/pokemon`) - All require JWT authentication
- `GET /` - Get all Pokemon (optional: `?category=shiny|regular|xxl`)
- `GET /:id` - Get single Pokemon
- `POST /` - Add new Pokemon
- `PUT /:id` - Update Pokemon
- `DELETE /:id` - Delete Pokemon
- `GET /stats` - Get count by category

## Usage

1. **Register**: Create a new account with email and password
2. **Login**: Sign in to your account
3. **Add Pokemon**: Click "Add Pokemon", search by name, select category, and optionally add level/IV/notes
4. **View Collection**: Switch between tabs to view Pokemon by category
5. **Edit/Delete**: Modify or remove Pokemon from your collection
6. **Logout**: Click logout to end your session

## Data Model

### User
```json
{
  "email": "user@example.com",
  "password": "hashed_password",
  "createdAt": "2024-04-19T00:00:00Z",
  "updatedAt": "2024-04-19T00:00:00Z"
}
```

### Pokemon
```json
{
  "userId": "user_id",
  "pokemonId": 25,
  "name": "Pikachu",
  "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/25.png",
  "category": "shiny",
  "level": 45,
  "iv": 95,
  "notes": "Caught at Central Park",
  "createdAt": "2024-04-19T00:00:00Z",
  "updatedAt": "2024-04-19T00:00:00Z"
}
```

## Deployment

### Backend Deployment
- Deploy on services like Heroku, Railway, or DigitalOcean
- Use MongoDB Atlas for cloud database
- Set environment variables in production

### Frontend Deployment
- Deploy on Vercel, Netlify, or GitHub Pages
- Update `VITE_API_URL` to point to production API
- Build with `npm run build`

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, Bcrypt
- **Frontend**: React, Vite, React Router, Axios
- **API**: PokeAPI for Pokemon data

## License

MIT