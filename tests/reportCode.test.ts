import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatReportCode,
  isChannelFormatReportCode,
  needsReportCodeMigration,
  resolveReportCodePrefix,
  seedPrefixCountersFromCodes,
} from "../src/lib/reportCode";

describe("reportCode", () => {
  it("detecta formato canal", () => {
    assert.equal(isChannelFormatReportCode("ENL-0042"), true);
    assert.equal(isChannelFormatReportCode("ENL9329C2"), false);
    assert.equal(needsReportCodeMigration("ENL9329C2"), true);
  });

  it("resuelve prefijo por canal", () => {
    assert.equal(
      resolveReportCodePrefix("Transmisión", "Enlace"),
      "ENL"
    );
    assert.equal(
      resolveReportCodePrefix("Audio", "Todos"),
      "AUD"
    );
  });

  it("siembra contadores desde códigos existentes", () => {
    const counters = seedPrefixCountersFromCodes(["ENL-0003", "TX-0010", "ENL9329C2"]);
    assert.equal(counters.ENL, 3);
    assert.equal(counters.TX, 10);
  });

  it("formatea correlativo", () => {
    assert.equal(formatReportCode("EJT", 12), "EJT-0012");
  });
});
