// Vitest setup for react package
import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock fetch globally
global.fetch = vi.fn();
