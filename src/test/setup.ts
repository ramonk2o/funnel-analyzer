import '@testing-library/jest-dom/vitest'

// Each test starts as a first visit: nothing saved in the browser.
afterEach(() => localStorage.clear())
