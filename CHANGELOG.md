# CHANGELOG

All notable changes to this project will be documented in this file.

## [1.2.0] - 2024-06-13

### Added

- Official support for refresh token-based authentication flow in `authRetry` option
- Enhanced documentation and examples for real-world token refresh scenarios
- Added tests for refresh token flow (access token expiration, refresh token expiration)

### Improved

- Revised authentication-related documentation to reflect practical usage patterns

## [1.1.1] - 2025-05-16

### Improved

- Enhanced documentation with more practical request cancellation examples
- Added explicit test for direct promise cancellation with `promise.cancel()` method

## [1.1.0] - 2025-05-16

### Added

- Single instance support: Use methods directly without creating an instance, similar to Axios
  - Direct use of `get`, `post`, `put`, `patch`, `del`, `head`, `options` methods
  - Added `ntFetch` object for global configuration
  - Global interceptor setup support
  - Default instance provided as default export

### Improved

- Enhanced response handling
  - Safe handling of methods without response body like HEAD, OPTIONS
  - Appropriate default values for empty response bodies
  - Added safe response method call logic

### Fixed

- Improved handling of mocked response objects in test environments
- Enhanced mock object compatibility through test environment detection
- Improved type safety when handling empty responses

## [1.0.1] - 2025-05-11

### Fixed

- Improved TypeScript type definitions
- Fixed some documentation typos

## [1.0.0] - 2025-05-11

### Added

- First official release
- Complete type safety written in TypeScript
- Perfect compatibility with Next.js App Router
- Familiar API similar to Axios
- Interceptor support (request, response, error)
- Response data validation using Zod
- Request cancellation capability
- Automatic retry functionality
- Support for various response types (JSON, Text, Blob, ArrayBuffer, Raw)
- Timeout settings
- Base URL configuration
