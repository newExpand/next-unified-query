// Vitest setup for core package
import { vi } from "vitest";

// Mock fetch globally
global.fetch = vi.fn();