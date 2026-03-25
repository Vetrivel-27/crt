# Complaint Resolution Tracker (CRT)

Complaint Resolution Tracker is a comprehensive web application designed to manage, track, and resolve complaints efficiently. It facilitates communication between students, workers, and administrators within a structured system.

## Features

*   **Multi-Role Access Control:** Secure, role-based dashboards for Students, Workers, and Administrators.
*   **Complaint Management Workflow:** End-to-end tracking of complaints from creation to resolution.
*   **Secure Authentication:** User authentication and authorization utilizing JSON Web Tokens (JWT) and Bcrypt for password hashing.
*   **Email Verification and Notifications:** Automated email verification for new registrations and system notifications using Nodemailer.
*   **Intelligent Insights:** AI-powered features leveraging Google Generative AI and the Groq SDK for enhanced complaint handling and insights.
*   **Automated Scheduled Tasks:** Background job processing via node-cron for systematic cleanup and reminders.
*   **Modern User Interface:** A responsive and accessible frontend built with React and Material-UI (MUI).

## Tech Stack

### Frontend
*   React
*   Material-UI (MUI) and Emotion for styling
*   React Router DOM for navigation
*   Axios for API communication

### Backend
*   Node.js with Express.js
*   PostgreSQL for robust relational data storage
*   JSON Web Token (JWT) & Bcrypt for security
*   Node-Cron for background tasks
*   Nodemailer for email services
*   Multer for multipart/form-data handling

## Project Structure

The repository is modularly split into two main directories:

*   `crt-backend/`: Contains the Express server, API controllers, services, database configurations, and route definitions.
*   `crt-frontend/`: Contains the React application, reusable UI components, API integration logic, and state management.

## Usage Guide

### Prerequisites
*   Node.js and npm installed on your machine
*   A running instance of PostgreSQL
*   API key of Groq SDK
*   SMTP credentials for sending emails

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd crt-backend
    ```

2.  Install all dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the `crt-backend` root directory and populate it with the required credentials (e.g., database URI, JWT secret, server port, SMTP credentials).

4.  Initialize the Database:
    Run the provided script to set up the default tables and schemas.
    ```bash
    npm run init-db
    ```

5.  Start the Development Server:
    ```bash
    npm run dev
    ```
    The backend API will start, typically on port 5000.

### Frontend Setup

1.  Open a new terminal window and navigate to the frontend directory:
    ```bash
    cd crt-frontend
    ```

2.  Install all dependencies:
    ```bash
    npm install
    ```

3.  Start the Application:
    ```bash
    npm start
    ```
    This will launch the application in your default web browser, typically accessible at `http://localhost:3000`.

## Architecture Overview

The system operates on a standard client-server model. The React frontend provides interactive dashboards tailored to the user's role. It communicates with the backend Express server via RESTful APIs. The backend, in turn, validates requests, enforces business logic, interacts with the PostgreSQL database, and manages external services like email delivery and AI integrations.
