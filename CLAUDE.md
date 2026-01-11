# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development Server
```bash
npm start
```
Runs on `http://localhost:3000` (or `3001` if 3000 is in use)

### Build for Production
```bash
npm run build
```
Creates optimized production build in `build/` folder

### Run Tests
```bash
npm test                    # Interactive test runner
npm test -- --coverage      # With coverage report
```

## Architecture Overview

### Backend Communication - Critical snake_case Convention

**IMPORTANT**: The backend uses Jackson configured for `snake_case` JSON serialization. All API communication follows these rules:

**Request Bodies** (Frontend → Backend):
- Must convert camelCase to snake_case using the `toSnakeCase()` helper in `adminService.js`
- Example: `{ adminId, password }` → `{ admin_id, password }`
- All admin API calls in `adminService.js` wrap request data with `toSnakeCase()`

**Response Bodies** (Backend → Frontend):
- Backend returns snake_case fields
- Example: `{ access_token, refresh_token }` not `{ accessToken, refreshToken }`
- AuthContext.js accesses `data.access_token` and `data.refresh_token`
- Token refresh endpoint also uses snake_case: `refresh_token` field

**Exception - File Uploads**:
- FormData requests (`/files/upload`) do NOT use snake_case conversion
- The `api.js` interceptor automatically removes `Content-Type` header for FormData to allow browser to set proper `multipart/form-data` boundary

### Authentication Flow

1. **Login**: `POST /admin/login` with `{ admin_id, password }`
   - Returns `{ access_token, refresh_token }` in snake_case
   - Tokens stored in localStorage as `accessToken` and `refreshToken` (camelCase keys for internal use)

2. **Request Interceptor** (`api.js`):
   - Automatically adds `Authorization: Bearer {token}` header from localStorage
   - Removes `Content-Type` for FormData requests

3. **Response Interceptor** (`api.js`):
   - On 401 error, attempts token refresh via `POST /admin/refresh` with `{ refresh_token }`
   - Receives new `access_token` in snake_case
   - Retries original request with new token
   - Redirects to `/login` if refresh fails

### File Upload Architecture

**File Service** (`fileService.js`):
- Handles multipart/form-data uploads to `/files/upload`
- Available folders (constants in `FILE_FOLDERS`):
  - `PROFILE_IMAGE_FOLDER`
  - `MUSIC_FOLDER`
  - `MUSIC_BANNER_IMAGE_FOLDER`
  - `MUSIC_VIDEO`

**Upload Flow**:
1. User selects file → stored in component state
2. Call `uploadFile(file, folder)` from fileService
3. Returns `{ fileUrl }` with backend file path
4. Use returned URL in subsequent API calls (e.g., creating music with file paths)

**Critical**: Do NOT manually set `Content-Type: multipart/form-data` header. The axios interceptor deletes it to allow browser auto-generation with proper boundary.

### State Management

**AuthContext** (`contexts/AuthContext.js`):
- Global authentication state: `isAuthenticated`, `user`, `loading`
- Login/logout functions
- Stores tokens in localStorage
- **Remember**: Backend returns `access_token`/`refresh_token` (snake_case)

**Component State**:
- Each page manages its own form state with `useState`
- No Redux or external state library

### Routing & Protection

**Route Structure** (`App.js`):
```
/login              → Login (public)
/admin              → Dashboard (protected)
/admin/music        → MusicManagement (protected)
/admin/announcements → AnnouncementManagement (protected)
/admin/notifications → NotificationManagement (protected)
/admin/topics       → TopicManagement (protected)
/admin/withdrawal-reasons → WithdrawalReasons (protected)
```

**Protected Routes**:
- Wrapped with `<ProtectedRoute>` component
- Checks `isAuthenticated` from AuthContext
- Redirects to `/login` if not authenticated

### UI/Styling - Toss Design System

