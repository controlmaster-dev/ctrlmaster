import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  operatorReportStatsPipeline,
  reportListPipeline,
  recentCommentsPipeline,
} from "../src/lib/reportAggregations";

describe("reportListPipeline", () => {
  it("includes sort, limit and count lookups", () => {
    const stages = reportListPipeline({ limit: 10, skip: 20, match: { status: "pending" } });
    const json = JSON.stringify(stages);
    assert.match(json, /\$sort/);
    assert.match(json, /\$limit/);
    assert.match(json, /\$skip/);
    assert.match(json, /"comments"/);
    assert.match(json, /"reactions"/);
    assert.match(json, /\$count/);
  });
});

describe("operatorReportStatsPipeline", () => {
  it("groups by operator and excludes automated monitoring", () => {
    const stages = operatorReportStatsPipeline();
    const json = JSON.stringify(stages);
    assert.match(json, /\$group/);
    assert.match(json, /operatorName/);
    assert.match(json, /Monitoreo Automático/);
    assert.match(json, /emailSent/);
  });
});

describe("recentCommentsPipeline", () => {
  it("limits and joins users and reports", () => {
    const stages = recentCommentsPipeline(5);
    const json = JSON.stringify(stages);
    assert.match(json, /\$limit/);
    assert.match(json, /"users"/);
    assert.match(json, /"reports"/);
  });
});
