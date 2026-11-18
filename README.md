# QueueSmart

A full-stack clinic queue management web app. Patients join a service queue online, see their position and estimated wait, and get notified when they're almost up. Admins manage services and queues and generate usage reports.

Built by a four-person team for a semester-long software engineering course at the University of Houston.

## Features

**Patients**
- Register and log in (passwords hashed with bcrypt)
- Browse services and join or leave a queue
- Live queue position and estimated wait time
- In-app notifications when you join a queue and when you're almost up
- Visit history

**Admins**
- Create, update, and delete services
- View all queues and serve the next patient
- Smart recommendation that points patients to a service with a shorter queue
- Reports on user participation, service activity, and queue statistics, exportable as PDF

## Tech Stack

| Layer    | Tools                                          |
| -------- | ---------------------------------------------- |
| Frontend | React 19, Vite, React Router, CSS Modules      |
| Backend  | Node.js, Express 5                             |
| Database | MySQL (hosted on Railway) via `mysql2`         |
| Testing  | Jest with Babel                                |
| Other    | bcryptjs, jsPDF / PDFKit, dotenv, oxlint       |

## Project Structure

```
├── server.js                # Express server and all API routes
├── src/
│   ├── pages/               # Patient pages + admin_pages/
│   ├── components/          # Navbar, NotificationBell, FormField
│   ├── context/             # NotificationContext
│   ├── hooks/               # useFormValidation
│   └── backend/
│       ├── modules/         # auth, queue, services, waitTime, notifications, history, reports
│       └── data/            # MySQL connection pool and table setup
└── tests/                   # Jest unit tests for each backend module
```

## Getting Started

**Prerequisites:** Node.js 18+ and a MySQL database (local or hosted)

1. Clone and install
```bash
   git clone https://github.com/akshitajulius/clinic.git
   cd clinic
   npm install
```

2. Create a `.env` file in the project root
```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=queuesmart
```
   Tables are created automatically on first run.

3. Start the API server (runs on http://localhost:3001)
```bash
   npm run server
```

4. In a second terminal, start the frontend
```bash
   npm run dev
```

5. Run the tests
```bash
   npm test
```

## API Overview

| Area          | Endpoints                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| Auth          | `POST /auth/register`, `POST /auth/login`                                 |
| Services      | `GET/POST /services`, `GET/PUT/DELETE /services/:id`, `GET /services/search` |
| Queue         | `GET /queue`, `POST /queue/join`, `POST /queue/leave`, `POST /queue/:serviceId/serve`, `GET /queue/:serviceId/position/:userId` |
| Wait time     | `GET /waittime/:serviceId`, `GET /waittime/:serviceId/:userId`            |
| Notifications | `GET /notifications/:userId`, `PUT /notifications/:id/read`, `PUT /notifications/:userId/read-all` |
| History       | `GET /history/:userId`, `POST /history`, `GET /history/summary`           |
| Reports       | `GET /reports/user/:userId`, `GET /reports/service/:serviceName`, `GET /reports/statistics`, `GET /reports/pdf` |

All backend modules return a consistent `{ success: true/false }` response shape.