**Design Patterns Applied**:
- **Typography**: Negative letter-spacing (-0.2px to -0.8px) for modern look
- **Font weights**: 500-700 (medium to bold)
- **Border radius**: 12-20px for rounded corners
- **Shadows**: Subtle (0.06-0.08 opacity) using `rgba(0, 0, 0, 0.06)`
- **Transitions**: Smooth with `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover effects**: Small vertical translations (`translateY(-1px to -4px)`)

**Color Palette** (existing gradient maintained):
- Primary gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Background: `#f9fafb`
- Text primary: `#191f28`
- Text secondary: `#4e5968`
- Borders: `#e5e8eb` (1.5px thickness)

**When styling new components**:
- Follow existing patterns in `src/styles/` folder
- Use 16px padding for containers, 12px for inputs
- Apply letter-spacing and font-weight consistently
- Keep existing color scheme (do NOT change colors)

### Topic Management Architecture

**Topics Reference** (from backend enum):
```
GENERAL_ANNOUNCEMENT
SYSTEM_ANNOUNCEMENT
BROADCAST_ANNOUNCEMENT
ONLY_ADMIN
```

**Adding Custom Topics**:
- Text input field for custom topic names (e.g., `TEST_TOPIC`)
- Checkbox for `defaultSubscribed` (subscribe all existing users)
- Sends to `POST /admin/topics/add` with snake_case: `{ topic, default_subscribed }`

## Common Patterns

### Making API Requests

**Pattern for Admin Endpoints**:
```javascript
// In adminService.js
export const createSomething = async (data) => {
  const response = await api.post('/admin/something', toSnakeCase(data));
  return response.data;
};

// In component
import { createSomething } from '../services/adminService';

const handleCreate = async () => {
  try {
    await createSomething({
      fieldOne: value1,    // Will become field_one
      fieldTwo: value2     // Will become field_two
    });
    setMessage({ type: 'success', text: '성공!' });
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.message || '실패' });
  }
};
```

### File Upload Pattern

```javascript
const handleFileUpload = async (event, folder) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    setUploading(true);
    const data = await uploadFile(file, folder);
    setFormData(prev => ({ ...prev, fileUrl: data.fileUrl }));
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    setUploading(false);
  }
};
```

### Mode-Based Forms (Music/Announcement Management)

Components use `mode` state: `'create'`, `'update'`, or `'delete'`
- Switch mode via buttons
- Form fields change based on mode
- Different API endpoints per mode (POST for create, PATCH for update, DELETE for delete)

## Environment Variables

Required in `.env`:
```env
REACT_APP_API_BASE_URL=https://whispy.whispy-company.site
REACT_APP_API_STAG_URL=https://whispy-be.onrender.com
```

**Do NOT commit `.env` file** - it's in `.gitignore`

## Backend Integration Notes

### Expected Response Formats (all snake_case)

**Login Response**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**File Upload Response**:
```json
{
  "file_url": "https://whispy.whispy-company.site/file/music_folder/..."
}
```

**Pagination Response** (withdrawal reasons):
```json
{
  "content": [...],
  "page_number": 0,
  "page_size": 10,
  "total_elements": 50,
  "total_pages": 5
}
```

### CORS Requirements

Backend must have:
1. Spring Security CORS enabled: `.cors(Customizer.withDefaults())`
2. `/files/**` endpoint set to `.authenticated()` (not `.hasRole("ADMIN")`)
3. WebConfig with `allowedOriginPatterns("*")` and `allowCredentials(true)`

## UI Text - Korean Language

All user-facing text is in Korean:
- Form labels: "음악 관리", "공지사항", "알림 보내기"
- Buttons: "새로 만들기", "수정하기", "삭제하기"
- Messages: "성공적으로 저장되었습니다", "오류가 발생했습니다"

## Key Files Reference

- **`src/services/api.js`**: Axios instance, JWT interceptors, auto-refresh logic
- **`src/services/adminService.js`**: All admin API calls with snake_case conversion
- **`src/services/fileService.js`**: File upload/delete with FormData
- **`src/contexts/AuthContext.js`**: Authentication state, login/logout, token management
- **`src/components/ProtectedRoute.js`**: Route protection wrapper
- **`src/components/Layout.js`**: Sidebar navigation layout
