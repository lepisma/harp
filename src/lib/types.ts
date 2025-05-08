export interface Metric {
  id: string;
  unit: string;
  tags: string[];
  range?: [number, number];
  healthyRange?: [number, number];
}

export interface Asset {
  fileName: string;
  mimeType?: string;
  text?: string;
}

export interface MetricValue {
  id: string;
  datetime: Date;
  value: number;
  reference: string;
}

export interface JournalEntry {
  datetime: Date;
  uuid: string;
  tags: string[];
  metrics: MetricValue[];
  text: string;
  assets: Asset[];
  isPrivate: boolean;
}

export interface Journal {
  name: string;
  entries: JournalEntry[];
}

export interface Source {
  id: string;
  description: string;
}

export interface Report {
  name: string;
  datetime: Date;
  uuid: string;
  tags: string[];
  source: Source;
  assets: Asset[];
  metrics: MetricValue[];
  annotation?: string;
}

export interface Consultation {
  name: string;
  datetime: Date;
  uuid: string;
  tags: string[];
  source: Source;
  assets: Asset[];
  annotation?: string;
}

export interface Metadata {
  sources: Source[];
  metrics: Metric[];
}

export interface Profile {
  uuid: string;
  name: string;
  metadata: Metadata;
  journals: Journal[];
  reports: Report[];
  consultations: Consultation[];
  metrics: MetricValue[];
}
