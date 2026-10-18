import { renderToStaticMarkup } from "react-dom/server";
import LegalAcceptanceGuard from "components/legal/LegalAcceptanceGuard";

const mockReplace = jest.fn();
let mockPathname = "/forgot-password";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: (effect) => effect(),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: mockPathname, replace: mockReplace }),
}));
jest.mock("swr", () => ({
  __esModule: true,
  default: () => ({ data: { required: true } }),
}));
jest.mock("components/auth/AuthProvider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

beforeEach(() => mockReplace.mockClear());

test.each(["/forgot-password", "/reset-password"])(
  "Keeps %s accessible while legal acceptance is pending",
  (pathname) => {
    mockPathname = pathname;
    renderToStaticMarkup(<LegalAcceptanceGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  },
);

test("Still requires acceptance before work operations", () => {
  mockPathname = "/works";
  renderToStaticMarkup(<LegalAcceptanceGuard />);
  expect(mockReplace).toHaveBeenCalledWith("/legal/accept");
});
