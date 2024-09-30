import "@testing-library/jest-dom";

// eslint-disable-next-line no-restricted-imports
import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
