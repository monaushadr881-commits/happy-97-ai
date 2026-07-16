import { createFileRoute } from "@tanstack/react-router";
import { ReleasePageShell } from "./-shell";
import { Panel } from "@/design-system/primitives";

export const Route = createFileRoute("/_authenticated/releases/settings")({
  component: () => (
    <ReleasePageShell title="Release Settings" description="Global release engineering configuration. Environment gates only — no key material stored here.">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-6 space-y-2 text-sm">
          <h3 className="font-semibold text-paper">External Dependencies</h3>
          <ul className="text-soft-gray text-xs space-y-1 list-disc pl-4">
            <li>Google Play — service account JSON + signed AAB</li>
            <li>Apple App Store — App Store Connect API key + macOS/Xcode host</li>
            <li>Microsoft Store — Partner Center creds + MSIX signing cert</li>
            <li>Amazon Appstore — developer credentials</li>
            <li>Samsung Galaxy — Seller Portal token</li>
            <li>Huawei AppGallery — client id/secret</li>
          </ul>
        </Panel>
        <Panel className="p-6 space-y-2 text-sm">
          <h3 className="font-semibold text-paper">Toolchain Requirements</h3>
          <ul className="text-soft-gray text-xs space-y-1 list-disc pl-4">
            <li>Android: SDK, gradle, apksigner, bundletool</li>
            <li>iOS/macOS: Xcode, xcodebuild, codesign, notarytool</li>
            <li>Windows: signtool, MakeAppx</li>
            <li>Linux: snapcraft / flatpak-builder / AppImage tools</li>
            <li>Docker: docker CLI in worker (unavailable)</li>
          </ul>
        </Panel>
      </div>
    </ReleasePageShell>
  ),
});
