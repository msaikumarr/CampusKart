# 🛒 CampusKart

> **A Full-Stack MERN Marketplace for College Students**

CampusKart is a secure and user-friendly marketplace designed exclusively for college students. It enables students to buy and sell second-hand products such as books, electronics, hostel essentials, lab equipment, and more within their campus community. The platform also provides real-time communication between buyers and sellers, making transactions simple, safe, and efficient.

---

# 📌 Table of Contents

* Overview
* Features
* Tech Stack
* System Architecture
* Project Structure
* Installation
* Environment Variables
* API Overview
* Database Design
* Authentication Flow
* Screenshots
* Future Enhancements
* Contributors
* License

---

# 📖 Overview

Students often rely on WhatsApp groups or social media to buy and sell used products, which can be disorganized and insecure. CampusKart solves this problem by providing a dedicated platform where verified students can:

* Buy and sell products
* Browse products by category
* Chat with buyers and sellers
* Manage their listings
* Connect within their college community

The application is built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)** with secure authentication and real-time messaging.

---

# ✨ Features

## 👤 User Authentication

* User Registration
* Secure Login
* JWT Authentication
* Password Encryption using bcrypt
* Protected Routes

---

## 📦 Product Management

* Add Product
* View Products
* Edit Product
* Delete Product
* Product Details Page

---

## 🔍 Product Search & Categories

* Search products
* Browse by category
* View latest products

---

## 💬 Real-Time Chat

* Instant messaging between buyers and sellers
* Powered by Socket.IO
* Real-time communication without refreshing the page

---

## 👤 User Dashboard

* View uploaded products
* Edit listings
* Delete listings
* Manage profile

---

## 📱 Responsive Design

* Mobile-friendly interface
* Responsive layouts
* Easy navigation

---

# 🛠️ Tech Stack

## Frontend

* React.js
* JavaScript (ES6+)
* HTML5
* CSS3
* Axios
* React Router

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JWT (JSON Web Token)
* bcrypt

## Real-Time Communication

* Socket.IO

## File Upload

* Multer
* Cloudinary *(if applicable)*

## Deployment

* Frontend: Vercel
* Backend: Node.js Server
* Database: MongoDB Atlas

---

# 🏗️ System Architecture

```text
                   User
                     │
                     ▼
             React Frontend
                     │
            Axios HTTP Requests
                     │
                     ▼
         Express.js + Node.js API
                     │
              Business Logic
                     │
                     ▼
             MongoDB Database
```

---

# 📂 Project Structure

```text
CampusKart/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   ├── socket/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/your-username/CampusKart.git
```

```bash
cd CampusKart
```

---

## Install Frontend Dependencies

```bash
cd client
npm install
```

---

## Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## Configure Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

## Run Backend

```bash
npm run dev
```

---

## Run Frontend

```bash
npm start
```

---

# 📡 API Overview

## Authentication

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register User |
| POST   | /api/auth/login    | Login User    |

---

## Products

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| GET    | /api/products     | Get All Products  |
| GET    | /api/products/:id | Get Product By ID |
| POST   | /api/products     | Create Product    |
| PUT    | /api/products/:id | Update Product    |
| DELETE | /api/products/:id | Delete Product    |

---

## Messages

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| GET    | /api/messages | Get Messages |
| POST   | /api/messages | Send Message |

---

# 🗄️ Database Design

## Users Collection

| Field        | Type            |
| ------------ | --------------- |
| _id          | ObjectId        |
| name         | String          |
| email        | String          |
| password     | String (Hashed) |
| profileImage | String          |
| college      | String          |

---

## Products Collection

| Field       | Type     |
| ----------- | -------- |
| _id         | ObjectId |
| title       | String   |
| description | String   |
| price       | Number   |
| category    | String   |
| images      | Array    |
| seller      | ObjectId |
| createdAt   | Date     |

---

## Messages Collection

| Field     | Type     |
| --------- | -------- |
| _id       | ObjectId |
| sender    | ObjectId |
| receiver  | ObjectId |
| message   | String   |
| timestamp | Date     |

---

# 🔐 Authentication Flow

```text
User Login
      │
      ▼
Email + Password
      │
      ▼
Server Verification
      │
      ▼
JWT Token Generated
      │
      ▼
Stored in Browser
      │
      ▼
Protected API Request
      │
      ▼
JWT Middleware Verification
      │
      ▼
Controller Execution
```

---

# 💬 Real-Time Messaging Flow

```text
Buyer
   │
   ▼
Socket.IO Client
   │
   ▼
Node.js Socket Server
   │
   ▼
Socket.IO Event
   │
   ▼
Seller Receives Message Instantly
```

---

# 🔒 Security Features

* JWT Authentication
* Password Hashing with bcrypt
* Protected Routes
* Input Validation
* Authorization Checks
* Secure API Access

---

# 🚀 Future Enhancements

* Wishlist
* Product Reviews
* Ratings
* Payment Gateway Integration
* Push Notifications
* AI Product Recommendations
* Product Recommendation Based on User Interests
* Admin Dashboard
* Order History

---

# 📷 Screenshots

Add screenshots of:

* Home Page
* Login Page
* Product Listing
* Product Details
* Chat Module
* User Dashboard

---

# 👨‍💻 Contributors

Developed collaboratively as a MERN Stack project by the CampusKart team.

---

# 📄 License

This project is developed for educational purposes and portfolio demonstration.

---

# ⭐ Acknowledgements

* React.js
* Node.js
* Express.js
* MongoDB Atlas
* Socket.IO
* JWT
* bcrypt
* Vercel
