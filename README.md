# Whispy Admin Frontend

Admin panel for managing Whispy backend services including music, announcements, notifications, and more.

## Features

- **Authentication**: Secure admin login with JWT token management
- **Music Management**: Create, update, and delete music entries with categories
- **Announcement Management**: Manage announcements with rich content
- **Notification System**: Send notifications to specific devices, topics, or broadcast to all users
- **Topic Management**: Add and manage FCM notification topics
- **Withdrawal Reasons**: View and manage user withdrawal feedback

## Tech Stack

- React 19.2.3
- React Router DOM v6
- Axios for API calls
- Context API for state management
- CSS3 with animations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Whispy-dsm/Whispy_FE.git
cd whispy_fe
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory (use `.env.example` as reference):
```env
REACT_APP_API_BASE_URL=https://whispy.whispy-company.site
REACT_APP_API_STAG_URL=https://whispy-be.onrender.com
```

4. Start the development server:
```bash
npm start
```

The app will run on [http://localhost:3000](http://localhost:3000)

## Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Project Structure

```
whispy_fe/
├── public/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.js      # Main layout with sidebar
│   │   └── ProtectedRoute.js
│   ├── contexts/          # React Context providers
│   │   └── AuthContext.js
│   ├── pages/             # Page components
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── MusicManagement.js
│   │   ├── AnnouncementManagement.js
│   │   ├── NotificationManagement.js
│   │   ├── WithdrawalReasons.js
│   │   └── TopicManagement.js
│   ├── services/          # API services
│   │   ├── api.js         # Axios configuration
│   │   └── adminService.js
│   ├── styles/            # CSS files
│   └── App.js             # Main app with routing
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
└── package.json
```

## API Endpoints

The app connects to the Whispy backend API. Base URLs:
- **Production**: https://whispy.whispy-company.site
- **Staging**: https://whispy-be.onrender.com

All admin endpoints are prefixed with `/admin`.

## Features Overview

### 1. Authentication
- Admin login with ID and password
- JWT token-based authentication
- Automatic token refresh
- Protected routes

### 2. Music Management
- Create new music with title, file path, duration, and category
- Update existing music entries
- Delete music entries
- Support for banner images and video URLs

### 3. Announcement Management
- Create announcements with title and content
- Update existing announcements
- Delete announcements
- Optional banner images

### 4. Notification Management
- Send notifications to specific devices
- Send notifications to topic subscribers
- Broadcast notifications to all users
- Custom data payload support

### 5. Topic Management
- Add new FCM topics
- Optionally subscribe all users to new topics
- View all available topics

### 6. Withdrawal Reasons
- View paginated list of user withdrawal reasons
- View detailed information
- Delete withdrawal reasons

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Production API URL
REACT_APP_API_BASE_URL=https://whispy.whispy-company.site

# Staging API URL (optional)
REACT_APP_API_STAG_URL=https://whispy-be.onrender.com
```

## Authentication Flow

1. User logs in with admin credentials
2. Backend returns access and refresh tokens
3. Tokens are stored in localStorage
4. Access token is added to all API requests via interceptor
5. If access token expires, refresh token is used automatically
6. If refresh fails, user is redirected to login

## Deployment

### Build for production:
```bash
npm run build
```

### Deploy to hosting service:
The `build` folder contains the production-ready static files that can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For issues or questions, contact the development team or create an issue in the repository.
