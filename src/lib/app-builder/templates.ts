/**
 * R13 — App Templates
 *
 * Deterministic starter trees per app kind. Used when a project is created
 * without AI or as a fallback if the AI generator returns an invalid tree.
 * These are NOT demo data — they are minimal, honest starting points that
 * the user (or AI) fills in.
 */
import { emptyAppTree, type AppKind, type AppTree } from "./schema";

function screen(
  id: string,
  path: string,
  title: string,
  role: AppTree["screens"][number]["role"],
): AppTree["screens"][number] {
  return {
    id, path, title, role,
    requiresAuth: role === "checkout" || role === "profile" || role === "settings",
    layout: "stack",
    components: [{ id: `${id}-heading`, type: "heading", props: { text: title } }],
    state: {},
  };
}

export function starterAppTree(kind: AppKind, name: string): AppTree {
  const base = emptyAppTree(kind, name);
  switch (kind) {
    case "ecommerce":
      return {
        ...base,
        navigation: {
          primary: "bottom_tabs",
          items: [
            { label: "Shop", screenId: "home" },
            { label: "Search", screenId: "search" },
            { label: "Cart", screenId: "cart" },
            { label: "Account", screenId: "account" },
          ],
        },
        screens: [
          screen("home", "/", "Shop", "home"),
          screen("search", "/search", "Search", "search"),
          screen("product", "/product/:id", "Product", "detail"),
          screen("cart", "/cart", "Cart", "checkout"),
          screen("account", "/account", "Account", "profile"),
        ],
      };
    case "education":
      return {
        ...base,
        navigation: {
          primary: "bottom_tabs",
          items: [
            { label: "Courses", screenId: "home" },
            { label: "Lessons", screenId: "lessons" },
            { label: "Profile", screenId: "profile" },
          ],
        },
        screens: [
          screen("home", "/", "Courses", "home"),
          screen("lessons", "/lessons", "My Lessons", "list"),
          screen("lesson-detail", "/lessons/:id", "Lesson", "detail"),
          screen("profile", "/profile", "Profile", "profile"),
        ],
      };
    case "restaurant":
      return {
        ...base,
        navigation: {
          primary: "bottom_tabs",
          items: [
            { label: "Menu", screenId: "home" },
            { label: "Orders", screenId: "orders" },
            { label: "Profile", screenId: "profile" },
          ],
        },
        screens: [
          screen("home", "/", "Menu", "home"),
          screen("item", "/item/:id", "Item", "detail"),
          screen("orders", "/orders", "Orders", "list"),
          screen("profile", "/profile", "Profile", "profile"),
        ],
      };
    case "marketplace":
      return {
        ...base,
        navigation: {
          primary: "bottom_tabs",
          items: [
            { label: "Browse", screenId: "home" },
            { label: "Search", screenId: "search" },
            { label: "Messages", screenId: "messages" },
            { label: "Profile", screenId: "profile" },
          ],
        },
        screens: [
          screen("home", "/", "Browse", "home"),
          screen("search", "/search", "Search", "search"),
          screen("listing", "/listing/:id", "Listing", "detail"),
          screen("messages", "/messages", "Messages", "list"),
          screen("profile", "/profile", "Profile", "profile"),
        ],
      };
    case "social":
      return {
        ...base,
        navigation: {
          primary: "bottom_tabs",
          items: [
            { label: "Feed", screenId: "home" },
            { label: "Search", screenId: "search" },
            { label: "Notifications", screenId: "notifications" },
            { label: "Profile", screenId: "profile" },
          ],
        },
        screens: [
          screen("home", "/", "Feed", "home"),
          screen("search", "/search", "Search", "search"),
          screen("notifications", "/notifications", "Notifications", "list"),
          screen("profile", "/profile", "Profile", "profile"),
        ],
      };
    default:
      return base;
  }
}
