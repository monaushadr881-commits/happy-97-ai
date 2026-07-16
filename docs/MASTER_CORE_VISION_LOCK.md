# HAPPY Core Vision Lock — R91 (Founder Directive)

**Status:** LOCKED · **Effective:** R91 · **Authority:** Founder

This document is the permanent engineering policy for the HAPPY Enterprise
Ecosystem. Everything implemented from R1 through R90 — plus every Founder-
approved implementation in the R91 conversation — is HAPPY Core Foundation.

## 1. Foundation Rule

Core Foundation modules may **only** be improved, optimized, extended,
refined, or integrated. They may **never** be removed, disabled,
downgraded, rewritten from scratch, or replaced.

## 2. Permanent Modules (non-exhaustive)

Living HAPPY · Digital Human Runtime · Living Presence Runtime · Workspace
Awareness · Conversation Engine · Conversation Continuity · Voice Runtime ·
Relationship Engine · Memory Engine · Daily Memory · Project Memory ·
Business Advisor · Initiative AI · Founder AI · Founder Workspace · Founder
Command Center · Founder Memory · Founder Dashboard · Universal Builder ·
Universal Runtime · Production Runtime · Release Runtime · Builder Runtime ·
Planning Runtime · Testing Runtime · Documentation Runtime · Deployment
Planner · Living Office Mode · Shared Workspace Intelligence · Context Bus ·
Notification Delivery · Delivery Choreography · Ambient Behaviour · Greeting
Runtime · Farewell Runtime · Emotion Runtime · Expression Runtime · Micro
Human Runtime · Camera Intelligence · Lighting Runtime · Particle Runtime ·
Workspace Intelligence · Persona Runtime · Route Anchors · Quality Runtime ·
Accessibility Runtime · Performance Runtime · Humanized Conversation · Tutor
Intelligence · Learning Behaviour · Office Behaviour · Task Companion ·
Session Restore · Session Continuity · Customer / Admin / Employee / Founder
Experience · Business Consultant Mode · Team Member Mode · Premium Living
Experience.

Concrete owning paths (do not fork or shadow these):

- `src/components/happy-desk/` — the single always-mounted HAPPY runtime.
- `src/components/digital-human/` — HappyAvatar and expression rig.
- `src/lib/happy-runtime/`, `src/lib/happy-cinematic/`, `src/lib/happy-living/`.
- `src/lib/happy-r80/` … `src/lib/happy-r89/` — behaviour modules (R80–R89).
- `src/lib/happy-r86/`, `src/lib/happy-r88/` — memory / notification gate / session restore.
- `src/brain/`, `src/kernel/`, `src/runtime/engine/` — cognition, kernel, engines.

## 3. Duplication Ban

There is **ONE** HAPPY, **ONE** Runtime, **ONE** Memory, **ONE**
Personality, **ONE** Conversation Engine, **ONE** Living Presence.

Never create:

- duplicate memory systems, conversation engines, notification engines,
  delivery systems, presence systems, workspace-awareness layers, founder
  systems, builder systems, or Digital Humans.
- separate assistants or a second AI. Every future feature must integrate
  into the existing HAPPY Runtime.

If a requested capability already exists, **improve it**. Do not rebuild it.
Do not duplicate it.

## 4. Global Presence

The same HAPPY exists across Website, Android, iPhone, Desktop, PWA,
Founder, Admin, Employee, Customer, Marketplace, Builder, CRM, ERP, HRMS,
Learning, Support, Analytics, Release Center, Production Center — every
surface. Mount points must stay singular; do not add a second HappyDesk /
FloatingHappy anywhere.

## 5. Future Development (R92+)

Future revisions **must**:

1. Reuse existing modules by their public exports.
2. Extend behaviour additively.
3. Optimize without changing the public contract.
4. Integrate new features into the existing runtime, not around it.

Before writing new code for any capability listed in §2, grep the paths in
§2 for an existing owner; extend that owner instead of adding a sibling.

## 6. Quality Standard

Every future implementation must be Enterprise Grade, Production Quality,
Performance Optimized, Accessible, Responsive, Secure, Reusable,
Maintainable, Fully Tested, End-to-End Integrated.

## 7. External Dependencies (allowed to remain BLOCKED)

Android SDK · Apple Developer Program · Google Play Console · Xcode ·
Signing Certificates · Payment Provider · Email Provider · Push
Notification Provider · Streaming Voice Provider · Live2D Assets ·
MetaHuman Assets · Audio2Face · NVIDIA ACE · Vision Pro · Professional
Motion Capture · Professional Avatar Assets.

Integration of any of the above must not alter the Core Foundation.

## 8. Version Policy

- **≤ R90** and the R91 Founder conversation → permanent Core Foundation.
- **R91** → Core Vision Lock (this document).
- **R92+** → future expansion under §5.

## 9. Reporting Discipline

Never declare "100%", "Production Ready", "Certified", or "Complete"
unless verified by real repository-side implementation and tests. Only
external dependencies (§7) may remain BLOCKED.

---

_This directive is preserved verbatim in project memory (see
`mem://index.md` → Core) so every future pass reads it before writing._
