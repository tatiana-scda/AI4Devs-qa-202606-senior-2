# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## End-to-End Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

### Available Scripts

#### `npm run test:e2e`

Runs Playwright tests in headless mode.

#### `npm run test:e2e:headed`

Runs Playwright tests with browsers visible (headed mode).

#### `npm run test:e2e:ui`

Runs Playwright tests in headed mode with slow mo (useful for UI debugging).

#### `npm run test:e2e:debug`

Runs Playwright tests with the Playwright Inspector open.

### Configuration

Playwright configuration is in `playwright.config.ts`. It includes:
- Test directory: `./tests`
- Multiple browser projects (Chromium, Firefox, WebKit, mobile emulation)
- Automatic dev server startup (`npm run start`)
- Screenshots and videos on test failure
- HTML reporter

### Writing Tests

Place your test files in the `tests/` directory. Test files should have `.spec.ts` or `.spec.js` extension.

Example test:

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/React App/);
});
```

### Useful Commands

- `npx playwright test` - Run all tests
- `npx playwright test --headed` - Run tests with browsers visible
- `npx playwright test --project=chromium` - Run only Chromium tests
- `npx playwright test --grep="login"` - Run only tests matching "login"
- `npx playwright show-report` - View the HTML test report
- `npx playwright codegen` - Generate test code interactively
