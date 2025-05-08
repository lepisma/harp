// Org parsing and formatting functions

import type { Metadata, ProfileData, Journal, Report, Consultation, MetricValue } from "./types";

export function parseTitle(orgString: string): string | null {
  const titleMatch = orgString.match(/^#\+TITLE:\s*(.*)$/mi);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return null;
}

export function parseOrgId(orgString: string): string | null {
  const idMatch = orgString.match(/^:ID:\s*(.*)$/m);
  if (idMatch && idMatch[1]) {
    return idMatch[1].trim();
  }
  return null;
}

function parseMetadata(orgString: string): Metadata {
  return {
    sources: [],
    metrics: [],
  };
}

function parseReports(orgString: string): Report[] {
  return [];
}

function parseJournals(orgString: string): Journal[] {
  return [];
}

function parseConsultations(orgString: string): Consultation[] {
  return [];
}

// Collect metric values entered in journal entries and marked in reports
function gatherMetrics(journals: Journal[], reports: Report[]): MetricValue[] {
  let metrics = [];

  for (const report of reports) {
    metrics.push(...report.metrics);
  }

  for (const journal of journals) {
    for (const entry of journal.entries) {
      metrics.push(...entry.metrics);
    }
  }

  return metrics;
}

export function parseProfileData(orgString: string): ProfileData {
  const reports = parseReports(orgString);
  const journals = parseJournals(orgString);

  return {
    metadata: parseMetadata(orgString),
    journals: journals,
    reports: reports,
    consultations: parseConsultations(orgString),
    metrics: gatherMetrics(journals, reports),
  }
}

// Convert profile data in org format for exports
export function formatProfileData(profileData: ProfileData): string {
  return '';
}
