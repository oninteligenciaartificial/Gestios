import { describe, expect, it } from "vitest";
import {
  ONIA_CAPABILITIES,
  ONIA_CORE_IMPLEMENTATION_REPO,
  ONIA_CORE_NAME,
  ONIA_CORE_QUESTIONS,
  ONIA_FAMILIES,
  ONIA_VERTICAL_TRACKS,
  getBlockedCapabilitiesForTrack,
  getOniaCapabilitiesByLayer,
  getOniaCapability,
  getOniaVerticalTrack,
  isOniaCoreCapability,
} from "@/lib/onia-core";

describe("ONIA Core contract", () => {
  it("names the core as ONIA Core and GestiOS as implementation", () => {
    expect(ONIA_CORE_NAME).toBe("ONIA Core");
    expect(ONIA_CORE_IMPLEMENTATION_REPO).toBe("GestiOS");

    const core = ONIA_FAMILIES.find((family) => family.id === "ONIA_CORE");
    const gestios = ONIA_FAMILIES.find((family) => family.id === "GESTIOS");

    expect(core?.coreRelationship).toBe("core");
    expect(gestios?.coreRelationship).toBe("implementation");
    expect(gestios?.role).toContain("ONIA Core");
  });

  it("keeps the core focused on operating organization questions", () => {
    expect(ONIA_CORE_QUESTIONS).toHaveLength(10);
    expect(ONIA_CORE_QUESTIONS.map((question) => question.id)).toEqual([
      "people",
      "roles",
      "relationships",
      "open_work",
      "ownership",
      "status",
      "next_action",
      "evidence",
      "attention",
      "management",
    ]);
  });

  it("does not treat POS, inventory, purchases, or integrations as core", () => {
    expect(isOniaCoreCapability("catalog_inventory")).toBe(false);
    expect(isOniaCoreCapability("sales_cash")).toBe(false);
    expect(isOniaCoreCapability("purchases")).toBe(false);
    expect(isOniaCoreCapability("whatsapp")).toBe(false);
    expect(isOniaCoreCapability("tr4_adapter")).toBe(false);
    expect(isOniaCoreCapability("siat")).toBe(false);
  });

  it("defines the core capabilities needed before vertical work", () => {
    const coreCapabilityIds = getOniaCapabilitiesByLayer("core").map((capability) => capability.id);

    expect(coreCapabilityIds).toEqual([
      "tenant",
      "team_roles",
      "relationships",
      "work_items",
      "evidence_activity",
      "alerts_reports",
      "data_ops",
    ]);

    for (const capability of getOniaCapabilitiesByLayer("core")) {
      expect(capability.answers.length).toBeGreaterThan(0);
      expect(capability.phase).toBeLessThanOrEqual(2);
    }
  });

  it("keeps ProveeGest Electrico as a vertical track over ONIA Core", () => {
    const track = getOniaVerticalTrack("proveegest-electrico");

    expect(track?.familyId).toBe("PROVEEGEST");
    expect(track?.status).toBe("planned");
    expect(track?.businessType).toBe("ELECTRICO");
    expect(track?.requiredCapabilityIds).toContain("quotes_b2b");
    expect(track?.requiredCapabilityIds).toContain("knowledge_base");
  });

  it("marks external integrations as blocked gates, not base features", () => {
    const blocked = getBlockedCapabilitiesForTrack("proveegest-electrico");

    expect(blocked.map((capability) => capability.id)).toEqual(["whatsapp", "tr4_adapter", "siat"]);
    expect(blocked.every((capability) => capability.layer === "external_gate")).toBe(true);
    expect(blocked.every((capability) => capability.blockedUntil)).toBe(true);
  });

  it("does not duplicate capability or vertical identifiers", () => {
    const capabilityIds = ONIA_CAPABILITIES.map((capability) => capability.id);
    const trackIds = ONIA_VERTICAL_TRACKS.map((track) => track.id);

    expect(new Set(capabilityIds).size).toBe(capabilityIds.length);
    expect(new Set(trackIds).size).toBe(trackIds.length);
    expect(getOniaCapability("tenant")?.name).toBe("Tenant y organizacion");
  });
});
