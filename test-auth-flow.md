# Authentication Flow Test Plan

## Local Testing (with Firebase Emulators)

### Prerequisites
- Firebase emulators running (`firebase emulators:start`)
- Development server running (`npm run dev`)
- Browser open to `http://localhost:5174`

### Test Cases

#### 1. Email Sign-Up Flow
1. Navigate to `/signup`
2. Fill in form with test data:
   - Display Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123!"
   - Confirm Password: "TestPassword123!"
3. Click "Sign up"
4. **Expected**: User should be redirected to `/onboarding`
5. **Verify**: Check Firebase Auth emulator for new user

#### 2. Google Sign-In Flow (Emulator)
1. Navigate to `/login`
2. Click "Continue with Google"
3. **Expected**: Emulator popup should appear
4. Select a test Google account
5. **Expected**: User should be redirected to `/onboarding` (new user) or `/app` (existing user)

#### 3. Apple Sign-In Flow (Emulator)
1. Navigate to `/login`
2. Click "Continue with Apple"
3. **Expected**: Emulator popup should appear
4. Select a test Apple account
5. **Expected**: User should be redirected to `/onboarding` (new user) or `/app` (existing user)

#### 4. Email Sign-In Flow
1. Navigate to `/login`
2. Enter credentials from test case 1
3. Click "Sign in"
4. **Expected**: User should be redirected to `/onboarding` (if not completed) or `/app` (if completed)

#### 5. Navigation After Authentication
1. While logged out, navigate to `/app/workout`
2. **Expected**: Redirected to `/login?redirect=%2Fapp%2Fworkout`
3. Sign in with any method
4. **Expected**: After authentication, redirected to `/app/workout`

### Verification Points

#### AuthProvider Navigation
- ✅ OAuth redirect results are handled properly
- ✅ Users are navigated to correct pages based on onboarding status
- ✅ Redirect parameters are preserved and honored

#### AuthService Methods
- ✅ `signInWithGoogle()` works with popup and redirect fallback
- ✅ `signInWithApple()` works with popup and redirect fallback
- ✅ Error handling for blocked popups
- ✅ Proper error messages for auth failures

#### UI Components
- ✅ Google sign-in button appears on login and signup pages
- ✅ Apple sign-in button appears on login and signup pages
- ✅ Loading states work correctly
- ✅ Error messages display properly

## Production Testing

### Prerequisites
- Apple Sign-In configured in Firebase Console
- Google Sign-In configured in Firebase Console
- App deployed to Firebase Hosting

### Additional Test Cases

#### Apple Sign-In Production
1. Test on iOS Safari
2. Test on macOS Safari
3. Test on other browsers (should fallback gracefully)

#### Google Sign-In Production
1. Test on various browsers
2. Test popup vs redirect behavior
3. Test account selection flow

### Configuration Requirements

#### Firebase Console - Authentication
1. **Google Sign-In**:
   - Enable Google provider
   - Configure OAuth consent screen
   - Add authorized domains

2. **Apple Sign-In**:
   - Enable Apple provider
   - Add Apple Team ID
   - Add Apple Service ID
   - Upload Apple Private Key
   - Configure authorized domains

#### Apple Developer Console
1. Create App ID with Sign In with Apple capability
2. Create Service ID for web authentication
3. Generate and download private key
4. Configure return URLs

### Success Criteria
- ✅ All authentication methods work seamlessly
- ✅ Users are properly navigated after authentication
- ✅ No redirect loops or navigation issues
- ✅ Error handling works correctly
- ✅ Loading states provide good UX
- ✅ Works on both desktop and mobile
