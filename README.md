# ChatterBox

Chat app I made a long time ago but upgraded, gave it JWT auth and role based perms

---

## Features

- **JWT Authentication**  
  The app utilizes JWT to set cookies for the access and refresh tokens (refresh tokens are not sent per request, only short-lived access tokens).

- **Email Verification & Password Reset**  
  These will give access to the application, if they are not set then the user is automatically sent back to the login page.

- **Role-Based Permissions**

  - Users are assigned a default role of `USER`.
  - Only `ADMIN` or `SUPER` users can access the **private room**.
  - All users can access the **public room**.
  - Roles determine access to WebSocket chat rooms.

  - **WebSocket-Enabled Real-Time Chat**  
    Real-time messaging utilizes WebSockets (with Socket.IO for faster implementation, may use ws instead in the future)

---

## The stuff I used (smiley face here)

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Auth**: JWT, Cookies
- **Deployment**: Frontend on Vercel, Backend on AWS EC2
- **Email**: Resend

---

## Lessons Learned

This project gave me deeper hands-on experience with:

- **Token-based authentication and session management**

- **WebSocket implementation with role-based access**

- **Secure full-stack app deployment on cloud platforms**
