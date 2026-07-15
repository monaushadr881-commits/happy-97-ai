/**
 * R43 Presentation & Whiteboard Runtime — contracts.
 *
 * Renderer-independent types. Portrait / Layered / Live2D / Live3D / XR / VR / AR
 * renderers consume these later. This module never renders.
 */

export const PRESENTATION_TYPES = [
  "founder_briefing","investor_pitch","company_overview","business_review",
  "sales_demo","product_demo","training","learning","meeting","workshop",
  "research","factory_tour","marketplace_demo","website_demo","application_demo",
] as const;
export type PresentationType = (typeof PRESENTATION_TYPES)[number];

export const PRESENTATION_MODES = [
  "founder","business","learning","teaching","presentation","meeting","workshop",
] as const;
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export const PRESENTATION_STATES = [
  "preparing","waiting","presenting","teaching","question_answer","paused","finished","cancelled",
] as const;
export type PresentationState = (typeof PRESENTATION_STATES)[number];

export const COMMAND_CHANNELS = [
  "slide","whiteboard","pointer","annotation","teaching","session",
] as const;
export type CommandChannel = (typeof COMMAND_CHANNELS)[number];

export const SLIDE_COMMANDS = [
  "next","previous","jump","focus","zoom","highlight","section","bookmark",
] as const;
export type SlideCommand = (typeof SLIDE_COMMANDS)[number];

export const WHITEBOARD_COMMANDS = [
  "draw_line","rectangle","circle","arrow","text","erase","highlight","focus","clear","undo","redo",
] as const;
export type WhiteboardCommand = (typeof WHITEBOARD_COMMANDS)[number];

export const POINTER_COMMANDS = [
  "laser","cursor","focus_target","attention_target","speaker_focus",
] as const;
export type PointerCommand = (typeof POINTER_COMMANDS)[number];

export const SESSION_COMMANDS = [
  "create","open","join","pause","resume","complete","cancel","archive","state",
] as const;
export type SessionCommand = (typeof SESSION_COMMANDS)[number];

export const TEACHING_COMMANDS = [
  "lesson","chapter","topic","step","example","exercise","summary","question","answer",
] as const;
export type TeachingCommand = (typeof TEACHING_COMMANDS)[number];

export const ANNOTATION_COMMANDS = ["create","update","resolve","delete"] as const;
export type AnnotationCommand = (typeof ANNOTATION_COMMANDS)[number];

export const ANNOTATION_KINDS = ["note","highlight","question","answer","action","decision"] as const;
export type AnnotationKind = (typeof ANNOTATION_KINDS)[number];

export const SLIDE_KINDS = ["slide","scene","chapter","question","exercise","summary","whiteboard"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

export const TRANSITIONS = ["cut","fade","slide_left","slide_right","zoom"] as const;
export type Transition = (typeof TRANSITIONS)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export type CommandPayload = { [k: string]: JsonValue };

export type Participant = {
  user_id: string;
  role: "presenter" | "co_presenter" | "attendee" | "observer";
  display_name?: string;
};
