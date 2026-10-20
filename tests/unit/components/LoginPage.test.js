import LoginPage from "components/auth/LoginPage";
import { signIn } from "components/auth/authClient";

let mockState;
let mockIndex;
const mockRouter = { query: {}, replace: jest.fn(), push: jest.fn() };
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: jest.fn(),
  useState: (initial) => {
    const index = mockIndex++;
    if (!(index in mockState)) mockState[index] = initial;
    return [
      mockState[index],
      (value) => {
        mockState[index] = value;
      },
    ];
  },
}));
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("components/auth/AuthProvider", () => ({
  useAuth: () => ({ refreshUser: jest.fn(), clearUser: jest.fn() }),
}));
jest.mock("components/auth/authClient", () => ({ signIn: jest.fn() }));
jest.mock("components/shared/useActionState", () => ({
  __esModule: true,
  default: () => [false, jest.fn(), { current: false }],
}));

function render() {
  mockIndex = 0;
  return LoginPage();
}
function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockState = ["new@example.com", "validpassword"];
});

test("Shows resend only after valid credentials require verification, without redirecting or retaining the password", async () => {
  const initial = render();
  expect(
    find(initial, (node) => node.props?.href === "/verify-email"),
  ).toBeNull();
  signIn.mockRejectedValue(
    Object.assign(new Error("Pending"), { verificationRequired: true }),
  );
  await find(initial, (node) => node.type === "form").props.onSubmit({
    preventDefault: jest.fn(),
  });
  const pending = render();
  expect(
    find(pending, (node) => node.props?.href === "/verify-email"),
  ).not.toBeNull();
  expect(mockState[1]).toBe("");
  expect(mockRouter.push).not.toHaveBeenCalled();
  find(
    pending,
    (node) => node.type === "input" && node.props.name === "email",
  ).props.onChange({ target: { value: "another@example.com" } });
  expect(
    find(render(), (node) => node.props?.href === "/verify-email"),
  ).toBeNull();
});

test("Incorrect credentials do not display the verification link", async () => {
  signIn.mockRejectedValue(new Error("E-mail ou senha não conferem."));
  await find(render(), (node) => node.type === "form").props.onSubmit({
    preventDefault: jest.fn(),
  });
  expect(
    find(render(), (node) => node.props?.href === "/verify-email"),
  ).toBeNull();
  expect(mockState[2]).toBe("E-mail ou senha não conferem.");
});
