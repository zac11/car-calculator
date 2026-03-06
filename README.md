# car-calculator

Calculate whether you should continue using Uber/ride-hailing or switch to owning a first or second hand car (petrol or electric), based on your commute and costs.

## Project structure

- `backend/`: Node + Express API server exposing the calculator (`/api/calculate`)
- `frontend/`: Vite-powered web UI (calls the backend via `/api` proxy in dev)

## Running the app

### Backend

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Start the backend:

   ```bash
   npm start
   ```

Backend runs at:

   ```text
   http://localhost:4000
   ```

### Frontend

1. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the frontend dev server:

   ```bash
   npm run dev
   ```

Frontend runs at:

```text
http://localhost:5173
```

## Production (single server)

In production you can serve the built frontend from the backend server.

1. Build the frontend:

```bash
cd frontend
npm install
npm run build
```

2. Start the backend:

```bash
cd backend
npm install
npm start
```

Open:

```text
http://localhost:4000
```

### Use

In the web UI, enter:
   - Your monthly Uber/ride-hailing spend
   - Commute distance and days per week
   - Other driving per month
   - Fuel and electricity prices
   - Loan assumptions (down payment, tenure, interest)
   - Parking and misc fixed monthly costs

The app will compare your Uber spend against a small catalog of sample cars (new and used, petrol and EV) and show an estimated **all-in monthly ownership cost** for each option.

